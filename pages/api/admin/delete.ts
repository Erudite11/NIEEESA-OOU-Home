import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { isAdminAuthed } from '../../../lib/auth'
// Cloudinary removed in production cleanup

// Note: We intentionally do not renumber IDs after deletes.
// Gaps are expected when rows are deleted and preserve data integrity.

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!isAdminAuthed(req)) {
    return res.status(401).json({ error: 'unauthorized' })
  }

  const { id } = req.body
  if (!id) {
    return res.status(400).json({ error: 'id required' })
  }

  try {
    const material = await prisma.material.findUnique({
      where: { id: Number(id) },
    })

    if (!material) {
      return res.status(404).json({ error: 'Material not found' })
    }

    // Cloudinary deletion removed (Supabase-only storage)

    //  Delete from DB
    await prisma.material.delete({
      where: { id: Number(id) },
    })

    // Return success (IDs are not renumbered by design)
    return res.json({ success: true })
  } catch (err: any) {
    console.error(err)
    return res.status(500).json({
      error: err.message || 'Server error',
    })
  }
}