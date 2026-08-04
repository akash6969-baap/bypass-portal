import { NextRequest, NextResponse } from "next/server";
import { validateAndDeductCredit } from "@/lib/apiKeysStore";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("X-AUTH-KEY") || req.headers.get("x-api-key") || req.headers.get("authorization");
    
    if (!authHeader) {
      return NextResponse.json({ success: false, error: "Missing X-AUTH-KEY header" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { uid, days, name } = body;

    if (!uid) {
      return NextResponse.json({ success: false, error: "Missing required parameter: uid" }, { status: 400 });
    }

    const parsedDays = parseInt(days);
    const durationDays = (!isNaN(parsedDays) && parsedDays > 0) ? parsedDays : 30;

    // Validate API Key and deduct durationDays Credits (Rule: 1 Day Whitelist = 1 Credit)
    const creditCheck = validateAndDeductCredit(authHeader, durationDays);
    if (!creditCheck.success) {
      return NextResponse.json({ 
        success: false, 
        error: creditCheck.error || `Authentication failed or insufficient credits to whitelist for ${durationDays} days.` 
      }, { status: 403 });
    }

    const clientName = name || creditCheck.clientName || "API_User";

    // Forward request to underlying Mani API Gateway
    const response = await fetch("https://mani272uidbypass.vercel.app/api/v1/uids/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-AUTH-KEY": "MANI272-6B861E35F791CA509E10EF3613FEF32C"
      },
      body: JSON.stringify({
        uid: String(uid).trim(),
        days: durationDays,
        name: clientName
      })
    });

    const responseData = await response.json().catch(() => ({}));

    return NextResponse.json({
      success: true,
      message: `UID ${uid} provisioned successfully for ${durationDays} days.`,
      credits_remaining: creditCheck.remainingCredits,
      data: responseData
    }, { status: 200 });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to process API request";
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}
