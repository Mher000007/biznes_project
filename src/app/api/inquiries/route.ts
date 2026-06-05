import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { businessId, senderName, senderEmail, subject, message } = body;

  if (!businessId || !senderName || !senderEmail || !message) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // In production: save to DB, send email notification, trigger n8n webhook
  return NextResponse.json({
    message: "Inquiry sent successfully",
    id: "inq-" + Date.now(),
  }, { status: 201 });
}
