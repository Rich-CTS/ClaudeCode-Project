# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Initial setup (install deps, generate Prisma client, run migrations)
npm run setup

# Development server (Turbopack)
npm run dev

# Build for production
npm run build

# Run all tests
npm test

# Run a single test file
npx vitest run src/components/chat/__tests__/ChatInterface.test.tsx

# Lint
npm run lint

# Start production server
npm run start

# Reset database (destructive)
npm run db:reset

# After any change to prisma/schema.prisma
npx prisma generate && npx prisma migrate dev
```

The dev server requires `NODE_OPTIONS='--require ./node-compat.cjs'` (already included in all npm scripts). `node-compat.cjs` deletes `globalThis.localStorage` and `globalThis.sessionStorage` on the server to prevent SSR breakage in Node.js 25+, where these globals exist but throw when accessed.

## Testing

Tests use [Vitest](vitest.config.mts) with the following setup:

- **Default environment**: `jsdom` (suitable for React component tests)
- **Node environment**: add `// @vitest-environment node` at the top of a file for server-side code (e.g. `src/lib/__tests__/auth.test.ts`)
- **Path aliases**: `@/` aliases work in tests via `vite-tsconfig-paths`
- **Test locations**: `__tests__/` folders colocated with source, files named `*.test.ts` / `*.test.tsx`
- **Mocking**: use `vi.mock(...)` before any dynamic `await import(...)` when testing modules that depend on `server-only` or `next/headers`

## Environment

Copy `.env` and set `ANTHROPIC_API_KEY`. Without it, the app uses a `MockLanguageModel` that returns static hardcoded components. The mock provider is in `src/lib/provider.ts` and activates automatically when the key is absent. `JWT_SECRET` defaults to `"development-secret-key"` and should be overridden in production.

## Architecture

### AI-Powered Component Generation Flow

1. User sends a chat message → `POST /api/chat` (`src/app/api/chat/route.ts`)
2. The route reconstructs a `VirtualFileSystem` from serialized file data sent by the client, then calls `streamText` (Vercel AI SDK) with two tools: `str_replace_editor` and `file_manager`
3. Claude uses these tools to create/edit files in the virtual file system
4. On finish, if the user is authenticated and a `projectId` exists, the updated file system and full message history are persisted to SQLite via Prisma
5. The client receives streamed tool call events and updates its own copy of the virtual file system via `FileSystemContext`

### Virtual File System

`VirtualFileSystem` (`src/lib/file-system.ts`) is an in-memory tree structure — no files are ever written to disk. It serializes to/from `Record<string, FileNode>` for persistence in the database (`Project.data`) and for passing between client and server on each request.

The AI tools (`src/lib/tools/str-replace.ts`, `src/lib/tools/file-manager.ts`) wrap `VirtualFileSystem` methods and expose them to the LLM.

### Live Preview

`PreviewFrame` (`src/components/preview/PreviewFrame.tsx`) renders generated components in a sandboxed `<iframe>`. On each file system change:
1. `createImportMap` (`src/lib/transform/jsx-transformer.ts`) transforms each JSX/TSX file using `@babel/standalone` in the browser, creating blob URLs
2. Third-party npm packages are resolved automatically via `https://esm.sh/`
3. `@/` path aliases are supported in generated code
4. An HTML document with an `<importmap>` script tag is set as `iframe.srcdoc`
5. Syntax errors are caught per-file and displayed inline in the preview rather than crashing

### Authentication

Custom JWT auth (`src/lib/auth.ts`) using `jose`. Sessions are stored in an HTTP-only cookie named `auth-token`. `src/lib/auth.ts` is server-only. The middleware (`src/middleware.ts`) protects routes. Users can use the app anonymously — `Project.userId` is optional, but anonymous projects are not persisted after the session.

Server Actions in `src/actions/` handle auth (`signUp`, `signIn`, `signOut`, `getUser`) and project CRUD (`createProject`, `getProject`, `getProjects`). Anonymous users' in-progress work is tracked in `sessionStorage` via `src/lib/anon-work-tracker.ts` so it can be saved if they sign up mid-session.

### Database

Prisma with SQLite (`prisma/dev.db`). The Prisma client is generated to `src/generated/prisma` (not the default location) — always import from `@/generated/prisma`, never from `@prisma/client`. The full schema is in `prisma/schema.prisma`. Two models:
- `User`: email + bcrypt-hashed password
- `Project`: stores `messages` (full AI conversation as JSON) and `data` (serialized `VirtualFileSystem` as JSON) as string columns

### Tool Invocation Display

Tool calls are rendered in `src/components/chat/MessageList.tsx` inside the `tool-invocation` case of the message parts switch. A `toolLabel` is derived from `tool.toolName` and `tool.args` to show a human-readable description instead of the raw tool name:

- `str_replace_editor` + `create` → `Creating <filename>`
- `str_replace_editor` + `str_replace` or `insert` → `Editing <filename>`
- `str_replace_editor` + `view` → `Reading <filename>`
- `file_manager` + `delete` → `Deleting <filename>`
- `file_manager` + `rename` → `Renaming <filename>`

While a tool call is in-flight (`tool.state !== "result"`), a spinner is shown. Once complete, a green dot is shown. To add display support for a new tool, extend the `toolLabel` IIFE in the `tool-invocation` case.

### State Management

`FileSystemContext` (`src/lib/contexts/file-system-context.tsx`) holds the client-side `VirtualFileSystem` instance and exposes `handleToolCall` — called by `ChatInterface` as streaming tool calls arrive to keep the preview in sync in real time.

`ChatContext` (`src/lib/contexts/chat-context.tsx`) manages message history and the `useChat` hook from the Vercel AI SDK.

### Key Paths

| Path | Purpose |
|---|---|
| `src/app/api/chat/route.ts` | Streaming chat API endpoint |
| `src/app/[projectId]/page.tsx` | Project-specific route |
| `src/actions/` | Server Actions for auth and project CRUD |
| `src/lib/file-system.ts` | VirtualFileSystem implementation |
| `src/lib/transform/jsx-transformer.ts` | Browser-side JSX → blob URL transform + import map |
| `src/lib/provider.ts` | Real vs. mock LLM selection |
| `src/lib/prompts/generation.tsx` | System prompt sent to Claude |
| `src/lib/tools/` | AI tool definitions (str_replace_editor, file_manager) |
| `src/components/preview/PreviewFrame.tsx` | Sandboxed iframe preview |
| `src/lib/contexts/` | React contexts for file system and chat state |
| `src/lib/anon-work-tracker.ts` | sessionStorage tracker for anonymous user work |
| `prisma/schema.prisma` | Database schema |
