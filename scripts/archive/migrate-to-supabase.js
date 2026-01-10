/**
 * Migration script to move files from Cloudinary to Supabase
 * This script will:
 * 1. Find all materials with Cloudinary URLs
 * 2. Download each file
 * 3. Upload to Supabase
 * 4. Update the database record
 * 
 * Run with: node scripts/migrate-to-supabase.js
 */

require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'materials'

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Error: Supabase credentials not configured!')
  console.error('   Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

async function migrateFile(material) {
  console.log(`\n📄 Processing: ${material.title}`)
  console.log(`   ID: ${material.id}`)
  console.log(`   Current URL: ${material.url}`)

  try {
    // Download file from Cloudinary
    console.log('   ⬇️  Downloading from Cloudinary...')
    const response = await fetch(material.url)
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.statusText}`)
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    console.log(`   ✅ Downloaded (${(buffer.length / 1024).toFixed(2)} KB)`)

    // Sanitize filename
    const sanitize = (s) => s.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-')
    const filename = material.originalName 
      ? sanitize(material.originalName)
      : sanitize(`${material.title}-${material.id}.pdf`)

    // Upload to Supabase
    console.log(`   ⬆️  Uploading to Supabase as: ${filename}`)
    const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${encodeURIComponent(filename)}`
    
    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/octet-stream',
      },
      body: buffer
    })

    if (!uploadRes.ok) {
      const errorText = await uploadRes.text()
      throw new Error(`Supabase upload failed: ${errorText}`)
    }

    const newUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${encodeURIComponent(filename)}`
    console.log(`   ✅ Uploaded to Supabase`)
    console.log(`   🔗 New URL: ${newUrl}`)

    // Update database
    console.log('   💾 Updating database...')
    await prisma.material.update({
      where: { id: material.id },
      data: {
        url: newUrl,
        publicId: null, // Clear Cloudinary public ID
      }
    })

    console.log('   ✅ Migration complete!')
    return { success: true, id: material.id, title: material.title }

  } catch (error) {
    console.error(`   ❌ Migration failed: ${error.message}`)
    return { success: false, id: material.id, title: material.title, error: error.message }
  }
}

async function main() {
  console.log('🚀 Starting Cloudinary to Supabase migration...\n')

  // Find all materials with Cloudinary URLs
  const materials = await prisma.material.findMany({
    where: {
      url: {
        contains: 'res.cloudinary.com'
      }
    }
  })

  if (materials.length === 0) {
    console.log('✅ No Cloudinary files found. Nothing to migrate!')
    await prisma.$disconnect()
    return
  }

  console.log(`📊 Found ${materials.length} file(s) to migrate\n`)
  console.log('⚠️  WARNING: This will replace Cloudinary URLs with Supabase URLs')
  console.log('   Make sure you have a backup of your database before proceeding!\n')

  // Prompt for confirmation (in a real scenario, you might want to use readline)
  console.log('Starting migration in 5 seconds... (Press Ctrl+C to cancel)')
  await new Promise(resolve => setTimeout(resolve, 5000))

  const results = []

  for (let i = 0; i < materials.length; i++) {
    console.log(`\n[${i + 1}/${materials.length}]`)
    const result = await migrateFile(materials[i])
    results.push(result)
    
    // Small delay between uploads to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 Migration Summary')
  console.log('='.repeat(60))
  
  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)

  console.log(`✅ Successful: ${successful.length}`)
  console.log(`❌ Failed: ${failed.length}`)

  if (failed.length > 0) {
    console.log('\n❌ Failed migrations:')
    failed.forEach(f => {
      console.log(`   - ${f.title} (ID: ${f.id}): ${f.error}`)
    })
  }

  console.log('\n✅ Migration complete!')
  console.log('\n📝 Next steps:')
  console.log('   1. Test file downloads in the app')
  console.log('   2. If everything works, you can delete files from Cloudinary')
  console.log('   3. Remove Cloudinary credentials from .env.local (optional)')

  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error('❌ Migration failed:', e)
  await prisma.$disconnect()
  process.exit(1)
})
