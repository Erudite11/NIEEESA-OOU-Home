/**
 * Reset Material ID sequence to remove gaps
 * ⚠️  WARNING: This will renumber all materials!
 * ⚠️  Only run this if you're sure you want to reset IDs
 */

require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('\n⚠️  WARNING: This will renumber all materials!\n')
  console.log('This script will:')
  console.log('  1. Get all materials ordered by creation date')
  console.log('  2. Delete all materials')
  console.log('  3. Re-insert them with sequential IDs (1, 2, 3...)')
  console.log('  4. Reset the ID sequence counter\n')
  
  console.log('Starting in 5 seconds... (Press Ctrl+C to cancel)\n')
  await new Promise(resolve => setTimeout(resolve, 5000))
  
  try {
    // Get all materials
    console.log('📊 Fetching all materials...')
    const materials = await prisma.material.findMany({
      orderBy: { createdAt: 'asc' }
    })
    
    console.log(`   Found ${materials.length} materials`)
    
    if (materials.length === 0) {
      console.log('\n✅ No materials to reset!')
      return
    }
    
    // Show current ID range
    const ids = materials.map(m => m.id)
    const minId = Math.min(...ids)
    const maxId = Math.max(...ids)
    console.log(`   Current ID range: ${minId} to ${maxId}`)
    console.log(`   Gaps: ${(maxId - minId + 1) - materials.length} missing IDs\n`)
    
    // Backup data (without IDs)
    const backup = materials.map(m => ({
      title: m.title,
      level: m.level,
      semester: m.semester,
      fileType: m.fileType,
      url: m.url,
      publicId: m.publicId,
      originalName: m.originalName,
      createdAt: m.createdAt
    }))
    
    // Delete all materials
    console.log('🗑️  Deleting all materials...')
    await prisma.material.deleteMany({})
    console.log('   ✅ Deleted')
    
    // Reset sequence to 1
    console.log('🔄 Resetting ID sequence...')
    await prisma.$executeRaw`ALTER SEQUENCE "Material_id_seq" RESTART WITH 1;`
    console.log('   ✅ Sequence reset to 1')
    
    // Re-insert materials
    console.log('📝 Re-inserting materials with new IDs...')
    for (let i = 0; i < backup.length; i++) {
      await prisma.material.create({
        data: backup[i]
      })
      if ((i + 1) % 10 === 0 || i === backup.length - 1) {
        console.log(`   Inserted ${i + 1}/${backup.length}`)
      }
    }
    
    console.log('\n✅ Done! Materials now have sequential IDs: 1 to ' + backup.length)
    console.log('   Next material will have ID: ' + (backup.length + 1))
    
    // Verify
    const newMaterials = await prisma.material.findMany({
      orderBy: { id: 'asc' }
    })
    const newIds = newMaterials.map(m => m.id)
    console.log(`\n🔍 Verification:`)
    console.log(`   Total materials: ${newMaterials.length}`)
    console.log(`   ID range: ${Math.min(...newIds)} to ${Math.max(...newIds)}`)
    console.log(`   No gaps: ${newMaterials.length === Math.max(...newIds) ? '✅ Yes' : '❌ No'}`)
    
  } catch (err) {
    console.error('\n❌ Error:', err.message)
    console.error('\nIf this failed, your data should still be intact.')
    console.error('Check the admin panel to verify.')
  } finally {
    await prisma.$disconnect()
  }
}

main()
