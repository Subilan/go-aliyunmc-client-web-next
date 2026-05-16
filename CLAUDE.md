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

**Routing** (`app/routes.ts`): `layout/app.tsx` wraps the main routes (index → `home.tsx`, `/profile`, `/all`, and a nested `layout/inner-app.tsx` for `/info/*`, `/game/*`, and `/updates` with breadcrumb nav). `/lor` (`routes/lor.tsx`) is the standalone login/register page outside the app layout.

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

## Loading & empty state conventions

**Data fetching**: Prefer `useEffect` + `useState` over route loaders for page-level data. Route loaders block child rendering and create request waterfalls. Only use loaders at the layout level for auth gating (`app/layout/app.tsx`).

**MetricCard**: Never set `loading: true` on individual `MetricItem` entries — it renders a `CircularProgress` spinner per metric. Instead, pass `value: null` when data isn't ready; `MetricCard` renders `—` for null values, giving a uniform empty-state look.

**Table loading**: Use skeleton rows inside the table, not `LoadingEmptyState` (spinner) outside it. Pattern:
```tsx
<TableBody>
  {loading
    ? Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={`skel-${i}`}>
          <TableCell colSpan={columns.length}>
            <div className="h-4 bg-neutral-100 rounded animate-pulse" />
          </TableCell>
        </TableRow>
      ))
    : rows.map(...)}
</TableBody>
```
`PaginatedTable` does this natively via its `loading` prop.

**Card refresh**: Card components that support refresh manage their own `[refreshing, setRefreshing]` state internally. The parent passes an `onRefreshData` callback to receive results, and optionally a `refreshKey` counter prop for imperative external triggers (e.g. from SSE events).

## Backend References

You can read directly from `~/code/go-aliyunmc-v2` when you're unsure about anything relevant to the actual backend implementation. As a matter of fact, reading backend helps you deliver more accurate, logical and correct frontend design.