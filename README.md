# DMS — Document Management System

A document management front end: sign in with a mobile number, upload documents with
metadata, and search them back with filters. Built as a client-only SPA that talks to the
Allsoft document management API.

---

## Contents

- [At a glance](#at-a-glance)
- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Environment files](#environment-files)
- [Running the app](#running-the-app)
- [Available scripts](#available-scripts)
- [Project structure](#project-structure)
- [How it works](#how-it-works)
- [Features](#features)
- [API reference](#api-reference)
- [File storage and CORS](#file-storage-and-cors)
- [Deployment](#deployment)
- [Platform notes](#platform-notes)
- [Project status](#project-status)
- [Conventions](#conventions)
- [Known limitations](#known-limitations)
- [Troubleshooting](#troubleshooting)

---

## At a glance

| | |
| --- | --- |
| Type | Client-only SPA (no server of its own) |
| Runtime | Browser only — nothing is rendered server-side |
| Authentication | Mobile number + OTP, token held in `sessionStorage` |
| Session length | 1 hour, then an automatic sign-out |
| Pages | `/login`, `/register`, `/dashboard` |
| API base | `VITE_API_BASE_URL` — the only environment variable |
| Results per page | 10, server-side pagination |
| Offline | Last search results kept in IndexedDB (12 h) |

---

## Tech stack

| Concern | Choice |
| --- | --- |
| Build tool | Vite 8 |
| UI | React 19, React Router 7 (data router) |
| Language | TypeScript 6 (strict) |
| Styling | Tailwind CSS 4 (via `@tailwindcss/vite`, CSS-first config) |
| Server state | TanStack Query 5 |
| Forms | React Hook Form + Zod |
| HTTP | Axios |
| Icons | Lucide React |
| ZIP archives | fflate |
| Offline cache | IndexedDB via idb |
| Fonts | Nunito (body) / Montserrat (headings), Google Fonts |

---

## Prerequisites

- **Node.js 20 or newer** — developed against 24.x. Older versions may not satisfy Vite 8.
- **npm 10 or newer** (ships with Node 20+)
- Access to the document management API, or a colleague's `.env.local`

```bash
node --version
npm --version
```

---

## Setup

```bash
git clone <repository-url>
cd dms-frontend
npm install
```

Then create `.env.local` in the project root:

```bash
# macOS / Linux
printf 'VITE_API_BASE_URL=https://apis.allsoft.co/api/documentManagement/\n' > .env.local

# Windows PowerShell
'VITE_API_BASE_URL=https://apis.allsoft.co/api/documentManagement/' | Set-Content .env.local
```

**This step is not optional.** Without it, `VITE_API_BASE_URL` is undefined, requests
have no base to go to, and every screen fails. See
[Environment files](#environment-files) for the details.

---

## Environment files

### The variables

This project uses exactly **one** environment variable.

| Variable | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `VITE_API_BASE_URL` | string | **Yes** | none | Base URL of the document management API, **with a trailing slash**. |

```bash
# Correct
VITE_API_BASE_URL=https://apis.allsoft.co/api/documentManagement/

# Wrong — Axios joins paths without inserting a separator
VITE_API_BASE_URL=https://apis.allsoft.co/api/documentManagement
```

If you add variables later:

- **Only variables prefixed `VITE_` are readable by the app.** Everything else is
  server-side only and invisible to the browser.
- Anything in a `VITE_` variable ends up **in the shipped JavaScript bundle**. Never put
  a secret, API key or password in one — a browser user can read it.
- Vite **replaces variables at build time**; there is no runtime lookup. Changing one
  requires a restart in development and a **redeploy** in production.

### Which files Vite reads

Vite loads env files according to the *mode*, which this project sets implicitly:

| File | Loaded when | Committed? | Purpose |
| --- | --- | --- | --- |
| `.env` | always | optional | Shared values for every mode |
| `.env.local` | always | **no** | Your personal overrides. The file you create |
| `.env.development` | `npm run dev` (mode `development`) | no | Shared dev defaults |
| `.env.production` | `npm run build` / `preview` (mode `production`) | no | Shared production defaults |
| `.env.development.local` | `development` only | **no** | Personal dev overrides |
| `.env.production.local` | `production` only | **no** | Personal production overrides |
| `.env.example` | never loaded — a template | should be | Documentation for new developers |

### Precedence

When the same variable appears more than once, the **most specific wins**:

```
.env.development.local   ← highest
.env.development
.env.local
.env                     ← lowest
```

Practical consequence: an existing `.env.local` **overrides** the committed
`.env.development`. If a teammate's value seems to be ignored, that file is the reason —
check it first.

### This repository's situation

`.gitignore` ignores `.env.*`, which **also ignores `.env.example`** (`.gitignore:18`).
So a fresh clone contains no env files, which is why
[Setup](#setup) creates `.env.local` by hand rather than copying a template.

To fix this properly: delete the `.env.example` line from `.gitignore`, commit that
file, and change setup back to `cp .env.example .env.local`. **Keep `.env.local`
ignored** — that one must never be committed.

### On Vercel

Do not upload env files. Set the variable in the project's **Settings → Environment
Variables**, for both Production and Preview. Values are inlined during the build, so a
change only takes effect on the next deployment.

---

## Running the app

```bash
npm run dev
```

The dev server binds to your network interface, so the printed URL is reachable from a
phone on the same network — useful for testing the responsive layout and the selection
controls on a real touch device.

Source changes are picked up immediately. **Env file changes require a restart.**

---

## Available scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Type-check, then produce a production build in `dist/` |
| `npm run preview` | Serve the production build locally to verify it |
| `npm run lint` | Run ESLint across the project |

`npm run build` runs `tsc -b` first, so a type error fails the build rather than
shipping.

---

## Project structure

```
src/
├── app/                     Routing, providers, route guards
│   ├── router.tsx           Route table
│   ├── route-elements.tsx   Guards + session expiry hook
│   └── providers.tsx        React Query client
├── components/
│   └── common/              Shared components (Toast)
├── pages/
│   ├── login/               Mobile + OTP sign-in
│   │   ├── api/             auth.api.ts
│   │   ├── components/      LoginForm, OtpForm
│   │   ├── hooks/           useAuth
│   │   ├── schemas/         Zod schemas
│   │   └── types/
│   ├── dashboard/           Upload + search
│   │   ├── api/             document-search, document-upload, document-metadata
│   │   ├── components/      Cards, filters, sidebar, dialogs
│   │   ├── constants/       Shared UI option lists
│   │   ├── hooks/           useDocumentSearch, useDocumentMetadata, useIsOffline
│   │   ├── types/
│   │   └── utils/           Dates, files, display helpers
│   └── user_create/         Registration form (local only, no API)
└── services/                Cross-cutting concerns
    ├── api-client.ts        Axios instance, request interceptor, error helpers
    ├── auth-session.ts      sessionStorage session, 1-hour expiry
    └── search-cache.ts      IndexedDB cache for offline results
```

---

## How it works

1. **Sign-in.** `POST /validateOTP` returns an opaque token. It is written to
   `sessionStorage` together with a one-hour deadline.
2. **Every request.** `services/api-client.ts` attaches the token as a `token` header
   and serialises outgoing `FormData` correctly (without it, Axios would stringify the
   file as JSON and lose it).
3. **Session expiry.** `useSessionExpiry` counts down to the stored deadline and ends
   the session when it passes. The guards read the session through
   `useSyncExternalStore`, so ending it redirects to `/login` immediately. `getAuthToken`
   also refuses to return an expired token, so a stale tab cannot keep making requests.
4. **Search.** `useDocumentSearch` is network-first and cache-second. Success is written
   to IndexedDB; a network failure falls back to the copy stored for that exact search
   and marks the result as cached.
5. **Uploads** go to `/saveDocumentEntry` as multipart form data with a raised timeout.

---

## Features

**Authentication** — mobile number plus OTP. The session token lives in `sessionStorage`
and expires **one hour** after sign-in; the app signs itself out and explains why.

**Upload** — drag-and-drop or file picker, with category, sub-category, document date,
tags and remarks. Large uploads get a 120-second timeout instead of the default 15.

**Search** — filter by category, sub-category, tags, date range and keyword, with
server-side pagination at 10 per page. Tags render as separate chips; a document with
several tags shows all of them.

**Multi-select download** — tick any number of documents and download them together as
one ZIP. Duplicate filenames are disambiguated (`report.pdf`, `report (2).pdf`) instead
of overwriting each other. If some files fail, the archive still downloads and the
missing ones are named.

**Offline results** — a successful search is stored in IndexedDB. When the network is
unreachable, the cached copy for that same search is shown, labelled with its age. Only
genuine network failures fall back; a 401 or 500 is reported as itself and never
disguised with stale rows.

**Typeface** — Nunito for body and UI text, Montserrat for headings, configured in
`src/index.css`.

---

## API reference

All calls go through the Axios instance in `src/services/api-client.ts`.

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/generateOTP` | POST | Request an OTP for a mobile number |
| `/validateOTP` | POST | Verify the OTP, receive the session token |
| `/searchDocumentEntry` | POST | Search documents |
| `/documentTags` | POST | Autocomplete source for tags |
| `/saveDocumentEntry` | POST | Upload a document with its metadata |

### Search request body

```jsonc
{
  "major_head": "Professional",        // category
  "minor_head": "IT",                  // sub-category / department
  "from_date": "01-02-2024",           // dd-MM-yyyy, empty when unset
  "to_date": "31-12-2024",             // dd-MM-yyyy
  "tags": [{ "tag_name": "invoice" }], // empty -> two blank placeholders
  "uploaded_by": "",
  "start": 0,                          // page * 10
  "length": 10,
  "filterId": "",
  "search": { "value": "invoice" }     // keyword
}
```

Dates go **out** as `dd-MM-yyyy` and come **back** as ISO. The app converts both ways.

### Search response row

```jsonc
{
  "document_id": 25,
  "major_head": "Professional",
  "minor_head": "IT",
  "file_url": "https://…amazonaws.com/…?X-Amz-Signature=…",
  "document_date": "2024-02-01T00:00:00",
  "document_remarks": "test",
  "upload_time": "2024-02-26T16:14:33",
  "uploaded_by": "Sagar",
  "total_count": 344
}
```

### Two behaviours that shape error handling

- The API answers **HTTP 200 even when it rejects a request**, with `status: false` and a
  message. That is treated as a failure.
- Stored links are **pre-signed S3 URLs that expire after 30 minutes**. Expired links
  return `403`; the app says so rather than reporting a generic failure.

---

## File storage and CORS

Documents live in an S3 bucket that sends **no CORS headers** for this app's origin, so a
browser cannot `fetch` those files directly. That breaks download, ZIP download and the
offline cache alike.

Both environments solve it by relaying through `/storage`, making every request
same-origin:

- **Development** — the proxy in `vite.config.ts`
- **Production** — the `/storage/:path*` rewrite in `vercel.json`

The rewrite **must** be listed before the `/(.*)` → `/index.html` catch-all, or every
file request returns the app shell instead of a file.

The alternative is bucket-side CORS (`docs/s3-cors.json`), but that means listing every
origin including the preview deployments Vercel generates, so the relay is more practical.

To verify the relay after deploying, open a stored URL through it directly:

```
https://your-domain.example/storage/fileUploads/2024-02-26/….jpg?X-Amz-Signature=…
```

If that returns the file, the path is correct.

---

## Deployment

Built for Vercel: static output in `dist/`, rewrites declared in `vercel.json`.

1. Push the repository and import it into Vercel.
2. Set `VITE_API_BASE_URL` in **Settings → Environment Variables**, for Production and
   Preview.
3. Deploy.

`vercel.json` is easy to lose — confirm it is committed, or the download relay silently
disappears on the next clean deploy.

---

## Platform notes

No `browserslist` or explicit build target is configured, so Vite's default modern
target applies. The app relies on APIs that rule out older browsers:

- **IndexedDB** for the offline cache, with a graceful no-op if unavailable (private
  browsing, locked-down profiles)
- **`100dvh` units** for full-height layouts, so mobile browser chrome does not clip
  content
- **`navigator.onLine`** plus `online` / `offline` events

Anything below roughly Safari 15 / Chrome 90 should be treated as unsupported without
further work.

---

## Project status

**There are no automated tests and no CI pipeline yet.** No test runner is installed.
Verification so far has been `tsc`, ESLint, production builds, and targeted checks of
pure logic (date formatting, file-type colouring, ZIP entry naming, cache key stability,
remark-to-tag parsing) run against the real modules in isolation.

Worth adding first, in rough priority order:

1. The response normaliser — field aliases and the remark-to-tag heuristic
2. `uniqueZipEntryName` — duplicate filenames silently drop files
3. Cache key generation — two identical searches must produce one key

---

## Conventions

- **Aliases** are the app's defence against the API renaming fields. Every read of a
  response field goes through a list of accepted key names (`ID_KEYS`, `TAG_KEYS`, …)
  rather than a single hard-coded property.
- **Comments explain *why*, not *what*.** Where behaviour looks surprising — a fallback
  that refuses to split prose, a dedupe that lower-cases names — the reasoning is
  written down next to it.
- **Server payloads are stored verbatim.** `sessionStorage` holds the API response
  exactly as received, so the shape is never reshaped on the way in.
- **Tailwind over CSS files.** Styling lives in component `className`; `index.css` holds
  only the font theme, keyframes and a few global resets.
- **Only one real dependency per job.** `fflate` for ZIP, `idb` for IndexedDB — no larger
  bundles for a single feature.

---

## Known limitations

- **The register page is not wired to the API.** It stores entries in `localStorage` on
  the client only. Treat it as a UI placeholder.
- **Selection does not cross pages.** Documents are paginated 10 at a time, so the ZIP is
  built from what is currently loaded. Selecting across pages would omit off-page files.
- **Category options are hard-coded** in `constants/minor-head.constants.ts` rather than
  fetched, so adding a category needs a code change.
- **`total_count` is the size of the whole result set**, not a property of the document,
  so it reads the same on every card.
- **Presigned links expire after 30 minutes**, so a very large ZIP batch can start
  failing partway. Partial failures are reported rather than hidden.
- **The cache holds 40 pages for 12 hours.** Enough to cover a dropped connection, not
  long-term browsing history.

---

## Troubleshooting

**"This file could not be downloaded."** The stored link expired (they last 30 minutes).
Run the search again to get a fresh one. If it fails for every file immediately, the
`/storage` relay is missing — check that `vercel.json` is committed and deployed.

**"Showing saved results."** The server could not be reached and the results came from the
offline cache. They may be out of date; use **Retry** once you are back online.

**"Your session has expired."** Sessions end after one hour by design. Sign in again.

**Requests fail immediately in development.** `.env.local` is missing or
`VITE_API_BASE_URL` is wrong. The variable is read at build time, so restart the dev
server after changing it.

**A teammate's env value seems ignored.** An existing `.env.local` outranks the committed
`.env.development`. See [precedence](#which-files-vite-reads).

**A fresh clone has no `.env.example`.** Expected: `.gitignore:18` ignores it. Create
`.env.local` by hand using the one-liner in [Setup](#setup).

**A type error blocks the build.** `npm run build` runs `tsc -b` first. Run `npx tsc -b`
alone to see the error without bundler output.