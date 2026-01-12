# NIEEESA OOU Home Documentation

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack (and Why)](#2-tech-stack-and-why)
3. [Data Model (Materials)](#3-data-model-materials)
4. [User Navigation Logic (Student Flow)](#4-user-navigation-logic-student-flow)
5. [Backend API Logic (Key Endpoints)](#5-backend-api-logic-key-endpoints)
6. [Step-by-Step: Start From Scratch (Local Setup)](#6-step-by-step-start-from-scratch-local-setup)
7. [Deployment (Vercel)](#7-deployment-vercel)
8. [Troubleshooting Guide (Common Bugs & Fixes)](#8-troubleshooting-guide-common-bugs--fixes)
9. [How to Defend the Architecture (Talking Points)](#9-how-to-defend-the-architecture-talking-points)
10. [Learning Path (How to become proficient)](#10-learning-path-how-to-become-proficient)
11. [Appendix: Key Project Locations](#appendix-key-project-locations)

---

## 1. Project Overview

**NIEEESA Materials Portal** is a web application that allows:

- **Students (public users)** to browse and download departmental materials by **Level → Semester → Type**.
- **Admins (restricted)** to upload materials and manage the library.

### What the system stores

- **Files** (PDF/DOCX/etc.) are stored in **Supabase Storage**.
- **Metadata** (title, level, semester, type, URL, etc.) is stored in **Supabase Postgres**, accessed via **Prisma**.

This separation is intentional: object storage is optimized for files, while SQL databases are optimized for searchable metadata.

---

## 2. Tech Stack (and Why)

### Frontend
- **Next.js (Pages Router)**: routing + server rendering + API routes in one project.
- **React + TypeScript**: safer development and fewer runtime errors.
- **Tailwind CSS**: consistent styling and fast UI building.

### Backend
- **Next.js API Routes** (`/pages/api/*`): simple server endpoints deployed alongside the app.

### Data
- **Supabase Postgres**: managed PostgreSQL database for production.
- **Prisma ORM**: type-safe database access with a schema-based workflow.

### Storage
- **Supabase Storage**: public bucket for fast file serving.

---

## 3. Data Model (Materials)

The main database table/model is `Material`.

A material record includes:
- `id`: auto-increment primary key
- `title`
- `level` (e.g., `"100"`)
- `semester` (e.g., `"Harmattan"`, `"Rain"`)
- `fileType` (e.g., `"PDF Material"`, `"Past Question"`, `"Course Form"`)
- `url` (Supabase Storage public URL)
- `originalName` (original uploaded filename)
- `createdAt`

**Important:** the file itself is not stored in the DB, only the file URL and metadata.

---

## 4. User Navigation Logic (Student Flow)

The student browsing experience is designed as a funnel:

1. **Homepage** (`/`) → choose a Level
2. **Semesters** (`/levels/[level]/semesters`) → choose a Semester
3. **Types** (`/levels/[level]/semesters/[semester]/types`) → choose a Material Type
4. **Materials list** (`/levels/[level]/semesters/[semester]/types/[type]/materials`) → view and download

Each step narrows the filtering criteria until we can query the DB for the exact category.

---

## 5. Backend API Logic (Key Endpoints)

### 5.1 Fetch materials list

**Endpoint**: `GET /api/materials?level=...&semester=...&fileType=...`

**Logic**:
1. Read query params
2. Normalize inputs (ensure string + trim)
3. Query the database:
   - `where: { level, semester, fileType }`
4. Return a JSON array of materials

**If this endpoint fails**, the materials page will appear empty.

---

### 5.2 Download a material (force download)

**Endpoint**: `GET /api/materials/download?id=123`

**Logic**:
1. Find record by `id`
2. Extract `url` and `originalName`
3. If URL is a Supabase public storage URL:
   - Redirect to `url?download=<filename>`
   - This forces the browser to download instead of preview.
4. Otherwise (non-Supabase URL):
   - Stream/proxy the file with correct headers.

---

### 5.3 Admin upload

Admin uploads:
1. Upload file to Supabase Storage bucket
2. Generate public URL
3. Save metadata via `POST /api/admin/create`

The admin UI also clears the form and shows status messages.

---

### 5.4 Admin list

**Endpoint**: `GET /api/admin/list`

**Logic**:
1. Ensure admin cookie exists (set after admin login)
2. `prisma.material.findMany({ orderBy: createdAt: 'desc' })`
3. Return results

Admin UI groups results by **Level + Semester**, and provides search/type filtering.

---

## 6. Step-by-Step: Start From Scratch (Local Setup)

### 6.1 Prerequisites
Install:
- Node.js 18+ (recommended)
- Git
- A Supabase account

---

### 6.2 Clone and install dependencies

```bash
git clone https://github.com/Erudite11/NIEEESA-OOU-Home.git
cd NIEEESA-OOU-Home
npm install
```

---

### 6.3 Create a Supabase project

1. Go to https://supabase.com/dashboard
2. Create a new project
3. Wait for provisioning to finish

---

### 6.4 Create Supabase Storage bucket

1. Supabase Dashboard → **Storage** → **New bucket**
2. Bucket name: `materials`
3. Make bucket: **Public**

Add policies (RLS) to allow uploads and downloads. In development, you used permissive policies. In production, you can tighten them to authenticated admin users.

---

### 6.5 Configure environment variables

#### Env file priority (local)

Next.js loads environment variables in this order (highest priority first):

1. `.env.local`
2. `.env.development` / `.env.production`
3. `.env`

So locally, your API routes will read from `.env.local` if present.

On **Vercel**, env files are not used — you must set variables in the Vercel dashboard.

#### Create `.env.local`

```bash
cp .env.local.example .env.local
```

Fill in:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_BUCKET=materials`
- `ADMIN_PASSWORD`

Database URLs:
- `DATABASE_URL`: **Pooler** connection (recommended runtime)
- `DIRECT_URL`: **Direct** connection (recommended migrations)

**Windows/DNS note:** Some networks/Windows DNS setups fail to resolve or connect to `db.<ref>.supabase.co:5432`. In that case:
- Keep `DATABASE_URL` as pooler (6543) for runtime.
- Run migrations from another network or Supabase SQL editor if `DIRECT_URL` fails.

---

### 6.6 Prisma generate + migrations

```bash
npx prisma generate
npx prisma migrate deploy
```

If Prisma fails on Windows with `EPERM` (file lock):

```powershell
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules\.prisma\client
npx prisma generate
```

---

### 6.7 Start the dev server

```bash
npm run dev
```

Open:
- http://localhost:3000
- Admin: http://localhost:3000/admin/login

---

## 7. Deployment (Vercel)

### 7.1 Deploy steps

1. Push code to GitHub
2. Vercel → Import project from GitHub
3. Add environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SUPABASE_BUCKET`
   - `DATABASE_URL` (pooler)
   - `DIRECT_URL`
   - `ADMIN_PASSWORD`
4. Deploy

### 7.2 Production recommendation

For Vercel/serverless:
- Use pooler for `DATABASE_URL` (`pgbouncer=true&sslmode=require`)
- Keep `DIRECT_URL` direct for migrations

---

## 8. Troubleshooting Guide (Common Bugs & Fixes)

### 8.1 Materials page shows blank / doesn’t load

Check:
1. Browser DevTools → Network:
   - `/api/materials?...` response
2. Server logs:
   - Prisma error output

If you see:
- `Can't reach database server...`

Then your `DATABASE_URL` is not reachable.

Fix:
- Prefer pooler `aws-*-*.pooler.supabase.com:6543`
- Ensure `sslmode=require`

---

### 8.2 Admin page cannot load materials

This uses `/api/admin/list` which queries Prisma.

If it fails, it is usually the same DB connectivity issue:
- wrong `DATABASE_URL`
- missing SSL
- blocked ports
- Supabase paused

---

### 8.3 Download button previews instead of downloads

Download logic lives in:
- `pages/api/materials/download.ts`

Make sure the redirect adds a `download` query param for Supabase URLs.

---

### 8.4 Windows Prisma build errors (EPERM rename query_engine)

Cause:
- Windows locks Prisma engine DLL (node process or antivirus)

Fix:

```powershell
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules\.prisma\client
npx prisma generate
npm run build
```

---

### 8.5 Supabase upload fails (403 RLS)

Cause:
- Storage RLS policies do not allow INSERT

Fix:
- Add Storage policies in Supabase dashboard for your bucket (INSERT/SELECT/UPDATE/DELETE) based on your desired security model.

---

## 9. How to Defend the Architecture (Talking Points)

- **Separation of concerns**: files belong in object storage; metadata belongs in a database.
- **Scalable downloads**: redirect-to-storage avoids proxying large files through your server.
- **Type safety and maintainability**: Prisma schema drives consistent DB operations.
- **Deployment-ready**: pooler supports serverless environments like Vercel.

---

## 10. Learning Path (How to become proficient)

Recommended order:

1. Next.js Pages Router
   - dynamic routes (`[level]`, `[semester]`, `[type]`)
   - API routes
2. Supabase
   - Storage bucket + public URLs
   - RLS policies
   - pooler vs direct connection
3. Prisma
   - schema modeling
   - migrations
   - Prisma Client queries
4. Debugging
   - DevTools network tab
   - server logs
   - connectivity testing (Test-NetConnection)
5. Deployment
   - Vercel environment variables
   - build vs runtime issues

---

## Appendix: Key Project Locations

- Student pages:
  - `pages/index.tsx`
  - `pages/levels/[level]/semesters.tsx`
  - `pages/levels/[level]/semesters/[semester]/types.tsx`
  - `pages/levels/[level]/semesters/[semester]/types/[type]/materials.tsx`

- Admin:
  - `pages/admin/login.tsx`
  - `pages/admin/index.tsx`
  - `pages/api/admin/*`

- API:
  - `pages/api/materials.ts`
  - `pages/api/materials/download.ts`

- Prisma:
  - `prisma/schema.prisma`

- Assets:
  - `public/assets/` (favicon/logo)
