import type { NextApiRequest, NextApiResponse } from 'next'
import { isAdminAuthed } from '../../../lib/auth'
import formidable from 'formidable'
import fs from 'fs'
import { prisma } from '../../../lib/prisma'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  if(!isAdminAuthed(req)) return res.status(401).json({ error: 'unauthorized' })
  if(req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '')
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const bucket = (process.env.NEXT_PUBLIC_SUPABASE_BUCKET as string) || 'materials'
  if(!supabaseUrl || !serviceKey) return res.status(500).json({ error: 'Supabase URL or service role key not configured on server' })

  const form = formidable({ multiples: false, keepExtensions: true })
  form.parse(req, async (err: any, fields: any, files: any) => {
    if(err) return res.status(500).json({ error: err.message || 'form parse error' })
    try{
      const title = (fields.title as string) || 'Untitled'
      const level = (fields.level as string) || ''
      const semester = (fields.semester as string) || ''
      const fileType = (fields.fileType as string) || ''

      const file = (files.file as any)
      if(!file || !file.filepath) return res.status(400).json({ error: 'file required' })

  // Read file into a buffer for upload (compatible with global fetch body types)
  const buffer = await fs.promises.readFile(file.filepath)
      // Use the original filename (sanitized) as the object path per user request.
      const sanitize = (s: string) => s.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-')
      const origName = String(file.originalFilename || 'upload')
      const objectPath = sanitize(origName)
      const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${encodeURIComponent(objectPath)}`

      // Check if object already exists to avoid duplicate uploads. If it exists, skip upload.
      const checkRes = await fetch(uploadUrl, { method: 'HEAD', headers: { Authorization: `Bearer ${serviceKey}` } as any })
      if (checkRes.ok) {
        // object exists — use existing public URL
      } else {
        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${serviceKey}`,
            'Content-Type': file.mimetype || 'application/octet-stream'
          },
          body: buffer as any
        })

        if(!uploadRes.ok){
          const txt = await uploadRes.text()
          return res.status(500).json({ error: 'Supabase upload failed', detail: txt })
        }
      }

      const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${encodeURIComponent(objectPath)}`

      // persist metadata — avoid creating duplicate DB records for the same URL
      const existing = await prisma.material.findFirst({ where: { url: publicUrl } })
      let created: any
      if (existing) {
        created = existing
      } else {
        created = await prisma.material.create({ data: {
          title,
          level,
          semester,
          fileType,
          url: publicUrl,
          originalName: file.originalFilename || ''
        }})
      }

      // cleanup temp file
      try{ fs.unlinkSync(file.filepath) }catch(e){}

      res.json({ ok: true, storage: 'supabase', url: publicUrl, id: created.id })
    }catch(e:any){
      console.error('upload-supabase error', e)
      res.status(500).json({ error: e?.message || 'server error' })
    }
  })
}
