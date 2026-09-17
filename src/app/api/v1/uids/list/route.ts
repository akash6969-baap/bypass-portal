import { NextRequest, NextResponse } from "next/server";

const MANI_KEY = (process.env.MANI_API_KEY && process.env.MANI_API_KEY.startsWith("MANI272-1849"))
  ? process.env.MANI_API_KEY
  : "MANI272-1849E54F1E89E81F29920EF7AC318AC3";

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
        "X-AUTH-KEY": MANI_KEY
      }
    });

    const resJson = await response.json().catch(() => ({}));
    const list = Array.isArray(resJson) ? resJson : (Array.isArray(resJson.data) ? resJson.data : []);

    return NextResponse.json({
      success: true,
      total: list.length,
      data: list
    }, { status: 200 });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch whitelisted UIDs list";
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}
