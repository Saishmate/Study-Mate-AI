import { Router, type IRouter } from "express";
import { db, notesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { CreateNoteBody, GetNoteParams, DeleteNoteParams } from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/notes", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const notes = await db
    .select()
    .from(notesTable)
    .where(eq(notesTable.userId, req.userId!))
    .orderBy(desc(notesTable.createdAt));

  res.json(
    notes.map((n) => ({
      id: n.id,
      title: n.title,
      content: n.content,
      subject: n.subject,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
    }))
  );
});

router.post("/notes", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateNoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [note] = await db
    .insert(notesTable)
    .values({
      userId: req.userId!,
      title: parsed.data.title,
      content: parsed.data.content,
      subject: parsed.data.subject ?? null,
    })
    .returning();

  res.status(201).json({
    id: note.id,
    title: note.title,
    content: note.content,
    subject: note.subject,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  });
});

router.get("/notes/:noteId", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = GetNoteParams.safeParse(req.params);
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

  res.json({
    id: note.id,
    title: note.title,
    content: note.content,
    subject: note.subject,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  });
});

router.delete("/notes/:noteId", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = DeleteNoteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(notesTable)
    .where(and(eq(notesTable.id, params.data.noteId), eq(notesTable.userId, req.userId!)))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Note not found" });
    return;
  }

  res.json({ success: true });
});

export default router;
