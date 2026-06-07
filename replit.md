# StudyMate AI

A student productivity web app that transforms notes into AI-powered summaries, flashcards, exam questions, and MCQ quizzes.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/studymate-ai run dev` — run the frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `SESSION_SECRET` — JWT signing secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, wouter, TanStack Query, shadcn/ui, framer-motion
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Auth: JWT (bcryptjs + jsonwebtoken), stored in localStorage
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/db/src/schema/` — DB schema (users, notes, saved_content)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/middlewares/auth.ts` — JWT auth middleware
- `artifacts/studymate-ai/src/` — React frontend

## Architecture decisions

- JWT auth stored in localStorage; token sent as `Authorization: Bearer` header on every API request
- All AI generation endpoints return dummy data — each is a single POST to `/notes/:noteId/<type>` ready to be swapped for Gemini API calls
- Saved content stored as JSON strings in a `content` text column — flexible enough to store any AI output shape
- Auth middleware attached per-route (not globally) so the health endpoint stays public
- Orval codegen strictly follows entity-shaped schema names (e.g. `NoteInput`) to avoid TS2308 collisions

## Product

- **Home** — Landing page with feature highlights and CTA
- **Login / Signup** — JWT-based auth with form validation
- **Dashboard** — Stats overview (notes, saved items, generations) + recent notes
- **Notes** — Create, list, view, and delete study notes (text content)
- **AI Generation** — Per-note: Summary + key points, Exam questions, Flashcards (flip animation), MCQ Quiz (with score tracking)
- **Saved** — All saved AI-generated content across all notes

## Gotchas

- After any OpenAPI spec change, run codegen before touching routes or frontend hooks
- AI routes return dummy data — to connect Gemini, replace the response bodies in `artifacts/api-server/src/routes/ai.ts`
- `pnpm --filter @workspace/db run push-force` if schema push fails with column conflicts

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
