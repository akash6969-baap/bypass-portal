import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Reseller, { IReseller } from "@/models/Reseller";

export async function GET() {
  const db = await dbConnect();
  if (!db) {
    return NextResponse.json({ success: false, error: "Database offline" }, { status: 500 });
  }
  
  try {
    const docs = await Reseller.find({}).lean();
    const formatted = docs.map((doc) => {
      const r = doc as unknown as IReseller;
      return {
        username: r.username,
        credits: r.credits,
        totalWhitelisted: r.totalWhitelisted,
        createdAt: r.createdAt,
      };
    });
    return NextResponse.json({ success: true, data: formatted });
  } catch (err) {
    console.error("MongoDB fetch error for resellers:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch resellers" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const listToSync = Array.isArray(body) ? body : (body.resellers || (body.username ? [body] : []));

    if (listToSync.length > 0) {
      const db = await dbConnect();
      if (!db) {
        return NextResponse.json({ success: false, error: "Database offline" }, { status: 500 });
      }

      for (const item of listToSync) {
        await Reseller.findOneAndUpdate(
          { username: item.username.trim() },
          {
            $set: {
              username: item.username.trim(),
              credits: item.credits ?? 100,
              totalWhitelisted: item.totalWhitelisted ?? 0,
              createdAt: item.createdAt || new Date().toLocaleDateString(),
            }
          },
          { upsert: true, new: true }
        );
      }
      return NextResponse.json({ success: true, message: "Resellers synchronized to MongoDB Cluster", data: listToSync });
    }

    return NextResponse.json({ success: false, error: "No resellers provided for sync" }, { status: 400 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to sync resellers";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
