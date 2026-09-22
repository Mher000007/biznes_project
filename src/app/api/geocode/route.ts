import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  const q = searchParams.get('q');
  const lang = request.headers.get('accept-language') || 'en';

  try {
    let url = '';
    if (lat && lon) {
      url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
    } else if (q) {
      url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=am&limit=5&addressdetails=1`;
    } else {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const res = await fetch(url, {
      headers: {
        'Accept-Language': lang,
        'User-Agent': 'BiznesApp/1.0 (admin@biznes.am)'
      }
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Geocoding failed' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
