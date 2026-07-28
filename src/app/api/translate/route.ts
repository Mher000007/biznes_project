import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side translation proxy — avoids CORS issues when calling
 * the Google Translate GTX API directly from the browser.
 *
 * GET /api/translate?q=chicken&sl=en&tl=hy
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const sl = searchParams.get("sl") || "en";
  const tl = searchParams.get("tl") || "hy";

  if (!q) {
    return NextResponse.json({ error: "Missing query param: q" }, { status: 400 });
  }

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(sl)}&tl=${encodeURIComponent(tl)}&dt=t&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Translation service error" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Translation failed" }, { status: 500 });
  }
}
