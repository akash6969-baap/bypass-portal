/* eslint-disable @typescript-eslint/no-unused-vars, @next/next/no-img-element, react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";

// --- Types ---
interface UIDItem {
  uid: string;
  days: number;
  name: string;
  createdBy: string;
  createdAt: string;
}

interface ResellerItem {
  username: string;
  password?: string;
  credits: number;
  totalWhitelisted: number;
  createdAt: string;
}

interface LogItem {
  id: string;
  action: string;
  details: string;
  by: string;
  timestamp: string;
}

interface ClientApiKeyItem {
  id: string;
  clientName: string;
  key: string;
  credits: number;
  status: "ACTIVE" | "REVOKED";
  createdAt: string;
}

type TabType = "OVERVIEW" | "WHITELIST" | "UID_MANAGEMENT" | "RESELLERS" | "API_KEYS" | "FREE_PORTAL" | "LOGS" | "DOCS";
type LandingSection = "HOME" | "PROVIDERS" | "API_ACCESS" | "RESELLER_SYSTEM" | "HOW_IT_WORKS";

function generateRandomId() {
  return Math.random().toString(36).substring(2, 9);
}

function generateApiKey(clientName: string) {
  const clean = clientName.trim().toUpperCase().replace(/\s+/g, "_");
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  const time = Date.now().toString(36).toUpperCase();
  return `KEY-${clean}-${rand}-${time}`;
}

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  // Authentication & API Config
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userRole, setUserRole] = useState<"ADMIN" | "RESELLER" | null>(null);
  const [currentUser, setCurrentUser] = useState<string>("");
  const [loginType, setLoginType] = useState<"ADMIN" | "RESELLER">("ADMIN");
  
  // Landing Page & Modal State
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [activeLandingSection, setActiveLandingSection] = useState<LandingSection>("HOME");
  const [apiCodeTab, setApiCodeTab] = useState<"curl" | "python" | "javascript">("curl");
  
  // App Config
  const [apiUrl, setApiUrl] = useState("https://mani272uidbypass.vercel.app/api/v1");
  const [isMockMode, setIsMockMode] = useState(false);
  
  // UI State
  const [isConnecting, setIsConnecting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("OVERVIEW");

  // Dashboard Data State
  const [uids, setUids] = useState<UIDItem[]>([]);
  const [resellers, setResellers] = useState<ResellerItem[]>([]);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [logFilter, setLogFilter] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Forms State
  const [searchQuery, setSearchQuery] = useState("");
  const [newUid, setNewUid] = useState("");
  const [newDays, setNewDays] = useState(30);
  const [newName, setNewName] = useState("");
  
  const [newResellerUsername, setNewResellerUsername] = useState("");
  const [newResellerPassword, setNewResellerPassword] = useState("");
  const [newResellerCredits, setNewResellerCredits] = useState(100);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingUid, setDeletingUid] = useState<string | null>(null);

  // Free Portal & API Key State
  const [checkUidInput, setCheckUidInput] = useState("");
  const [checkResult, setCheckResult] = useState<{ searched: boolean; item: UIDItem | null } | null>(null);
  const [apiKey, setApiKey] = useState("X-AUTH-FEAR-EDIT-X999-SECRET-KEY");
  const [clientApiKeys, setClientApiKeys] = useState<ClientApiKeyItem[]>([]);
  const [newClientName, setNewClientName] = useState("");
  const [newClientCredits, setNewClientCredits] = useState(500);
  const [extendModalKey, setExtendModalKey] = useState<ClientApiKeyItem | null>(null);
  const [extendCreditsInput, setExtendCreditsInput] = useState<number>(500);

  // Free Portal Admin Controls & Discord State
  const [freePortalEnabled, setFreePortalEnabled] = useState(true);
  const [freeDurationDays, setFreeDurationDays] = useState(1); // Default 1 day / 24 hours
  const [freeDurationLabel, setFreeDurationLabel] = useState("24 Hours (1 Day)");
  const [freeUidInput, setFreeUidInput] = useState("");
  const [freeUserNameInput, setFreeUserNameInput] = useState("");
  const [discordUser, setDiscordUser] = useState<{ name: string; tag: string; avatar: string } | null>(null);

  // Safe API Proxy Call Helper
  const makeApiCall = async (endpoint: string, method: "GET" | "POST", bodyData?: Record<string, unknown>) => {
    try {
      const response = await fetch("/api/uid-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: `${apiUrl}${endpoint}`,
          method,
          body: bodyData,
        }),
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        return { 
          ok: false, 
          error: responseData.error || responseData.message || `API Error (${response.status})` 
        };
      }

      return { ok: true, data: responseData };
    } catch (err: unknown) {
      console.error(`API Call failed (${endpoint}):`, err);
      return { 
        ok: false, 
        error: err instanceof Error ? err.message : "Failed to connect to API server" 
      };
    }
  };

  // Free Portal Whitelist Submission Handler
  const handleFreeWhitelistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!freePortalEnabled) {
      showToast("Free Whitelist Portal is currently PAUSED by Admin.", "error");
      return;
    }
    if (!freeUidInput.trim()) {
      showToast("Please enter a valid Game UID.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const clientName = discordUser ? `${discordUser.name}_(Discord)` : (freeUserNameInput.trim() || "Free_User");
      
      // Call Next.js Proxy route handler
      const res = await makeApiCall("/uids/add", "POST", {
        uid: freeUidInput.trim(),
        days: freeDurationDays,
        name: clientName
      });

      if (res.ok) {
        showToast(`🎉 UID ${freeUidInput.trim()} FREE Whitelisted for ${freeDurationLabel}!`, "success");
        addLog("FREE_WHITELIST", `Free Whitelisted UID ${freeUidInput.trim()} for ${freeDurationLabel} by ${clientName}.`, clientName);
        setCheckUidInput(freeUidInput.trim());
        setCheckResult({
          searched: true,
          item: {
            uid: freeUidInput.trim(),
            days: freeDurationDays,
            name: clientName,
            createdBy: clientName,
            createdAt: new Date().toLocaleDateString()
          }
        });
        setFreeUidInput("");
      } else {
        showToast(res.error || "Failed to whitelist UID.", "error");
      }
    } catch (err: unknown) {
      showToast("Error connecting to whitelist server.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Client API Key Handlers
  const handleGenerateClientKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) {
      showToast("Client name is required.", "error");
      return;
    }

    const randomId = generateRandomId();
    const generatedKey = generateApiKey(newClientName);

    const newRecord: ClientApiKeyItem = {
      id: randomId,
      clientName: newClientName.trim(),
      key: generatedKey,
      credits: newClientCredits,
      status: "ACTIVE",
      createdAt: new Date().toLocaleDateString(),
    };

    const updated = [newRecord, ...clientApiKeys];
    saveClientKeysWithServer(updated);
    addLog("API_KEY_CREATE", `Generated API Key for ${newClientName.trim()} with ${newClientCredits} credits.`, currentUser);
    showToast(`Generated API Key for ${newClientName.trim()}!`, "success");
    setNewClientName("");
    setNewClientCredits(500);
  };

  const saveClientKeysWithServer = (list: ClientApiKeyItem[]) => {
    setClientApiKeys(list);
    localStorage.setItem("mono_client_api_keys", JSON.stringify(list));
    try {
      fetch("/api/v1/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SYNC", keys: list })
      });
    } catch (e) {
      console.error("Failed to sync keys to server:", e);
    }
  };

  const handleRevokeClientKey = (keyId: string) => {
    const updated = clientApiKeys.map(k => k.id === keyId ? { ...k, status: k.status === "ACTIVE" ? ("REVOKED" as const) : ("ACTIVE" as const) } : k);
    saveClientKeysWithServer(updated);
    showToast("API Key status updated.", "info");
  };

  const handleDeleteClientKey = (keyId: string) => {
    if (!confirm("Are you sure you want to delete this API Key?")) return;
    const updated = clientApiKeys.filter(k => k.id !== keyId);
    saveClientKeysWithServer(updated);
    showToast("API Key deleted.", "success");
  };

  const handleExtendClientKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extendModalKey || !extendCreditsInput || extendCreditsInput <= 0) return;

    const keyId = extendModalKey.id;
    const amount = extendCreditsInput;

    const updated = clientApiKeys.map(k => {
      if (k.id === keyId) {
        const newCredits = (k.credits || 0) + amount;
        addLog("API_KEY_EXTEND", `Extended +${amount} credits for API key ${k.clientName} (New Total: ${newCredits} CR).`, currentUser);
        return { ...k, credits: newCredits };
      }
      return k;
    });

    saveClientKeysWithServer(updated);
    showToast(`Added +${amount} credits to ${extendModalKey.clientName}!`, "success");
    setExtendModalKey(null);
    setExtendCreditsInput(500);
  };

  // Free Portal Check Handler (Real-Time Live Server Verification)
  const handleCheckUid = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = checkUidInput.trim();
    if (!query) return;

    // First check local state memory
    const found = uids.find(u => 
      String(u.uid).trim() === query || 
      String((u as UIDItem & { identifier?: string }).identifier || "").trim() === query
    );

    if (found) {
      setCheckResult({ searched: true, item: found });
      return;
    }

    // If not found in local state, fetch live Mani API server database
    try {
      const res = await makeApiCall("/uids/list", "GET");
      if (res.ok && Array.isArray(res.data)) {
        const liveMatch = res.data.find((item: { identifier?: string; uid?: string; name?: string; creator?: string; days?: number; createdAt?: string }) => 
          String(item.identifier || item.uid || "").trim() === query
        );

        if (liveMatch) {
          const formatted: UIDItem = {
            uid: String(liveMatch.identifier || liveMatch.uid),
            days: parseInt(liveMatch.days) || 30,
            name: liveMatch.name || "Client",
            createdBy: liveMatch.creator || "System",
            createdAt: liveMatch.createdAt ? new Date(liveMatch.createdAt).toLocaleDateString() : new Date().toLocaleDateString()
          };

          setUids(prev => {
            if (!prev.some(u => String(u.uid).trim() === query)) {
              return [formatted, ...prev];
            }
            return prev;
          });

          setCheckResult({ searched: true, item: formatted });
          return;
        }
      }
    } catch (err) {
      console.error("Error verifying live UID:", err);
    }

    setCheckResult({ searched: true, item: null });
  };

  // Helper: Toast
  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Helper: Logger
  const addLog = (action: string, details: string, by: string) => {
    const newLog: LogItem = {
      id: generateRandomId(),
      action,
      details,
      by,
      timestamp: new Date().toLocaleString(),
    };
    setLogs(prev => {
      const updated = [newLog, ...prev];
      localStorage.setItem("mono_logs", JSON.stringify(updated));
      return updated;
    });
  };

  // Load Data on Mount & Fetch Real Mani API UIDs
  useEffect(() => {
    setIsMounted(true);

    const savedRole = localStorage.getItem("mono_role") as "ADMIN" | "RESELLER" | null;
    const savedAuth = localStorage.getItem("mono_auth") === "true";
    const savedUser = localStorage.getItem("mono_user") || "";
    
    if (savedAuth && savedRole) {
      setIsAuthenticated(true);
      setUserRole(savedRole);
      setCurrentUser(savedUser);
    }

    try {
      setUids(JSON.parse(localStorage.getItem("mono_local_uids") || "[]"));
      setResellers(JSON.parse(localStorage.getItem("mono_resellers") || "[]"));
      setLogs(JSON.parse(localStorage.getItem("mono_logs") || "[]"));
      setClientApiKeys(JSON.parse(localStorage.getItem("mono_client_api_keys") || "[]"));
    } catch (e) {
      console.error("Error loading local data:", e);
    }

    // Fetch Live Real UIDs from Mani API
    const fetchManiUids = async () => {
      try {
        const res = await makeApiCall("/uids/list", "GET");
        if (res.ok && Array.isArray(res.data)) {
          const remoteList: UIDItem[] = res.data.map((item: { identifier?: string; uid?: string; name?: string; expiresAt?: string; days?: number; createdAt?: string; creator?: string }) => {
            let daysLeft = 30;
            if (item.expiresAt) {
              const diffMs = new Date(item.expiresAt).getTime() - new Date().getTime();
              daysLeft = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
            }
            return {
              uid: item.identifier || item.uid || "Unknown",
              name: item.name || `Node_${item.identifier || "UID"}`,
              days: item.days || daysLeft,
              createdBy: item.creator || "chiper",
              createdAt: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
            };
          });

          if (remoteList.length > 0) {
            setUids(remoteList);
            localStorage.setItem("mono_local_uids", JSON.stringify(remoteList));
          }
        }
      } catch (err) {
        console.log("Remote Mani API list fetch fallback:", err);
      }
    };

    // Fetch Server API Keys
    const fetchServerKeys = async () => {
      try {
        const response = await fetch("/api/v1/keys");
        const resData = await response.json();
        if (resData.success && Array.isArray(resData.data) && resData.data.length > 0) {
          setClientApiKeys(resData.data);
          localStorage.setItem("mono_client_api_keys", JSON.stringify(resData.data));
        }
      } catch (err) {
        console.log("Server keys fetch fallback:", err);
      }
    };

    fetchManiUids();
    fetchServerKeys();
  }, []);

  // Save changes to localStorage wrappers
  const saveUids = (list: UIDItem[]) => {
    setUids(list);
    localStorage.setItem("mono_local_uids", JSON.stringify(list));
  };
  const saveResellers = (list: ResellerItem[]) => {
    setResellers(list);
    localStorage.setItem("mono_resellers", JSON.stringify(list));
  };

  // Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setLoginError(loginType === "ADMIN" ? "Email and Password are required." : "Username and Password are required.");
      return;
    }

    setLoginError(null);
    setIsConnecting(true);

    setTimeout(() => {
      setIsConnecting(false);
      
      if (loginType === "ADMIN") {
        const isValidAdmin = 
          (email === "sarthakking333@gmail.com" && password === "SARTHAKX999") ||
          (email === "basicpanelfear69@gmail.com" && password === "fear@6395");

        if (isValidAdmin) {
          setIsAuthenticated(true);
          setUserRole("ADMIN");
          setCurrentUser("ADMIN");
          localStorage.setItem("mono_auth", "true");
          localStorage.setItem("mono_role", "ADMIN");
          localStorage.setItem("mono_user", "ADMIN");
          setIsLoginModalOpen(false);
          showToast("Admin session established.", "success");
          addLog("LOGIN", "Admin logged into the system.", "ADMIN");
        } else {
          setLoginError("Invalid admin credentials.");
        }
      } else {
        const reseller = resellers.find(r => r.username === email && r.password === password);
        if (reseller) {
          setIsAuthenticated(true);
          setUserRole("RESELLER");
          setCurrentUser(reseller.username);
          localStorage.setItem("mono_auth", "true");
          localStorage.setItem("mono_role", "RESELLER");
          localStorage.setItem("mono_user", reseller.username);
          setIsLoginModalOpen(false);
          showToast("Reseller session established.", "success");
          addLog("LOGIN", "Reseller logged in.", reseller.username);
        } else {
          setLoginError("Invalid reseller credentials.");
        }
      }
    }, 800);
  };

  const handleLogout = () => {
    addLog("LOGOUT", "User logged out.", currentUser);
    setIsAuthenticated(false);
    setUserRole(null);
    setCurrentUser("");
    localStorage.removeItem("mono_auth");
    localStorage.removeItem("mono_role");
    localStorage.removeItem("mono_user");
    showToast("Session terminated.", "info");
  };

  // Add UID
  const handleAddUid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUid.trim()) {
      showToast("UID is required.", "error");
      return;
    }

    const creditCost = newDays;
    if (userRole === "RESELLER") {
      const currentReseller = resellers.find(r => r.username === currentUser);
      if (!currentReseller || currentReseller.credits < creditCost) {
        showToast(`Insufficient credits. Required: ${creditCost}.`, "error");
        return;
      }
      
      const updatedResellers = resellers.map(r => {
        if (r.username === currentUser) {
          return { ...r, credits: r.credits - creditCost, totalWhitelisted: r.totalWhitelisted + 1 };
        }
        return r;
      });
      saveResellers(updatedResellers);
    }

    setIsSubmitting(true);
    const newRecord: UIDItem = {
      uid: newUid.trim(),
      days: newDays,
      name: newName.trim() || "DefaultName",
      createdBy: currentUser,
      createdAt: new Date().toLocaleDateString(),
    };

    if (uids.some((item) => item.uid === newRecord.uid)) {
      showToast("UID already exists in database.", "error");
      setIsSubmitting(false);
      return;
    }

    // Try backend API call in background
    makeApiCall("/uids/add", "POST", {
      uid: newRecord.uid,
      days: newRecord.days,
      name: newRecord.name,
    }).catch(err => console.log("Backend sync offline fallback active:", err));

    // Save record immediately in real-time
    saveUids([newRecord, ...uids]);
    addLog("WHITELIST_ADD", `Added UID ${newRecord.uid} for ${newRecord.days} days.`, currentUser);
    showToast("UID provisioned successfully.", "success");
    setNewUid("");
    setNewName("");
    setNewDays(30);
    setIsSubmitting(false);
  };

  // Extend UID Lifespan
  const handleExtendUid = async (uidToExtend: string, additionalDays: number) => {
    if (additionalDays <= 0) return;

    if (userRole === "RESELLER") {
      const currentReseller = resellers.find(r => r.username === currentUser);
      if (!currentReseller || currentReseller.credits < additionalDays) {
        showToast(`Insufficient credits. Required: ${additionalDays}.`, "error");
        return;
      }
      const updatedResellers = resellers.map(r => {
        if (r.username === currentUser) {
          return { ...r, credits: r.credits - additionalDays };
        }
        return r;
      });
      saveResellers(updatedResellers);
    }

    const updatedUids = uids.map((item) => {
      if (item.uid === uidToExtend) {
        return { ...item, days: Number(item.days) + Number(additionalDays) };
      }
      return item;
    });

    saveUids(updatedUids);
    addLog("WHITELIST_EXTEND", `Extended UID ${uidToExtend} by ${additionalDays} days.`, currentUser);
    showToast(`UID extended by ${additionalDays} days.`, "success");
  };

  // Remove UID
  const handleRemoveUid = async (uidToRemove: string) => {
    if (!confirm(`Are you sure you want to delete/revoke UID: ${uidToRemove}?`)) return;

    setDeletingUid(uidToRemove);

    if (isMockMode) {
      setTimeout(() => {
        const updated = uids.filter((item) => item.uid !== uidToRemove);
        saveUids(updated);
        addLog("WHITELIST_REMOVE", `Revoked UID ${uidToRemove}.`, currentUser);
        setDeletingUid(null);
        showToast("UID deleted successfully.", "success");
      }, 500);
      return;
    }

    const apiRes = await makeApiCall("/uids/remove", "POST", { uid: uidToRemove });
    
    if (apiRes.ok) {
      addLog("WHITELIST_REMOVE", `Revoked UID ${uidToRemove}.`, currentUser);
      showToast("UID revoked successfully.", "success");
    } else {
      showToast(apiRes.error || "UID removed locally.", "info");
    }

    const updated = uids.filter((item) => item.uid !== uidToRemove);
    saveUids(updated);
    setDeletingUid(null);
  };

  // Add Reseller
  const handleAddReseller = (e: React.FormEvent) => {
    e.preventDefault();
    if (resellers.some(r => r.username === newResellerUsername)) {
      showToast("Reseller username already exists.", "error");
      return;
    }

    const newReseller: ResellerItem = {
      username: newResellerUsername,
      password: newResellerPassword,
      credits: newResellerCredits,
      totalWhitelisted: 0,
      createdAt: new Date().toLocaleDateString(),
    };

    saveResellers([newReseller, ...resellers]);
    addLog("RESELLER_ADD", `Created reseller ${newResellerUsername} with ${newResellerCredits} credits.`, currentUser);
    showToast("Reseller created successfully.", "success");
    setNewResellerUsername("");
    setNewResellerPassword("");
    setNewResellerCredits(100);
  };

  // Add / Edit Reseller Credits
  const handleAddResellerCredits = (targetUsername: string, extraCredits: number) => {
    if (extraCredits <= 0) return;
    const updated = resellers.map(r => {
      if (r.username === targetUsername) {
        return { ...r, credits: Number(r.credits) + Number(extraCredits) };
      }
      return r;
    });
    saveResellers(updated);
    addLog("RESELLER_CREDIT_ADD", `Added ${extraCredits} credits to reseller ${targetUsername}.`, currentUser);
    showToast(`Added ${extraCredits} credits to ${targetUsername}.`, "success");
  };

  // Delete Reseller
  const handleDeleteReseller = (targetUsername: string) => {
    if (!confirm(`Are you sure you want to delete reseller: ${targetUsername}?`)) return;
    const updated = resellers.filter(r => r.username !== targetUsername);
    saveResellers(updated);
    addLog("RESELLER_DELETE", `Deleted reseller ${targetUsername}.`, currentUser);
    showToast(`Reseller ${targetUsername} deleted.`, "success");
  };

  // Filtering logic
  const filteredUids = uids.filter(item => 
    (userRole === "ADMIN" || item.createdBy === currentUser) &&
    (item.uid.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const filteredLogs = logs.filter(item => {
    const roleAllowed = userRole === "ADMIN" || item.by === currentUser;
    if (!roleAllowed) return false;
    if (!logFilter.trim()) return true;
    const q = logFilter.toLowerCase();
    return (
      item.action.toLowerCase().includes(q) ||
      item.details.toLowerCase().includes(q) ||
      item.by.toLowerCase().includes(q) ||
      item.timestamp.toLowerCase().includes(q)
    );
  });

  const currentResellerObj = resellers.find(r => r.username === currentUser);

  return (
    <div className="flex-1 flex flex-col bg-black text-white font-mono min-h-screen selection:bg-white selection:text-black">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 px-4 py-3 border border-white/20 bg-black/80 backdrop-blur-md text-white text-xs max-w-sm transition-all duration-300 animate-slide-in shadow-[0_0_20px_rgba(255,255,255,0.1)] rounded-lg">
          <div className="flex items-center space-x-2">
            <span className={`h-2 w-2 rounded-full ${
              toast.type === "success" ? "bg-emerald-500 shadow-[0_0_10px_#10b981]" : toast.type === "error" ? "bg-red-500 animate-ping" : "bg-blue-500"
            }`} />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* --- PUBLIC HERO LANDING PAGE --- */}
      {!isAuthenticated ? (
        <div className="flex-1 flex flex-col bg-black text-white relative font-sans selection:bg-white selection:text-black min-h-screen overflow-y-scroll">
          
          {/* FLOATING NAVBAR (Fixed & Anchored) */}
          <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-full max-w-7xl z-40 px-6 flex items-center justify-between pointer-events-none">
            {/* Brand Logo */}
            <div className="pointer-events-auto flex items-center bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-xl px-5 py-2.5 rounded-full shadow-2xl">
              <span className="font-logo font-black tracking-tight text-lg text-white">
                UID BYPASS PORTAL
              </span>
            </div>

            {/* Center Floating Pill Menu */}
            <div className="pointer-events-auto hidden md:flex items-center space-x-1 bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-xl p-1.5 rounded-full shadow-2xl">
              {[
                { id: "HOME", label: "Home" },
                { id: "PROVIDERS", label: "Providers" },
                { id: "API_ACCESS", label: "API Access" },
                { id: "RESELLER_SYSTEM", label: "Reseller System" },
                { id: "HOW_IT_WORKS", label: "How It Works" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveLandingSection(item.id as LandingSection)}
                  className={`px-4 py-2 text-xs font-semibold rounded-full transition-all duration-200 ${
                    activeLandingSection === item.id
                      ? "bg-zinc-800 text-white shadow-inner"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Right Action Button (Log In) */}
            <div className="pointer-events-auto">
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="bg-white hover:bg-zinc-200 text-black px-6 py-2.5 rounded-full text-xs font-bold tracking-wider transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span>Portal Log In</span>
              </button>
            </div>
          </nav>

          {/* MAIN PAGE VIEW SWITCHER */}
          <main className="flex-1 flex flex-col pt-36 pb-20 px-6 max-w-7xl mx-auto w-full min-h-[calc(100vh-5rem)]">
            
            {/* 1. HOME / HERO PAGE */}
            {activeLandingSection === "HOME" && (
              <div className="flex flex-col items-center text-center relative animate-fade-in pt-16 py-12">

                {/* Full Screen Fixed Shooting Stars Meteor Shower */}
                <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute rounded-full animate-meteor-fall"
                      style={{
                        top: `-180px`,
                        left: `${(i * 19) % 130 - 15}%`,
                        width: i % 4 === 0 ? "2px" : "1px",
                        height: i % 4 === 0 ? "70px" : "45px",
                        background: "linear-gradient(to bottom, #ffffff, rgba(255, 255, 255, 0.5), transparent)",
                        opacity: 0.35 + (i % 4) * 0.2,
                        boxShadow: "0 0 10px 1px rgba(255, 255, 255, 0.8)",
                        animationDuration: `${2.0 + (i % 5) * 0.6}s`,
                        animationDelay: `${(i % 9) * 0.3}s`,
                      }}
                    />
                  ))}
                </div>

                <div className="relative z-10 flex flex-col items-center">
                  <h1 className="text-5xl md:text-8xl font-black text-white tracking-tight leading-tight max-w-5xl mb-6">
                    Instant UID Whitelisting & <span className="bg-gradient-to-r from-white via-zinc-400 to-zinc-600 bg-clip-text text-transparent">API Access</span>
                  </h1>

                  <p className="text-zinc-400 text-base md:text-xl max-w-2xl font-normal leading-relaxed mb-10">
                    High-performance automated verification system with real-time API access, multi-tier reseller management, and credit-based quota provisioning.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <button
                      onClick={() => setIsLoginModalOpen(true)}
                      className="w-full sm:w-auto bg-white text-black font-bold px-8 py-4 rounded-xl text-sm transition-all duration-300 hover:bg-zinc-200 shadow-[0_0_30px_rgba(255,255,255,0.25)]"
                    >
                      Access Portal Console
                    </button>
                    <button
                      onClick={() => setActiveLandingSection("API_ACCESS")}
                      className="w-full sm:w-auto bg-zinc-950 border border-zinc-800 hover:border-zinc-600 text-zinc-300 font-medium px-8 py-4 rounded-xl text-sm transition-all duration-300"
                    >
                      Explore API Docs
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. PROVIDERS PAGE */}
            {activeLandingSection === "PROVIDERS" && (
              <div className="animate-fade-in space-y-12 pt-4 max-w-6xl mx-auto font-sans">
                
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto font-sans">
                  <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                    Official Providers
                  </h2>
                  <p className="text-zinc-400 text-sm md:text-base mt-3">
                    The official gaming security servers powering & maintaining the UID Bypass Portal network.
                  </p>
                </div>

                {/* 2 Massive Ultra-Stylized Server Banners */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch font-sans">
                  
                  {/* FEAR X CORPORATION BANNER */}
                  <div className="bg-gradient-to-b from-zinc-900/90 via-zinc-950 to-zinc-950 border border-zinc-800 hover:border-zinc-500 rounded-3xl p-8 transition-all duration-300 shadow-2xl flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none group-hover:bg-white/10 transition-all duration-500" />

                    <div className="space-y-6 relative z-10">
                      {/* Server Avatar & Title */}
                      <div className="flex items-center space-x-4">
                        <div className="h-16 w-16 bg-zinc-900 border border-zinc-700 rounded-2xl flex items-center justify-center overflow-hidden shadow-[0_0_30px_rgba(255,255,255,0.2)] flex-shrink-0">
                          <img src="/fear-logo.jpg" alt="FEAR Logo" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                            FEAR X CORPORATION
                          </h3>
                          <div className="text-xs text-zinc-400 font-sans mt-0.5">
                            Developer & Owner: <strong className="text-white font-mono">FEAR</strong>
                          </div>
                        </div>
                      </div>

                      {/* Role Info Box */}
                      <div className="bg-black/80 border border-zinc-800 p-5 rounded-2xl space-y-2">
                        <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">INFRASTRUCTURE ROLE</div>
                        <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                          Maintains core bypass proxy endpoints, backend database layers, and server security. Coded and developed by <strong className="text-white">FEAR</strong>.
                        </p>
                      </div>
                    </div>

                    {/* Discord Join Link */}
                    <div className="pt-6 mt-6 border-t border-zinc-900 relative z-10">
                      <a
                        href="https://discord.gg/5k8BCM9WRg"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-white hover:bg-zinc-200 text-black font-black py-4 px-6 rounded-2xl text-xs flex items-center justify-center space-x-3 transition-all duration-300 shadow-[0_0_25px_rgba(255,255,255,0.2)]"
                      >
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                        </svg>
                        <span>JOIN DISCORD</span>
                      </a>
                    </div>
                  </div>

                  {/* EDIT XITERS BANNER */}
                  <div className="bg-gradient-to-b from-zinc-900/90 via-zinc-950 to-zinc-950 border border-zinc-800 hover:border-zinc-500 rounded-3xl p-8 transition-all duration-300 shadow-2xl flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none group-hover:bg-white/10 transition-all duration-500" />

                    <div className="space-y-6 relative z-10">
                      {/* Server Avatar & Title */}
                      <div className="flex items-center space-x-4">
                        <div className="h-16 w-16 bg-zinc-900 border border-zinc-700 rounded-2xl flex items-center justify-center overflow-hidden shadow-[0_0_30px_rgba(255,255,255,0.2)] flex-shrink-0">
                          <img src="/edit-xiters-logo.png" alt="EDIT XITERS Logo" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                            EDIT XITERS
                          </h3>
                          <div className="text-xs text-zinc-400 font-sans mt-0.5">
                            Founder & Owner: <strong className="text-white font-mono">CHIPER ZERO X</strong>
                          </div>
                        </div>
                      </div>

                      {/* Role Info Box */}
                      <div className="bg-black/80 border border-zinc-800 p-5 rounded-2xl space-y-2">
                        <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">DISTRIBUTION ROLE</div>
                        <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                          Operates global reseller credit matrix, quota allocation systems, and client permissions. Owned by <strong className="text-white">CHIPER ZERO X</strong>.
                        </p>
                      </div>
                    </div>

                    {/* Discord Join Link */}
                    <div className="pt-6 mt-6 border-t border-zinc-900 relative z-10">
                      <a
                        href="https://discord.gg/NjwePf285J"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-white hover:bg-zinc-200 text-black font-black py-4 px-6 rounded-2xl text-xs flex items-center justify-center space-x-3 transition-all duration-300 shadow-[0_0_25px_rgba(255,255,255,0.2)]"
                      >
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                        </svg>
                        <span>JOIN DISCORD</span>
                      </a>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* 2. API ACCESS PAGE */}
            {activeLandingSection === "API_ACCESS" && (
              <div className="animate-fade-in space-y-12 pt-4">
                <div className="text-center max-w-3xl mx-auto">
                  <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">API Access & Developer Docs</h2>
                  <p className="text-zinc-400 text-sm md:text-base mt-3">Integrate high-speed automated UID verification into your software applications using simple REST HTTP requests.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                  {/* Endpoint Cards */}
                  <div className="lg:col-span-5 space-y-4 flex flex-col justify-center">
                    <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-5 hover:border-zinc-700 transition-colors">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-[10px] font-mono font-bold px-2.5 py-1 rounded">POST</span>
                        <span className="font-mono text-sm text-white font-bold">/api/v1/uids/add</span>
                      </div>
                      <p className="text-xs text-zinc-400">Whitelist a target UID with a specified lifespan (days) and client name.</p>
                    </div>

                    <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-5 hover:border-zinc-700 transition-colors">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="bg-red-950/80 border border-red-800 text-red-400 text-[10px] font-mono font-bold px-2.5 py-1 rounded">POST</span>
                        <span className="font-mono text-sm text-white font-bold">/api/v1/uids/remove</span>
                      </div>
                      <p className="text-xs text-zinc-400">Revoke and delete a whitelisted UID immediately from the active registry.</p>
                    </div>

                    <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-5 hover:border-zinc-700 transition-colors">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="bg-blue-950/80 border border-blue-800 text-blue-400 text-[10px] font-mono font-bold px-2.5 py-1 rounded">GET</span>
                        <span className="font-mono text-sm text-white font-bold">/api/v1/uids/list</span>
                      </div>
                      <p className="text-xs text-zinc-400">Fetch all active whitelisted UIDs and their remaining lifespans.</p>
                    </div>
                  </div>

                  {/* Interactive Code Terminal Box */}
                  <div className="lg:col-span-7 bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6 font-mono text-xs flex flex-col justify-between shadow-2xl space-y-4">
                    <div>
                      {/* Language Selector Bar */}
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
                        <div className="flex items-center space-x-1.5 bg-zinc-900/80 p-1 rounded-lg border border-zinc-800">
                          {[
                            { id: "curl", label: "cURL" },
                            { id: "python", label: "Python" },
                            { id: "javascript", label: "JavaScript" },
                          ].map((lang) => (
                            <button
                              key={lang.id}
                              onClick={() => setApiCodeTab(lang.id as "curl" | "python" | "javascript")}
                              className={`px-3 py-1 rounded text-[11px] font-bold transition-all ${
                                apiCodeTab === lang.id
                                  ? "bg-white text-black shadow"
                                  : "text-zinc-400 hover:text-white"
                              }`}
                            >
                              {lang.label}
                            </button>
                          ))}
                        </div>
                        <span className="text-zinc-500 text-[10px]">HEADER: X-AUTH-KEY</span>
                      </div>

                      {/* Code Snippets */}
                      {apiCodeTab === "curl" && (
                        <pre className="text-zinc-300 leading-relaxed overflow-x-auto p-2 bg-black/60 rounded-xl border border-zinc-900">
{`curl -X POST "https://api.your-domain.com/api/v1/uids/add" \\
  -H "Content-Type: application/json" \\
  -H "X-AUTH-KEY: YOUR_SERVER_API_KEY" \\
  -d '{
    "uid": "123456789",
    "days": 30,
    "name": "ClientAlpha"
  }'`}
                        </pre>
                      )}

                      {apiCodeTab === "python" && (
                        <pre className="text-zinc-300 leading-relaxed overflow-x-auto p-2 bg-black/60 rounded-xl border border-zinc-900">
{`import requests

url = "https://api.your-domain.com/api/v1/uids/add"
headers = {
    "Content-Type": "application/json",
    "X-AUTH-KEY": "YOUR_SERVER_API_KEY"
}
payload = {
    "uid": "123456789",
    "days": 30,
    "name": "ClientAlpha"
}

response = requests.post(url, headers=headers, json=payload)
print(response.json())`}
                        </pre>
                      )}

                      {apiCodeTab === "javascript" && (
                        <pre className="text-zinc-300 leading-relaxed overflow-x-auto p-2 bg-black/60 rounded-xl border border-zinc-900">
{`const response = await fetch("https://api.your-domain.com/api/v1/uids/add", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-AUTH-KEY": "YOUR_SERVER_API_KEY"
  },
  body: JSON.stringify({
    uid: "123456789",
    days: 30,
    name: "ClientAlpha"
  })
});

const data = await response.json();
console.log(data);`}
                        </pre>
                      )}
                    </div>

                    {/* Response Preview */}
                    <div className="pt-4 border-t border-zinc-900 space-y-2">
                      <div className="flex items-center justify-between text-[10px] text-zinc-500">
                        <span className="font-bold text-emerald-400">Response Payload (200 OK)</span>
                        <span>application/json</span>
                      </div>
                      <pre className="text-zinc-400 text-[11px] bg-black/40 p-3 rounded-lg border border-zinc-900">
{`{
  "success": true,
  "message": "UID whitelisted successfully",
  "uid": "123456789",
  "days": 30,
  "status": "ACTIVE"
}`}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Additional Feature Grid below */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-zinc-900">
                  <div className="bg-zinc-950 border border-zinc-800/60 rounded-xl p-5">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1 font-mono">🔐 Header Authentication</h4>
                    <p className="text-xs text-zinc-400 font-sans">Pass your secret key via <code className="text-white">X-AUTH-KEY</code> header for secure request verification.</p>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-800/60 rounded-xl p-5">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1 font-mono">⚡ Low Latency Execution</h4>
                    <p className="text-xs text-zinc-400 font-sans">Sub-50ms execution speed with edge proxy optimization on REST endpoints.</p>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-800/60 rounded-xl p-5">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1 font-mono">📡 Standard JSON Output</h4>
                    <p className="text-xs text-zinc-400 font-sans">Predictable JSON status structures for seamless error handling and logging.</p>
                  </div>
                </div>
              </div>
            )}

            {/* 3. RESELLER SYSTEM PAGE */}
            {activeLandingSection === "RESELLER_SYSTEM" && (
              <div className="animate-fade-in space-y-12 pt-4">
                <div className="text-center max-w-3xl mx-auto">
                  <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">Reseller System & Quotas</h2>
                  <p className="text-zinc-400 text-sm md:text-base mt-3">Empower your team and distributors with a credit-based quota provisioning system and dedicated console access.</p>
                </div>

                {/* 4 Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6 text-left hover:border-zinc-700 transition-colors">
                    <div className="h-10 w-10 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center text-white mb-5 text-lg">🔑</div>
                    <h3 className="text-base font-bold text-white mb-2 font-mono">Dedicated Login</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">Admin generates custom Username & Password for resellers. Resellers log in independently to manage their clients.</p>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6 text-left hover:border-zinc-700 transition-colors">
                    <div className="h-10 w-10 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center text-white mb-5 text-lg">💳</div>
                    <h3 className="text-base font-bold text-white mb-2 font-mono">1 Credit = 1 Day</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">Simple quota math: 30 days whitelist cost 30 Credits. Admins top-up reseller credit balances in real time.</p>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6 text-left hover:border-zinc-700 transition-colors">
                    <div className="h-10 w-10 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center text-white mb-5 text-lg">⚡</div>
                    <h3 className="text-base font-bold text-white mb-2 font-mono">Self-Service Console</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">Resellers can add new UIDs, extend existing lifespans, or delete clients without requesting Admin action.</p>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6 text-left hover:border-zinc-700 transition-colors">
                    <div className="h-10 w-10 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center text-white mb-5 text-lg">📊</div>
                    <h3 className="text-base font-bold text-white mb-2 font-mono">Audit & Logs</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">Every credit deduction, top-up, login, and UID whitelist event is recorded in the immutable Console Audit Log.</p>
                  </div>
                </div>

                {/* Credit Deduction Visual Workflow */}
                <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-8 font-mono">
                  <div className="text-xs text-zinc-500 uppercase tracking-widest mb-6 font-bold text-center">Credit Math Workflow Example</div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center text-center">
                    <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-xl">
                      <div className="text-[10px] text-zinc-500 uppercase">Initial Balance</div>
                      <div className="text-xl font-bold text-white mt-1">500 Credits</div>
                    </div>
                    <div className="text-zinc-600 font-bold text-sm hidden md:block">➔</div>
                    <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-xl">
                      <div className="text-[10px] text-zinc-500 uppercase">Action: Whitelist 30d</div>
                      <div className="text-xl font-bold text-red-400 mt-1">-30 Credits</div>
                    </div>
                    <div className="bg-zinc-900/80 border border-emerald-900/50 p-4 rounded-xl">
                      <div className="text-[10px] text-emerald-500 uppercase">New Balance</div>
                      <div className="text-xl font-bold text-emerald-400 mt-1">470 Credits</div>
                    </div>
                  </div>
                </div>

                {/* Role Permission Matrix */}
                <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6 font-mono text-xs">
                  <div className="text-xs text-zinc-400 font-bold uppercase tracking-widest mb-4">Role Capabilities Comparison</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-800 text-[10px] text-zinc-500 uppercase">
                          <th className="pb-3">Feature Capability</th>
                          <th className="pb-3 text-center">Admin Role</th>
                          <th className="pb-3 text-center">Reseller Role</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900 text-zinc-300">
                        <tr>
                          <td className="py-3">UID Whitelisting & Extension</td>
                          <td className="py-3 text-center text-emerald-400 font-bold">UNLIMITED (Free)</td>
                          <td className="py-3 text-center text-white">Quota Deducted (1 Cr = 1 Day)</td>
                        </tr>
                        <tr>
                          <td className="py-3">Create & Delete Reseller Accounts</td>
                          <td className="py-3 text-center text-emerald-400 font-bold">YES</td>
                          <td className="py-3 text-center text-zinc-600">NO</td>
                        </tr>
                        <tr>
                          <td className="py-3">Add & Top-Up Reseller Credits</td>
                          <td className="py-3 text-center text-emerald-400 font-bold">YES</td>
                          <td className="py-3 text-center text-zinc-600">NO</td>
                        </tr>
                        <tr>
                          <td className="py-3">Audit Logs Visibility</td>
                          <td className="py-3 text-center text-emerald-400 font-bold">FULL SYSTEM LOGS</td>
                          <td className="py-3 text-center text-white">PERSONAL ACTIVITY ONLY</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 4. HOW IT WORKS PAGE */}
            {activeLandingSection === "HOW_IT_WORKS" && (
              <div className="animate-fade-in space-y-12 pt-4">
                <div className="text-center max-w-3xl mx-auto">
                  <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">How The Portal Works</h2>
                  <p className="text-zinc-400 text-sm md:text-base mt-3">Step-by-step architectural breakdown from portal login to automated live API authorization.</p>
                </div>

                {/* 4 Detailed Step Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 font-mono">
                  <div className="bg-zinc-950 border border-zinc-800/80 p-6 rounded-2xl relative overflow-hidden group hover:border-zinc-700 transition-colors">
                    <div className="text-[10px] text-zinc-500 font-bold mb-3">STEP 01</div>
                    <h4 className="text-base font-bold text-white mb-2">01. Authentication</h4>
                    <p className="text-xs text-zinc-400 font-sans leading-relaxed">Admins log in with secure Email/Password. Resellers log in with custom credentials generated by Admin.</p>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800/80 p-6 rounded-2xl relative overflow-hidden group hover:border-zinc-700 transition-colors">
                    <div className="text-[10px] text-zinc-500 font-bold mb-3">STEP 02</div>
                    <h4 className="text-base font-bold text-white mb-2">02. Provisioning</h4>
                    <p className="text-xs text-zinc-400 font-sans leading-relaxed">Enter Target UID, Client Identifier, and Whitelist Lifespan (1 to 9999 Days).</p>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800/80 p-6 rounded-2xl relative overflow-hidden group hover:border-zinc-700 transition-colors">
                    <div className="text-[10px] text-zinc-500 font-bold mb-3">STEP 03</div>
                    <h4 className="text-base font-bold text-white mb-2">03. Quota Validation</h4>
                    <p className="text-xs text-zinc-400 font-sans leading-relaxed">Reseller credits are validated automatically (1 Credit = 1 Day) and deducted securely in real-time.</p>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800/80 p-6 rounded-2xl relative overflow-hidden group hover:border-zinc-700 transition-colors">
                    <div className="text-[10px] text-zinc-500 font-bold mb-3">STEP 04</div>
                    <h4 className="text-base font-bold text-white mb-2">04. Live Edge Sync</h4>
                    <p className="text-xs text-zinc-400 font-sans leading-relaxed">Request is proxied to the central database, activating the UID globally in under 50ms.</p>
                  </div>
                </div>

                {/* System Architecture Flow Diagram */}
                <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-8 font-mono">
                  <div className="text-xs text-zinc-500 uppercase tracking-widest mb-6 font-bold text-center">System Execution Flow</div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center text-center">
                    <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-xl">
                      <div className="text-[10px] text-zinc-500 uppercase">Input</div>
                      <div className="text-sm font-bold text-white mt-1">Portal Form / REST API</div>
                    </div>
                    <div className="text-zinc-600 font-bold text-sm hidden md:block">➔</div>
                    <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-xl">
                      <div className="text-[10px] text-zinc-500 uppercase">Proxy Gateway</div>
                      <div className="text-sm font-bold text-white mt-1">Encrypted X-AUTH-KEY</div>
                    </div>
                    <div className="bg-zinc-900/80 border border-emerald-900/50 p-4 rounded-xl">
                      <div className="text-[10px] text-emerald-500 uppercase">Status</div>
                      <div className="text-sm font-bold text-emerald-400 mt-1">Active Whitelisted</div>
                    </div>
                  </div>
                </div>

                {/* Frequently Asked Questions (FAQ) */}
                <div className="space-y-4 pt-4 border-t border-zinc-900">
                  <div className="text-xs text-zinc-400 font-bold uppercase tracking-widest font-mono mb-4 text-center">Frequently Asked Questions</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-zinc-950 border border-zinc-800/60 rounded-xl p-5">
                      <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-2 font-mono">⚡ How fast is UID activation?</h5>
                      <p className="text-xs text-zinc-400 font-sans leading-relaxed">Activation happens instantly in real-time (&lt;50ms response latency) upon form submission or API POST call.</p>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-800/60 rounded-xl p-5">
                      <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-2 font-mono">⏳ What happens upon expiration?</h5>
                      <p className="text-xs text-zinc-400 font-sans leading-relaxed">Whitelisted UIDs automatically expire after their specified days lifespan, or can be manually extended anytime.</p>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-800/60 rounded-xl p-5">
                      <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-2 font-mono">💳 How do Reseller credits work?</h5>
                      <p className="text-xs text-zinc-400 font-sans leading-relaxed">1 Credit equals 1 Day of UID whitelist. Admins can top-up reseller credit balances instantly from the Admin Console.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>

          {/* --- LOGIN MODAL (Triggered by Log In buttons) --- */}
          {isLoginModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in font-mono">
              <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 p-8 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.9)] relative overflow-hidden">
                {/* Glow bar at top */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-white/20 blur-sm rounded-full" />
                
                {/* Close Button */}
                <button
                  onClick={() => setIsLoginModalOpen(false)}
                  className="absolute top-5 right-5 text-zinc-500 hover:text-white p-2 rounded-full hover:bg-zinc-900 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                  <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase mb-1">
                    PORTAL LOGIN
                  </h2>
                  <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em] font-bold">
                    SELECT ROLE AND ENTER CREDENTIALS
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                  {/* Admin / Reseller Switcher */}
                  <div className="flex bg-black/60 p-1.5 rounded-xl border border-zinc-800/80 relative">
                    <button
                      type="button"
                      onClick={() => setLoginType("ADMIN")}
                      className={`flex-1 py-2.5 text-[11px] font-black tracking-widest uppercase transition-all duration-300 rounded-lg z-10 ${
                        loginType === "ADMIN" ? "text-black shadow-lg" : "text-zinc-500 hover:text-white"
                      }`}
                    >
                      ADMIN
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoginType("RESELLER")}
                      className={`flex-1 py-2.5 text-[11px] font-black tracking-widest uppercase transition-all duration-300 rounded-lg z-10 ${
                        loginType === "RESELLER" ? "text-black shadow-lg" : "text-zinc-500 hover:text-white"
                      }`}
                    >
                      RESELLER
                    </button>
                    <div 
                      className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-lg transition-all duration-300 ease-out z-0 ${
                        loginType === "ADMIN" ? "left-1.5" : "translate-x-full left-1.5"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-1.5 font-bold">
                      {loginType === "ADMIN" ? "EMAIL ADDRESS" : "USERNAME"}
                    </label>
                    <input
                      type={loginType === "ADMIN" ? "email" : "text"}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={loginType === "ADMIN" ? "Enter your email address..." : "Enter your username..."}
                      className="w-full bg-black/90 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white focus:ring-1 focus:ring-white/20 transition-all font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-1.5 font-bold">
                      PASSWORD
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-black/90 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white focus:ring-1 focus:ring-white/20 transition-all font-sans"
                    />
                  </div>

                  {loginError && (
                    <div className="border border-red-500/40 bg-red-950/40 text-red-400 text-xs p-3 rounded-xl font-sans">
                      {loginError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isConnecting}
                    className="w-full bg-white text-black hover:bg-zinc-200 rounded-xl py-3.5 text-xs font-black tracking-widest uppercase transition-all duration-300 shadow-[0_0_25px_rgba(255,255,255,0.2)]"
                  >
                    {isConnecting ? "Authenticating..." : "ACCESS CONSOLE"}
                  </button>
                </form>

                {/* Divider Line */}
                <div className="my-6 relative flex items-center justify-center">
                  <div className="border-t border-zinc-800/80 w-full" />
                  <span className="bg-zinc-950 px-3 text-[10px] text-zinc-500 uppercase tracking-widest font-mono whitespace-nowrap">
                    OR CONNECT WITH DISCORD
                  </span>
                  <div className="border-t border-zinc-800/80 w-full" />
                </div>

                {/* Discord OAuth Login Option (AT THE VERY BOTTOM) */}
                <div>
                  <a
                    href="/api/auth/discord"
                    className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold py-3.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-3 transition-all duration-300 shadow-[0_0_20px_rgba(88,101,242,0.3)] group"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                    <span>LOGIN WITH DISCORD</span>
                  </a>
                </div>

              </div>
            </div>
          )}

        </div>
      ) : (

        /* --- AUTHENTICATED DASHBOARD PAGE --- */
        <div className="h-screen w-screen flex flex-col relative bg-black text-white overflow-hidden">
          {/* Background Grid & Falling Stars Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
          
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-40">
            {Array.from({ length: 25 }).map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full animate-meteor-fall"
                style={{
                  top: `-180px`,
                  left: `${(i * 21) % 130 - 15}%`,
                  width: i % 4 === 0 ? "2px" : "1px",
                  height: i % 4 === 0 ? "60px" : "35px",
                  background: "linear-gradient(to bottom, #ffffff, rgba(255, 255, 255, 0.4), transparent)",
                  opacity: 0.3 + (i % 4) * 0.15,
                  animationDuration: `${2.5 + (i % 5) * 0.6}s`,
                  animationDelay: `${(i % 8) * 0.3}s`,
                }}
              />
            ))}
          </div>

          {/* Header */}
          <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl shrink-0 z-40">
            <div className="w-full px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center space-x-3">
                <span className="font-logo font-black tracking-tight text-lg text-white">
                  UID BYPASS PORTAL
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl px-3.5 py-2 flex items-center space-x-2 shadow-inner">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">ROLE:</span>
                  <span className={`font-black tracking-wider text-[11px] px-2 py-0.5 rounded ${
                    userRole === "ADMIN" ? "bg-white text-black" : "bg-purple-950 text-purple-300 border border-purple-800/60"
                  }`}>
                    {userRole}
                  </span>
                </div>
                <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl px-3.5 py-2 flex items-center space-x-2 shadow-inner">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">USER:</span>
                  <span className="font-extrabold tracking-wider text-white text-[11px]">
                    {currentUser || userRole}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="bg-white hover:bg-zinc-200 text-black rounded-xl px-4 py-2 transition-all duration-300 tracking-wider uppercase text-[10px] font-black shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                >
                  De-Authorize
                </button>
              </div>
            </div>
          </header>

          {/* Main Workspace - FROZEN SIDEBAR + INDEPENDENT SCROLL AREA */}
          <main className="flex-1 w-full flex overflow-hidden relative z-10">
            {/* Sidebar / Tabs - 100% UNMOVABLE & FROZEN */}
            <aside className="w-64 shrink-0 font-sans flex flex-col justify-between py-6 px-6 border-r border-zinc-800/80 h-full bg-black">
              
              <div className="space-y-6 overflow-y-auto pr-2">
                
                {/* OVERVIEW SECTION */}
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 px-3 mb-2 font-mono">
                    OVERVIEW
                  </div>
                  <button
                    onClick={() => setActiveTab("OVERVIEW")}
                    className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      activeTab === "OVERVIEW"
                        ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.25)] font-black"
                        : "text-zinc-200 hover:text-white hover:bg-zinc-900/80"
                    }`}
                  >
                    <svg className={`w-4 h-4 shrink-0 ${activeTab === "OVERVIEW" ? "text-black" : "text-zinc-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                    </svg>
                    <span>Dashboard</span>
                  </button>
                </div>

                {/* MANAGEMENT SECTION */}
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 px-3 mb-2 font-mono">
                    MANAGEMENT
                  </div>
                  <div className="space-y-1">
                    <button
                      onClick={() => setActiveTab("WHITELIST")}
                      className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        activeTab === "WHITELIST"
                          ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.25)] font-black"
                          : "text-zinc-200 hover:text-white hover:bg-zinc-900/80"
                      }`}
                    >
                      <svg className={`w-4 h-4 shrink-0 ${activeTab === "WHITELIST" ? "text-black" : "text-zinc-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span>{userRole === "ADMIN" ? "Add Whitelist" : "Whitelist UID"}</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("UID_MANAGEMENT")}
                      className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        activeTab === "UID_MANAGEMENT"
                          ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.25)] font-black"
                          : "text-zinc-200 hover:text-white hover:bg-zinc-900/80"
                      }`}
                    >
                      <svg className={`w-4 h-4 shrink-0 ${activeTab === "UID_MANAGEMENT" ? "text-black" : "text-zinc-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                      <span>UID Management</span>
                    </button>

                    {userRole === "ADMIN" && (
                      <button
                        onClick={() => setActiveTab("RESELLERS")}
                        className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                          activeTab === "RESELLERS"
                            ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.25)] font-black"
                            : "text-zinc-200 hover:text-white hover:bg-zinc-900/80"
                        }`}
                      >
                        <svg className={`w-4 h-4 shrink-0 ${activeTab === "RESELLERS" ? "text-black" : "text-zinc-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>Reseller Management</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* SECURITY & GATEWAY SECTION */}
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 px-3 mb-2 font-mono">
                    SECURITY & API
                  </div>
                  <div className="space-y-1">
                    {userRole === "ADMIN" && (
                      <button
                        onClick={() => setActiveTab("API_KEYS")}
                        className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                          activeTab === "API_KEYS"
                            ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.25)] font-black"
                            : "text-zinc-200 hover:text-white hover:bg-zinc-900/80"
                        }`}
                      >
                        <svg className={`w-4 h-4 shrink-0 ${activeTab === "API_KEYS" ? "text-black" : "text-zinc-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        <span>API Keys & Gateway</span>
                      </button>
                    )}

                    <button
                      onClick={() => setActiveTab("DOCS")}
                      className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        activeTab === "DOCS"
                          ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.25)] font-black"
                          : "text-zinc-200 hover:text-white hover:bg-zinc-900/80"
                      }`}
                    >
                      <svg className={`w-4 h-4 shrink-0 ${activeTab === "DOCS" ? "text-black" : "text-zinc-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                      <span>API Code Examples</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("FREE_PORTAL")}
                      className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        activeTab === "FREE_PORTAL"
                          ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.25)] font-black"
                          : "text-zinc-200 hover:text-white hover:bg-zinc-900/80"
                      }`}
                    >
                      <svg className={`w-4 h-4 shrink-0 ${activeTab === "FREE_PORTAL" ? "text-black" : "text-zinc-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                      <span>Free Portal Check</span>
                    </button>
                  </div>
                </div>

                {/* MONITORING SECTION */}
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 px-3 mb-2 font-mono">
                    MONITORING
                  </div>
                  <button
                    onClick={() => setActiveTab("LOGS")}
                    className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      activeTab === "LOGS"
                        ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.25)] font-black"
                        : "text-zinc-200 hover:text-white hover:bg-zinc-900/80"
                    }`}
                  >
                    <svg className={`w-4 h-4 shrink-0 ${activeTab === "LOGS" ? "text-black" : "text-zinc-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Console Logs</span>
                  </button>
                </div>

              </div>

              {/* BOTTOM USER PROFILE CARD & LOGOUT BUTTON - PINNED */}
              <div className="pt-4 border-t border-zinc-800 space-y-2 mt-4 bg-black shrink-0">
                <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded-2xl flex items-center justify-between space-x-3">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="h-9 w-9 bg-zinc-800 border border-zinc-700 rounded-xl flex items-center justify-center font-black text-white text-sm shrink-0">
                      {(currentUser || userRole || "A").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-black text-white truncate uppercase font-logo">
                        {currentUser || (userRole === "ADMIN" ? "BASIC PANEL" : "RESELLER")}
                      </div>
                      <span className="inline-block mt-0.5 text-[9px] bg-zinc-800 text-zinc-300 border border-zinc-700 font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                        {userRole === "ADMIN" ? "OWNER" : "RESELLER"}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    title="De-Authorize / Logout"
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-all shrink-0"
                  >
                    <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              </div>
            </aside>

            {/* Content Area - ONLY THIS AREA SCROLLS */}
            <div className="flex-1 h-full overflow-y-auto px-8 py-6 flex flex-col min-w-0">
              
              {/* OVERVIEW TAB - FULL CLEAN & AESTHETIC DASHBOARD */}
              {activeTab === "OVERVIEW" && (
                <div className="space-y-8 animate-fade-in font-sans">
                  
                  {/* Hero Metric Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* CARD 1: My Whitelisted UIDs */}
                    <div className="bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-6 relative overflow-hidden group transition-all duration-300 shadow-xl">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
                          {userRole === "ADMIN" ? "System Whitelisted UIDs" : "My Whitelisted UIDs"}
                        </span>
                        <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </div>
                      </div>
                      <div className="text-4xl font-extrabold text-white font-mono tracking-tight">
                        {filteredUids.length}
                      </div>
                      <div className="text-xs text-zinc-400 mt-4 flex items-center justify-between pt-4 border-t border-zinc-900 font-mono">
                        <span>Active records</span>
                        <button 
                          onClick={() => setActiveTab("WHITELIST")} 
                          className="text-white hover:underline text-xs font-bold"
                        >
                          View list &rarr;
                        </button>
                      </div>
                    </div>

                    {/* CARD 2: Reseller Credits / Admin Resellers */}
                    {userRole === "RESELLER" && currentResellerObj ? (
                      <div className="bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-6 relative overflow-hidden group transition-all duration-300 shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
                            Available Credits
                          </span>
                          <span className="text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-300 px-2.5 py-0.5 rounded-full">
                            1 CR = 1 Day
                          </span>
                        </div>
                        <div className="text-4xl font-extrabold text-white font-mono tracking-tight">
                          {currentResellerObj.credits} <span className="text-sm font-normal text-zinc-400">CR</span>
                        </div>
                        <div className="text-xs text-zinc-400 mt-4 flex items-center justify-between pt-4 border-t border-zinc-900 font-mono">
                          <span>Quota balance</span>
                          <a 
                            href="https://discord.gg/5k8BCM9WRg" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-white hover:underline font-bold"
                          >
                            Top up credits &rarr;
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-6 relative overflow-hidden group transition-all duration-300 shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
                            Total Active Resellers
                          </span>
                          <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                        </div>
                        <div className="text-4xl font-extrabold text-white font-mono tracking-tight">
                          {resellers.length}
                        </div>
                        <div className="text-xs text-zinc-400 mt-4 flex items-center justify-between pt-4 border-t border-zinc-900 font-mono">
                          <span>Registered accounts</span>
                          <button 
                            onClick={() => setActiveTab("RESELLERS")} 
                            className="text-white hover:underline text-xs font-bold"
                          >
                            Manage resellers &rarr;
                          </button>
                        </div>
                      </div>
                    )}

                    {/* CARD 3: System Status */}
                    <div className="bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-6 relative overflow-hidden group transition-all duration-300 shadow-xl">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
                          System Gateway Status
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-0.5 rounded-full font-bold">
                          &lt; 50ms latency
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-white font-mono flex items-center space-x-3 mt-2">
                        <span className="h-2.5 w-2.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_#34d399]" />
                        <span>OPERATIONAL</span>
                      </div>
                      <div className="text-xs text-zinc-400 mt-4 flex items-center justify-between pt-4 border-t border-zinc-900 font-mono">
                        <span>API Proxy Gateway</span>
                        <span className="text-emerald-400 font-bold">100% Uptime</span>
                      </div>
                    </div>

                  </div>

                  {/* QUICK ACTION SHORTCUT GRID */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button
                      onClick={() => setActiveTab("WHITELIST")}
                      className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 p-4 rounded-2xl flex items-center space-x-3.5 transition-all text-left group shadow-lg"
                    >
                      <div className="p-2.5 bg-zinc-900 group-hover:bg-white text-white group-hover:text-black rounded-xl transition-colors shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white uppercase tracking-wider font-mono">Whitelist UID</div>
                        <div className="text-[10px] text-zinc-400">Add new record</div>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTab("FREE_PORTAL")}
                      className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 p-4 rounded-2xl flex items-center space-x-3.5 transition-all text-left group shadow-lg"
                    >
                      <div className="p-2.5 bg-zinc-900 group-hover:bg-white text-white group-hover:text-black rounded-xl transition-colors shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white uppercase tracking-wider font-mono">Free Portal</div>
                        <div className="text-[10px] text-zinc-400">Check live status</div>
                      </div>
                    </button>

                    {userRole === "ADMIN" && (
                      <>
                        <button
                          onClick={() => setActiveTab("API_KEYS")}
                          className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 p-4 rounded-2xl flex items-center space-x-3.5 transition-all text-left group shadow-lg"
                        >
                          <div className="p-2.5 bg-zinc-900 group-hover:bg-white text-white group-hover:text-black rounded-xl transition-colors shrink-0">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white uppercase tracking-wider font-mono">API Gateway</div>
                            <div className="text-[10px] text-zinc-400">Manage auth keys</div>
                          </div>
                        </button>

                        <button
                          onClick={() => setActiveTab("RESELLERS")}
                          className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 p-4 rounded-2xl flex items-center space-x-3.5 transition-all text-left group shadow-lg"
                        >
                          <div className="p-2.5 bg-zinc-900 group-hover:bg-white text-white group-hover:text-black rounded-xl transition-colors shrink-0">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white uppercase tracking-wider font-mono">Resellers</div>
                            <div className="text-[10px] text-zinc-400">Manage accounts</div>
                          </div>
                        </button>
                      </>
                    )}
                  </div>

                  {/* Clean Console Activity Stream */}
                  <div className="bg-zinc-950/90 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
                    <div className="bg-zinc-900/80 px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1.5">
                          <span className="w-2.5 h-2.5 bg-red-500/70 rounded-full" />
                          <span className="w-2.5 h-2.5 bg-yellow-500/70 rounded-full" />
                          <span className="w-2.5 h-2.5 bg-emerald-500/70 rounded-full" />
                        </div>
                        <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                          Console Activity Stream
                        </h2>
                      </div>
                      <span className="text-[11px] text-zinc-400 font-mono">
                        {filteredLogs.length} total events
                      </span>
                    </div>

                    <div className="p-6 space-y-3 font-mono text-xs">
                      {filteredLogs.slice(0, 6).map((log) => (
                        <div 
                          key={log.id} 
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-black/60 border border-zinc-900 rounded-xl hover:border-zinc-800 transition-colors gap-2"
                        >
                          <div className="flex items-center space-x-3 min-w-0">
                            <span className="text-zinc-500 text-[11px] shrink-0">{log.timestamp.split(', ')[1]}</span>
                            <span className="font-bold text-white shrink-0">[{log.by}]</span>
                            <span className="text-zinc-300 font-sans truncate">{log.details}</span>
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-zinc-900 border border-zinc-800 text-zinc-300 px-2.5 py-1 rounded-md shrink-0 self-start sm:self-auto">
                            {log.action}
                          </span>
                        </div>
                      ))}

                      {filteredLogs.length === 0 && (
                        <div className="text-zinc-500 text-xs py-8 text-center tracking-wider uppercase">
                          No recent console logs recorded.
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* WHITELIST TAB - ULTRA-PREMIUM PRO WORKSPACE */}
              {activeTab === "WHITELIST" && (
                <div className="space-y-6 animate-fade-in font-sans">
                  
                  {/* TOP WHITELIST HERO STATS HEADER */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-zinc-950/90 border border-zinc-800/80 p-5 rounded-2xl flex items-center justify-between shadow-lg">
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold">Total Whitelisted UIDs</div>
                        <div className="text-2xl font-extrabold text-white font-mono mt-1">{filteredUids.length} Records</div>
                      </div>
                      <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                    </div>

                    <div className="bg-zinc-950/90 border border-zinc-800/80 p-5 rounded-2xl flex items-center justify-between shadow-lg">
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold">Reseller Quota Balance</div>
                        <div className="text-2xl font-extrabold text-white font-mono mt-1">
                          {userRole === "RESELLER" && currentResellerObj ? `${currentResellerObj.credits} Credits` : "Unlimited (Admin)"}
                        </div>
                      </div>
                      <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                    </div>

                    <div className="bg-zinc-950/90 border border-zinc-800/80 p-5 rounded-2xl flex items-center justify-between shadow-lg">
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold">API Gateway Protocol</div>
                        <div className="text-sm font-bold text-emerald-400 font-mono mt-1.5 flex items-center space-x-2">
                          <span className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_#34d399]" />
                          <span>Connected & Online</span>
                        </div>
                      </div>
                      <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                        <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* MAIN WHITELIST WORKSPACE GRID */}
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    
                    {/* LEFT COLUMN: PROVISION FORM */}
                    <div className="xl:col-span-4 space-y-6">
                      <div className="bg-zinc-950/90 border border-zinc-800/80 rounded-2xl p-6 relative shadow-xl">
                        <div className="text-xs tracking-wider uppercase text-white font-mono font-bold mb-6 border-b border-zinc-800 pb-4 flex items-center justify-between">
                          <span>⚡ Provision Whitelist</span>
                          {userRole === "RESELLER" && currentResellerObj && (
                            <span className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-300 px-2.5 py-0.5 rounded-full font-mono">
                              1 CR = 1 Day
                            </span>
                          )}
                        </div>

                        <form onSubmit={handleAddUid} className="space-y-5">
                          <div>
                            <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-2 font-bold">
                              Target Game UID
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                required
                                value={newUid}
                                onChange={(e) => setNewUid(e.target.value)}
                                placeholder="Enter Free Fire Game UID..."
                                className="w-full bg-black border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-white transition-all font-mono"
                              />
                              <svg className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457-.312-2.841-.873-4.084" />
                              </svg>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-2 font-bold flex justify-between items-center">
                              <span>Lifespan (Days)</span>
                              {userRole === "RESELLER" && (
                                <span className="text-white font-bold">Cost: {newDays} Credits</span>
                              )}
                            </label>

                            {/* Quick Days Selector Pills */}
                            <div className="grid grid-cols-4 gap-2 mb-2">
                              {[7, 30, 60, 365].map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => setNewDays(preset)}
                                  className={`py-2 rounded-xl text-[10px] font-mono font-bold uppercase transition-all ${
                                    newDays === preset
                                      ? "bg-white text-black font-black shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                                      : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white hover:bg-zinc-800"
                                  }`}
                                >
                                  {preset}d
                                </button>
                              ))}
                            </div>

                            <input
                              type="number"
                              required
                              min={1}
                              max={9999}
                              value={newDays}
                              onChange={(e) => setNewDays(parseInt(e.target.value) || 1)}
                              placeholder="Custom Days (e.g. 30)"
                              className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-white transition-all font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-2 font-bold">
                              Client Identifier (Name / Note)
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="e.g. Customer Alpha..."
                                className="w-full bg-black border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-white transition-all font-mono"
                              />
                              <svg className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                          </div>

                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-white text-black hover:bg-zinc-200 rounded-xl py-3.5 text-xs font-black tracking-widest uppercase transition-all flex items-center justify-center space-x-2 mt-6 shadow-[0_0_20px_rgba(255,255,255,0.25)]"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            <span>{isSubmitting ? "Provisioning..." : "Whitelist UID Record"}</span>
                          </button>
                        </form>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: DATABASE TABLE */}
                    <div className="xl:col-span-8">
                      <div className="bg-zinc-950/90 border border-zinc-800/80 rounded-2xl p-6 relative flex flex-col h-full min-h-[500px] shadow-xl">
                        <div className="text-xs font-mono tracking-wider uppercase text-white font-bold mb-6 border-b border-zinc-800 pb-4 flex justify-between items-center">
                          <span>Database Records Registry</span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                const allUidsStr = filteredUids.map(u => u.uid).join("\n");
                                navigator.clipboard.writeText(allUidsStr);
                                showToast(`Copied ${filteredUids.length} UIDs to clipboard!`, "success");
                              }}
                              className="text-[10px] bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white px-3 py-1 rounded-lg font-bold uppercase transition-all"
                            >
                              📋 Copy All UIDs
                            </button>
                            <span className="bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full text-white text-[11px] font-bold">
                              {filteredUids.length} Active
                            </span>
                          </div>
                        </div>

                        {/* Search Bar */}
                        <div className="relative mb-6">
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search records by Game UID or Client Name..."
                            className="w-full bg-black border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors font-mono"
                          />
                          <svg className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>

                        <div className="flex-1 overflow-x-auto">
                          {filteredUids.length === 0 ? (
                            <div className="h-64 flex flex-col items-center justify-center border border-zinc-900 border-dashed rounded-2xl text-zinc-500 p-8 text-center">
                              <svg className="w-10 h-10 mb-3 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="text-xs font-mono uppercase tracking-widest font-bold text-zinc-400">
                                No Database Records Found
                              </span>
                              <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                                Use the form on the left to add target UIDs to the system whitelist.
                              </p>
                            </div>
                          ) : (
                            <table className="w-full text-left border-collapse font-mono text-xs">
                              <thead>
                                <tr className="border-b border-zinc-800 text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
                                  <th className="pb-3">Client Identifier</th>
                                  <th className="pb-3">Game UID</th>
                                  <th className="pb-3 text-center">Lifespan</th>
                                  {userRole === "ADMIN" && <th className="pb-3 text-center">Created By</th>}
                                  <th className="pb-3 text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-900 text-xs">
                                {filteredUids.map((item) => (
                                  <tr key={item.uid} className="hover:bg-zinc-900/60 transition-colors group">
                                    <td className="py-4 font-bold text-white truncate max-w-[150px]">
                                      <div className="flex items-center space-x-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                                        <span className="truncate">{item.name}</span>
                                      </div>
                                    </td>
                                    <td className="py-4 text-zinc-300 font-mono select-all font-semibold">
                                      <div className="flex items-center space-x-2">
                                        <span>{item.uid}</span>
                                        <button
                                          onClick={() => {
                                            navigator.clipboard.writeText(item.uid);
                                            showToast(`Copied ${item.uid} to clipboard!`, "success");
                                          }}
                                          title="Copy UID"
                                          className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-white p-1 rounded transition-all"
                                        >
                                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                          </svg>
                                        </button>
                                      </div>
                                    </td>
                                    <td className="py-4 text-center">
                                      <span className={`px-2.5 py-1 rounded-md border font-bold text-[11px] ${
                                        item.days > 7
                                          ? "bg-zinc-900 text-white border-zinc-800"
                                          : "bg-amber-950/40 text-amber-300 border-amber-800/60"
                                      }`}>
                                        {item.days}d
                                      </span>
                                    </td>
                                    {userRole === "ADMIN" && (
                                      <td className="py-4 text-center text-zinc-300 font-bold text-[10px] uppercase">
                                        <span className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-zinc-300">
                                          {item.createdBy}
                                        </span>
                                      </td>
                                    )}
                                    <td className="py-4 text-right">
                                      <div className="flex items-center justify-end space-x-2">
                                        <button
                                          onClick={() => {
                                            const daysStr = prompt("Enter additional days to extend:", "30");
                                            if (daysStr) {
                                              const days = parseInt(daysStr);
                                              if (!isNaN(days) && days > 0) {
                                                handleExtendUid(item.uid, days);
                                              }
                                            }
                                          }}
                                          className="bg-zinc-900 hover:bg-white text-zinc-300 hover:text-black border border-zinc-800 hover:border-white rounded-lg px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider transition-all"
                                        >
                                          + Extend
                                        </button>

                                        <button
                                          onClick={() => handleRemoveUid(item.uid)}
                                          disabled={deletingUid === item.uid}
                                          className="bg-red-950/30 hover:bg-red-600 text-red-400 hover:text-white border border-red-900/50 hover:border-red-600 rounded-lg px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider transition-all"
                                        >
                                          {deletingUid === item.uid ? "Deleting..." : "Delete"}
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* UID MANAGEMENT CONTROL CENTER TAB */}
              {activeTab === "UID_MANAGEMENT" && (
                <div className="space-y-6 animate-fade-in font-sans">
                  
                  {/* HERO STATS BAR FOR UID MANAGEMENT */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-zinc-950/90 border border-zinc-800/80 p-5 rounded-2xl flex items-center justify-between shadow-lg font-mono">
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Total Whitelisted UIDs</div>
                        <div className="text-2xl font-extrabold text-white mt-1">{filteredUids.length} Records</div>
                      </div>
                      <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                      </div>
                    </div>

                    <div className="bg-zinc-950/90 border border-zinc-800/80 p-5 rounded-2xl flex items-center justify-between shadow-lg font-mono">
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Active Engine Nodes</div>
                        <div className="text-2xl font-extrabold text-emerald-400 mt-1">100% Operational</div>
                      </div>
                      <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                        <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse block" />
                      </div>
                    </div>

                    <div className="bg-zinc-950/90 border border-zinc-800/80 p-5 rounded-2xl flex items-center justify-between shadow-lg font-mono">
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Database Proxy Sync</div>
                        <div className="text-xs font-bold text-zinc-300 mt-1.5">UID Bypass Live Gateway</div>
                      </div>
                      <button
                        onClick={async () => {
                          const res = await makeApiCall("/uids/list", "GET");
                          if (res.ok && Array.isArray(res.data)) {
                            showToast("Synced with live UID Bypass database!", "success");
                          }
                        }}
                        className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all font-mono"
                      >
                        🔄 Sync Now
                      </button>
                    </div>
                  </div>

                  {/* FULL-WIDTH SEARCH BAR & MANAGEMENT CONTROL PANEL */}
                  <div className="bg-zinc-950/90 border border-zinc-800/80 p-6 rounded-2xl space-y-4 shadow-xl">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4 font-mono">
                      <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-wider font-sans">
                          UID Management Control Center
                        </h2>
                        <p className="text-xs text-zinc-400 font-sans mt-1">
                          Search, inspect, extend validity duration, or delete/revoke any whitelisted gaming UID in real-time.
                        </p>
                      </div>
                      <div className="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl text-xs font-mono font-bold text-zinc-300">
                        Showing {filteredUids.length} of {uids.length} UIDs
                      </div>
                    </div>

                    {/* SEARCH INPUT BAR */}
                    <div className="relative font-mono">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="🔍 Search by Gaming UID, Registered Name, or Creator..."
                        className="w-full bg-black/90 border border-zinc-800 rounded-xl px-4 py-3.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white transition-all"
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
                  </div>

                  {/* UID MANAGEMENT TABLE */}
                  <div className="bg-zinc-950/90 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl font-mono">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-zinc-800 bg-zinc-900/60 text-[10px] uppercase tracking-widest text-zinc-400">
                            <th className="py-4 px-6 font-bold">Gaming UID</th>
                            <th className="py-4 px-6 font-bold">Client / Node Name</th>
                            <th className="py-4 px-6 font-bold">Validity / Days Left</th>
                            <th className="py-4 px-6 font-bold">Created By</th>
                            <th className="py-4 px-6 font-bold">Status</th>
                            <th className="py-4 px-6 font-bold text-right">Management Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60 text-xs">
                          {filteredUids.map((item) => (
                            <tr key={item.uid} className="hover:bg-zinc-900/40 transition-colors">
                              <td className="py-4 px-6 font-bold text-white font-mono">
                                {item.uid}
                              </td>
                              <td className="py-4 px-6 text-zinc-300 font-sans">
                                {item.name || "DefaultName"}
                              </td>
                              <td className="py-4 px-6 font-bold text-emerald-400">
                                {item.days} Day(s)
                              </td>
                              <td className="py-4 px-6 text-zinc-400">
                                {item.createdBy || "System"}
                              </td>
                              <td className="py-4 px-6">
                                <span className="inline-flex items-center space-x-1.5 bg-emerald-950/40 border border-emerald-800/80 text-emerald-400 text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                                  <span>ACTIVE</span>
                                </span>
                              </td>
                              <td className="py-4 px-6 text-right">
                                <div className="flex items-center justify-end space-x-2">
                                  <button
                                    onClick={() => handleExtendUid(item.uid, 1)}
                                    className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all"
                                  >
                                    +1D Extend
                                  </button>
                                  <button
                                    onClick={() => handleExtendUid(item.uid, 7)}
                                    className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all"
                                  >
                                    +7D Extend
                                  </button>
                                  <button
                                    onClick={() => handleRemoveUid(item.uid)}
                                    disabled={deletingUid === item.uid}
                                    className="bg-red-950/40 hover:bg-red-900/80 border border-red-800/80 text-red-400 hover:text-white px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all disabled:opacity-50"
                                  >
                                    {deletingUid === item.uid ? "Revoking..." : "🗑️ Delete"}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}

                          {filteredUids.length === 0 && (
                            <tr>
                              <td colSpan={6} className="py-16 text-center text-zinc-500 font-mono text-xs uppercase tracking-widest">
                                {searchQuery ? `No whitelisted UIDs found matching "${searchQuery}"` : "No Whitelisted UIDs Recorded"}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {/* RESELLERS TAB (ADMIN ONLY) - ULTRA-PREMIUM NETWORK WORKSPACE */}
              {activeTab === "RESELLERS" && userRole === "ADMIN" && (
                <div className="space-y-6 animate-fade-in font-sans">
                  
                  {/* HERO STATS BAR FOR RESELLERS */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-zinc-950/90 border border-zinc-800/80 p-5 rounded-2xl flex items-center justify-between shadow-lg">
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold">Total Reseller Accounts</div>
                        <div className="text-2xl font-extrabold text-white font-mono mt-1">{resellers.length} Accounts</div>
                      </div>
                      <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                    </div>

                    <div className="bg-zinc-950/90 border border-zinc-800/80 p-5 rounded-2xl flex items-center justify-between shadow-lg">
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold">Allocated Network Credits</div>
                        <div className="text-2xl font-extrabold text-white font-mono mt-1">
                          {resellers.reduce((acc, r) => acc + (r.credits || 0), 0)} CR
                        </div>
                      </div>
                      <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>

                    <div className="bg-zinc-950/90 border border-zinc-800/80 p-5 rounded-2xl flex items-center justify-between shadow-lg">
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold">Reseller Portal Control</div>
                        <div className="text-sm font-bold text-emerald-400 font-mono mt-1.5 flex items-center space-x-2">
                          <span className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_#34d399]" />
                          <span>Admin Quota Override Active</span>
                        </div>
                      </div>
                      <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                        <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* RESELLER WORKSPACE GRID */}
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    
                    {/* LEFT COLUMN: CREATE RESELLER FORM */}
                    <div className="xl:col-span-4 space-y-6">
                      <div className="bg-zinc-950/90 border border-zinc-800/80 rounded-2xl p-6 relative shadow-xl">
                        <div className="text-xs tracking-wider uppercase text-white font-mono font-bold mb-6 border-b border-zinc-800 pb-4 flex items-center justify-between">
                          <span>👥 Create Reseller Account</span>
                          <span className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-300 px-2.5 py-0.5 rounded-full font-mono">
                            Admin Only
                          </span>
                        </div>

                        <form onSubmit={handleAddReseller} className="space-y-5">
                          <div>
                            <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-2 font-bold">
                              Reseller Username
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                required
                                value={newResellerUsername}
                                onChange={(e) => setNewResellerUsername(e.target.value)}
                                placeholder="reseller_one"
                                className="w-full bg-black border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-white transition-all font-mono"
                              />
                              <svg className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-2 font-bold">
                              Account Password
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                required
                                value={newResellerPassword}
                                onChange={(e) => setNewResellerPassword(e.target.value)}
                                placeholder="secure_password_123"
                                className="w-full bg-black border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-white transition-all font-mono"
                              />
                              <svg className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-2 font-bold">
                              Initial Credits Allocation
                            </label>

                            {/* Quick Credit Presets */}
                            <div className="grid grid-cols-4 gap-2 mb-2">
                              {[50, 100, 250, 500].map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => setNewResellerCredits(preset)}
                                  className={`py-2 rounded-xl text-[10px] font-mono font-bold uppercase transition-all ${
                                    newResellerCredits === preset
                                      ? "bg-white text-black font-black shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                                      : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white hover:bg-zinc-800"
                                  }`}
                                >
                                  {preset} CR
                                </button>
                              ))}
                            </div>

                            <input
                              type="number"
                              required
                              min={0}
                              value={newResellerCredits}
                              onChange={(e) => setNewResellerCredits(parseInt(e.target.value) || 0)}
                              placeholder="100"
                              className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-white transition-all font-mono"
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full bg-white text-black hover:bg-zinc-200 rounded-xl py-3.5 text-xs font-black tracking-widest uppercase transition-all flex items-center justify-center space-x-2 mt-6 shadow-[0_0_20px_rgba(255,255,255,0.25)]"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                            <span>Create Reseller Account</span>
                          </button>
                        </form>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: RESELLER DATABASE TABLE */}
                    <div className="xl:col-span-8">
                      <div className="bg-zinc-950/90 border border-zinc-800/80 rounded-2xl p-6 relative flex flex-col h-full min-h-[500px] shadow-xl">
                        <div className="text-xs font-mono tracking-wider uppercase text-white font-bold mb-6 border-b border-zinc-800 pb-4 flex justify-between items-center">
                          <span>Reseller Accounts Database</span>
                          <span className="bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full text-white text-[11px] font-mono font-bold">
                            {resellers.length} Registered
                          </span>
                        </div>

                        <div className="flex-1 overflow-x-auto">
                          <table className="w-full text-left border-collapse font-mono text-xs">
                            <thead>
                              <tr className="border-b border-zinc-800 text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
                                <th className="pb-3">Reseller Username</th>
                                <th className="pb-3 text-center">Password</th>
                                <th className="pb-3 text-center">Credit Quota</th>
                                <th className="pb-3 text-center">Whitelisted UIDs</th>
                                <th className="pb-3 text-center">Created</th>
                                <th className="pb-3 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-900 text-xs">
                              {resellers.map((r) => (
                                <tr key={r.username} className="hover:bg-zinc-900/60 transition-colors group">
                                  <td className="py-4 font-bold text-white">
                                    <div className="flex items-center space-x-2">
                                      <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
                                      <span>{r.username}</span>
                                    </div>
                                  </td>
                                  <td className="py-4 text-center">
                                    <div className="flex items-center justify-center space-x-1.5">
                                      <span className="text-zinc-400 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-md text-[11px] select-all font-mono">
                                        {r.password || "••••••••"}
                                      </span>
                                      <button
                                        onClick={() => {
                                          navigator.clipboard.writeText(r.password || "");
                                          showToast(`Copied password for ${r.username}!`, "success");
                                        }}
                                        title="Copy Password"
                                        className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-white p-1 rounded transition-all"
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                      </button>
                                    </div>
                                  </td>
                                  <td className="py-4 text-center">
                                    <span className="bg-zinc-900 border border-zinc-800 text-white px-3 py-1 rounded-md font-bold text-[11px]">
                                      {r.credits} CR
                                    </span>
                                  </td>
                                  <td className="py-4 text-center text-zinc-300 font-bold">{r.totalWhitelisted} UIDs</td>
                                  <td className="py-4 text-center text-zinc-500 text-[11px]">{r.createdAt}</td>
                                  <td className="py-4 text-right">
                                    <div className="flex items-center justify-end space-x-2">
                                      <button
                                        onClick={() => {
                                          const amountStr = prompt(`Add credits for ${r.username}:`, "50");
                                          if (amountStr) {
                                            const amount = parseInt(amountStr);
                                            if (!isNaN(amount) && amount > 0) {
                                              handleAddResellerCredits(r.username, amount);
                                            }
                                          }
                                        }}
                                        className="bg-zinc-900 hover:bg-white text-zinc-300 hover:text-black border border-zinc-800 hover:border-white rounded-lg px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider transition-all"
                                      >
                                        + Add Credits
                                      </button>

                                      <button
                                        onClick={() => handleDeleteReseller(r.username)}
                                        className="bg-red-950/30 hover:bg-red-600 text-red-400 hover:text-white border border-red-900/50 hover:border-red-600 rounded-lg px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider transition-all"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}

                              {resellers.length === 0 && (
                                <tr>
                                  <td colSpan={6} className="py-16 text-center text-zinc-500">
                                    <div className="flex flex-col items-center justify-center space-y-2">
                                      <svg className="w-10 h-10 text-zinc-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                      </svg>
                                      <span className="text-xs font-mono uppercase tracking-widest font-bold text-zinc-400">
                                        No Reseller Accounts Found
                                      </span>
                                      <p className="text-xs text-zinc-500 max-w-sm">
                                        Use the form on the left to create reseller accounts and allocate initial credit quotas.
                                      </p>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* API KEYS & GATEWAY TAB (ADMIN ONLY) */}
              {activeTab === "API_KEYS" && userRole === "ADMIN" && (
                <div className="space-y-6 animate-fade-in font-sans">
                  
                  {/* HERO STATS BAR FOR API GATEWAY */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-zinc-950/90 border border-zinc-800/80 p-5 rounded-2xl flex items-center justify-between shadow-lg">
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold">Total Client API Keys</div>
                        <div className="text-2xl font-extrabold text-white font-mono mt-1">
                          {clientApiKeys.filter(k => k.status === "ACTIVE").length} Active Keys
                        </div>
                      </div>
                      <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                      </div>
                    </div>

                    <div className="bg-zinc-950/90 border border-zinc-800/80 p-5 rounded-2xl flex items-center justify-between shadow-lg">
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold">Total API Credits Quota</div>
                        <div className="text-2xl font-extrabold text-white font-mono mt-1">
                          {clientApiKeys.reduce((acc, k) => acc + (k.credits || 0), 0)} CR
                        </div>
                      </div>
                      <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                    </div>

                    <div className="bg-zinc-950/90 border border-zinc-800/80 p-5 rounded-2xl flex items-center justify-between shadow-lg">
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold">API Gateway Status</div>
                        <div className="text-sm font-bold text-emerald-400 font-mono mt-1.5 flex items-center space-x-2">
                          <span className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_#34d399]" />
                          <span>3 API Endpoints Live (12ms)</span>
                        </div>
                      </div>
                      <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                        <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* CLIENT & RESELLER API KEYS GENERATOR WORKSPACE */}
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    
                    {/* GENERATE CLIENT API KEY FORM */}
                    <div className="xl:col-span-4 space-y-6">
                      <div className="bg-zinc-950/90 border border-zinc-800/80 rounded-2xl p-6 relative shadow-xl">
                        <div className="text-xs font-mono tracking-wider uppercase text-white font-bold mb-6 border-b border-zinc-800 pb-4 flex justify-between items-center">
                          <span>🔑 Provision Client API Key</span>
                          <span className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-300 px-2.5 py-0.5 rounded-full font-mono">
                            Admin KeyGen
                          </span>
                        </div>

                        <form onSubmit={handleGenerateClientKey} className="space-y-5">
                          <div>
                            <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-2 font-bold">
                              Client / Website Name
                            </label>
                            <div className="relative font-mono">
                              <input
                                type="text"
                                required
                                value={newClientName}
                                onChange={(e) => setNewClientName(e.target.value)}
                                placeholder="e.g. Client_Website_Alpha"
                                className="w-full bg-black border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-white transition-all"
                              />
                              <svg className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                              </svg>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-2 font-bold">
                              API Key Credit Quota
                            </label>

                            <div className="grid grid-cols-4 gap-2 mb-2 font-mono">
                              {[100, 500, 1000, 5000].map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => setNewClientCredits(preset)}
                                  className={`py-2 rounded-xl text-[10px] font-mono font-bold uppercase transition-all ${
                                    newClientCredits === preset
                                      ? "bg-white text-black font-black shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                                      : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white hover:bg-zinc-800"
                                  }`}
                                >
                                  {preset} CR
                                </button>
                              ))}
                            </div>

                            <input
                              type="number"
                              required
                              min={1}
                              value={newClientCredits}
                              onChange={(e) => setNewClientCredits(parseInt(e.target.value) || 0)}
                              placeholder="500"
                              className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-white transition-all font-mono"
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full bg-white text-black hover:bg-zinc-200 rounded-xl py-3.5 text-xs font-black tracking-widest uppercase transition-all flex items-center justify-center space-x-2 mt-6 shadow-[0_0_20px_rgba(255,255,255,0.25)]"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                            <span>Generate Client API Key</span>
                          </button>
                        </form>
                      </div>
                    </div>

                    {/* CLIENT API KEYS DATABASE TABLE */}
                    <div className="xl:col-span-8">
                      <div className="bg-zinc-950/90 border border-zinc-800/80 rounded-2xl p-6 relative flex flex-col h-full min-h-[400px] shadow-xl">
                        <div className="text-xs font-mono tracking-wider uppercase text-white font-bold mb-6 border-b border-zinc-800 pb-4 flex justify-between items-center">
                          <span>Generated Client API Keys</span>
                          <span className="bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full text-white text-[11px] font-mono font-bold">
                            {clientApiKeys.length} Active Keys
                          </span>
                        </div>

                        <div className="flex-1 overflow-x-auto">
                          <table className="w-full text-left border-collapse font-mono text-xs">
                            <thead>
                              <tr className="border-b border-zinc-800 text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
                                <th className="pb-3">Client / Website</th>
                                <th className="pb-3 text-center">API Auth Key</th>
                                <th className="pb-3 text-center">Credits</th>
                                <th className="pb-3 text-center">Status</th>
                                <th className="pb-3 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-900 text-xs">
                              {clientApiKeys.map((item) => (
                                <tr key={item.id} className="hover:bg-zinc-900/60 transition-colors group">
                                  <td className="py-4 font-bold text-white truncate max-w-[140px]">
                                    <div className="flex items-center space-x-2">
                                      <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                                      <span className="truncate">{item.clientName}</span>
                                    </div>
                                  </td>
                                  <td className="py-4 text-center">
                                    <div className="flex items-center justify-center space-x-1.5">
                                      <span className="text-zinc-300 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-md text-[11px] select-all truncate max-w-[160px]">
                                        {item.key}
                                      </span>
                                      <button
                                        onClick={() => {
                                          navigator.clipboard.writeText(item.key);
                                          showToast(`Copied API Key for ${item.clientName}!`, "success");
                                        }}
                                        title="Copy API Key"
                                        className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-white p-1 rounded transition-all"
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                      </button>
                                    </div>
                                  </td>
                                  <td className="py-4 text-center">
                                    <span className="bg-zinc-900 border border-zinc-800 text-white px-2.5 py-1 rounded-md font-bold text-[11px]">
                                      {item.credits} CR
                                    </span>
                                  </td>
                                  <td className="py-4 text-center">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                      item.status === "ACTIVE"
                                        ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/60"
                                        : "bg-red-950/60 text-red-400 border border-red-800/60"
                                    }`}>
                                      {item.status}
                                    </span>
                                  </td>
                                  <td className="py-4 text-right">
                                    <div className="flex items-center justify-end space-x-2">
                                      <button
                                        onClick={() => {
                                          setExtendModalKey(item);
                                          setExtendCreditsInput(500);
                                        }}
                                        className="bg-emerald-950/40 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-800/60 hover:border-emerald-500 rounded-lg px-2.5 py-1.5 text-[10px] uppercase font-bold transition-all flex items-center space-x-1"
                                        title="Extend API Key Credits"
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        <span>+ Extend</span>
                                      </button>

                                      <button
                                        onClick={() => handleRevokeClientKey(item.id)}
                                        className="bg-zinc-900 hover:bg-white text-zinc-300 hover:text-black border border-zinc-800 hover:border-white rounded-lg px-2.5 py-1.5 text-[10px] uppercase font-bold transition-all"
                                      >
                                        {item.status === "ACTIVE" ? "Revoke" : "Activate"}
                                      </button>

                                      <button
                                        onClick={() => handleDeleteClientKey(item.id)}
                                        className="bg-red-950/30 hover:bg-red-600 text-red-400 hover:text-white border border-red-900/50 hover:border-red-600 rounded-lg px-2.5 py-1.5 text-[10px] uppercase font-bold transition-all"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}

                              {clientApiKeys.length === 0 && (
                                <tr>
                                  <td colSpan={5} className="py-12 text-center text-zinc-500">
                                    <div className="flex flex-col items-center justify-center space-y-2">
                                      <svg className="w-8 h-8 text-zinc-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                      </svg>
                                      <span className="text-xs font-mono uppercase tracking-widest font-bold text-zinc-400">
                                        No Client API Keys Created Yet
                                      </span>
                                      <p className="text-xs text-zinc-500 max-w-xs">
                                        Use the form on the left to generate API keys for external resellers/clients to build their own tools.
                                      </p>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* DEDICATED API CODE EXAMPLES & DOCUMENTATION TAB */}
              {activeTab === "DOCS" && (
                <div className="space-y-8 animate-fade-in font-sans">
                  
                  {/* TOP HERO METRICS FOR API DOCS */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-zinc-950/90 border border-zinc-800/80 p-5 rounded-2xl flex items-center justify-between shadow-lg relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-xl group-hover:bg-white/10 transition-all pointer-events-none" />
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold">Production Domain</div>
                        <div className="text-sm font-black text-white font-mono mt-1 select-all flex items-center space-x-2">
                          <span className="truncate">https://bypass-portal-mu.vercel.app</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText("https://bypass-portal-mu.vercel.app");
                          showToast("Production domain copied to clipboard!", "success");
                        }}
                        className="p-2.5 bg-zinc-900 hover:bg-white text-zinc-300 hover:text-black border border-zinc-800 rounded-xl transition-all shrink-0 ml-2"
                        title="Copy Base URL"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>

                    <div className="bg-zinc-950/90 border border-zinc-800/80 p-5 rounded-2xl flex items-center justify-between shadow-lg">
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold">Authentication Method</div>
                        <div className="text-sm font-black text-yellow-400 font-mono mt-1">
                          Header: X-AUTH-KEY
                        </div>
                      </div>
                      <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                        <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                      </div>
                    </div>

                    <div className="bg-zinc-950/90 border border-zinc-800/80 p-5 rounded-2xl flex items-center justify-between shadow-lg">
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold">Gateway Engine Status</div>
                        <div className="text-sm font-bold text-emerald-400 font-mono mt-1 flex items-center space-x-2">
                          <span className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_#34d399]" />
                          <span>100% Operational & Active</span>
                        </div>
                      </div>
                      <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                        <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* API ENDPOINTS REFERENCE CARD */}
                  <div className="bg-zinc-950/90 border border-zinc-800/80 rounded-2xl p-6 relative shadow-xl space-y-6 font-mono">
                    <div className="text-xs tracking-wider uppercase text-white font-bold border-b border-zinc-800 pb-4 flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>📡 Production REST API Endpoints</span>
                      </div>
                      <span className="text-[10px] bg-emerald-950/80 border border-emerald-800 text-emerald-400 px-3 py-1 rounded-full font-bold">
                        3 Endpoints Active
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* ADD UID */}
                      <div className="bg-black border border-zinc-800/90 p-4 rounded-xl space-y-3 relative group hover:border-emerald-500/50 transition-all">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 text-[9px] font-black rounded uppercase">POST</span>
                              <span className="text-[10px] text-zinc-400 uppercase font-bold">Provision UID</span>
                            </div>
                            <div className="text-xs text-white font-bold mt-2 select-all">/api/v1/uids/add</div>
                          </div>
                          <button
                            onClick={() => {
                              const fullUrl = `https://bypass-portal-mu.vercel.app/api/v1/uids/add`;
                              navigator.clipboard.writeText(fullUrl);
                              showToast("Add UID Endpoint URL copied!", "success");
                            }}
                            className="bg-zinc-900 hover:bg-white text-zinc-300 hover:text-black border border-zinc-800 px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all"
                          >
                            Copy URL
                          </button>
                        </div>
                        <div className="text-[10px] text-zinc-400 border-t border-zinc-900 pt-2 font-mono">
                          Body: <code className="text-emerald-400">{`{"uid": "123456789", "days": 30, "name": "ClientName"}`}</code>
                        </div>
                      </div>

                      {/* REMOVE UID */}
                      <div className="bg-black border border-zinc-800/90 p-4 rounded-xl space-y-3 relative group hover:border-red-500/50 transition-all">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="px-1.5 py-0.5 bg-red-950 text-red-400 border border-red-800 text-[9px] font-black rounded uppercase">POST</span>
                              <span className="text-[10px] text-zinc-400 uppercase font-bold">Revoke UID</span>
                            </div>
                            <div className="text-xs text-white font-bold mt-2 select-all">/api/v1/uids/remove</div>
                          </div>
                          <button
                            onClick={() => {
                              const fullUrl = `https://bypass-portal-mu.vercel.app/api/v1/uids/remove`;
                              navigator.clipboard.writeText(fullUrl);
                              showToast("Remove UID Endpoint URL copied!", "success");
                            }}
                            className="bg-zinc-900 hover:bg-white text-zinc-300 hover:text-black border border-zinc-800 px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all"
                          >
                            Copy URL
                          </button>
                        </div>
                        <div className="text-[10px] text-zinc-400 border-t border-zinc-900 pt-2 font-mono">
                          Body: <code className="text-red-400">{`{"uid": "123456789"}`}</code>
                        </div>
                      </div>

                      {/* LIST UIDS */}
                      <div className="bg-black border border-zinc-800/90 p-4 rounded-xl space-y-3 relative group hover:border-blue-500/50 transition-all">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="px-1.5 py-0.5 bg-blue-950 text-blue-400 border border-blue-800 text-[9px] font-black rounded uppercase">GET</span>
                              <span className="text-[10px] text-zinc-400 uppercase font-bold">Fetch All UIDs</span>
                            </div>
                            <div className="text-xs text-white font-bold mt-2 select-all">/api/v1/uids/list</div>
                          </div>
                          <button
                            onClick={() => {
                              const fullUrl = `https://bypass-portal-mu.vercel.app/api/v1/uids/list`;
                              navigator.clipboard.writeText(fullUrl);
                              showToast("List UIDs Endpoint URL copied!", "success");
                            }}
                            className="bg-zinc-900 hover:bg-white text-zinc-300 hover:text-black border border-zinc-800 px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all"
                          >
                            Copy URL
                          </button>
                        </div>
                        <div className="text-[10px] text-zinc-400 border-t border-zinc-900 pt-2 font-mono">
                          Returns JSON array of all active whitelisted UIDs.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* MACOS TERMINAL STYLE DEVELOPER CODE EXAMPLES CARD */}
                  <div className="bg-zinc-950/90 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl font-mono">
                    
                    {/* MACOS HEADER BAR */}
                    <div className="bg-zinc-900 border-b border-zinc-800 px-5 py-3.5 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex space-x-1.5">
                          <div className="w-3 h-3 rounded-full bg-red-500/80" />
                          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                          <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                        </div>
                        <span className="text-xs text-zinc-400 font-bold tracking-wider uppercase ml-2">
                          developer_integration_snippet.{apiCodeTab === "curl" ? "sh" : apiCodeTab === "python" ? "py" : "js"}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        {(["curl", "python", "javascript"] as const).map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setApiCodeTab(tab)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                              apiCodeTab === tab
                                ? "bg-white text-black font-black shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                                : "bg-black text-zinc-400 hover:text-white border border-zinc-800"
                            }`}
                          >
                            {tab}
                          </button>
                        ))}

                        <button
                          onClick={() => {
                            const activeKey = clientApiKeys.length > 0 ? clientApiKeys[0].key : "YOUR_CLIENT_API_KEY";
                            const baseUrl = "https://bypass-portal-mu.vercel.app";
                            let codeText = "";
                            if (apiCodeTab === "curl") {
                              codeText = `curl -X POST "${baseUrl}/api/v1/uids/add" \\\n  -H "Content-Type: application/json" \\\n  -H "X-AUTH-KEY: ${activeKey}" \\\n  -d '{"uid": "123456789", "days": 30, "name": "ClientAlpha"}'`;
                            } else if (apiCodeTab === "python") {
                              codeText = `import requests\n\nurl = "${baseUrl}/api/v1/uids/add"\nheaders = {\n    "Content-Type": "application/json",\n    "X-AUTH-KEY": "${activeKey}"\n}\npayload = {\n    "uid": "123456789",\n    "days": 30,\n    "name": "ClientAlpha"\n}\n\nresponse = requests.post(url, json=payload, headers=headers)\nprint(response.json())`;
                            } else {
                              codeText = `const response = await fetch("${baseUrl}/api/v1/uids/add", {\n  method: "POST",\n  headers: {\n    "Content-Type": "application/json",\n    "X-AUTH-KEY": "${activeKey}"\n  },\n  body: JSON.stringify({\n    uid: "123456789",\n    days: 30,\n    name: "ClientAlpha"\n  })\n});\n\nconst data = await response.json();\nconsole.log(data);`;
                            }
                            navigator.clipboard.writeText(codeText);
                            showToast(`Copied ${apiCodeTab.toUpperCase()} code snippet!`, "success");
                          }}
                          className="bg-white hover:bg-zinc-200 text-black px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all shadow-[0_0_15px_rgba(255,255,255,0.25)] ml-2"
                        >
                          📋 Copy Full Code
                        </button>
                      </div>
                    </div>

                    {/* CODE BODY */}
                    <div className="bg-black p-6 text-xs overflow-x-auto text-zinc-300 leading-relaxed font-mono">
                      {apiCodeTab === "curl" && (
                        <pre className="text-emerald-400">
{`curl -X POST "https://bypass-portal-mu.vercel.app/api/v1/uids/add" \\
  -H "Content-Type: application/json" \\
  -H "X-AUTH-KEY: ${clientApiKeys.length > 0 ? clientApiKeys[0].key : "YOUR_CLIENT_API_KEY"}" \\
  -d '{"uid": "123456789", "days": 30, "name": "ClientAlpha"}'`}
                        </pre>
                      )}

                      {apiCodeTab === "python" && (
                        <pre className="text-blue-400">
{`import requests

url = "https://bypass-portal-mu.vercel.app/api/v1/uids/add"
headers = {
    "Content-Type": "application/json",
    "X-AUTH-KEY": "${clientApiKeys.length > 0 ? clientApiKeys[0].key : "YOUR_CLIENT_API_KEY"}"
}
payload = {
    "uid": "123456789",
    "days": 30,
    "name": "ClientAlpha"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`}
                        </pre>
                      )}

                      {apiCodeTab === "javascript" && (
                        <pre className="text-yellow-300">
{`const response = await fetch("https://bypass-portal-mu.vercel.app/api/v1/uids/add", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-AUTH-KEY": "${clientApiKeys.length > 0 ? clientApiKeys[0].key : "YOUR_CLIENT_API_KEY"}"
  },
  body: JSON.stringify({
    uid: "123456789",
    days: 30,
    name: "ClientAlpha"
  })
});

const data = await response.json();
console.log(data);`}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* FREE PORTAL & DISCORD WHITELIST HUB */}
              {activeTab === "FREE_PORTAL" && (
                <div className="space-y-8 animate-fade-in font-sans">
                  
                  {/* HERO METRICS FOR FREE PORTAL */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-zinc-950/90 border border-zinc-800/80 p-5 rounded-2xl flex items-center justify-between shadow-lg">
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold">Free Whitelist System</div>
                        <div className="text-sm font-bold font-mono mt-1 flex items-center space-x-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${
                            freePortalEnabled
                              ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]"
                              : "bg-red-500"
                          }`} />
                          <span className={freePortalEnabled ? "text-emerald-400 font-black" : "text-red-400 font-black"}>
                            {freePortalEnabled ? "PORTAL ACTIVE (LIVE)" : "PAUSED BY ADMIN"}
                          </span>
                        </div>
                      </div>
                      <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                    </div>

                    <div className="bg-zinc-950/90 border border-zinc-800/80 p-5 rounded-2xl flex items-center justify-between shadow-lg">
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold">Free Whitelist Duration</div>
                        <div className="text-xl font-extrabold text-white font-mono mt-1">
                          {freeDurationLabel}
                        </div>
                      </div>
                      <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                        <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>

                    <div className="bg-zinc-950/90 border border-zinc-800/80 p-5 rounded-2xl flex items-center justify-between shadow-lg">
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold">Discord OAuth Gateway</div>
                        <div className="text-sm font-bold text-indigo-400 font-mono mt-1 flex items-center space-x-2">
                          <span className="h-2 w-2 bg-indigo-400 rounded-full animate-pulse" />
                          <span>{discordUser ? `Logged in: ${discordUser.name}` : "Discord OAuth Ready"}</span>
                        </div>
                      </div>
                      <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                        <svg className="w-5 h-5 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* ADMIN CONTROL PANEL SECTION (EXCLUSIVE TO ADMIN) */}
                  {userRole === "ADMIN" && (
                    <div className="bg-zinc-950/90 border border-zinc-800/80 rounded-2xl p-6 relative shadow-xl space-y-6">
                      <div className="text-xs font-mono tracking-wider uppercase text-white font-bold border-b border-zinc-800 pb-4 flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-purple-400" />
                          <span>👑 Admin Free Whitelist Controls</span>
                        </div>
                        <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-800/60 px-3 py-1 rounded-full font-mono font-bold">
                          Admin Exclusive
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* PORTAL TOGGLE CONTROL */}
                        <div className="bg-black border border-zinc-800 p-5 rounded-xl space-y-3">
                          <label className="block text-xs font-mono uppercase tracking-widest text-zinc-400 font-bold">
                            Free Whitelisting Status
                          </label>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-bold text-white font-mono">
                                {freePortalEnabled ? "Free Whitelisting ENABLED" : "Free Whitelisting PAUSED"}
                              </div>
                              <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                                {freePortalEnabled ? "Discord users can claim free whitelisting." : "Free whitelist form is locked."}
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                const newStatus = !freePortalEnabled;
                                setFreePortalEnabled(newStatus);
                                localStorage.setItem("free_portal_enabled", JSON.stringify(newStatus));
                                document.cookie = `free_portal_enabled=${newStatus}; path=/`;
                                showToast(`Free Portal is now ${newStatus ? "ENABLED" : "PAUSED"}.`, newStatus ? "success" : "info");
                                addLog("FREE_PORTAL_TOGGLE", `Admin set Free Portal to ${newStatus ? "ENABLED" : "PAUSED"}.`, currentUser);
                              }}
                              className={`px-4 py-2 rounded-xl text-xs font-mono font-black uppercase transition-all shadow-lg ${
                                freePortalEnabled
                                  ? "bg-emerald-500 hover:bg-emerald-600 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                                  : "bg-red-600 hover:bg-red-700 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                              }`}
                            >
                              {freePortalEnabled ? "Pause Portal" : "Enable Portal"}
                            </button>
                          </div>
                        </div>

                        {/* FREE DURATION PRESETS CONTROL */}
                        <div className="bg-black border border-zinc-800 p-5 rounded-xl space-y-3">
                          <label className="block text-xs font-mono uppercase tracking-widest text-zinc-400 font-bold">
                            Set Free Whitelist Validity Duration
                          </label>

                          <div className="grid grid-cols-4 gap-2 font-mono">
                            {[
                              { label: "24 Hours (1 Day)", days: 1 },
                              { label: "3 Days", days: 3 },
                              { label: "7 Days", days: 7 },
                              { label: "30 Days", days: 30 }
                            ].map((preset) => (
                              <button
                                key={preset.days}
                                onClick={() => {
                                  setFreeDurationDays(preset.days);
                                  setFreeDurationLabel(preset.label);
                                  localStorage.setItem("free_portal_duration_days", String(preset.days));
                                  localStorage.setItem("free_portal_duration_label", preset.label);
                                  document.cookie = `free_portal_duration_days=${preset.days}; path=/`;
                                  showToast(`Free Duration set to ${preset.label}`, "info");
                                  addLog("FREE_DURATION_CHANGE", `Admin set Free Whitelist duration to ${preset.label}.`, currentUser);
                                }}
                                className={`py-2 rounded-xl text-[10px] font-mono font-bold uppercase transition-all ${
                                  freeDurationDays === preset.days
                                    ? "bg-white text-black font-black shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                                    : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white hover:bg-zinc-800"
                                }`}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>

                      </div>
                    </div>
                  )}

                  {/* LIVE STATUS CHECKER WORKSPACE */}
                  <div className="bg-zinc-950/90 border border-zinc-800/80 rounded-2xl p-6 relative shadow-xl space-y-6 max-w-3xl mx-auto font-mono">
                    <div className="border-b border-zinc-800 pb-4 text-center">
                      <div className="text-sm tracking-wider uppercase text-white font-bold">
                        🔍 Live Status Verification Checker
                      </div>
                      <p className="text-zinc-400 text-xs mt-1">
                        Enter any Gaming UID below to verify real-time whitelist validity and expiration details.
                      </p>
                    </div>

                    <form onSubmit={handleCheckUid} className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        required
                        value={checkUidInput}
                        onChange={(e) => setCheckUidInput(e.target.value)}
                        placeholder="Enter Game UID to check..."
                        className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-white transition-all"
                      />
                      <button
                        type="submit"
                        className="bg-white text-black hover:bg-zinc-200 px-6 py-3 rounded-xl text-xs font-black tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)] shrink-0"
                      >
                        Verify UID
                      </button>
                    </form>

                    <div>
                      {checkResult && checkResult.searched ? (
                        <div className="animate-fade-in">
                          {checkResult.item ? (
                            <div className="bg-emerald-950/30 border border-emerald-800/60 p-5 rounded-2xl text-left space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] uppercase text-emerald-400 font-bold tracking-widest">STATUS: WHITELISTED ACTIVE</span>
                                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold px-2.5 py-1 rounded-full uppercase">VERIFIED</span>
                              </div>
                              <div className="text-xl font-black text-white">{checkResult.item.uid}</div>
                              <div className="grid grid-cols-2 gap-4 text-xs pt-3 border-t border-emerald-900/40">
                                <div>
                                  <span className="text-zinc-500 block text-[10px] uppercase">Registered Name</span>
                                  <span className="text-white font-bold">{checkResult.item.name || "Default Client"}</span>
                                </div>
                                <div>
                                  <span className="text-zinc-500 block text-[10px] uppercase">Active Validity</span>
                                  <span className="text-emerald-400 font-bold">{checkResult.item.days} Days</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-red-950/30 border border-red-900/60 p-5 rounded-2xl text-center space-y-2">
                              <div className="text-xs uppercase text-red-400 font-bold tracking-widest">STATUS: NOT WHITELISTED</div>
                              <p className="text-xs text-zinc-400">UID <span className="text-white font-bold">{checkUidInput}</span> is not whitelisted in the portal server database.</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="py-10 text-center text-zinc-600 text-xs uppercase tracking-widest font-mono border border-dashed border-zinc-900 rounded-2xl">
                          Ready for Real-Time UID Verification
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* AUDIT LOGS & CONSOLE TAB */}
              {activeTab === "LOGS" && (
                <div className="space-y-6 animate-fade-in font-sans">
                  
                  {/* HERO STATS BAR FOR LOGS */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-zinc-950/90 border border-zinc-800/80 p-5 rounded-2xl flex items-center justify-between shadow-lg">
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold">Total Audit Events</div>
                        <div className="text-2xl font-extrabold text-white font-mono mt-1">
                          {logs.length} Recorded
                        </div>
                      </div>
                      <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    </div>

                    <div className="bg-zinc-950/90 border border-zinc-800/80 p-5 rounded-2xl flex items-center justify-between shadow-lg">
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold">Key Security Overrides</div>
                        <div className="text-2xl font-extrabold text-amber-400 font-mono mt-1">
                          {logs.filter(l => l.action.includes("REMOVE") || l.action.includes("DELETE") || l.action.includes("REGENERATE")).length} Actions
                        </div>
                      </div>
                      <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                        <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                    </div>

                    <div className="bg-zinc-950/90 border border-zinc-800/80 p-5 rounded-2xl flex items-center justify-between shadow-lg">
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold">Log Stream Mode</div>
                        <div className="text-sm font-bold text-emerald-400 font-mono mt-1 flex items-center space-x-2">
                          <span className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_#34d399]" />
                          <span>Live Console Active</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm("Are you sure you want to clear all audit logs?")) {
                            setLogs([]);
                            localStorage.setItem("mono_logs", JSON.stringify([]));
                            showToast("Audit logs cleared successfully.", "success");
                          }
                        }}
                        className="p-2.5 bg-zinc-900 hover:bg-red-950 text-zinc-400 hover:text-red-400 border border-zinc-800 hover:border-red-900 rounded-xl transition-all font-mono text-[10px] font-bold uppercase shrink-0"
                      >
                        Clear Logs
                      </button>
                    </div>
                  </div>

                  {/* MACOS TERMINAL STYLE LOGS CONTAINER */}
                  <div className="bg-zinc-950/90 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl font-mono">
                    
                    {/* TERMINAL HEADER BAR */}
                    <div className="bg-zinc-900 border-b border-zinc-800 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex space-x-1.5">
                          <div className="w-3 h-3 rounded-full bg-red-500/80" />
                          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                          <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                        </div>
                        <span className="text-xs text-zinc-300 font-bold tracking-wider uppercase ml-2 flex items-center space-x-2">
                          <span>system_audit_stream.log</span>
                          <span className="text-[10px] bg-black border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
                            {filteredLogs.length} Events
                          </span>
                        </span>
                      </div>

                      {/* SEARCH FILTER INPUT */}
                      <div className="relative">
                        <input
                          type="text"
                          value={logFilter}
                          onChange={(e) => setLogFilter(e.target.value)}
                          placeholder="Search logs by keyword..."
                          className="bg-black border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white transition-all w-full sm:w-64"
                        />
                        <svg className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>

                    {/* TERMINAL LOGSTREAM LIST */}
                    <div className="bg-black p-4 space-y-1.5 max-h-[600px] overflow-y-auto font-mono text-xs">
                      {filteredLogs.map((log) => {
                        const isAdd = log.action.includes("ADD") || log.action.includes("WHITELIST") || log.action.includes("CREATE");
                        const isRemove = log.action.includes("REMOVE") || log.action.includes("DELETE") || log.action.includes("REVOKE");
                        const isRegen = log.action.includes("REGENERATE") || log.action.includes("CREDIT");

                        return (
                          <div
                            key={log.id}
                            className="flex flex-col md:flex-row md:items-center py-2.5 px-3.5 bg-zinc-950/70 border border-zinc-900 rounded-xl hover:border-zinc-800 hover:bg-zinc-900/40 transition-all gap-2 group"
                          >
                            <div className="text-[10px] text-zinc-500 w-36 shrink-0 font-mono">
                              {log.timestamp}
                            </div>

                            <div className="w-32 shrink-0">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase border ${
                                isAdd
                                  ? "bg-emerald-950/80 text-emerald-400 border-emerald-800/80"
                                  : isRemove
                                  ? "bg-red-950/80 text-red-400 border-red-800/80"
                                  : isRegen
                                  ? "bg-amber-950/80 text-amber-400 border-amber-800/80"
                                  : "bg-blue-950/80 text-blue-400 border-blue-800/80"
                              }`}>
                                {log.action}
                              </span>
                            </div>

                            <div className="flex-1 text-zinc-300 font-sans text-xs group-hover:text-white transition-colors">
                              {log.details}
                            </div>

                            <div className="text-[10px] text-zinc-500 font-mono font-bold shrink-0 bg-black border border-zinc-800/80 px-2 py-1 rounded">
                              BY: {log.by}
                            </div>
                          </div>
                        );
                      })}

                      {filteredLogs.length === 0 && (
                        <div className="py-16 text-center text-zinc-500 font-mono space-y-2">
                          <svg className="w-8 h-8 text-zinc-700 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <div className="text-xs uppercase tracking-widest font-bold text-zinc-400">
                            [root@portal-server ~]$ No Matching Console Logs
                          </div>
                          <p className="text-[11px] text-zinc-600">
                            Perform whitelist additions, reseller updates, or API key operations to generate real-time audit logs.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </main>
        </div>
      )}

      {/* EXTEND CLIENT API KEY CREDITS MODAL */}
      {extendModalKey && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-sm font-mono uppercase tracking-wider font-bold text-white">
                  ⚡ Extend API Key Credits
                </h3>
              </div>
              <button
                onClick={() => setExtendModalKey(null)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-2 font-mono text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Client / Website:</span>
                <span className="text-white font-bold">{extendModalKey.clientName}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Current Credits:</span>
                <span className="text-emerald-400 font-bold">{extendModalKey.credits} CR</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>API Key:</span>
                <span className="text-zinc-300 font-mono text-[10px]">{extendModalKey.key.slice(0, 14)}...</span>
              </div>
            </div>

            <form onSubmit={handleExtendClientKeySubmit} className="space-y-4 font-mono">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-2 font-bold">
                  Add Additional Credits
                </label>

                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[100, 500, 1000, 5000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setExtendCreditsInput(preset)}
                      className={`py-2 rounded-xl text-[10px] font-mono font-bold uppercase transition-all ${
                        extendCreditsInput === preset
                          ? "bg-emerald-500 text-black font-black shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                          : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white hover:bg-zinc-800"
                      }`}
                    >
                      +{preset} CR
                    </button>
                  ))}
                </div>

                <input
                  type="number"
                  required
                  min={1}
                  value={extendCreditsInput}
                  onChange={(e) => setExtendCreditsInput(parseInt(e.target.value) || 0)}
                  placeholder="Enter credit amount e.g. 500"
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500 transition-all font-mono"
                />
              </div>

              <div className="pt-2 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setExtendModalKey(null)}
                  className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl py-3 text-xs font-bold uppercase tracking-wider transition-all"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl py-3 text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                >
                  Confirm +{extendCreditsInput} CR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
