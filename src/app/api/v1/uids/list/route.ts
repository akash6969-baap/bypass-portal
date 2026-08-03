import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("X-AUTH-KEY") || req.headers.get("x-api-key") || req.headers.get("authorization");
    
    if (!authHeader) {
      return NextResponse.json({ success: false, error: "Missing X-AUTH-KEY header" }, { status: 401 });
    }

    const response = await fetch("https://mani272uidbypass.vercel.app/api/v1/uids/list", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-AUTH-KEY": "MANI272-6B861E35F791CA509E10EF3613FEF32C"
      }
    });

    const data = await response.json().catch(() => ([]));

    return NextResponse.json({
      success: true,
      total: Array.isArray(data) ? data.length : 0,
      data
    }, { status: 200 });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch whitelisted UIDs list";
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}
