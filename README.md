# NIEEESA home — v1

This is a Next.js + TypeScript + Tailwind project for a student materials portal (v1).

Features implemented in this version:

- Next.js app (pages router) with Tailwind styling
- Prisma with SQLite and a Material model
- API route to fetch materials by level, semester and file type
- Admin dashboard to upload files (uploads to Cloudinary) and save URL to DB
- Student flow: choose Level → Semester → Material Type → View materials and download

Admin notes (auth and admin features)

- Admin login: visit `/admin/login` and enter the password set in `ADMIN_PASSWORD` in your `.env` file. If `ADMIN_PASSWORD` is not set, admin login is allowed by default (convenience for local dev).
- After logging in the server sets an HttpOnly cookie and admin APIs (`/api/admin/*`) require that cookie.
- Admin can edit title, level, semester, file type and URL inline in the admin dashboard. Files can be replaced using the replace action which uploads a new file to Cloudinary and updates the record.

Seeding

- A seed script exists at `scripts/seed.js`. Run it with `node scripts/seed.js` to insert sample materials into the database.
- There's also an HTTP seed endpoint `POST /api/seed` (protected by admin cookie) if you prefer calling via the dev server.

Getting started

1. Copy the env example and fill credentials:

   cp .env.example .env
   # set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET if you want uploads

2. Install dependencies:

   npm install

3. Generate Prisma client and run an initial migration (creates SQLite DB):

   npx prisma generate
   npx prisma migrate dev --name init

4. Run the dev server:

   npm run dev

Notes

- Uploading files requires Cloudinary credentials. If you don't want to use Cloudinary, remove the upload logic and save URLs manually or implement Supabase Storage.
- "shadcn UI" styling: this project uses Tailwind and simple components inspired by shadcn; to fully integrate the shadcn UI component library, follow their docs and generate components into `components/ui`.

Next steps (planned):

- Add authentication for admin
- Implement edit flow for materials
- Add client-side search/filter and pagination
