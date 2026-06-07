import { Router, type IRouter } from "express";
import { db, notesTable, savedContentTable } from "@workspace/db";
import { eq, count, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/dashboard/stats", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.userId!;

  const [notesCount] = await db
    .select({ count: count() })
    .from(notesTable)
    .where(eq(notesTable.userId, userId));

  const [savedCount] = await db
    .select({ count: count() })
    .from(savedContentTable)
    .where(eq(savedContentTable.userId, userId));

  const savedByType = await db
    .select({ type: savedContentTable.type, count: count() })
    .from(savedContentTable)
    .where(eq(savedContentTable.userId, userId))
    .groupBy(savedContentTable.type);

  const getTypeCount = (type: string) =>
    savedByType.find((r) => r.type === type)?.count ?? 0;

  const recentNotes = await db
    .select()
    .from(notesTable)
    .where(eq(notesTable.userId, userId))
    .orderBy(desc(notesTable.createdAt))
    .limit(5);

  res.json({
    totalNotes: notesCount.count,
    totalSaved: savedCount.count,
    summariesGenerated: getTypeCount("summary"),
    flashcardsGenerated: getTypeCount("flashcards"),
    quizzesGenerated: getTypeCount("quiz"),
    recentNotes: recentNotes.map((n) => ({
      id: n.id,
      title: n.title,
      content: n.content,
      subject: n.subject,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
    })),
  });
});

export default router;
