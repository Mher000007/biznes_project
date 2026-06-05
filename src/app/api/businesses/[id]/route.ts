import { NextRequest, NextResponse } from "next/server";
import { MOCK_BUSINESSES } from "@/data/mock-businesses";

type Params = Promise<{ id: string }>;

export async function GET(_request: NextRequest, { params }: { params: Params }) {
  const { id } = await params;
  const biz = MOCK_BUSINESSES.find((b) => b.id === id || b.slug === id);
  if (!biz) return NextResponse.json({ error: "Business not found" }, { status: 404 });
  return NextResponse.json({ data: biz });
}

export async function PUT(_request: NextRequest, { params }: { params: Params }) {
  const { id } = await params;
  const biz = MOCK_BUSINESSES.find((b) => b.id === id);
  if (!biz) return NextResponse.json({ error: "Business not found" }, { status: 404 });
  return NextResponse.json({ message: "Business updated", data: biz });
}

export async function DELETE(_request: NextRequest, { params }: { params: Params }) {
  const { id } = await params;
  return NextResponse.json({ message: `Business ${id} deleted` });
}
