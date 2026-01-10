import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import fs from 'fs'
import path from 'path'

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  const id = Number(req.query.id)
  if(!id) return res.status(400).json({ error: 'id required' })

  try{
    const material = await prisma.material.findUnique({ where: { id } })
    if(!material) return res.status(404).json({ error: 'not found' })

    const url = material.url
    const originalName = material.originalName || ''

    // If local file (saved under /uploads), serve from disk with Content-Disposition
    if(url.startsWith('/uploads/') || url.startsWith('/public/uploads/')){
      const rel = url.startsWith('/') ? url.slice(1) : url
      const filePath = path.join(process.cwd(), rel)
      if(!fs.existsSync(filePath)) return res.status(404).json({ error: 'file missing' })
      const stat = await fs.promises.stat(filePath)
      res.setHeader('Content-Length', String(stat.size))
      res.setHeader('Content-Type', 'application/octet-stream')
      const fn = originalName || path.basename(filePath)
      res.setHeader('Content-Disposition', `attachment; filename="${fn.replace(/"/g,'') }"`)
      const stream = fs.createReadStream(filePath)
      stream.pipe(res)
      return
    }

    // For Supabase public URLs, add download parameter to force download
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
    if(supabaseUrl && url.includes(supabaseUrl) && url.includes('/storage/v1/object/public/')){
      // Add download query parameter to force download instead of preview
      const downloadUrl = url.includes('?') ? `${url}&download` : `${url}?download=${encodeURIComponent(originalName || 'file')}`
      return res.redirect(downloadUrl)
    }

    // Remote URL (Cloudinary or other): fetch and proxy with streaming
    const fetchRes = await fetch(url)
    if(!fetchRes.ok) return res.status(502).json({ error: 'upstream fetch failed' })
    
    const contentType = fetchRes.headers.get('content-type') || 'application/octet-stream'
    const contentLength = fetchRes.headers.get('content-length')
    
    res.setHeader('Content-Type', contentType)
    const fn = originalName || path.basename(new URL(url).pathname || 'file')
    res.setHeader('Content-Disposition', `attachment; filename="${fn.replace(/"/g,'')}"`)
    if(contentLength) res.setHeader('Content-Length', contentLength)
    
    // Stream the response instead of buffering in memory (better for large files)
    if(fetchRes.body){
      const reader = fetchRes.body.getReader()
      while(true){
        const { done, value } = await reader.read()
        if(done) break
        res.write(Buffer.from(value))
      }
      res.end()
    } else {
      // Fallback to buffer method if streaming not available
      const arrayBuffer = await fetchRes.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      res.end(buffer)
    }
  }catch(err:any){
    console.error(err)
    res.status(500).json({ error: err.message || 'server error' })
  }
}
