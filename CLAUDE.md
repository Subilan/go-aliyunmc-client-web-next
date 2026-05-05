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

**Routing** (`app/routes.ts`): Two routes — `layout/app.tsx` wraps the index (`routes/home.tsx`), while `/lor` (`routes/lor.tsx`) is the standalone login/register page without the app layout.

**Auth flow** (`app/utils/auth.ts`): The `Auth` object caches the user in memory and deduplicates concurrent `getUser()` calls. The layout route's `clientLoader` runs `Auth.isLoggedIn()` and redirects to `/lor` (mapped as `/login` by the server) if not authenticated. The login page's `clientLoader` does the inverse — redirects to `/` if already logged in.

**Request layer**: `app/utils/requests.ts` provides `get`, `post`, `del` helpers wrapping `fetch` with `credentials: 'include'` (cookie-based auth). All return `{data, error}` tuples where exactly one is non-null. Individual API calls live in `app/utils/requests/` and are aggregated in `Req.ts` as a namespace object.

**State & context**: `UserContext` (`app/contexts/user.ts`) holds the current `User | null`. The layout route's `loaderData` populates it. The custom `useStateNamed` hook returns `{current, set}` instead of array destructuring — used pervasively for local component state.

**UI stack**: MUI v9 components + Tailwind CSS v4 for layout/spacing + ECharts (via `echarts-for-react`) for charts. Notifications use `react-hot-toast` wrapped by the `Toast` static helper in `root.tsx`, which renders MUI `SnackbarContent`. Forms use `react-hook-form` with a custom `StringInput` component wrapping MUI `Controller`.

**Types**: Domain types (`User`, `Instance`, `Task`, etc.) extend the `Model` base interface with GORM soft-delete fields (`ID`, `CreatedAt`, `UpdatedAt`, `DeletedAt`). The home page currently uses hardcoded mock data while the API integration is being built out.

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
