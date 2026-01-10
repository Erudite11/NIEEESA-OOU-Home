# Supabase Setup Guide

This guide will help you set up Supabase for the NIEEESA Materials Portal.

## Why Supabase?

We migrated from Cloudinary to Supabase because:
- ✅ Better support for PDF downloads
- ✅ Direct file serving (no proxy needed)
- ✅ Free generous storage quota
- ✅ Built-in PostgreSQL database
- ✅ Simple public URL structure

## Step-by-Step Setup

### 1. Create a Supabase Account and Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up for a free account
3. Click **"New Project"**
4. Fill in:
   - **Name**: NIEEESA Materials (or any name you prefer)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose the closest to your users (e.g., `West Africa (Lagos)` if available, otherwise `eu-west-1`)
   - **Pricing Plan**: Free tier is sufficient
5. Click **"Create new project"**
6. Wait ~2 minutes for setup to complete

### 2. Create Storage Bucket

1. In your project dashboard, click **"Storage"** in the left sidebar
2. Click **"New bucket"**
3. Configure:
   - **Name**: `materials`
   - **Public bucket**: Toggle **ON** (important for direct downloads!)
   - **File size limit**: 50 MB (adjust if needed)
   - **Allowed MIME types**: Leave empty to allow all file types
4. Click **"Create bucket"**

### 3. Set Bucket Policies (Important!)

To allow public downloads, you need to set proper policies:

1. Click on your `materials` bucket
2. Go to **"Policies"** tab
3. Click **"New Policy"**
4. Choose **"For full customization"** 
5. Add this policy for public read access:

```sql
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'materials' );
```

Or use the UI:
- **Policy name**: Public Access
- **Allowed operation**: SELECT
- **Target roles**: public
- **USING expression**: `bucket_id = 'materials'`

6. Click **"Review"** then **"Save policy"**

### 4. Get Your Credentials

#### API Credentials

1. Go to **"Project Settings"** (gear icon in sidebar)
2. Click **"API"** in settings menu
3. Copy these values:
   - **Project URL** → This is your `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → This is your `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep secret!)

#### Database Credentials

1. In **"Project Settings"**, click **"Database"**
2. Scroll to **"Connection string"** section
3. Select **"URI"** tab
4. Copy the connection string and replace `[YOUR-PASSWORD]` with your database password
   - This is your `DIRECT_URL`
5. Switch to **"Connection pooling"** and select **"Session mode"** 
6. Copy this pooler connection string → This is your `DATABASE_URL`

### 5. Configure Environment Variables

1. Copy the example file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Open `.env.local` and fill in your credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGc..."
   SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."
   NEXT_PUBLIC_SUPABASE_BUCKET="materials"
   DATABASE_URL="postgresql://postgres.xxxxx:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres.xxxxx:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres"
   ADMIN_PASSWORD="your-secure-password"
   ```

### 6. Install Dependencies and Run Migrations

```bash
# Install packages
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Start the dev server
npm run dev
```

### 7. Test Upload and Download

1. Go to [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
2. Enter your `ADMIN_PASSWORD`
3. Upload a test PDF file
4. Go to the student portal and try downloading it
5. ✅ The file should download directly from Supabase!

## Troubleshooting

### "Bucket not found" error
- Make sure the bucket name in `.env.local` matches the bucket you created
- Check that `NEXT_PUBLIC_SUPABASE_BUCKET` is set correctly

### "Failed to fetch file" error
- Verify your bucket is set to **Public**
- Check that the storage policy allows public SELECT
- Make sure the file was uploaded successfully

### Upload fails with "Unauthorized"
- Check your `SUPABASE_SERVICE_ROLE_KEY` is correct
- Verify your API credentials are from the correct project

### Database connection errors
- Verify your `DATABASE_URL` includes the correct password
- Check that you're using the **connection pooler URL** for `DATABASE_URL`
- Ensure `DIRECT_URL` is the direct database connection (not pooler)

### Downloads not working
- Clear your browser cache
- Check the browser console for errors
- Verify the file URL in the database includes `/storage/v1/object/public/`

## File URL Structure

Supabase public file URLs look like this:
```
https://your-project.supabase.co/storage/v1/object/public/materials/filename.pdf
```

The app automatically:
1. Detects Supabase URLs
2. Redirects downloads directly to Supabase (no proxy)
3. Falls back to proxying for non-Supabase URLs (Cloudinary, etc.)

## Cost and Limits (Free Tier)

- **Storage**: 1 GB
- **Bandwidth**: 2 GB/month
- **Database**: 500 MB

This is sufficient for most small to medium projects. Upgrade if needed.

## Next Steps

- Test uploading different file types (PDF, DOCX, etc.)
- Monitor storage usage in Supabase dashboard
- Consider adding file type validation
- Set up automated backups

## Need Help?

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)
- [GitHub Issues](https://github.com/Erudite11/NIEEESA-OOU-Home/issues)
