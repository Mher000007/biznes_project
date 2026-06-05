import { NextRequest, NextResponse } from "next/server";
import { MOCK_BUSINESSES } from "@/data/mock-businesses";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q")?.toLowerCase() || "";
  const category = searchParams.get("category") || "";
  const city = searchParams.get("city") || "";
  const size = searchParams.get("size") || "";
  const verified = searchParams.get("verified") === "true";

  let results = [...MOCK_BUSINESSES];

  if (q) results = results.filter((b) => b.name.toLowerCase().includes(q) || b.shortDescription.toLowerCase().includes(q));
  if (category) results = results.filter((b) => b.category.slug === category);
  if (city) results = results.filter((b) => b.city === city);
  if (size) results = results.filter((b) => b.employeeCount === size);
  if (verified) results = results.filter((b) => b.isVerified);

  return NextResponse.json({ data: results, total: results.length });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  // In production: validate with Zod, save to DB
  return NextResponse.json({ message: "Business registered successfully", id: "new-" + Date.now() }, { status: 201 });
}
