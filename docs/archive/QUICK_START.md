# Quick Start Guide

Get up and running in 10 minutes! ⚡

## Prerequisites

- Node.js 16+ installed
- A Supabase account (free tier is fine)

## Setup Steps

### 1️⃣ Clone and Install (2 minutes)

```bash
# If not already cloned
git clone https://github.com/Erudite11/NIEEESA-OOU-Home.git
cd NIEEESA-OOU-Home

# Run setup script
node scripts/setup.js
```

### 2️⃣ Create Supabase Project (3 minutes)

1. Go to [supabase.com](https://supabase.com) → Sign up (free)
2. Create new project → Wait ~2 minutes
3. Go to **Storage** → Create bucket named `materials` → Toggle **Public: ON**

### 3️⃣ Get Credentials (2 minutes)

**API Keys:**
- Dashboard → Settings → API
- Copy: Project URL, anon key, service_role key

**Database URLs:**
- Dashboard → Settings → Database
- Copy: Connection pooling URL (for `DATABASE_URL`)
- Copy: Connection string URL (for `DIRECT_URL`)

### 4️⃣ Configure App (1 minute)

Edit `.env.local` (created by setup script):

```env
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGc..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."
NEXT_PUBLIC_SUPABASE_BUCKET="materials"
DATABASE_URL="postgresql://postgres.xxxxx:PASSWORD@pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxxxx:PASSWORD@db.supabase.co:5432/postgres"
ADMIN_PASSWORD="your-password"
```

### 5️⃣ Run Migrations (1 minute)

```bash
npx prisma migrate deploy
```

### 6️⃣ Test & Start (1 minute)

```bash
# Test configuration (optional but recommended)
node scripts/test-supabase.js

# Start dev server
npm run dev
```

Visit: http://localhost:3000

## First Upload Test

1. Go to http://localhost:3000/admin/login
2. Login with your `ADMIN_PASSWORD`
3. Upload a PDF file
4. Navigate to it in the student portal
5. Click Download → Should work! ✅

## Troubleshooting

**Bucket not found?**
```bash
# Check bucket name matches .env.local
# Ensure bucket is PUBLIC in Supabase dashboard
```

**Download fails?**
```bash
# Run diagnostics
node scripts/test-supabase.js
```

**Database error?**
```bash
# Regenerate Prisma client
npx prisma generate
npx prisma migrate deploy
```

## Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm start               # Start production server

# Database
npx prisma generate     # Generate Prisma client
npx prisma migrate deploy  # Run migrations
npx prisma studio       # Open database GUI

# Testing/Utilities
node scripts/test-supabase.js        # Test Supabase config
node scripts/migrate-to-supabase.js  # Migrate from Cloudinary
```

## Project Structure

```
NIEEESA-OOU-Home/
├── pages/
│   ├── api/
│   │   ├── materials/
│   │   │   └── download.ts        # Download endpoint
│   │   └── admin/
│   │       ├── upload-supabase.ts # Upload endpoint
│   │       └── ...
│   ├── admin/                     # Admin dashboard
│   └── levels/                    # Student portal
├── prisma/
│   └── schema.prisma              # Database schema
├── scripts/
│   ├── setup.js                   # Setup wizard
│   ├── test-supabase.js          # Config tester
│   └── migrate-to-supabase.js    # Migration script
└── .env.local                     # Your config (DO NOT COMMIT)
```

## Admin Features

- Upload files (PDF, DOCX, etc.)
- Organize by Level (100-500) and Semester
- Edit material metadata
- Delete materials
- View/download files

## Student Features

- Browse by Level → Semester → Type
- Search materials
- Paginated results
- Direct downloads from Supabase

## Need More Help?

- 📖 **Full guide**: `SETUP_SUPABASE.md`
- 📋 **Migration info**: `MIGRATION_SUMMARY.md`
- 🐛 **Issues**: [GitHub Issues](https://github.com/Erudite11/NIEEESA-OOU-Home/issues)
- 📚 **Supabase docs**: [supabase.com/docs](https://supabase.com/docs)

## Security Notes

⚠️ **Never commit `.env.local` to Git!**

✅ Safe to commit:
- `.env.example`
- `.env.local.example`

❌ Never commit:
- `.env.local`
- `.env`
- Any file with real credentials

---

**Ready to go?** Run `npm run dev` and start uploading! 🚀
