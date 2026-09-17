import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("X-AUTH-KEY") || req.headers.get("x-api-key") || req.headers.get("authorization");
    
    if (!authHeader) {
      return NextResponse.json({ success: false, error: "Missing X-AUTH-KEY header" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { uid } = body;

    if (!uid) {
      return NextResponse.json({ success: false, error: "Missing required parameter: uid" }, { status: 400 });
    }

    const response = await fetch("https://mani272uidbypass.vercel.app/api/v1/uids/remove", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-AUTH-KEY": process.env.MANI_API_KEY || "MANI272-1849E54F1E89E81F29920EF7AC318AC3"
      },
      body: JSON.stringify({ uid: String(uid).trim() })
    });

    const data = await response.json().catch(() => ({}));

    return NextResponse.json({
      success: true,
      message: `UID ${uid} revoked successfully.`,
      data
    }, { status: 200 });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to revoke UID";
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}
