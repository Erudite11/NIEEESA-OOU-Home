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
      res.setHeader('Content-Disposition', `attachment; filename="${fn.replace(/"/g,'') }"
`)
      const stream = fs.createReadStream(filePath)
      stream.pipe(res)
      return
    }

    // Remote URL: fetch and proxy (buffers in memory)
    const fetchRes = await fetch(url)
    if(!fetchRes.ok) return res.status(502).json({ error: 'upstream fetch failed' })
    const contentType = fetchRes.headers.get('content-type') || 'application/octet-stream'
    const arrayBuffer = await fetchRes.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    res.setHeader('Content-Type', contentType)
    const fn = originalName || path.basename(new URL(url).pathname || 'file')
    res.setHeader('Content-Disposition', `attachment; filename="${fn.replace(/"/g,'')}"`)
    res.setHeader('Content-Length', String(buffer.length))
    res.end(buffer)
  }catch(err:any){
    console.error(err)
    res.status(500).json({ error: err.message || 'server error' })
  }
}
