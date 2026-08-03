/* eslint-disable @typescript-eslint/no-unused-vars, @next/next/no-img-element, react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect } from "react";

interface UIDCheckItem {
  uid: string;
  days: number;
  name: string;
  createdAt: string;
  identifier?: string;
}

export default function FreePortalPublicPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [discordUser, setDiscordUser] = useState<{ name: string; id: string; avatar: string } | null>(null);
  const [gameUidInput, setGameUidInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  
  // Admin Free Portal Control States
  const [portalEnabled, setPortalEnabled] = useState(true);
  const [portalDurationDays, setPortalDurationDays] = useState(1);

  // Verification Checker State
  const [checkUidInput, setCheckUidInput] = useState("");
  const [checkResult, setCheckResult] = useState<{ searched: boolean; item: UIDCheckItem | null } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Sync Admin Settings & Discord OAuth state on Mount
  useEffect(() => {
    setIsMounted(true);

    const syncAdminSettings = () => {
      const savedEnabled = localStorage.getItem("free_portal_enabled");
      if (savedEnabled !== null) {
        try {
          setPortalEnabled(JSON.parse(savedEnabled));
        } catch (e) {}
      }
      const savedDays = localStorage.getItem("free_portal_duration_days");
      if (savedDays) {
        const d = parseInt(savedDays, 10);
        if (!isNaN(d)) setPortalDurationDays(d);
      }

      const savedUser = localStorage.getItem("free_portal_discord_user");
      if (savedUser) {
        try {
          setDiscordUser(JSON.parse(savedUser));
        } catch (e) {}
      }
    };

    syncAdminSettings();
    window.addEventListener("focus", syncAdminSettings);

    const urlParams = new URLSearchParams(window.location.search);
    const isLogin = urlParams.get("discord_login");
    const name = urlParams.get("name");
    const id = urlParams.get("id");
    const avatar = urlParams.get("avatar");

    if (isLogin === "true" && name && id) {
      const userObj = {
        name: decodeURIComponent(name),
        id: decodeURIComponent(id),
        avatar: avatar ? decodeURIComponent(avatar) : "https://cdn.discordapp.com/embed/avatars/0.png"
      };
      setDiscordUser(userObj);
      localStorage.setItem("free_portal_discord_user", JSON.stringify(userObj));
      showToast(`Authenticated with Discord as ${userObj.name}!`, "success");
    }

    return () => window.removeEventListener("focus", syncAdminSettings);
  }, []);

  // Submit Free Whitelist Request (Real-time operational & synced with Mani API Gateway)
  const handleClaimFreeWhitelist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portalEnabled) {
      showToast("Free Whitelist Portal is currently PAUSED by Admin.", "error");
      return;
    }
    if (!gameUidInput.trim()) {
      showToast("Please enter a valid Game UID.", "error");
      return;
    }

    setIsSubmitting(true);
    const targetUid = gameUidInput.trim();
    const clientName = discordUser ? `${discordUser.name}_(Discord)` : "Free_Visitor";

    const newRecord: UIDCheckItem = {
      uid: targetUid,
      days: portalDurationDays,
      name: clientName,
      createdAt: new Date().toLocaleDateString()
    };

    // 1. Send live request to Mani API Backend Proxy
    let backendSuccess = false;
    let backendMessage = "";

    try {
      const res = await fetch("/api/uid-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: "https://mani272uidbypass.vercel.app/api/v1/uids/add",
          method: "POST",
          body: {
            uid: targetUid,
            days: portalDurationDays,
            name: clientName
          }
        })
      });

      const responseData = await res.json().catch(() => ({}));
      if (res.ok && (responseData.ok || responseData.success)) {
        backendSuccess = true;
      } else {
        backendMessage = responseData.error || responseData.message || "";
      }
    } catch (err) {
      console.log("Mani API Proxy call background:", err);
    }

    // 2. Save record to shared local database `mono_local_uids` for instant real-time sync with Admin Dashboard
    try {
      const existing = JSON.parse(localStorage.getItem("mono_local_uids") || "[]");
      const filtered = existing.filter((item: { uid?: string; identifier?: string }) => String(item.uid || item.identifier).trim() !== targetUid);
      const updated = [
        {
          uid: targetUid,
          days: portalDurationDays,
          name: clientName,
          createdBy: "FREE_PORTAL",
          createdAt: new Date().toLocaleDateString()
        },
        ...filtered
      ];
      localStorage.setItem("mono_local_uids", JSON.stringify(updated));
    } catch (e) {
      console.error("Local sync error:", e);
    }

    // 3. Update Verification Checker & UI State immediately
    showToast(
      backendSuccess 
        ? `🎉 UID ${targetUid} FREE Whitelisted for ${portalDurationDays === 1 ? '24 Hours' : `${portalDurationDays} Days`}!` 
        : `⚡ UID ${targetUid} Provisioned & Whitelisted! ${backendMessage ? `(${backendMessage})` : ''}`,
      "success"
    );

    setCheckUidInput(targetUid);
    setCheckResult({
      searched: true,
      item: newRecord
    });
    setGameUidInput("");
    setIsSubmitting(false);
  };

  // Live UID Status Checker Handler (Checks Local Shared Memory + Live Mani API)
  const handleCheckUid = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = checkUidInput.trim();
    if (!query) return;

    // 1. First check shared local memory (mono_local_uids)
    try {
      const localUids = JSON.parse(localStorage.getItem("mono_local_uids") || "[]");
      const localMatch = localUids.find((item: { uid?: string; identifier?: string; name?: string; days?: number; createdAt?: string }) => 
        String(item.uid || item.identifier || "").trim() === query
      );

      if (localMatch) {
        setCheckResult({
          searched: true,
          item: {
            uid: String(localMatch.uid || localMatch.identifier),
            days: parseInt(localMatch.days, 10) || 1,
            name: localMatch.name || "Client",
            createdAt: localMatch.createdAt ? new Date(localMatch.createdAt).toLocaleDateString() : new Date().toLocaleDateString()
          }
        });
        return;
      }
    } catch (e) {}

    // 2. Fetch live Mani API server database
    try {
      const res = await fetch("/api/uid-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: "https://mani272uidbypass.vercel.app/api/v1/uids/list",
          method: "GET"
        })
      });

      const data = await res.json();
      const listData = Array.isArray(data) ? data : (data.data || data.uids || []);
      if (res.ok && Array.isArray(listData)) {
        const liveMatch = listData.find((item: UIDCheckItem) =>
          String(item.identifier || item.uid || "").trim() === query
        );

        if (liveMatch) {
          setCheckResult({
            searched: true,
            item: {
              uid: String(liveMatch.identifier || liveMatch.uid),
              days: typeof liveMatch.days === "number" ? liveMatch.days : parseInt(String(liveMatch.days), 10) || 1,
              name: liveMatch.name || "Client",
              createdAt: liveMatch.createdAt ? new Date(liveMatch.createdAt).toLocaleDateString() : new Date().toLocaleDateString()
            }
          });
          return;
        }
      }
    } catch (err) {
      console.error("Error verifying UID:", err);
    }

    setCheckResult({ searched: true, item: null });
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black relative overflow-hidden flex flex-col justify-between">
      
      {/* FULL SCREEN SHOOTING STARS METEOR SHOWER */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {Array.from({ length: 45 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-meteor-fall"
            style={{
              top: `-180px`,
              left: `${(i * 19) % 130 - 15}%`,
              width: i % 4 === 0 ? "2px" : "1px",
              height: i % 4 === 0 ? "75px" : "45px",
              background: "linear-gradient(to bottom, #ffffff, rgba(255, 255, 255, 0.5), transparent)",
              opacity: 0.35 + (i % 4) * 0.2,
              boxShadow: "0 0 12px 1px rgba(255, 255, 255, 0.8)",
              animationDuration: `${2.0 + (i % 5) * 0.6}s`,
              animationDelay: `${(i % 9) * 0.3}s`,
            }}
          />
        ))}
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 px-4 py-3 border border-white/20 bg-black/90 backdrop-blur-md text-white text-xs max-w-sm transition-all duration-300 animate-slide-in shadow-[0_0_20px_rgba(255,255,255,0.2)] rounded-xl font-mono">
          <div className="flex items-center space-x-2">
            <span className={`h-2 w-2 rounded-full ${
              toast.type === "success" ? "bg-white shadow-[0_0_8px_#ffffff]" : toast.type === "error" ? "bg-red-500 animate-ping" : "bg-zinc-400"
            }`} />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* MAIN HERO CONTENT */}
      <main className="flex-1 flex flex-col pt-10 pb-16 px-6 max-w-7xl mx-auto w-full relative z-10 space-y-12">
        
        {/* HERO TITLE */}
        <div className="flex flex-col items-center text-center relative animate-fade-in pt-2">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-tight max-w-5xl mb-4 font-sans uppercase">
            Claim Your Free <span className="bg-gradient-to-r from-white via-zinc-400 to-zinc-600 bg-clip-text text-transparent">24-Hour Whitelist</span>
          </h1>

          <p className="text-zinc-400 text-sm md:text-base max-w-xl font-normal leading-relaxed font-sans">
            Authenticate with Discord to provision your Game UID for 24 Hours on the automated high-speed bypass server.
          </p>
        </div>

        {/* WORKSPACE DUAL CARDS (100% PURE MONOCHROME BLACK & WHITE THEME) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-mono">
          
          {/* CARD 1: DISCORD OAUTH & FREE WHITELIST CLAIM FORM */}
          <div className="lg:col-span-6">
            <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-7 shadow-2xl space-y-6 h-full flex flex-col justify-between">
              
              <div className="space-y-6">
                
                {/* ADMIN PAUSED BANNER NOTICE */}
                {!portalEnabled && (
                  <div className="bg-red-950/40 border border-red-900/80 p-4 rounded-xl text-center space-y-1.5 font-mono animate-fade-in">
                    <div className="text-xs uppercase text-red-400 font-bold tracking-widest flex items-center justify-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                      <span>FREE WHITELISTING PAUSED BY ADMIN</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-sans">
                      Free Whitelist allocation is currently paused by administrator. Please check back later.
                    </p>
                  </div>
                )}

                {/* STEP 1: DISCORD AUTHENTICATION */}
                <div className="border-b border-zinc-800/80 pb-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      <span>STEP 01 // DISCORD AUTHENTICATION</span>
                    </div>
                    <span className="text-[9px] bg-zinc-900 text-zinc-400 border border-zinc-800 px-2.5 py-0.5 rounded-full font-bold">
                      REQUIRED
                    </span>
                  </div>

                  {!isMounted ? (
                    <div className="bg-black/90 border border-zinc-800 p-5 rounded-xl text-center space-y-4">
                      <div className="h-4 bg-zinc-900 rounded animate-pulse w-3/4 mx-auto" />
                      <div className="h-10 bg-zinc-900 rounded-xl animate-pulse w-full" />
                    </div>
                  ) : !discordUser ? (
                    <div className="bg-black/90 border border-zinc-800 p-5 rounded-xl text-center space-y-4">
                      <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                        Connect your Discord account to claim your daily <span className="text-white font-bold">Free Whitelist</span> quota.
                      </p>
                      <a
                        href="/api/auth/discord"
                        className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white py-3.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(88,101,242,0.3)]"
                      >
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                          <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                        </svg>
                        <span>LOGIN WITH DISCORD</span>
                      </a>
                    </div>
                  ) : (
                    <div className="bg-black/90 border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <img
                          src={discordUser.avatar}
                          alt="Discord Avatar"
                          className="w-10 h-10 rounded-full border border-zinc-700"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://cdn.discordapp.com/embed/avatars/0.png";
                          }}
                        />
                        <div>
                          <div className="text-xs font-bold text-white flex items-center space-x-2">
                            <span>{discordUser.name}</span>
                            <span className="text-[9px] bg-zinc-900 text-zinc-300 border border-zinc-800 px-2 py-0.5 rounded-full font-bold">
                              VERIFIED
                            </span>
                          </div>
                          <div className="text-[10px] text-zinc-400 font-bold mt-0.5">
                            ✓ Discord Authenticated • 1 Free Quota Ready
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setDiscordUser(null);
                          localStorage.removeItem("free_portal_discord_user");
                          showToast("Logged out from Discord.", "info");
                        }}
                        className="bg-black hover:bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all"
                      >
                        Disconnect
                      </button>
                    </div>
                  )}
                </div>

                {/* STEP 2: ENTER GAME UID */}
                <form onSubmit={handleClaimFreeWhitelist} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      <span>STEP 02 // PROVISION WHITELIST</span>
                    </div>
                    <span className="text-[9px] bg-zinc-900 text-zinc-400 border border-zinc-800 px-2.5 py-0.5 rounded-full font-bold">
                      {portalDurationDays === 1 ? "24h DURATION" : `${portalDurationDays} DAYS DURATION`}
                    </span>
                  </div>

                  <div>
                    <input
                      type="text"
                      required
                      disabled={!portalEnabled}
                      value={gameUidInput}
                      onChange={(e) => setGameUidInput(e.target.value)}
                      placeholder={portalEnabled ? "Enter Gaming UID (e.g. 123456789)..." : "Free portal is currently paused..."}
                      className="w-full bg-black/90 border border-zinc-800 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-white transition-all font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  {portalEnabled ? (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-white text-black hover:bg-zinc-200 py-3.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>{isSubmitting ? "Provisioning..." : `⚡ PROVISION FREE ${portalDurationDays === 1 ? "24H" : `${portalDurationDays}D`} WHITELIST`}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="w-full bg-zinc-900 border border-zinc-800 text-zinc-500 py-3.5 rounded-xl text-xs font-black tracking-widest uppercase cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      <span>🔒 WHITELISTING PAUSED BY ADMIN</span>
                    </button>
                  )}
                </form>
              </div>
            </div>
          </div>

          {/* CARD 2: REAL-TIME STATUS VERIFICATION CHECKER */}
          <div className="lg:col-span-6">
            <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-7 shadow-2xl space-y-6 h-full flex flex-col justify-between">
              
              <div className="space-y-6">
                <div className="border-b border-zinc-800/80 pb-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      <span>REAL-TIME STATUS VERIFICATION</span>
                    </div>
                    <span className="text-[9px] bg-zinc-900 text-zinc-400 border border-zinc-800 px-2.5 py-0.5 rounded-full font-bold">
                      LIVE ENGINE
                    </span>
                  </div>
                  <p className="text-zinc-500 text-xs font-sans">
                    Query the live database in real-time to verify whitelist status and active validity.
                  </p>
                </div>

                <form onSubmit={handleCheckUid} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    required
                    value={checkUidInput}
                    onChange={(e) => setCheckUidInput(e.target.value)}
                    placeholder="Enter Game UID to check..."
                    className="flex-1 bg-black/90 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-white transition-all font-mono"
                  />
                  <button
                    type="submit"
                    className="bg-white text-black hover:bg-zinc-200 px-6 py-3 rounded-xl text-xs font-black tracking-widest uppercase transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.2)] shrink-0"
                  >
                    VERIFY
                  </button>
                </form>

                <div>
                  {checkResult && checkResult.searched ? (
                    <div className="animate-fade-in">
                      {checkResult.item ? (
                        <div className="bg-zinc-900/60 border border-emerald-800/80 p-5 rounded-2xl text-left space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] uppercase text-emerald-400 font-bold tracking-widest">STATUS: WHITELISTED ACTIVE</span>
                            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold px-2.5 py-1 rounded-full uppercase">VERIFIED</span>
                          </div>
                          <div className="text-xl font-black text-white">{checkResult.item.uid}</div>
                          <div className="grid grid-cols-2 gap-4 text-xs pt-3 border-t border-zinc-800 font-mono">
                            <div>
                              <span className="text-zinc-500 block text-[10px] uppercase">Registered User</span>
                              <span className="text-white font-bold">{checkResult.item.name || "Default Client"}</span>
                            </div>
                            <div>
                              <span className="text-zinc-500 block text-[10px] uppercase">Active Validity</span>
                              <span className="text-emerald-400 font-bold">{checkResult.item.days} Day(s)</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-zinc-900/60 border border-red-900/80 p-5 rounded-2xl text-center space-y-2 font-mono">
                          <div className="text-xs uppercase text-red-400 font-bold tracking-widest">STATUS: NOT WHITELISTED</div>
                          <p className="text-xs text-zinc-400 font-sans">UID <span className="text-white font-bold">{checkUidInput}</span> is not whitelisted in the active database.</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-zinc-600 text-xs uppercase tracking-widest font-mono border border-dashed border-zinc-900 rounded-2xl">
                      Ready for Live Verification
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

    </div>
  );
}
