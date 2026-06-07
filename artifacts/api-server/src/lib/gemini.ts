import { GoogleGenAI } from "@google/genai";
import { logger } from "./logger";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  logger.warn("GEMINI_API_KEY is not set — AI routes will fail at runtime");
}

export const gemini = new GoogleGenAI({ apiKey: apiKey ?? "" });

// gemini-2.0-flash has 15 RPM on the free tier vs 5 RPM for gemini-2.5-flash
export const MODEL = "gemini-2.0-flash";

const RETRYABLE_CODES = new Set([429, 503]);
const MAX_RETRIES = 3;

function extractRetryDelay(err: unknown): number {
  try {
    const msg = (err as Error).message ?? "";
    // Gemini returns "Please retry in Xs" in the message
    const match = msg.match(/retry in (\d+(?:\.\d+)?)/i);
    if (match) return Math.min(parseFloat(match[1]) * 1000, 30000);
  } catch {
    // ignore
  }
  return 5000; // default 5s
}

function isRetryableError(err: unknown): boolean {
  try {
    const msg = JSON.stringify(err);
    return (
      msg.includes('"code":429') ||
      msg.includes('"code":503') ||
      msg.includes("RESOURCE_EXHAUSTED") ||
      msg.includes("UNAVAILABLE")
    );
  } catch {
    return false;
  }
}

export async function generateJson<T>(prompt: string): Promise<T> {
  let lastErr: unknown;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delay = extractRetryDelay(lastErr) * attempt;
      logger.info({ attempt, delay }, "Retrying Gemini request after delay");
      await new Promise((r) => setTimeout(r, delay));
    }

    try {
      const response = await gemini.models.generateContent({
        model: MODEL,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          maxOutputTokens: 8192,
        },
      });

      const text = response.text ?? "";
      return JSON.parse(text) as T;
    } catch (err) {
      lastErr = err;
      if (!isRetryableError(err) || attempt === MAX_RETRIES - 1) {
        throw err;
      }
      logger.warn({ err, attempt }, "Gemini retryable error — will retry");
    }
  }

  throw lastErr;
}

export function getGeminiErrorMessage(err: unknown): { status: number; message: string } {
  try {
    const msg = (err as Error).message ?? "";

    if (msg.includes("RESOURCE_EXHAUSTED") || msg.includes("429")) {
      const retryMatch = msg.match(/retry in (\d+(?:\.\d+)?)s/i);
      const waitSecs = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : 60;
      return {
        status: 429,
        message: `The AI is temporarily rate-limited. Please wait ${waitSecs} seconds and try again.`,
      };
    }

    if (msg.includes("UNAVAILABLE") || msg.includes("503")) {
      return {
        status: 503,
        message: "The AI model is temporarily unavailable due to high demand. Please try again in a moment.",
      };
    }
  } catch {
    // ignore
  }

  return { status: 500, message: "AI generation failed. Please try again." };
}
