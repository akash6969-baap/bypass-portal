import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  const host = request.headers.get("host") || url.host;
  const protocol = request.headers.get("x-forwarded-proto") || "http";
  const baseUrl = `${protocol}://${host}`;
  const redirectUri = `${baseUrl}/api/auth/discord/callback`;

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/free-portal?error=no_code`);
  }

  const clientId = process.env.DISCORD_CLIENT_ID || "1533814691707752468";
  const clientSecret = process.env.DISCORD_CLIENT_SECRET || "8nRQXJrWsIh83nuT1eSscOKiiHX2qnmP";

  try {
    // 1. Exchange OAuth code for Access Token
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectUri,
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error("Discord Token Error:", tokenData);
      return NextResponse.redirect(`${baseUrl}/free-portal?error=token_failed`);
    }

    // 2. Fetch User Profile from Discord
    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`
      }
    });

    const userData = await userResponse.json();

    const discordName = encodeURIComponent(userData.global_name || userData.username || "DiscordUser");
    const discordId = encodeURIComponent(userData.id);
    const avatar = userData.avatar
      ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`
      : `https://cdn.discordapp.com/embed/avatars/0.png`;

    // 3. Redirect to Public Free Whitelist Portal Page with Discord User state
    return NextResponse.redirect(
      `${baseUrl}/free-portal?discord_login=true&name=${discordName}&id=${discordId}&avatar=${encodeURIComponent(avatar)}`
    );
  } catch (err) {
    console.error("Discord Callback Exception:", err);
    return NextResponse.redirect(`${baseUrl}/free-portal?error=oauth_exception`);
  }
}
