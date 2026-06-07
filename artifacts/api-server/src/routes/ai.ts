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
import { generateJson, getGeminiErrorMessage } from "../lib/gemini";

const router: IRouter = Router();

async function fetchNote(noteId: number, userId: number) {
  const [note] = await db
    .select()
    .from(notesTable)
    .where(and(eq(notesTable.id, noteId), eq(notesTable.userId, userId)));
  return note ?? null;
}

// ── Summary ────────────────────────────────────────────────────────────────

router.post("/notes/:noteId/summary", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = GenerateSummaryParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const note = await fetchNote(params.data.noteId, req.userId!);
  if (!note) { res.status(404).json({ error: "Note not found" }); return; }

  const prompt = `You are an expert study assistant. Read the following student notes and produce a study summary.

Notes title: ${note.title}
${note.subject ? `Subject: ${note.subject}` : ""}

Notes content:
${note.content}

Return a JSON object with exactly this shape:
{
  "summary": "A concise 3–5 sentence paragraph summarising the key ideas in the notes",
  "keyPoints": ["point 1", "point 2", "point 3", "point 4", "point 5"]
}

Rules:
- summary should be in plain, clear language a student can understand
- keyPoints must be an array of 5–8 distinct, actionable bullet points derived from the actual notes content
- Do not add anything outside the JSON object`;

  try {
    type R = { summary: string; keyPoints: string[] };
    const result = await generateJson<R>(prompt);
    res.json({ noteId: note.id, summary: result.summary, keyPoints: result.keyPoints, generatedAt: new Date().toISOString() });
  } catch (err) {
    req.log.error({ err }, "Gemini summary error");
    const { status, message } = getGeminiErrorMessage(err);
    res.status(status).json({ error: message });
  }
});

// ── Exam Questions ─────────────────────────────────────────────────────────

router.post("/notes/:noteId/questions", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = GenerateQuestionsParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const note = await fetchNote(params.data.noteId, req.userId!);
  if (!note) { res.status(404).json({ error: "Note not found" }); return; }

  const prompt = `You are an expert exam question writer. Read the following student notes and generate important exam questions.

Notes title: ${note.title}
${note.subject ? `Subject: ${note.subject}` : ""}

Notes content:
${note.content}

Return a JSON array of exactly 5 exam questions:
[
  {
    "id": 1,
    "question": "The exam question text",
    "answer": "A thorough model answer",
    "difficulty": "easy" | "medium" | "hard"
  }
]

Rules:
- Questions must be directly derived from the actual notes content
- Mix difficulty: at least one easy, two medium, one hard
- Answers should be complete and educational
- Return only the JSON array, no surrounding text`;

  try {
    type Q = { id: number; question: string; answer: string; difficulty: string };
    const result = await generateJson<Q[]>(prompt);
    res.json(result.map((q, i) => ({ ...q, id: i + 1 })));
  } catch (err) {
    req.log.error({ err }, "Gemini questions error");
    const { status, message } = getGeminiErrorMessage(err);
    res.status(status).json({ error: message });
  }
});

// ── Flashcards ─────────────────────────────────────────────────────────────

router.post("/notes/:noteId/flashcards", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = GenerateFlashcardsParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const note = await fetchNote(params.data.noteId, req.userId!);
  if (!note) { res.status(404).json({ error: "Note not found" }); return; }

  const prompt = `You are an expert flashcard creator. Read the following student notes and generate study flashcards.

Notes title: ${note.title}
${note.subject ? `Subject: ${note.subject}` : ""}

Notes content:
${note.content}

Return a JSON array of 6–10 flashcards:
[
  {
    "id": 1,
    "front": "A concise question or term (one sentence max)",
    "back": "The answer or definition — clear and complete",
    "topic": "Sub-topic label"
  }
]

Rules:
- Each card must be based on actual content from the notes
- No duplicate concepts across cards
- Return only the JSON array, no surrounding text`;

  try {
    type C = { id: number; front: string; back: string; topic: string | null };
    const result = await generateJson<C[]>(prompt);
    res.json(result.map((c, i) => ({ ...c, id: i + 1 })));
  } catch (err) {
    req.log.error({ err }, "Gemini flashcards error");
    const { status, message } = getGeminiErrorMessage(err);
    res.status(status).json({ error: message });
  }
});

// ── MCQ Quiz ───────────────────────────────────────────────────────────────

router.post("/notes/:noteId/quiz", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = GenerateQuizParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const note = await fetchNote(params.data.noteId, req.userId!);
  if (!note) { res.status(404).json({ error: "Note not found" }); return; }

  const prompt = `You are an expert multiple-choice quiz creator. Read the following student notes and generate a quiz.

Notes title: ${note.title}
${note.subject ? `Subject: ${note.subject}` : ""}

Notes content:
${note.content}

Return a JSON array of exactly 5 multiple-choice questions:
[
  {
    "id": 1,
    "question": "The quiz question",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Why this answer is correct and the others are not"
  }
]

Rules:
- All questions must be grounded in the actual notes content
- Each question must have exactly 4 options
- correctIndex is 0-based index of the correct option
- Distractors must be plausible — not obviously wrong
- Vary the position of the correct answer
- Return only the JSON array, no surrounding text`;

  try {
    type QQ = { id: number; question: string; options: string[]; correctIndex: number; explanation: string };
    const result = await generateJson<QQ[]>(prompt);
    res.json(result.map((q, i) => ({ ...q, id: i + 1 })));
  } catch (err) {
    req.log.error({ err }, "Gemini quiz error");
    const { status, message } = getGeminiErrorMessage(err);
    res.status(status).json({ error: message });
  }
});

export default router;
