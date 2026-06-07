import { Router, type IRouter } from "express";
import { db, savedContentTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { SaveContentBody, DeleteSavedParams } from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/saved", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const saved = await db
    .select()
    .from(savedContentTable)
    .where(eq(savedContentTable.userId, req.userId!))
    .orderBy(desc(savedContentTable.createdAt));

  res.json(
    saved.map((s) => ({
      id: s.id,
      noteId: s.noteId,
      type: s.type,
      title: s.title,
      content: s.content,
      createdAt: s.createdAt.toISOString(),
    }))
  );
});

router.post("/saved", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = SaveContentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [saved] = await db
    .insert(savedContentTable)
    .values({
      userId: req.userId!,
      noteId: parsed.data.noteId,
      type: parsed.data.type,
      title: parsed.data.title,
      content: parsed.data.content,
    })
    .returning();

  res.status(201).json({
    id: saved.id,
    noteId: saved.noteId,
    type: saved.type,
    title: saved.title,
    content: saved.content,
    createdAt: saved.createdAt.toISOString(),
  });
});

router.delete("/saved/:savedId", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = DeleteSavedParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(savedContentTable)
    .where(and(eq(savedContentTable.id, params.data.savedId), eq(savedContentTable.userId, req.userId!)))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Saved content not found" });
    return;
  }

  res.json({ success: true });
});

export default router;
