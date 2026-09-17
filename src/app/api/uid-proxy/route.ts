import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url, method, headers, body } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "Target URL is required" }, { status: 400 });
    }

    const apiKey = process.env.MANI_API_KEY || "MANI272-1849E54F1E89E81F29920EF7AC318AC3";

    const response = await fetch(url, {
      method: method || "GET",
      headers: {
        "Content-Type": "application/json",
        "X-AUTH-KEY": apiKey,
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json().catch(() => ({}));

    return NextResponse.json(data, { status: response.status });
  } catch (error: unknown) {
    console.error("Proxy error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to communicate with external API";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
