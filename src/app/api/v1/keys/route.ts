import { NextRequest, NextResponse } from "next/server";
import { getClientApiKeysServer, saveClientApiKeysServer, ClientApiKeyRecord } from "@/lib/apiKeysStore";

export async function GET() {
  try {
    const keys = getClientApiKeysServer();
    return NextResponse.json({ success: true, data: keys }, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch keys";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, keys: inputKeys } = body;

    if (action === "SYNC" && Array.isArray(inputKeys)) {
      saveClientApiKeysServer(inputKeys);
      return NextResponse.json({ success: true, message: "Keys synced successfully", data: inputKeys });
    }

    if (Array.isArray(body)) {
      saveClientApiKeysServer(body);
      return NextResponse.json({ success: true, message: "Keys saved", data: body });
    }

    const currentKeys = getClientApiKeysServer();
    return NextResponse.json({ success: true, data: currentKeys });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to update keys";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
