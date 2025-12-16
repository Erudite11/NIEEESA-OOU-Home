import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { isAdminAuthed } from '../../../lib/auth'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

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

    //  Delete from Cloudinary FIRST
    if (material.publicId) {
      await cloudinary.uploader.destroy(material.publicId, {
        resource_type: 'auto',
      })
    }

    //  Delete from DB
    await prisma.material.delete({
      where: { id: Number(id) },
    })

    return res.json({ success: true })
  } catch (err: any) {
    console.error(err)
    return res.status(500).json({
      error: err.message || 'Server error',
    })
  }
}