import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { notesTable } from "./notes";

export const savedContentTable = pgTable("saved_content", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  noteId: integer("note_id").notNull().references(() => notesTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // "summary" | "questions" | "flashcards" | "quiz"
  title: text("title").notNull(),
  content: text("content").notNull(), // JSON stringified content
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSavedContentSchema = createInsertSchema(savedContentTable).omit({ id: true, createdAt: true });
export type InsertSavedContent = z.infer<typeof insertSavedContentSchema>;
export type SavedContent = typeof savedContentTable.$inferSelect;
