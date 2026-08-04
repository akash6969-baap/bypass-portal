import { NextRequest, NextResponse } from "next/server";
import { getClientApiKeysAsync, saveClientApiKeysAsync } from "@/lib/apiKeysStore";

export async function GET() {
  try {
    const keys = await getClientApiKeysAsync();
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
      await saveClientApiKeysAsync(inputKeys);
      return NextResponse.json({ success: true, message: "Keys synced successfully to MongoDB Cluster", data: inputKeys });
    }

    if (Array.isArray(body)) {
      await saveClientApiKeysAsync(body);
      return NextResponse.json({ success: true, message: "Keys saved to MongoDB Cluster", data: body });
    }

    const currentKeys = await getClientApiKeysAsync();
    return NextResponse.json({ success: true, data: currentKeys });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to update keys";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
