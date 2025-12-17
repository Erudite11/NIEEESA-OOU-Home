import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  if (!id) return res.status(400).end('Missing id')

  const material = await prisma.material.findUnique({
    where: { id: Number(id) }
  })

  if (!material) return res.status(404).end('Not found')

  const fileRes = await fetch(material.url)
  if (!fileRes.ok) return res.status(500).end('Failed to fetch file')

  const buffer = Buffer.from(await fileRes.arrayBuffer())

  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${material.originalName || 'download'}"`
  )
  res.setHeader('Content-Type', 'application/octet-stream')

  res.send(buffer)
}