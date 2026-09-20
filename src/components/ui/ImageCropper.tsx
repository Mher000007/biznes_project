import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check } from 'lucide-react';

interface ImageCropperProps {
  image: string;
  onCropDone: (croppedImageUrl: string) => void;
  onCancel: () => void;
  aspect?: number;
  circularCrop?: boolean;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

export const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<string> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return "";
  }

  // Set canvas size to the cropped size
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Draw the cropped image onto the canvas
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((file) => {
      if (file) {
        resolve(URL.createObjectURL(file));
      } else {
        reject(new Error('Canvas is empty'));
      }
    }, 'image/jpeg');
  });
};

export default function ImageCropper({ image, onCropDone, onCancel, aspect = 1, circularCrop = false }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleDone = async () => {
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      onCropDone(croppedImage);
    } catch (e) {
      console.error("Error cropping image:", e);
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm">
      <div className="bg-[hsl(var(--card))] w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col border border-[hsl(var(--border))]">
        <div className="p-4 border-b border-[hsl(var(--border))] flex justify-between items-center">
          <h3 className="font-semibold text-sm">Crop Image</h3>
          <button onClick={onCancel} className="p-1 hover:bg-[hsl(var(--muted))] rounded-lg">
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <div className="relative w-full h-[300px] sm:h-[400px] bg-black/5">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape={circularCrop ? "round" : "rect"}
            showGrid={false}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>
        
        <div className="p-4 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Zoom</span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => {
                setZoom(Number(e.target.value));
              }}
              className="flex-1 h-1.5 bg-[hsl(var(--muted))] rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[hsl(var(--primary))] [&::-webkit-slider-thumb]:rounded-full"
            />
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-2 rounded-xl text-xs font-semibold bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] hover:opacity-90 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDone}
              className="flex-1 py-2 rounded-xl text-xs font-semibold bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90 transition-colors flex justify-center items-center gap-1.5"
            >
              <Check className="h-3.5 w-3.5" />
              Apply Crop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
