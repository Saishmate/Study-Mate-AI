import { GoogleGenAI } from "@google/genai";
import { logger } from "./logger";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  logger.warn("GEMINI_API_KEY is not set — AI routes will fail at runtime");
}

export const gemini = new GoogleGenAI({ apiKey: apiKey ?? "" });

export const MODEL = "gemini-2.5-flash";

// ── In-memory result cache ────────────────────────────────────────────────
// Key: "<noteId>:<type>:<note.updatedAt.toISOString()>"
// Auto-invalidates whenever the note is edited (updatedAt changes).
const cache = new Map<string, unknown>();
const MAX_CACHE_ENTRIES = 500;

export function cacheKey(noteId: number, type: string, updatedAt: Date): string {
  return `${noteId}:${type}:${updatedAt.toISOString()}`;
}

export function getCached<T>(key: string): T | undefined {
  return cache.get(key) as T | undefined;
}

export function setCached(key: string, value: unknown): void {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    // Evict the oldest entry
    const first = cache.keys().next().value;
    if (first !== undefined) cache.delete(first);
  }
  cache.set(key, value);
}

// ── Retry helpers ─────────────────────────────────────────────────────────
const MAX_RETRIES = 2;

function isRetryable(err: unknown): boolean {
  const msg = JSON.stringify(err);
  return msg.includes("UNAVAILABLE") || msg.includes('"code":503');
}

function retryDelay(err: unknown): number {
  try {
    const match = JSON.stringify(err).match(/"retryDelay":"(\d+)s"/);
    if (match) return Math.min(parseInt(match[1]) * 1000, 15000);
  } catch { /* ignore */ }
  return 3000;
}

export function getGeminiErrorMessage(err: unknown): { status: number; message: string } {
  const msg = JSON.stringify(err);
  if (msg.includes("RESOURCE_EXHAUSTED") || msg.includes('"code":429')) {
    const secs = msg.match(/"retryDelay":"(\d+)s"/)?.[1];
    return {
      status: 429,
      message: `AI rate limit reached. Please wait ${secs ?? 60} seconds and try again.`,
    };
  }
  if (msg.includes("UNAVAILABLE") || msg.includes('"code":503')) {
    return { status: 503, message: "AI model is temporarily busy. Please try again in a moment." };
  }
  return { status: 500, message: "AI generation failed. Please try again." };
}

// ── Core generator ────────────────────────────────────────────────────────
export async function generateJson<T>(prompt: string): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, retryDelay(lastErr) * attempt));
      logger.info({ attempt }, "Retrying Gemini request");
    }
    try {
      const response = await gemini.models.generateContent({
        model: MODEL,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" },
      });
      return JSON.parse(response.text ?? "{}") as T;
    } catch (err) {
      lastErr = err;
      if (!isRetryable(err) || attempt === MAX_RETRIES) throw err;
      logger.warn({ attempt }, "Gemini 503 — retrying");
    }
  }
  throw lastErr;
}
