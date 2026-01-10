# NIEEESA Materials Portal

This is a Next.js + TypeScript + Tailwind project for a student materials portal (v1).

Production-ready stack:

- Next.js (pages router) + TypeScript + Tailwind CSS
- Prisma + Supabase Postgres
- Supabase Storage for file uploads/downloads
- API routes for list/download
- Admin dashboard for uploads and management
- Student flow: Level → Semester → Type → Materials → Download

Admin

- Login: `/admin/login` — password from `ADMIN_PASSWORD`
- Admin APIs use an Http Only cookie after login
- Uploads go to Supabase Storage; metadata saved in DB
- Grouped list by Level and Semester with filters (type, search)
- Delete and open actions per material
- Modernized login UI with show/hide password


Getting started

### 1. Set up Supabase (Required)

This project uses Supabase for file storage and PostgreSQL database.

**a) Create a Supabase project:**
   - Go to [https://supabase.com](https://supabase.com) and create a free account
   - Create a new project (note: it takes ~2 minutes to set up)

**b) Create a storage bucket:**
   - In your Supabase dashboard, go to **Storage**
   - Click **New bucket**
   - Name it `materials` (or use a different name and update `.env`)
   - Make it **Public** so files can be downloaded directly
   - Click **Create bucket**

**c) Get your credentials:**
   - Go to **Project Settings** > **API**
   - Copy your **Project URL** and **anon/public key**
   - Copy your **service_role key** (keep this secret!)
   - Go to **Project Settings** > **Database**
   - Copy the **Connection pooling** URL (for `DATABASE_URL`)
   - Copy the **Connection string** URL (for `DIRECT_URL`)

### 2. Configure environment variables

Copy the example env file and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `NEXT_PUBLIC_SUPABASE_BUCKET` - Your bucket name (default: `materials`)
- `DATABASE_URL` - Your Supabase connection pooling URL
- `DIRECT_URL` - Your Supabase direct connection URL
- `ADMIN_PASSWORD` - Set a secure password for admin access

### 3. Install dependencies

```bash
npm install
```

### 4. Set up the database

Generate Prisma client and run migrations:

```bash
npx prisma generate
npx prisma migrate deploy
```

If you see errors about missing DIRECT_URL/DATABASE_URL, fill them in `.env.local` using your Supabase dashboard values.

### 5. Run the development server

```bash
npm run dev
```

Open (http://localhost:3000) to view the app.

- Admin dashboard: (http://localhost:3000/admin/login)

## How file uploads/downloads work

- Uploads go to Supabase Storage (client direct for small files, server for large files)
- Downloads:
  - Supabase public URLs: redirected with `?download` to force download
  - Other external URLs: streamed via API with proper headers
  - Local files (legacy): served from `/public/uploads`

Notes

- Storage provider: Supabase only (Cloudinary removed)
- Styling: Tailwind with lightweight components; can be extended with any UI kit

Production features

- Dynamic page titles/descriptions for SEO
- Page transition animations + scroll-reveal on cards
- Favicon and OG image set to /assets/nieesa.jpg
- robots.txt and sitemap.xml included
