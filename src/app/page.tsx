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
type LandingSection = "HOME" | "PROVIDERS" | "API_ACCESS" | "RESELLER_SYSTEM" | "HOW_IT_WORKS";

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
                    href="https://discord.gg/5k8BCM9WRg"
                    target="_blank"
                    rel="noopener noreferrer"
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
