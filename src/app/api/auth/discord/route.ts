import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const clientId = process.env.DISCORD_CLIENT_ID || "1533814691707752468";
  const url = new URL(request.url);
  const host = request.headers.get("host") || url.host;
  const protocol = request.headers.get("x-forwarded-proto") || "http";
  const redirectUri = `${protocol}://${host}/api/auth/discord/callback`;

  const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=identify%20email`;

  return NextResponse.redirect(discordAuthUrl);
}
