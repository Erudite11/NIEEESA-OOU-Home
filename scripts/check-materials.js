/**
 * Check materials in database
 */

require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('\n📊 Checking Materials Database...\n')
  
  try {
    const materials = await prisma.material.findMany({
      orderBy: { id: 'asc' },
      select: { id: true, title: true, createdAt: true }
    })
    
    console.log(`Total materials: ${materials.length}`)
    
    if (materials.length > 0) {
      console.log('\nFirst 5 materials:')
      materials.slice(0, 5).forEach(m => {
        console.log(`  ID: ${m.id} | ${m.title} | ${m.createdAt.toISOString().split('T')[0]}`)
      })
      
      console.log('\nLast 5 materials:')
      materials.slice(-5).forEach(m => {
        console.log(`  ID: ${m.id} | ${m.title} | ${m.createdAt.toISOString().split('T')[0]}`)
      })
      
      const ids = materials.map(m => m.id)
      const minId = Math.min(...ids)
      const maxId = Math.max(...ids)
      
      console.log(`\n📈 ID Range: ${minId} to ${maxId}`)
      
      // Check for gaps
      const expectedCount = maxId - minId + 1
      if (expectedCount !== materials.length) {
        console.log(`⚠️  Warning: There are gaps in IDs (expected ${expectedCount} but have ${materials.length})`)
        console.log('   This is normal if materials were deleted.')
      } else {
        console.log('✅ No gaps in ID sequence')
      }
      
      console.log(`\n🔢 Next ID will be: ${maxId + 1}`)
    } else {
      console.log('No materials found. Next ID will be: 1')
    }
    
  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
