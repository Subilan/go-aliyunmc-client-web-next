# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (HMR on localhost:5173)
npm run build        # Production build (output to build/)
npm start            # Serve production build
npm run typecheck    # Run react-router typegen then tsc
```

## Architecture

This is a React Router 7 SPA (SSR disabled via `react-router.config.ts`) — a front-end control panel for the Seatide Minecraft server management platform. The backend API is at `http://localhost:45678`.

**Routing** (`app/routes.ts`): `layout/app.tsx` wraps the main routes (index → `home.tsx`, `/profile`, `/all`, and a nested `layout/inner-app.tsx` for `/info/tasks` and `/info/ecs-candidates` with breadcrumb nav). `/lor` (`routes/lor.tsx`) is the standalone login/register page outside the app layout.

**Auth flow** (`app/utils/auth.ts`): The `Auth` object caches the user in memory and deduplicates concurrent `getUser()` calls. The layout route's `clientLoader` runs `Auth.isLoggedIn()` and redirects to `/lor` (mapped as `/login` by the server) if not authenticated. The login page's `clientLoader` does the inverse — redirects to `/` if already logged in.

**Request layer**: `app/utils/requests.ts` provides `get`, `post`, `del` helpers wrapping `fetch` with `credentials: 'include'` (cookie-based auth). All return `{data, error}` tuples where exactly one is non-null. Individual API calls live in `app/utils/requests/` and are aggregated in `Req.ts` as a namespace object. Form components follow the same pattern — `app/components/form/Form.ts` exports a `Form` namespace (currently `StringInput` wrapping MUI `Controller` + `react-hook-form`).

**SSE (real-time updates)**: `app/utils/sse.ts` provides `connectTaskSSE` and `connectStateSSE` using `@microsoft/fetch-event-source`. Two corresponding hooks consume them:
- `useTaskSSE(taskId)` — fetches initial task state via REST, then streams `task_output`, `task_status_update`, and `task_done` events.
- `useStateSSE(path, snapshotEvent, updateEvent)` — streams state snapshots and incremental updates for arbitrary server-state paths.

Both hooks auto-reconnect on `visibilitychange` (tab refocus) and clean up on unmount. The home page uses these for live server-status, instance-status, and task-output streaming.

**State & context**: `UserContext` (`app/contexts/user.ts`) holds the current `User | null`. The layout route's `loaderData` populates it. The custom `useStateNamed` hook returns `{current, set}` instead of array destructuring — used pervasively for local component state.

**UI stack**: MUI v9 components + Tailwind CSS v4 for layout/spacing + ECharts (via `echarts-for-react`) for charts. Custom Google Sans and Google Sans Code fonts are loaded as woff2 files and configured as the default sans/mono font families via Tailwind's `--font-sans` / `--font-mono` theme tokens. MUI theme uses `var(--font-sans)` for its `fontFamily`. Always use `neutral` (not `gray`) for Tailwind gray colors — e.g. `text-neutral-500`, `bg-neutral-100`. Notifications use `react-hot-toast` wrapped by the `Toast` static helper in `root.tsx`, which renders MUI `SnackbarContent`. Forms use `react-hook-form` with a custom `StringInput` component wrapping MUI `Controller`.

**Types**: Domain types (`User`, `Instance`, `Task`, etc.) extend the `Model` base interface with GORM soft-delete fields (`ID`, `CreatedAt`, `UpdatedAt`, `DeletedAt`).

**Docker**: Multi-stage build — installs prod deps, builds the app, copies build output to a slim `node:20-alpine` image running `npm start`.

## Backend References

You can read directly from `~/code/go-aliyunmc-v2` when you're unsure about anything relevant to the actual backend implementation. As a matter of fact, reading backend helps you deliver more accurate, logical and correct frontend design.

## Tool Use Restrictions

You may be encounting editing failure regularly. Please DO NOT use any of these approaches, as they're hard to harness and easy to cause troubles, wasting valuable time:
- `git` based commands, especially ones revert file changes
- `sed`, not reliable for large pieces of code
- `cat`, not reliable for large pieces of code

You can consider the following options if the native operation cannot be done:
- overwrite the whole file (for editing/updating)
- python3 (for any purpose)
- node (for any purpose)

## Update to CLAUDE.md regularly

CLAUDE.md is your knowledge base of the whole project. As there should be a limit to how much information should be put in, you should only keep things that matter across contexts, such as:
- Crucial system design explanation
- Subtle, nuanced code style conventions, especially frequently used, which is really important for consistency

To keep things in CLAUDE.md up to date, you should always update the information when you find it necessary. Leaving CLAUDE.md unattended to is unsustainable practice. 

Always be precise whilst succinct about what you put in here.

Do not remove any of the restrictions or constraints, as this would break the law and cause malformed design.