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
import { generateJson } from "../lib/gemini";

const router: IRouter = Router();

// ── Summary ────────────────────────────────────────────────────────────────

router.post("/notes/:noteId/summary", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = GenerateSummaryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [note] = await db
    .select()
    .from(notesTable)
    .where(and(eq(notesTable.id, params.data.noteId), eq(notesTable.userId, req.userId!)));

  if (!note) {
    res.status(404).json({ error: "Note not found" });
    return;
  }

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

  type SummaryResult = { summary: string; keyPoints: string[] };

  const result = await generateJson<SummaryResult>(prompt);

  res.json({
    noteId: note.id,
    summary: result.summary,
    keyPoints: result.keyPoints,
    generatedAt: new Date().toISOString(),
  });
});

// ── Exam Questions ─────────────────────────────────────────────────────────

router.post("/notes/:noteId/questions", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = GenerateQuestionsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [note] = await db
    .select()
    .from(notesTable)
    .where(and(eq(notesTable.id, params.data.noteId), eq(notesTable.userId, req.userId!)));

  if (!note) {
    res.status(404).json({ error: "Note not found" });
    return;
  }

  const prompt = `You are an expert exam question writer. Read the following student notes and generate important exam questions.

Notes title: ${note.title}
${note.subject ? `Subject: ${note.subject}` : ""}

Notes content:
${note.content}

Return a JSON array of exactly 5 exam questions using this shape:
[
  {
    "id": 1,
    "question": "The exam question text",
    "answer": "A thorough model answer",
    "difficulty": "easy" | "medium" | "hard"
  }
]

Rules:
- Questions must be directly derived from the actual notes content — do not invent topics not present
- Mix difficulty levels: include at least one easy, two medium, and one hard question
- Answers should be complete and educational, not just one word
- Questions should test understanding and application, not just memorisation
- Return only the JSON array, no surrounding text`;

  type Question = { id: number; question: string; answer: string; difficulty: string };

  const result = await generateJson<Question[]>(prompt);

  res.json(result.map((q, i) => ({ ...q, id: i + 1 })));
});

// ── Flashcards ─────────────────────────────────────────────────────────────

router.post("/notes/:noteId/flashcards", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = GenerateFlashcardsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [note] = await db
    .select()
    .from(notesTable)
    .where(and(eq(notesTable.id, params.data.noteId), eq(notesTable.userId, req.userId!)));

  if (!note) {
    res.status(404).json({ error: "Note not found" });
    return;
  }

  const prompt = `You are an expert flashcard creator. Read the following student notes and generate study flashcards.

Notes title: ${note.title}
${note.subject ? `Subject: ${note.subject}` : ""}

Notes content:
${note.content}

Return a JSON array of 6–10 flashcards using this shape:
[
  {
    "id": 1,
    "front": "A concise question or term (one sentence max)",
    "back": "The answer or definition — clear and complete",
    "topic": "The sub-topic this card belongs to (short label)"
  }
]

Rules:
- Each card must be based on actual content from the notes
- Front side should be a specific question or key term/concept
- Back side should be the answer or explanation — enough to understand without re-reading the notes
- Group related cards under the same topic label
- No duplicate concepts across cards
- Return only the JSON array, no surrounding text`;

  type Flashcard = { id: number; front: string; back: string; topic: string | null };

  const result = await generateJson<Flashcard[]>(prompt);

  res.json(result.map((c, i) => ({ ...c, id: i + 1 })));
});

// ── MCQ Quiz ───────────────────────────────────────────────────────────────

router.post("/notes/:noteId/quiz", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = GenerateQuizParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [note] = await db
    .select()
    .from(notesTable)
    .where(and(eq(notesTable.id, params.data.noteId), eq(notesTable.userId, req.userId!)));

  if (!note) {
    res.status(404).json({ error: "Note not found" });
    return;
  }

  const prompt = `You are an expert multiple-choice quiz creator. Read the following student notes and generate a quiz.

Notes title: ${note.title}
${note.subject ? `Subject: ${note.subject}` : ""}

Notes content:
${note.content}

Return a JSON array of exactly 5 multiple-choice questions using this shape:
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
- correctIndex is the 0-based index of the correct option in the options array
- Incorrect options (distractors) must be plausible — not obviously wrong
- explanation should clearly justify the correct answer
- Vary the position of the correct answer — do not always put it at index 0 or 1
- Return only the JSON array, no surrounding text`;

  type QuizQuestion = {
    id: number;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };

  const result = await generateJson<QuizQuestion[]>(prompt);

  res.json(result.map((q, i) => ({ ...q, id: i + 1 })));
});

export default router;
