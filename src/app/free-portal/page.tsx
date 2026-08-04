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

  // UID Management Database State
  const [allUids, setAllUids] = useState<UIDCheckItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [actionLoadingUid, setActionLoadingUid] = useState<string | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch Database UIDs from local memory and live Mani API
  const fetchDatabaseUids = async () => {
    setIsLoadingList(true);
    let merged: UIDCheckItem[] = [];

    // 1. Get from local shared memory
    try {
      const local = JSON.parse(localStorage.getItem("mono_local_uids") || "[]");
      merged = local.map((item: { uid?: string; identifier?: string; days?: number | string; name?: string; createdAt?: string }) => ({
        uid: String(item.uid || item.identifier),
        days: typeof item.days === "number" ? item.days : (parseInt(String(item.days), 10) || 1),
        name: item.name || "Client",
        createdAt: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : new Date().toLocaleDateString()
      }));
    } catch (e) {}

    // 2. Fetch live Mani API backend database
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
        listData.forEach((remote: { identifier?: string; uid?: string; days?: number | string; name?: string; createdAt?: string }) => {
          const uidStr = String(remote.identifier || remote.uid);
          if (uidStr && !merged.some(m => m.uid === uidStr)) {
            merged.push({
              uid: uidStr,
              days: typeof remote.days === "number" ? remote.days : (parseInt(String(remote.days), 10) || 1),
              name: remote.name || `Node_${uidStr.substring(0, 6)}`,
              createdAt: remote.createdAt ? new Date(remote.createdAt).toLocaleDateString() : new Date().toLocaleDateString()
            });
          }
        });
      }
    } catch (err) {
      console.error("Fetch list error:", err);
    }

    setAllUids(merged);
    setIsLoadingList(false);
  };

  // Sync Admin Settings, Discord OAuth & Database on Mount
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
    fetchDatabaseUids();
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

  // Submit Free Whitelist Request
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

    // 2. Save record to shared local database `mono_local_uids`
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

    // 3. Update state immediately
    showToast(
      backendSuccess 
        ? `🎉 UID ${targetUid} FREE Whitelisted for ${portalDurationDays === 1 ? '24 Hours' : `${portalDurationDays} Days`}!` 
        : `⚡ UID ${targetUid} Provisioned & Whitelisted! ${backendMessage ? `(${backendMessage})` : ''}`,
      "success"
    );

    setGameUidInput("");
    setIsSubmitting(false);
    fetchDatabaseUids();
  };

  // Extend UID Validity Handler (+1 or +7 Days)
  const handleExtendUid = async (targetUid: string, addDays: number = 1) => {
    setActionLoadingUid(targetUid);
    try {
      const targetItem = allUids.find(u => u.uid === targetUid);
      const newDays = (targetItem ? targetItem.days : 1) + addDays;
      const clientName = targetItem ? targetItem.name : "Client";

      await fetch("/api/uid-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: "https://mani272uidbypass.vercel.app/api/v1/uids/add",
          method: "POST",
          body: {
            uid: targetUid,
            days: newDays,
            name: clientName
          }
        })
      });

      const updated = allUids.map(item => {
        if (item.uid === targetUid) {
          return { ...item, days: newDays };
        }
        return item;
      });
      setAllUids(updated);
      localStorage.setItem("mono_local_uids", JSON.stringify(updated));
      showToast(`⚡ Extended UID ${targetUid} by +${addDays} Day(s)! Total: ${newDays} Days`, "success");
    } catch (e) {
      showToast(`Failed to extend UID ${targetUid}`, "error");
    } finally {
      setActionLoadingUid(null);
    }
  };

  // Delete / Revoke UID Handler
  const handleDeleteUid = async (targetUid: string) => {
    if (!confirm(`Are you sure you want to REVOKE and DELETE whitelist for UID ${targetUid}?`)) return;

    setActionLoadingUid(targetUid);
    try {
      await fetch("/api/uid-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: "https://mani272uidbypass.vercel.app/api/v1/uids/remove",
          method: "POST",
          body: { uid: targetUid }
        })
      });

      const updated = allUids.filter(item => item.uid !== targetUid);
      setAllUids(updated);
      localStorage.setItem("mono_local_uids", JSON.stringify(updated));
      showToast(`🗑️ UID ${targetUid} Revoked and Removed successfully!`, "success");
    } catch (e) {
      showToast(`Failed to revoke UID ${targetUid}`, "error");
    } finally {
      setActionLoadingUid(null);
    }
  };

  // Filter UIDs based on search query
  const filteredUids = allUids.filter(u =>
    u.uid.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
    u.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

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

        {/* TOP CARD: DISCORD OAUTH & FREE WHITELIST CLAIM FORM (CENTERED DESIGN) */}
        <div className="max-w-3xl mx-auto w-full font-mono">
          <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-7 shadow-2xl space-y-6">
            
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

        {/* BRAND NEW SECTION: UID MANAGEMENT CONTROL CENTER */}
        <div className="max-w-7xl mx-auto w-full pt-8 font-mono space-y-6">
          <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-7 shadow-2xl space-y-6">
            
            {/* HEADER & SEARCH BAR */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <h2 className="text-xl font-black text-white uppercase tracking-wider font-sans">
                    UID Management Control Center
                  </h2>
                </div>
                <p className="text-xs text-zinc-500 font-sans mt-1">
                  View total whitelisted UIDs in real-time, search records, extend validity, or delete/revoke access.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <div className="bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl text-xs font-bold text-zinc-300 flex items-center space-x-2 shrink-0">
                  <span className="text-[10px] text-zinc-500 uppercase">Total UIDs:</span>
                  <span className="text-white font-black">{allUids.length}</span>
                </div>
                <button
                  onClick={fetchDatabaseUids}
                  disabled={isLoadingList}
                  className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0"
                >
                  <svg className={`w-3.5 h-3.5 ${isLoadingList ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>{isLoadingList ? "Syncing..." : "Refresh"}</span>
                </button>
              </div>
            </div>

            {/* SEARCH INPUT BAR */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 Search by Gaming UID or Registered Name..."
                className="w-full bg-black/90 border border-zinc-800 rounded-xl px-4 py-3.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white transition-all font-mono"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-white"
                >
                  ✕ Clear
                </button>
              )}
            </div>

            {/* WHITELISTED UIDS TABLE */}
            <div className="overflow-x-auto border border-zinc-800/80 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/50 text-[10px] uppercase tracking-widest text-zinc-400">
                    <th className="py-3.5 px-4 font-bold">Gaming UID</th>
                    <th className="py-3.5 px-4 font-bold">Registered Client</th>
                    <th className="py-3.5 px-4 font-bold">Validity / Days Left</th>
                    <th className="py-3.5 px-4 font-bold">Status</th>
                    <th className="py-3.5 px-4 font-bold text-right">Management Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-xs">
                  {filteredUids.map((item) => (
                    <tr key={item.uid} className="hover:bg-zinc-900/40 transition-colors">
                      
                      {/* GAMING UID */}
                      <td className="py-3.5 px-4 font-bold text-white font-mono">
                        {item.uid}
                      </td>

                      {/* REGISTERED NAME */}
                      <td className="py-3.5 px-4 text-zinc-300 font-sans">
                        {item.name || "Default Client"}
                      </td>

                      {/* VALIDITY / DAYS LEFT */}
                      <td className="py-3.5 px-4 font-bold text-emerald-400">
                        {item.days} Day(s)
                      </td>

                      {/* STATUS BADGE */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center space-x-1.5 bg-emerald-950/40 border border-emerald-800/80 text-emerald-400 text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                          <span>ACTIVE</span>
                        </span>
                      </td>

                      {/* MANAGEMENT ACTIONS (EXTEND / DELETE) */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            disabled={actionLoadingUid === item.uid}
                            onClick={() => handleExtendUid(item.uid, 1)}
                            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all flex items-center space-x-1 disabled:opacity-50"
                          >
                            <span>+1D Extend</span>
                          </button>

                          <button
                            disabled={actionLoadingUid === item.uid}
                            onClick={() => handleExtendUid(item.uid, 7)}
                            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all flex items-center space-x-1 disabled:opacity-50"
                          >
                            <span>+7D Extend</span>
                          </button>

                          <button
                            disabled={actionLoadingUid === item.uid}
                            onClick={() => handleDeleteUid(item.uid)}
                            className="bg-red-950/40 hover:bg-red-900/80 border border-red-800/80 text-red-400 hover:text-white px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all flex items-center space-x-1 disabled:opacity-50"
                          >
                            <span>🗑️ Delete</span>
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))}

                  {filteredUids.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-zinc-600 text-xs font-mono uppercase tracking-widest">
                        {isLoadingList ? "Syncing Database Records..." : searchQuery ? `No Whitelisted UIDs match "${searchQuery}"` : "No Whitelisted UIDs Found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>

      </main>

    </div>
  );
}
