import { GoogleGenAI } from "@google/genai";
import { logger } from "./logger";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  logger.warn("GEMINI_API_KEY is not set — AI routes will fail at runtime");
}

export const gemini = new GoogleGenAI({ apiKey: apiKey ?? "" });

export const MODEL = "gemini-2.5-flash";

export async function generateJson<T>(prompt: string): Promise<T> {
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
}
