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
        password: r.password,
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
    const action = body.action;
    const listToSync = Array.isArray(body) ? body : (body.resellers || (body.username ? [body] : []));

    const db = await dbConnect();
    if (!db) {
      return NextResponse.json({ success: false, error: "Database offline" }, { status: 500 });
    }

    if (action === "DELETE" && body.username) {
      await Reseller.deleteMany({ username: String(body.username).trim() });
      return NextResponse.json({ success: true, message: `Reseller ${body.username} permanently deleted from MongoDB Cluster.` });
    }

    if (action === "SYNC" || Array.isArray(body) || body.resellers || listToSync.length > 0) {
      const activeUsernames = listToSync.map((item: { username?: string }) => item.username ? item.username.trim() : "").filter(Boolean);

      // Remove deleted resellers from MongoDB cluster
      await Reseller.deleteMany({ username: { $nin: activeUsernames } });

      for (const item of listToSync) {
        if (!item.username) continue;
        await Reseller.findOneAndUpdate(
          { username: item.username.trim() },
          {
            $set: {
              username: item.username.trim(),
              password: item.password,
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

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");
    if (!username) {
      return NextResponse.json({ success: false, error: "Missing username parameter" }, { status: 400 });
    }
    const db = await dbConnect();
    if (!db) {
      return NextResponse.json({ success: false, error: "Database offline" }, { status: 500 });
    }
    await Reseller.deleteMany({ username: username.trim() });
    return NextResponse.json({ success: true, message: `Reseller ${username} permanently deleted from MongoDB.` });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to delete reseller";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
