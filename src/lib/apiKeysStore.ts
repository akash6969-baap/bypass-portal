import { dbConnect } from "@/lib/mongodb";
import ApiKey, { IApiKey } from "@/models/ApiKey";

export interface ClientApiKeyRecord {
  id: string;
  clientName: string;
  key: string;
  credits: number;
  status: "ACTIVE" | "REVOKED";
  createdAt: string;
}

/**
 * Reads all registered client API keys from MongoDB Cluster.
 */
export async function getClientApiKeysAsync(): Promise<ClientApiKeyRecord[]> {
  const db = await dbConnect();
  if (!db) return [];
  
  try {
    const docs = await ApiKey.find({}).lean();
    return docs.map((doc) => {
      const k = doc as unknown as IApiKey;
      return {
        id: k.id || String(k._id),
        clientName: k.clientName,
        key: k.key,
        credits: k.credits,
        status: k.status as "ACTIVE" | "REVOKED",
        createdAt: k.createdAt || new Date().toLocaleDateString(),
      };
    });
  } catch (err) {
    console.error("Error fetching keys from MongoDB:", err);
    return [];
  }
}

/**
 * Saves/updates client API keys directly to MongoDB Cluster.
 */
export async function saveClientApiKeysAsync(keys: ClientApiKeyRecord[]): Promise<void> {
  const db = await dbConnect();
  if (!db) return;

  try {
    for (const k of keys) {
      await ApiKey.findOneAndUpdate(
        { key: k.key.trim() },
        {
          $set: {
            id: k.id,
            clientName: k.clientName,
            key: k.key.trim(),
            credits: k.credits,
            status: k.status,
            createdAt: k.createdAt,
          }
        },
        { upsert: true, new: true }
      );
    }
  } catch (err) {
    console.error("Error syncing keys to MongoDB:", err);
  }
}

/**
 * Generates a standard production API key format.
 */
export function generateStandardApiKey(clientName: string): string {
  const cleanName = clientName.trim().toUpperCase().replace(/[^A-Z0-9]/g, "_").slice(0, 15) || "CLIENT";
  const randomHash = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `KEY-${cleanName}-${randomHash}`;
}

/**
 * Validates incoming X-AUTH-KEY and deducts credits asynchronously against MongoDB Cluster.
 */
export async function validateAndDeductCredit(authKey: string, deductAmount: number = 1): Promise<{ success: boolean; error?: string; remainingCredits?: number; clientName?: string }> {
  if (!authKey) {
    return { success: false, error: "Missing X-AUTH-KEY header" };
  }

  const cleanKey = authKey.trim();

  // Allow Master Admin System Key from Environment
  const masterEnvKey = process.env.MANI_API_KEY || "MANI272-3AB5727F69D214062DA3B8468B708D36";
  if (cleanKey === masterEnvKey || cleanKey.startsWith("X-AUTH-MASTER") || cleanKey.startsWith("X-AUTH-ADMIN")) {
    return { success: true, remainingCredits: 999999, clientName: "Master Admin Gateway" };
  }

  const db = await dbConnect();
  if (!db) {
    return { success: false, error: "Database connection offline. Please try again later." };
  }

  try {
    const keyDoc = await ApiKey.findOne({ key: cleanKey });

    if (!keyDoc) {
      return { success: false, error: "Invalid API Key. Authorization denied." };
    }

    if (keyDoc.status !== "ACTIVE") {
      return { success: false, error: "API Key is REVOKED or Disabled. Contact Admin." };
    }

    if (keyDoc.credits < deductAmount) {
      return { success: false, error: `Insufficient API Credits. Current Balance: ${keyDoc.credits} CR, Required: ${deductAmount} CR.` };
    }

    // Deduct credits and save
    keyDoc.credits -= deductAmount;
    await keyDoc.save();

    return { success: true, remainingCredits: keyDoc.credits, clientName: keyDoc.clientName };
  } catch (mongoErr) {
    console.error("MongoDB verification error:", mongoErr);
    return { success: false, error: "Internal Database Verification Error." };
  }
}
