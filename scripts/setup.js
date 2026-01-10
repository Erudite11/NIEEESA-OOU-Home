/**
 * Quick setup script for NIEEESA Materials Portal
 * Run with: node scripts/setup.js
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🚀 NIEEESA Materials Portal - Setup Wizard\n')
console.log('=' .repeat(60))

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local')
const envExists = fs.existsSync(envPath)

if (!envExists) {
  console.log('\n📝 Step 1: Creating environment file...')
  const examplePath = path.join(process.cwd(), '.env.local.example')
  
  if (fs.existsSync(examplePath)) {
    fs.copyFileSync(examplePath, envPath)
    console.log('   ✅ Created .env.local from template')
    console.log('   ⚠️  You need to edit .env.local with your Supabase credentials!')
    console.log('')
    console.log('   Follow these steps:')
    console.log('   1. Go to https://supabase.com and create a project')
    console.log('   2. Create a storage bucket named "materials" (make it PUBLIC)')
    console.log('   3. Get your credentials from Project Settings > API')
    console.log('   4. Get database URLs from Project Settings > Database')
    console.log('   5. Update .env.local with all credentials')
    console.log('')
    console.log('   📖 For detailed instructions, see: SETUP_SUPABASE.md')
    console.log('')
  } else {
    console.log('   ❌ Error: .env.local.example not found!')
    process.exit(1)
  }
} else {
  console.log('\n✅ Step 1: .env.local already exists')
}

// Check if node_modules exists
const nodeModulesPath = path.join(process.cwd(), 'node_modules')
const hasNodeModules = fs.existsSync(nodeModulesPath)

if (!hasNodeModules) {
  console.log('\n📦 Step 2: Installing dependencies...')
  console.log('   This may take a few minutes...')
  try {
    execSync('npm install', { stdio: 'inherit' })
    console.log('   ✅ Dependencies installed')
  } catch (err) {
    console.log('   ❌ Failed to install dependencies')
    console.log('   Try running: npm install')
    process.exit(1)
  }
} else {
  console.log('\n✅ Step 2: Dependencies already installed')
}

// Generate Prisma client
console.log('\n🔧 Step 3: Generating Prisma client...')
try {
  execSync('npx prisma generate', { stdio: 'inherit' })
  console.log('   ✅ Prisma client generated')
} catch (err) {
  console.log('   ⚠️  Warning: Prisma generation had issues')
  console.log('   This is normal if DATABASE_URL is not set yet')
}

// Check if we can connect to database
console.log('\n🗄️  Step 4: Checking database connection...')
require('dotenv').config({ path: '.env.local' })

if (!process.env.DATABASE_URL) {
  console.log('   ⚠️  DATABASE_URL not set in .env.local')
  console.log('   Skipping database migration')
  console.log('   Run "npx prisma migrate deploy" after setting up Supabase')
} else {
  console.log('   ✅ DATABASE_URL is set')
  console.log('   Running migrations...')
  try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit' })
    console.log('   ✅ Database migrations completed')
  } catch (err) {
    console.log('   ⚠️  Migration failed - this is normal if Supabase is not configured yet')
    console.log('   Run "npx prisma migrate deploy" after completing Supabase setup')
  }
}

// Final instructions
console.log('\n' + '='.repeat(60))
console.log('📋 Setup Summary')
console.log('='.repeat(60))

const allConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
                      process.env.SUPABASE_SERVICE_ROLE_KEY &&
                      process.env.DATABASE_URL &&
                      process.env.DIRECT_URL

if (allConfigured) {
  console.log('\n✅ Setup complete! All environment variables are configured.')
  console.log('\n🧪 Test your configuration:')
  console.log('   node scripts/test-supabase.js')
  console.log('\n🚀 Start the development server:')
  console.log('   npm run dev')
  console.log('\n🌐 Then visit:')
  console.log('   - Homepage: http://localhost:3000')
  console.log('   - Admin: http://localhost:3000/admin/login')
} else {
  console.log('\n⚠️  Setup incomplete - you need to configure Supabase')
  console.log('\n📝 Next steps:')
  console.log('   1. Edit .env.local with your Supabase credentials')
  console.log('   2. Follow the guide: SETUP_SUPABASE.md')
  console.log('   3. Run: node scripts/test-supabase.js (to verify setup)')
  console.log('   4. Run: npx prisma migrate deploy (to set up database)')
  console.log('   5. Run: npm run dev (to start the server)')
  
  console.log('\n🆘 Need help?')
  console.log('   - Read: SETUP_SUPABASE.md (step-by-step guide)')
  console.log('   - Read: MIGRATION_SUMMARY.md (overview of changes)')
  console.log('   - Check: https://supabase.com/docs')
}

console.log('\n' + '='.repeat(60))
console.log('💡 Tip: Keep .env.local secret - never commit it to Git!')
console.log('='.repeat(60) + '\n')
