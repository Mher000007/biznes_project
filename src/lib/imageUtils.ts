/**
 * Client-side image compression utility to prevent localStorage quota exhaustion
 * and ensure fast network uploads.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: "image/jpeg" | "image/webp" | "image/png";
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.75,
  mimeType: "image/jpeg",
};

/**
 * Compress an image File and return a base64 Data URL.
 */
export async function compressImageFile(
  file: File,
  options: CompressionOptions = {}
): Promise<string> {
  const { maxWidth = 1200, maxHeight = 1200, quality = 0.75, mimeType = "image/jpeg" } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  // If it's a non-image (like a video), fall back to standard file reader
  if (!file.type.startsWith("image/")) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") resolve(reader.result);
        else reject(new Error("File conversion failed"));
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // If file is SVG, keep as is
  if (file.type === "image/svg+xml") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") resolve(reader.result);
        else reject(new Error("SVG conversion failed"));
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (!src) {
        return reject(new Error("Failed to read image file"));
      }

      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;

          // Scale down if larger than max dimensions
          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            // Fallback to original src if canvas context not available
            return resolve(src);
          }

          // Fill white background for JPEGs to prevent black transparency
          if (mimeType === "image/jpeg") {
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, width, height);
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL(mimeType, quality);
          resolve(compressedDataUrl);
        } catch (err) {
          console.warn("Canvas compression failed, falling back to original data URL", err);
          resolve(src);
        }
      };

      img.onerror = () => {
        console.warn("Image load failed for compression, using raw data URL");
        resolve(src);
      };

      img.src = src;
    };

    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Compress an existing base64 image data URL.
 */
export async function compressBase64Image(
  base64: string,
  options: CompressionOptions = {}
): Promise<string> {
  if (!base64 || !base64.startsWith("data:image/") || base64.startsWith("data:image/svg+xml")) {
    return base64;
  }

  // If already small (< 50KB), no need to recompress
  if (base64.length < 50 * 1024) {
    return base64;
  }

  const { maxWidth = 1200, maxHeight = 1200, quality = 0.75, mimeType = "image/jpeg" } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(base64);

        if (mimeType === "image/jpeg") {
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL(mimeType, quality));
      } catch (err) {
        console.warn("Base64 compression failed, returning original", err);
        resolve(base64);
      }
    };

    img.onerror = () => resolve(base64);
    img.src = base64;
  });
}
