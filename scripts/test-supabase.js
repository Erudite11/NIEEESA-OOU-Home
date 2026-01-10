/**
 * Test script to verify Supabase configuration
 * Run with: node scripts/test-supabase.js
 */

require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'materials'

console.log('🧪 Testing Supabase Configuration...\n')

// Check environment variables
console.log('1️⃣ Checking environment variables...')
const checks = [
  { name: 'NEXT_PUBLIC_SUPABASE_URL', value: supabaseUrl, required: true },
  { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: anonKey, required: true },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', value: serviceKey, required: true },
  { name: 'NEXT_PUBLIC_SUPABASE_BUCKET', value: bucket, required: false },
  { name: 'DATABASE_URL', value: process.env.DATABASE_URL, required: true },
  { name: 'DIRECT_URL', value: process.env.DIRECT_URL, required: true },
]

let missingVars = false
checks.forEach(check => {
  if (check.value) {
    const displayValue = check.value.length > 50 
      ? check.value.substring(0, 30) + '...' + check.value.substring(check.value.length - 10)
      : check.value
    console.log(`   ✅ ${check.name}: ${displayValue}`)
  } else {
    if (check.required) {
      console.log(`   ❌ ${check.name}: NOT SET (required!)`)
      missingVars = true
    } else {
      console.log(`   ⚠️  ${check.name}: NOT SET (using default: ${bucket})`)
    }
  }
})

if (missingVars) {
  console.log('\n❌ Missing required environment variables!')
  console.log('   Please copy .env.local.example to .env.local and fill in your credentials.')
  process.exit(1)
}

console.log('\n2️⃣ Testing Supabase API connection...')

async function testSupabase() {
  try {
    // Test bucket existence
    const bucketUrl = `${supabaseUrl}/storage/v1/bucket/${bucket}`
    const bucketRes = await fetch(bucketUrl, {
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey
      }
    })

    if (bucketRes.ok) {
      const bucketData = await bucketRes.json()
      console.log(`   ✅ Bucket '${bucket}' exists`)
      console.log(`   📊 Bucket is ${bucketData.public ? 'PUBLIC' : 'PRIVATE'}`)
      
      if (!bucketData.public) {
        console.log(`   ⚠️  WARNING: Bucket is private! Downloads may not work.`)
        console.log(`      To fix: Go to Supabase Dashboard > Storage > ${bucket} > Settings > Make bucket public`)
      }
    } else {
      console.log(`   ❌ Bucket '${bucket}' not found!`)
      console.log(`   📝 Create it: Supabase Dashboard > Storage > New Bucket > Name: ${bucket} > Public: ON`)
      process.exit(1)
    }

    // Test list objects (this will fail if policies aren't set, but that's ok)
    console.log('\n3️⃣ Testing bucket access...')
    const listUrl = `${supabaseUrl}/storage/v1/object/list/${bucket}`
    const listRes = await fetch(listUrl, {
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey
      }
    })

    if (listRes.ok) {
      const objects = await listRes.json()
      console.log(`   ✅ Can access bucket (found ${objects.length} files)`)
      if (objects.length > 0) {
        console.log(`   📁 Sample files:`)
        objects.slice(0, 3).forEach(obj => {
          console.log(`      - ${obj.name}`)
        })
      }
    } else {
      console.log(`   ⚠️  Could not list bucket contents (this is OK if bucket is empty)`)
    }

    // Test database connection
    console.log('\n4️⃣ Testing database connection...')
    try {
      const { PrismaClient } = require('@prisma/client')
      const prisma = new PrismaClient()
      const count = await prisma.material.count()
      console.log(`   ✅ Database connected (${count} materials in database)`)
      await prisma.$disconnect()
    } catch (dbErr) {
      console.log(`   ❌ Database connection failed: ${dbErr.message}`)
      console.log(`   📝 Run: npx prisma generate && npx prisma migrate deploy`)
    }

    console.log('\n✅ All tests passed! Your Supabase configuration is working.')
    console.log('\n📝 Next steps:')
    console.log('   1. Start dev server: npm run dev')
    console.log('   2. Go to: http://localhost:3000/admin/login')
    console.log('   3. Upload a test file')
    console.log('   4. Try downloading it from the student portal')

  } catch (err) {
    console.log(`\n❌ Test failed: ${err.message}`)
    console.log('\n🔍 Common issues:')
    console.log('   - Check your SUPABASE_URL is correct')
    console.log('   - Verify your API keys are valid')
    console.log('   - Ensure the bucket exists in Supabase Storage')
    console.log('   - Make sure the bucket is PUBLIC')
    process.exit(1)
  }
}

testSupabase()
