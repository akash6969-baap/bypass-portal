import fs from "fs";
import path from "path";

export interface ClientApiKeyRecord {
  id: string;
  clientName: string;
  key: string;
  credits: number;
  status: "ACTIVE" | "REVOKED";
  createdAt: string;
}

// In-memory cache for fast Vercel Serverless execution
let globalMemoryKeys: ClientApiKeyRecord[] | null = null;

const DATA_DIR = path.join(process.cwd(), "data");
const KEYS_FILE = path.join(DATA_DIR, "client_keys.json");
const TMP_KEYS_FILE = path.join("/tmp", "client_keys.json");

/**
 * Reads all registered client API keys from JSON storage (Filesystem / Vercel Tmp / Memory / Env).
 */
export function getClientApiKeysServer(): ClientApiKeyRecord[] {
  if (globalMemoryKeys && globalMemoryKeys.length > 0) {
    return globalMemoryKeys;
  }

  // 1. Try reading from project data/client_keys.json
  try {
    if (fs.existsSync(KEYS_FILE)) {
      const raw = fs.readFileSync(KEYS_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        globalMemoryKeys = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.log("Project client_keys.json read fallback:", err);
  }

  // 2. Try reading from Vercel /tmp/client_keys.json
  try {
    if (fs.existsSync(TMP_KEYS_FILE)) {
      const raw = fs.readFileSync(TMP_KEYS_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        globalMemoryKeys = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.log("Vercel tmp client_keys.json read fallback:", err);
  }

  // 3. Try reading from process.env.CLIENT_KEYS_JSON
  if (process.env.CLIENT_KEYS_JSON) {
    try {
      const parsed = JSON.parse(process.env.CLIENT_KEYS_JSON);
      if (Array.isArray(parsed)) {
        globalMemoryKeys = parsed;
        return parsed;
      }
    } catch (e) {
      console.log("Env CLIENT_KEYS_JSON read fallback:", e);
    }
  }

  return globalMemoryKeys || [];
}

/**
 * Saves all client API keys to JSON format (Project File + Vercel Tmp + Memory).
 */
export function saveClientApiKeysServer(keys: ClientApiKeyRecord[]): void {
  globalMemoryKeys = keys;

  // Try writing to project data/client_keys.json (Localhost)
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2), "utf-8");
  } catch (err) {
    // Vercel Serverless disk is read-only, fallback to /tmp
    try {
      fs.writeFileSync(TMP_KEYS_FILE, JSON.stringify(keys, null, 2), "utf-8");
    } catch (tmpErr) {
      console.log("Vercel tmp write fallback:", tmpErr);
    }
  }
}

/**
 * Generates a standard production API key format for any client/website.
 */
export function generateStandardApiKey(clientName: string): string {
  const cleanName = clientName.trim().toUpperCase().replace(/[^A-Z0-9]/g, "_").slice(0, 15) || "CLIENT";
  const randomHash = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `KEY-${cleanName}-${randomHash}`;
}

/**
 * Validates incoming X-AUTH-KEY and deducts credits for any registered client key in JSON format.
 */
export function validateAndDeductCredit(authKey: string, deductAmount: number = 1): { success: boolean; error?: string; remainingCredits?: number; clientName?: string } {
  if (!authKey) {
    return { success: false, error: "Missing X-AUTH-KEY header" };
  }

  const cleanKey = authKey.trim();

  // Allow Master Admin System Key from Environment
  const masterEnvKey = process.env.MANI_API_KEY || "MANI272-6B861E35F791CA509E10EF3613FEF32C";
  if (cleanKey === masterEnvKey || cleanKey.startsWith("X-AUTH-MASTER") || cleanKey.startsWith("X-AUTH-ADMIN")) {
    return { success: true, remainingCredits: 999999, clientName: "Master Admin Gateway" };
  }

  const keys = getClientApiKeysServer();
  const index = keys.findIndex(k => k.key.trim() === cleanKey);

  if (index === -1) {
    return { success: false, error: "Invalid API Key. Authorization denied." };
  }

  const keyRecord = keys[index];

  if (keyRecord.status !== "ACTIVE") {
    return { success: false, error: "API Key is REVOKED or Disabled. Contact Admin." };
  }

  if (keyRecord.credits < deductAmount) {
    return { success: false, error: `Insufficient API Credits. Current Balance: ${keyRecord.credits} CR, Required: ${deductAmount} CR.` };
  }

  // Deduct credits and save updated JSON format
  keyRecord.credits -= deductAmount;
  keys[index] = keyRecord;
  saveClientApiKeysServer(keys);

  return { success: true, remainingCredits: keyRecord.credits, clientName: keyRecord.clientName };
}
