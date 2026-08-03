# 🧠 BRAIN.md - UID Bypass Server & Dashboard System Architecture

> **Project Name**: UID Bypass Server & High-Performance Whitelist Control Center  
> **Repository Scope**: Public Free Whitelist Portal (`/free-portal`), Admin Control Console (`/`), API Proxy Engine, & Discord OAuth Integration.

---

## 📌 1. Project Overview & System Purpose

The **UID Whitelist Dashboard** is a state-of-the-art, high-throughput management system built for automated gaming UID whitelisting, high-speed bypass server proxying, reseller credit distribution, and public free quota allocation.

### Core Philosophy & Aesthetics:
- **100% Pure Monochrome Black & White Interface**: Built with high-end glassmorphism, animated shooting stars meteor shower, crisp typography (`font-sans font-black`), and zero color clutter.
- **Dual-Layer Persistence Engine**: Synchronizes live requests directly with external Vercel backend API endpoints (`https://mani272uidbypass.vercel.app/api/v1/uids/add` & `/list`) with real-time local storage (`mono_local_uids`) fallbacks.
- **Zero-Error Hydration & Pure Component Lifecycle**: Fully compliant with Next.js 16 App Router SSR hydration protection (`isMounted` guards) and React 19 compiler purity standards.

---

## 🏗️ 2. Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js (App Router `src/app/`) |
| **UI Library** | React 19 & Tailwind CSS |
| **Authentication** | Discord OAuth2 Integration (`/api/auth/discord`) |
| **API Proxy** | Next.js Serverless Route Handlers (`/api/uid-proxy`) |
| **State Management** | LocalStorage Persistence with React Hooks & `isMounted` Guards |
| **Styling & Effects** | Pure Monochrome CSS, Meteor Shower Keyframe Animations |

---

## ⚡ 3. Key Architecture & Features

### A. Public Free Whitelist Portal (`/free-portal`)
- **Step 1 - Discord Authentication**: Connects users to Discord OAuth (`/api/auth/discord` & `/api/auth/discord/callback`) to verify identity and restrict duplicate claims.
- **Step 2 - Provisioning Form**: Allows authenticated visitors to claim free whitelists for a configured duration (1 Day, 3 Days, 7 Days, 30 Days).
- **Admin Lock Sync**: Dynamically syncs with Admin Pause/Enable toggle (`free_portal_enabled`). When paused, renders an instant `🔒 FREE WHITELISTING PAUSED BY ADMIN` banner and locks form inputs.
- **Real-Time Live Status Checker**: Enables users to search any Game UID against both local shared memory and live backend databases in real-time.

### B. Admin Control Center (`/`)
- **System Root Access**: Secured via Admin Authorization Keys.
- **Live Portal Control Panel**: Toggle Free Portal ON/OFF instantly and configure quota validity durations.
- **UID Management**: Add, search, filter, and revoke whitelisted UIDs with real-time API Proxy forwarding.
- **Reseller Credit Management**: Create reseller sub-accounts, allocate credit quotas, and track usage.
- **Client API Gateway Keys**: Generate, manage, and revoke client API keys (`X-AUTH-KEY`) for automated third-party integration.

### C. Serverless API Proxy Engine (`/api/uid-proxy`)
- **Header Injection**: Securely appends internal authorization header `X-AUTH-KEY: MANI272-6B861E35F791CA509E10EF3613FEF32C`.
- **CORS & Proxying**: Forwards incoming client requests directly to live Vercel API backend (`https://mani272uidbypass.vercel.app/api/v1/uids/*`), shielding raw credentials from browser inspectors.

---

## 📂 4. Repository Directory Structure

```
uid-dashboard/
├── BRAIN.md                             # Comprehensive Architecture & Brain Document
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── discord/
│   │   │   │       ├── route.ts         # Discord OAuth Redirect Initiator
│   │   │   │       └── callback/
│   │   │   │           └── route.ts     # Discord OAuth Code Exchange Handler
│   │   │   ├── uid-proxy/
│   │   │   │   └── route.ts             # Secure API Proxy Gateway
│   │   │   └── v1/
│   │   │       └── uids/
│   │   │           ├── add/route.ts     # Add UID API Endpoint
│   │   │           ├── list/route.ts    # List UIDs API Endpoint
│   │   │           └── remove/route.ts  # Revoke UID API Endpoint
│   │   ├── free-portal/
│   │   │   └── page.tsx                 # Public Free Whitelist Portal & Status Checker
│   │   ├── globals.css                  # Core CSS & Shooting Stars Meteor Animations
│   │   ├── layout.tsx                   # Root HTML Layout
│   │   └── page.tsx                     # Main Dashboard & Admin Console
```

---

## 🔒 5. Verification & Testing Standards

- **ESLint Compliance**: Tested with `npm run lint` — **0 Errors, 0 Warnings**.
- **Hydration Mismatch**: Protected via `isMounted` checks preventing SSR vs Client initial state mismatches.
- **Local Dev Server**: Verified with `npm run dev` running cleanly on Turbo.

---

*Document generated and updated for UID Server & Bypass System.*
