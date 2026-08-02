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

type TabType = "OVERVIEW" | "WHITELIST" | "RESELLERS" | "LOGS";
type LandingSection = "HOME" | "API_ACCESS" | "RESELLER_SYSTEM" | "HOW_IT_WORKS";

export default function Home() {
  // Authentication & API Config
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userRole, setUserRole] = useState<"ADMIN" | "RESELLER" | null>(null);
  const [currentUser, setCurrentUser] = useState<string>("");
  const [loginType, setLoginType] = useState<"ADMIN" | "RESELLER">("ADMIN");
  
  // Landing Page & Modal State
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [activeLandingSection, setActiveLandingSection] = useState<LandingSection>("HOME");
  
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

  // Helper: Toast
  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Helper: Logger
  const addLog = (action: string, details: string, by: string) => {
    const newLog: LogItem = {
      id: Math.random().toString(36).substr(2, 9),
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

  // Load Data on Mount
  useEffect(() => {
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
    } catch (e) {
      console.error("Error loading local data:", e);
    }
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
        if (email === "sarthakking333@gmail.com" && password === "SARTHAKX999") {
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

  // Safe API Proxy Call Helper
  const makeApiCall = async (endpoint: string, method: "GET" | "POST", bodyData?: any) => {
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

  // Add UID
  const handleAddUid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUid.trim()) {
      showToast("UID is required.", "error");
      return;
    }

    let creditCost = newDays;
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

    if (isMockMode) {
      setTimeout(() => {
        if (uids.some((item) => item.uid === newRecord.uid)) {
          showToast("UID already exists in database.", "error");
          setIsSubmitting(false);
          return;
        }
        saveUids([newRecord, ...uids]);
        addLog("WHITELIST_ADD", `Added UID ${newRecord.uid} for ${newRecord.days} days.`, currentUser);
        setNewUid("");
        setNewName("");
        setNewDays(30);
        setIsSubmitting(false);
        showToast("UID provisioned successfully.", "success");
      }, 600);
      return;
    }

    const apiRes = await makeApiCall("/uids/add", "POST", {
      uid: newRecord.uid,
      days: newRecord.days,
      name: newRecord.name,
    });

    if (apiRes.ok) {
      saveUids([newRecord, ...uids]);
      addLog("WHITELIST_ADD", `Added UID ${newRecord.uid} for ${newRecord.days} days.`, currentUser);
      showToast("UID provisioned successfully.", "success");
      setNewUid("");
      setNewName("");
      setNewDays(30);
    } else {
      showToast(apiRes.error || "Failed to add UID.", "error");
    }
    
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
  
  const filteredLogs = logs.filter(item =>
    userRole === "ADMIN" || item.by === currentUser
  );

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
        <div className="flex-1 flex flex-col bg-black text-white relative font-sans selection:bg-white selection:text-black">
          
          {/* FLOATING NAVBAR (Inspired by screenshot pill navbar) */}
          <nav className="fixed top-6 left-0 right-0 z-40 px-6 max-w-7xl mx-auto flex items-center justify-between pointer-events-none">
            {/* Brand Logo */}
            <div className="pointer-events-auto flex items-center space-x-3 bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-xl px-5 py-2.5 rounded-full shadow-2xl">
              <span className="h-2.5 w-2.5 bg-white rounded-full animate-pulse" />
              <span className="font-extrabold tracking-wider text-base text-white font-mono">UID BYPASS</span>
            </div>

            {/* Center Floating Pill Menu */}
            <div className="pointer-events-auto hidden md:flex items-center space-x-1 bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-xl p-1.5 rounded-full shadow-2xl">
              {[
                { id: "HOME", label: "Home" },
                { id: "API_ACCESS", label: "API Access" },
                { id: "RESELLER_SYSTEM", label: "Reseller System" },
                { id: "HOW_IT_WORKS", label: "How It Works" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveLandingSection(item.id as LandingSection);
                    const el = document.getElementById(item.id.toLowerCase());
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`px-4 py-2 text-xs font-semibold rounded-full transition-all duration-300 ${
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

          {/* HERO SECTION */}
          <section id="home" className="pt-40 pb-20 px-6 max-w-7xl mx-auto w-full flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-[140px] pointer-events-none" />

            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-400 text-xs font-mono mb-8 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>Next-Gen Identity Authorization Terminal</span>
            </div>

            <h1 className="text-4xl md:text-7xl font-extrabold text-white tracking-tight leading-tight max-w-4xl mb-6">
              Instant UID Whitelisting & <span className="bg-gradient-to-r from-white via-zinc-400 to-zinc-600 bg-clip-text text-transparent">API Access Portal</span>
            </h1>

            <p className="text-zinc-400 text-sm md:text-lg max-w-2xl font-normal leading-relaxed mb-10">
              High-performance automated verification system with real-time API access, multi-tier reseller management, and credit-based quota provisioning.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="w-full sm:w-auto bg-white text-black font-bold px-8 py-4 rounded-xl text-sm transition-all duration-300 hover:bg-zinc-200 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
              >
                Access Portal Console
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById("api_access");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="w-full sm:w-auto bg-zinc-950 border border-zinc-800 hover:border-zinc-600 text-zinc-300 font-medium px-8 py-4 rounded-xl text-sm transition-all duration-300"
              >
                Explore API Docs
              </button>
            </div>

            {/* Quick Stat Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-4xl mt-20 pt-10 border-t border-zinc-900">
              <div>
                <div className="text-3xl font-extrabold text-white font-mono">99.9%</div>
                <div className="text-xs text-zinc-500 uppercase tracking-widest mt-1">Uptime Guarantee</div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-white font-mono">&lt; 50ms</div>
                <div className="text-xs text-zinc-500 uppercase tracking-widest mt-1">Response Latency</div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-white font-mono">REST API</div>
                <div className="text-xs text-zinc-500 uppercase tracking-widest mt-1">POST & GET Ready</div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-white font-mono">Role System</div>
                <div className="text-xs text-zinc-500 uppercase tracking-widest mt-1">Admin & Reseller</div>
              </div>
            </div>
          </section>

          {/* SECTION 1: API ACCESS DETAILS */}
          <section id="api_access" className="py-20 px-6 max-w-7xl mx-auto w-full border-t border-zinc-900">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">Developer Documentation</span>
              <h2 className="text-3xl md:text-4xl font-bold text-white mt-2">API Access & Endpoints</h2>
              <p className="text-zinc-400 text-sm mt-3">Integrate UID verification into your external applications with our REST API.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Endpoint Cards */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6 hover:border-zinc-700 transition-colors">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="bg-emerald-950/60 border border-emerald-900/80 text-emerald-400 text-[10px] font-mono font-bold px-2.5 py-1 rounded">POST</span>
                    <span className="font-mono text-sm text-white font-bold">/api/v1/uids/add</span>
                  </div>
                  <p className="text-xs text-zinc-400">Whitelist a target UID with a specified lifespan (days) and client name.</p>
                </div>

                <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6 hover:border-zinc-700 transition-colors">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="bg-red-950/60 border border-red-900/80 text-red-400 text-[10px] font-mono font-bold px-2.5 py-1 rounded">POST</span>
                    <span className="font-mono text-sm text-white font-bold">/api/v1/uids/remove</span>
                  </div>
                  <p className="text-xs text-zinc-400">Revoke and delete a whitelisted UID immediately from the active registry.</p>
                </div>

                <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6 hover:border-zinc-700 transition-colors">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="bg-blue-950/60 border border-blue-900/80 text-blue-400 text-[10px] font-mono font-bold px-2.5 py-1 rounded">GET</span>
                    <span className="font-mono text-sm text-white font-bold">/api/v1/uids/list</span>
                  </div>
                  <p className="text-xs text-zinc-400">Fetch all active whitelisted UIDs and their remaining lifespans.</p>
                </div>
              </div>

              {/* Code Snippet Box */}
              <div className="lg:col-span-7 bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6 font-mono text-xs overflow-x-auto">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
                  <span className="text-zinc-400 font-bold">cURL Example</span>
                  <span className="text-zinc-500 text-[10px]">Header: X-AUTH-KEY</span>
                </div>
                <pre className="text-zinc-300 leading-relaxed">
{`curl -X POST "https://mani272uidbypass.vercel.app/api/v1/uids/add" \\
  -H "Content-Type: application/json" \\
  -H "X-AUTH-KEY: YOUR_API_KEY_HERE" \\
  -d '{
    "uid": "123456789",
    "days": 30,
    "name": "ClientAlpha"
  }'`}
                </pre>
              </div>
            </div>
          </section>

          {/* SECTION 2: RESELLER SYSTEM DETAILS */}
          <section id="reseller_system" className="py-20 px-6 max-w-7xl mx-auto w-full border-t border-zinc-900">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">Multi-Tier Architecture</span>
              <h2 className="text-3xl md:text-4xl font-bold text-white mt-2">Reseller Management & Quotas</h2>
              <p className="text-zinc-400 text-sm mt-3">Empower your team and distributors with credit-based UID whitelisting.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8 text-left">
                <div className="h-10 w-10 bg-zinc-900 border border-zinc-700 rounded-xl flex items-center justify-center text-white mb-6">🔑</div>
                <h3 className="text-lg font-bold text-white mb-2">Dedicated Credentials</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">Admin creates Resellers with custom Username and Password. Resellers log in directly through the Portal using their credentials.</p>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8 text-left">
                <div className="h-10 w-10 bg-zinc-900 border border-zinc-700 rounded-xl flex items-center justify-center text-white mb-6">💳</div>
                <h3 className="text-lg font-bold text-white mb-2">1 Credit = 1 Day Rule</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">Simple quota math: Whitelisting 30 days costs 30 Credits. Admins can top-up reseller credit balances instantly anytime.</p>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8 text-left">
                <div className="h-10 w-10 bg-zinc-900 border border-zinc-700 rounded-xl flex items-center justify-center text-white mb-6">📊</div>
                <h3 className="text-lg font-bold text-white mb-2">Audit & Log Controls</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">Every action—login, credit addition, UID creation, and deletion—is logged into the Console with user timestamps.</p>
              </div>
            </div>
          </section>

          {/* SECTION 3: HOW IT WORKS */}
          <section id="how_it_works" className="py-20 px-6 max-w-7xl mx-auto w-full border-t border-zinc-900">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">Simple 3-Step Workflow</span>
              <h2 className="text-3xl md:text-4xl font-bold text-white mt-2">How It Works</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center font-mono">
              <div className="bg-zinc-950 border border-zinc-800/60 p-8 rounded-2xl">
                <div className="text-xs text-zinc-500 mb-2">STEP 01</div>
                <h4 className="text-base font-bold text-white mb-2">Log In To Portal</h4>
                <p className="text-xs text-zinc-400 font-sans">Admin logs in via Email/Pass, Reseller logs in via Username/Pass.</p>
              </div>

              <div className="bg-zinc-950 border border-zinc-800/60 p-8 rounded-2xl">
                <div className="text-xs text-zinc-500 mb-2">STEP 02</div>
                <h4 className="text-base font-bold text-white mb-2">Provide Target UID</h4>
                <p className="text-xs text-zinc-400 font-sans">Enter Target UID, Client Identifier, and Days lifespan.</p>
              </div>

              <div className="bg-zinc-950 border border-zinc-800/60 p-8 rounded-2xl">
                <div className="text-xs text-zinc-500 mb-2">STEP 03</div>
                <h4 className="text-base font-bold text-white mb-2">Instant Authorization</h4>
                <p className="text-xs text-zinc-400 font-sans">The server receives authorization and the UID is active immediately.</p>
              </div>
            </div>
          </section>

          {/* FOOTER */}
          <footer className="py-12 border-t border-zinc-900 text-center text-xs text-zinc-600 font-mono">
            <div>UID BYPASS ACCESS PORTAL • SECURED TERMINAL</div>
          </footer>

          {/* --- LOGIN MODAL (Triggered by Log In buttons) --- */}
          {isLoginModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-mono">
              <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 p-8 rounded-2xl shadow-2xl relative">
                
                {/* Close Button */}
                <button
                  onClick={() => setIsLoginModalOpen(false)}
                  className="absolute top-4 right-4 text-zinc-500 hover:text-white p-2"
                >
                  ✕
                </button>

                <div className="text-center mb-8">
                  <h2 className="text-2xl font-extrabold tracking-widest text-white uppercase mb-1">
                    PORTAL LOGIN
                  </h2>
                  <p className="text-zinc-500 text-[10px] tracking-widest uppercase">
                    Select Role and Enter Credentials
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                  {/* Admin / Reseller Switcher */}
                  <div className="flex bg-zinc-900/50 p-1 rounded-lg border border-zinc-800 relative">
                    <button
                      type="button"
                      onClick={() => setLoginType("ADMIN")}
                      className={`flex-1 py-2.5 text-xs font-bold tracking-widest uppercase transition-all duration-300 rounded-md z-10 ${
                        loginType === "ADMIN" ? "text-black shadow-lg" : "text-zinc-500 hover:text-white"
                      }`}
                    >
                      Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoginType("RESELLER")}
                      className={`flex-1 py-2.5 text-xs font-bold tracking-widest uppercase transition-all duration-300 rounded-md z-10 ${
                        loginType === "RESELLER" ? "text-black shadow-lg" : "text-zinc-500 hover:text-white"
                      }`}
                    >
                      Reseller
                    </button>
                    <div 
                      className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-md transition-all duration-300 ease-out z-0 ${
                        loginType === "ADMIN" ? "left-1" : "translate-x-full left-1"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-2 font-medium">
                      {loginType === "ADMIN" ? "Email Address" : "Username"}
                    </label>
                    <input
                      type={loginType === "ADMIN" ? "email" : "text"}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={loginType === "ADMIN" ? "sarthakking333@gmail.com" : "Enter your username..."}
                      className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-2 font-medium">
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-white transition-all"
                    />
                  </div>

                  {loginError && (
                    <div className="border border-red-500/50 bg-red-950/30 text-red-400 text-xs p-3 rounded-lg">
                      {loginError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isConnecting}
                    className="w-full bg-white text-black hover:bg-zinc-200 rounded-lg py-3.5 text-xs font-bold tracking-widest uppercase transition-all flex items-center justify-center shadow-lg"
                  >
                    {isConnecting ? "Authenticating..." : "Access Console"}
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>
      ) : (

        /* --- AUTHENTICATED DASHBOARD PAGE --- */
        <div className="flex-1 flex flex-col relative bg-black min-h-screen">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

          {/* Header */}
          <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
            <div className="w-full px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-base font-bold tracking-widest text-white uppercase font-mono">
                  UID BYPASS ACCES PORTAL
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                <div className="bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 flex items-center space-x-2">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">ROLE:</span>
                  <span className="font-bold tracking-wider text-white text-[11px]">
                    {userRole}
                  </span>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 flex items-center space-x-2">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">USER:</span>
                  <span className="font-bold tracking-wider text-white text-[11px]">
                    {currentUser || userRole}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="bg-zinc-900 hover:bg-white text-zinc-300 hover:text-black border border-zinc-700 hover:border-white rounded-md px-3.5 py-1.5 transition-all duration-200 tracking-wider uppercase text-[10px] font-bold"
                >
                  De-Authorize
                </button>
              </div>
            </div>
          </header>

          {/* Main Workspace - FULL WIDTH */}
          <main className="flex-1 w-full px-8 py-6 flex flex-col lg:flex-row gap-8 relative z-10">
            {/* Sidebar / Tabs - SLEEK & EMOJI-FREE */}
            <aside className="w-full lg:w-64 flex flex-col gap-1.5 shrink-0">
              {[
                { 
                  id: "OVERVIEW", 
                  label: "Overview", 
                  icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  ) 
                },
                { 
                  id: "WHITELIST", 
                  label: "UID Whitelist", 
                  icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  ) 
                },
                ...(userRole === "ADMIN" ? [{ 
                  id: "RESELLERS", 
                  label: "Reseller Management", 
                  icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) 
                }] : []),
                { 
                  id: "LOGS", 
                  label: "Console Logs", 
                  icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  ) 
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-xs font-semibold tracking-wider transition-all duration-200 border-l-2 ${
                    activeTab === tab.id
                      ? "bg-zinc-900 text-white border-white font-bold"
                      : "bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-950 border-transparent"
                  }`}
                >
                  <span className="shrink-0">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </aside>

            {/* Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
              
              {/* OVERVIEW TAB */}
              {activeTab === "OVERVIEW" && (
                <div className="space-y-6 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 relative overflow-hidden group hover:border-zinc-600 transition-colors">
                      <div className="text-[10px] tracking-widest uppercase text-zinc-500 mb-2 font-mono">My Whitelisted UIDs</div>
                      <div className="text-4xl font-extrabold text-white font-mono">{filteredUids.length}</div>
                    </div>
                    {userRole === "RESELLER" && currentResellerObj && (
                      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 relative overflow-hidden group hover:border-zinc-600 transition-colors">
                        <div className="text-[10px] tracking-widest uppercase text-zinc-500 mb-2 font-mono">Available Credits</div>
                        <div className="text-4xl font-extrabold text-white font-mono">{currentResellerObj.credits}</div>
                        <div className="text-[9px] uppercase text-zinc-500 mt-2 font-mono">1 Credit = 1 Day Whitelist</div>
                      </div>
                    )}
                    {userRole === "ADMIN" && (
                      <>
                        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 relative overflow-hidden group hover:border-zinc-600 transition-colors">
                          <div className="text-[10px] tracking-widest uppercase text-zinc-500 mb-2 font-mono">Total Resellers</div>
                          <div className="text-4xl font-extrabold text-white font-mono">{resellers.length}</div>
                        </div>
                        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 relative overflow-hidden group hover:border-zinc-600 transition-colors">
                          <div className="text-[10px] tracking-widest uppercase text-zinc-500 mb-2 font-mono">System Status</div>
                          <div className="text-xl font-bold text-white flex items-center space-x-2.5 mt-2 font-mono">
                            <span className="h-2.5 w-2.5 bg-white rounded-none animate-pulse"></span>
                            <span>OPERATIONAL</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
                    <h2 className="text-xs font-bold tracking-widest uppercase mb-4 text-zinc-400 border-b border-zinc-800 pb-4 font-mono">Recent Activity</h2>
                    <div className="space-y-4">
                      {filteredLogs.slice(0, 5).map(log => (
                        <div key={log.id} className="flex items-start space-x-3 text-sm font-mono">
                          <span className="text-zinc-500 text-[10px] mt-1 shrink-0">{log.timestamp.split(', ')[1]}</span>
                          <div>
                            <span className="font-bold text-white mr-2 text-xs">[{log.by}]</span>
                            <span className="text-zinc-300 text-xs">{log.details}</span>
                          </div>
                        </div>
                      ))}
                      {filteredLogs.length === 0 && (
                         <div className="text-xs text-zinc-600 tracking-widest uppercase font-mono">No recent activity.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* WHITELIST TAB */}
              {activeTab === "WHITELIST" && (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-fade-in font-mono">
                  <div className="xl:col-span-4 space-y-6">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 relative">
                      <div className="text-[10px] tracking-widest uppercase text-zinc-400 mb-6 border-b border-zinc-800 pb-4">
                        Provision Registry
                      </div>

                      {userRole === "RESELLER" && currentResellerObj && (
                         <div className="mb-6 p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-xs flex justify-between items-center">
                           <span className="text-zinc-400 uppercase tracking-wider text-[10px]">Your Balance</span>
                           <span className="font-bold text-white">{currentResellerObj.credits} Credits</span>
                         </div>
                      )}

                      <form onSubmit={handleAddUid} className="space-y-5">
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5 font-medium">
                            Target UID
                          </label>
                          <input
                            type="text"
                            required
                            value={newUid}
                            onChange={(e) => setNewUid(e.target.value)}
                            placeholder="e.g., 123456789"
                            className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5 font-medium flex justify-between">
                            <span>Lifespan (Days)</span>
                            {userRole === "RESELLER" && <span className="text-white font-bold">Cost: {newDays} Credits</span>}
                          </label>
                          <input
                            type="number"
                            required
                            min={1}
                            max={9999}
                            value={newDays}
                            onChange={(e) => setNewDays(parseInt(e.target.value) || 1)}
                            placeholder="30"
                            className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5 font-medium">
                            Client Identifier (Name)
                          </label>
                          <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="e.g., Client Alpha"
                            className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white transition-all"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full bg-white text-black hover:bg-zinc-200 rounded-lg py-3 text-xs font-bold tracking-widest uppercase transition-all flex items-center justify-center mt-4"
                        >
                          {isSubmitting ? "Provisioning..." : "Whitelist UID"}
                        </button>
                      </form>
                    </div>
                  </div>

                  <div className="xl:col-span-8">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 relative flex flex-col h-full min-h-[500px]">
                      <div className="text-[10px] tracking-widest uppercase text-zinc-400 mb-6 border-b border-zinc-800 pb-4 flex justify-between items-center">
                        <span>Database Records</span>
                        <span className="bg-zinc-900 border border-zinc-800 px-2 py-1 rounded text-white">{filteredUids.length} Active</span>
                      </div>

                      <div className="relative mb-6">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Query by UID or Name..."
                          className="w-full bg-black border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-600 transition-colors"
                        />
                        <svg className="w-4 h-4 absolute left-3.5 top-2.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      </div>

                      <div className="flex-1 overflow-x-auto">
                        {filteredUids.length === 0 ? (
                          <div className="h-64 flex flex-col items-center justify-center border border-zinc-800/80 border-dashed rounded-xl text-zinc-600">
                            <span className="text-xs uppercase tracking-widest">No Database Records Found</span>
                          </div>
                        ) : (
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-zinc-800 text-[10px] text-zinc-500 uppercase tracking-widest">
                                <th className="pb-3 font-semibold">Identifier</th>
                                <th className="pb-3 font-semibold">UID Value</th>
                                <th className="pb-3 font-semibold text-center">Span</th>
                                {userRole === "ADMIN" && <th className="pb-3 font-semibold text-center">By</th>}
                                <th className="pb-3 font-semibold text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/50 text-xs">
                              {filteredUids.map((item) => (
                                <tr key={item.uid} className="hover:bg-zinc-900/40 group transition-colors">
                                  <td className="py-4 font-medium text-white truncate max-w-[150px]">{item.name}</td>
                                  <td className="py-4 text-zinc-400 select-all">{item.uid}</td>
                                  <td className="py-4 text-center text-zinc-300">
                                    <span className="bg-zinc-900 px-2 py-1 rounded border border-zinc-800">{item.days}d</span>
                                  </td>
                                  {userRole === "ADMIN" && (
                                    <td className="py-4 text-center text-white font-medium text-[10px] uppercase tracking-wider">{item.createdBy}</td>
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
                                        className="bg-zinc-900 hover:bg-white text-zinc-300 hover:text-black border border-zinc-700 hover:border-white rounded px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider transition-all"
                                      >
                                        + Extend
                                      </button>

                                      <button
                                        onClick={() => handleRemoveUid(item.uid)}
                                        disabled={deletingUid === item.uid}
                                        className="bg-red-950/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-900/50 hover:border-red-600 rounded px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider transition-all"
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
              )}

              {/* RESELLERS TAB (ADMIN ONLY) */}
              {activeTab === "RESELLERS" && userRole === "ADMIN" && (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-fade-in font-mono">
                  <div className="xl:col-span-4 space-y-6">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 relative">
                      <div className="text-[10px] tracking-widest uppercase text-zinc-400 mb-6 border-b border-zinc-800 pb-4">
                        Create Reseller
                      </div>

                      <form onSubmit={handleAddReseller} className="space-y-5">
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5 font-medium">Username</label>
                          <input type="text" required value={newResellerUsername} onChange={(e) => setNewResellerUsername(e.target.value)} placeholder="reseller_one" className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white transition-all" />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5 font-medium">Password</label>
                          <input type="text" required value={newResellerPassword} onChange={(e) => setNewResellerPassword(e.target.value)} placeholder="secure_pass" className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white transition-all" />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5 font-medium">Initial Credits</label>
                          <input type="number" required min={0} value={newResellerCredits} onChange={(e) => setNewResellerCredits(parseInt(e.target.value) || 0)} placeholder="100" className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white transition-all" />
                        </div>
                        <button type="submit" className="w-full bg-white text-black hover:bg-zinc-200 rounded-lg py-3 text-xs font-bold tracking-widest uppercase transition-all mt-4">
                          Create Reseller
                        </button>
                      </form>
                    </div>
                  </div>

                  <div className="xl:col-span-8">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 relative flex flex-col h-full min-h-[500px]">
                      <div className="text-[10px] tracking-widest uppercase text-zinc-400 mb-6 border-b border-zinc-800 pb-4">
                        Reseller Database
                      </div>
                      <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-zinc-800 text-[10px] text-zinc-500 uppercase tracking-widest">
                              <th className="pb-3 font-semibold">User</th>
                              <th className="pb-3 font-semibold text-center">Password</th>
                              <th className="pb-3 font-semibold text-center">Credits</th>
                              <th className="pb-3 font-semibold text-center">Whitelisted</th>
                              <th className="pb-3 font-semibold text-center">Created</th>
                              <th className="pb-3 font-semibold text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/50 text-xs">
                            {resellers.map((r) => (
                              <tr key={r.username} className="hover:bg-zinc-900/40 group transition-colors">
                                <td className="py-4 font-bold text-white">{r.username}</td>
                                <td className="py-4 text-center">
                                  <span className="text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-[11px] select-all">
                                    {r.password || "••••••••"}
                                  </span>
                                </td>
                                <td className="py-4 text-center">
                                  <span className="text-white bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-md font-bold">{r.credits}</span>
                                </td>
                                <td className="py-4 text-center text-zinc-300">{r.totalWhitelisted}</td>
                                <td className="py-4 text-center text-zinc-500">{r.createdAt}</td>
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
                                      className="bg-zinc-900 hover:bg-white text-zinc-300 hover:text-black border border-zinc-700 hover:border-white rounded px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider transition-all"
                                    >
                                      + Add Credits
                                    </button>

                                    <button
                                      onClick={() => handleDeleteReseller(r.username)}
                                      className="bg-red-950/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-900/50 hover:border-red-600 rounded px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider transition-all"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {resellers.length === 0 && (
                              <tr><td colSpan={6} className="py-8 text-center text-zinc-600 text-xs uppercase tracking-widest">No Resellers Found</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* LOGS TAB */}
              {activeTab === "LOGS" && (
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 relative min-h-[600px] animate-fade-in font-mono">
                  <div className="text-[10px] tracking-widest uppercase text-zinc-400 mb-6 border-b border-zinc-800 pb-4">
                    Audit Trail & Console
                  </div>
                  <div className="space-y-1">
                    {filteredLogs.map(log => (
                      <div key={log.id} className="flex flex-col sm:flex-row sm:items-center py-3 border-b border-zinc-900/50 hover:bg-zinc-900/30 px-4 rounded transition-colors gap-2">
                        <div className="w-32 text-[10px] text-zinc-500 shrink-0">{log.timestamp}</div>
                        <div className="w-32 shrink-0">
                          <span className={`text-[9px] uppercase tracking-wider px-2 py-1 rounded border ${
                            log.action.includes("ADD") ? "bg-zinc-900 border-zinc-700 text-white" :
                            log.action.includes("REMOVE") ? "bg-red-950/30 border-red-900/50 text-red-400" :
                            "bg-zinc-900 border-zinc-800 text-zinc-400"
                          }`}>{log.action}</span>
                        </div>
                        <div className="flex-1 text-sm text-zinc-300">{log.details}</div>
                        <div className="w-24 text-right text-xs font-bold text-zinc-500">[{log.by}]</div>
                      </div>
                    ))}
                    {filteredLogs.length === 0 && (
                      <div className="py-12 text-center text-zinc-600 text-xs uppercase tracking-widest">No logs available</div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </main>
        </div>
      )}
    </div>
  );
}
