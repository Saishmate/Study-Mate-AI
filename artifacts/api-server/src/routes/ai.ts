import { Router, type IRouter } from "express";
import { db, notesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  GenerateSummaryParams,
  GenerateQuestionsParams,
  GenerateFlashcardsParams,
  GenerateQuizParams,
} from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { generateJson, getGeminiErrorMessage, cacheKey, getCached, setCached } from "../lib/gemini";

const router: IRouter = Router();

async function fetchNote(noteId: number, userId: number) {
  const [note] = await db
    .select()
    .from(notesTable)
    .where(and(eq(notesTable.id, noteId), eq(notesTable.userId, userId)));
  return note ?? null;
}

// ── Summary ───────────────────────────────────────────────────────────────
router.post("/notes/:noteId/summary", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = GenerateSummaryParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const note = await fetchNote(params.data.noteId, req.userId!);
  if (!note) { res.status(404).json({ error: "Note not found" }); return; }

  const key = cacheKey(note.id, "summary", note.updatedAt);
  const cached = getCached<{ summary: string; keyPoints: string[] }>(key);
  if (cached) { res.json(cached); return; }

  const prompt = `Summarise these student notes as JSON only — no extra text.
Title: ${note.title}${note.subject ? `\nSubject: ${note.subject}` : ""}
Notes:
${note.content}

Return: {"summary":"3-5 sentence paragraph","keyPoints":["point 1","point 2",...]}
keyPoints: 5-8 items, each a single clear sentence drawn from the notes.`;

  try {
    type R = { summary: string; keyPoints: string[] };
    const result = await generateJson<R>(prompt);
    setCached(key, result);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Gemini summary error");
    const { status, message } = getGeminiErrorMessage(err);
    res.status(status).json({ error: message });
  }
});

// ── Exam Questions ────────────────────────────────────────────────────────
router.post("/notes/:noteId/questions", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = GenerateQuestionsParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const note = await fetchNote(params.data.noteId, req.userId!);
  if (!note) { res.status(404).json({ error: "Note not found" }); return; }

  const key = cacheKey(note.id, "questions", note.updatedAt);
  const cached = getCached(key);
  if (cached) { res.json(cached); return; }

  const prompt = `Generate 5 exam questions from these notes as JSON only.
Title: ${note.title}${note.subject ? `\nSubject: ${note.subject}` : ""}
Notes:
${note.content}

Return: [{"id":1,"question":"...","answer":"...","difficulty":"easy"|"medium"|"hard"}]
Mix: 1 easy, 2 medium, 2 hard. Answers must be thorough.`;

  try {
    type Q = { id: number; question: string; answer: string; difficulty: string };
    const result = (await generateJson<Q[]>(prompt)).map((q, i) => ({ ...q, id: i + 1 }));
    setCached(key, result);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Gemini questions error");
    const { status, message } = getGeminiErrorMessage(err);
    res.status(status).json({ error: message });
  }
});

// ── Flashcards ────────────────────────────────────────────────────────────
router.post("/notes/:noteId/flashcards", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = GenerateFlashcardsParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const note = await fetchNote(params.data.noteId, req.userId!);
  if (!note) { res.status(404).json({ error: "Note not found" }); return; }

  const key = cacheKey(note.id, "flashcards", note.updatedAt);
  const cached = getCached(key);
  if (cached) { res.json(cached); return; }

  const prompt = `Create 6-10 flashcards from these notes as JSON only.
Title: ${note.title}${note.subject ? `\nSubject: ${note.subject}` : ""}
Notes:
${note.content}

Return: [{"id":1,"front":"term or question","back":"definition or answer","topic":"sub-topic"}]
No duplicate concepts. front max 1 sentence.`;

  try {
    type C = { id: number; front: string; back: string; topic: string | null };
    const result = (await generateJson<C[]>(prompt)).map((c, i) => ({ ...c, id: i + 1 }));
    setCached(key, result);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Gemini flashcards error");
    const { status, message } = getGeminiErrorMessage(err);
    res.status(status).json({ error: message });
  }
});

// ── MCQ Quiz ──────────────────────────────────────────────────────────────
router.post("/notes/:noteId/quiz", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = GenerateQuizParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const note = await fetchNote(params.data.noteId, req.userId!);
  if (!note) { res.status(404).json({ error: "Note not found" }); return; }

  const key = cacheKey(note.id, "quiz", note.updatedAt);
  const cached = getCached(key);
  if (cached) { res.json(cached); return; }

  const prompt = `Generate 5 multiple-choice quiz questions from these notes as JSON only.
Title: ${note.title}${note.subject ? `\nSubject: ${note.subject}` : ""}
Notes:
${note.content}

Return: [{"id":1,"question":"...","options":["A","B","C","D"],"correctIndex":0,"explanation":"..."}]
Exactly 4 options each. correctIndex is 0-based. Vary correct answer position. Distractors must be plausible.`;

  try {
    type QQ = { id: number; question: string; options: string[]; correctIndex: number; explanation: string };
    const result = (await generateJson<QQ[]>(prompt)).map((q, i) => ({ ...q, id: i + 1 }));
    setCached(key, result);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Gemini quiz error");
    const { status, message } = getGeminiErrorMessage(err);
    res.status(status).json({ error: message });
  }
});

export default router;
