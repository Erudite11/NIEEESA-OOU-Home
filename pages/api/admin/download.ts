import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  if (!id) return res.status(400).end('Missing id')

  const material = await prisma.material.findUnique({
    where: { id: Number(id) }
  })

  if (!material) return res.status(404).end('Not found')

  // For Supabase public URLs, add download parameter to force download
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
  if(supabaseUrl && material.url.includes(supabaseUrl) && material.url.includes('/storage/v1/object/public/')){
    // Add download query parameter to force download instead of preview
    const downloadUrl = material.url.includes('?') 
      ? `${material.url}&download` 
      : `${material.url}?download=${encodeURIComponent(material.originalName || 'file')}`
    return res.redirect(downloadUrl)
  }

  // For other URLs (Cloudinary, etc.), proxy with streaming
  const fileRes = await fetch(material.url)
  if (!fileRes.ok) return res.status(500).end('Failed to fetch file')

  const contentType = fileRes.headers.get('content-type') || 'application/octet-stream'
  const contentLength = fileRes.headers.get('content-length')

  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${material.originalName || 'download'}"`
  )
  res.setHeader('Content-Type', contentType)
  if(contentLength) res.setHeader('Content-Length', contentLength)

  // Stream the response
  if(fileRes.body){
    const reader = fileRes.body.getReader()
    while(true){
      const { done, value } = await reader.read()
      if(done) break
      res.write(Buffer.from(value))
    }
    res.end()
  } else {
    const buffer = Buffer.from(await fileRes.arrayBuffer())
    res.send(buffer)
  }
}