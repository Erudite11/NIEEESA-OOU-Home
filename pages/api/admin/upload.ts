import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import os from 'os'
import fs from 'fs'
import path from 'path'
import { v2 as cloudinary } from 'cloudinary'
import { prisma } from '../../../lib/prisma'
import { isAdminAuthed } from '../../../lib/auth'

export const config = { api: { bodyParser: false } }

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const parseForm = (req: NextApiRequest) => {
  // Increase maxFileSize to allow larger uploads (bytes). Adjust as needed.
  // Also keep extensions to preserve file types.
  const form = formidable({ multiples: false, maxFileSize: 500 * 1024 * 1024, keepExtensions: true })
  return new Promise<{ fields: any; files: any }>((resolve, reject) => {
    form.parse(req as any, (err: any, fields: any, files: any) => {
      if (err) return reject(err)
      resolve({ fields, files })
    })
  })
}

function ensureUploadsDir() {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
  return uploadsDir
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAdminAuthed(req)) return res.status(401).json({ error: 'unauthorized' })
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { fields, files } = await parseForm(req)
    const title = String(fields.title || '')
    const level = String(fields.level || '')
    const semester = String(fields.semester || '')
    const fileType = String(fields.fileType || '')

    const file = files?.file as any
    if (!file) return res.status(400).json({ error: 'file required' })

    const allowedLevels = ['100', '200', '300', '400', '500']
    const allowedSemesters = ['Harmattan', 'Rain']
    const allowedFileTypes = ['PDF Material', 'Past Question', 'Course Form']

    if (!allowedLevels.includes(level) || !allowedSemesters.includes(semester) || !allowedFileTypes.includes(fileType)) {
      return res.status(400).json({ error: 'invalid values' })
    }

    const hasCloudinary = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)

    let url = ''
    let storage: 'cloudinary' | 'local' = 'cloudinary'

    const tmpPath = file.filepath || file.path
    const tmpSize = file.size || (tmpPath ? (await fs.promises.stat(tmpPath)).size : 0)
    const CLOUDINARY_SINGLE_LIMIT = 10 * 1024 * 1024 // 10 MB - Cloudinary free plan single-file limit (approx)

    if (hasCloudinary) {
      // helper: streaming upload
      const uploadFromStream = (filePath: string) =>
        new Promise<any>((resolve, reject) => {
          const readStream = fs.createReadStream(filePath)
          const stream = cloudinary.uploader.upload_stream({ folder: 'nieeesa', resource_type: 'auto' }, (err: any, result: any) => {
            if (err) return reject(err)
            resolve(result)
          })
          readStream.on('error', (err) => reject(err))
          readStream.pipe(stream)
        })

      // helper: upload_large for big files (resumable)
      const uploadLarge = (filePath: string) =>
        new Promise<any>((resolve, reject) => {
          // chunk_size in bytes, tune as needed
          // @ts-ignore upload_large may not be in typings
          cloudinary.uploader.upload_large(filePath, { folder: 'nieeesa', resource_type: 'auto', chunk_size: 6000000 }, (err: any, result: any) => {
            if (err) return reject(err)
            resolve(result)
          })
        })

      try {
        if (tmpSize > CLOUDINARY_SINGLE_LIMIT) {
          // use upload_large for big files
          const result = await uploadLarge(tmpPath)
          url = result.secure_url
        } else {
          try {
            const result = await uploadFromStream(tmpPath)
            url = result.secure_url
          } catch (err: any) {
            // if Cloudinary rejects due to size limits, try upload_large before falling back
            const isSizeLimit = err && (err.http_code === 400 || err.http_code === '400') && /Maximum is \d+/.test(String(err.message || ''))
            if (isSizeLimit) {
              try {
                const result = await uploadLarge(tmpPath)
                url = result.secure_url
              } catch (err2:any) {
                console.error('Cloudinary upload_large also failed', err2)
                // inform client that direct-to-supabase is recommended if configured
                const supabaseAvailable = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
                if (supabaseAvailable) return res.status(400).json({ success: false, error: 'cloudinary_size_limit', message: String(err.message || err), fallback: 'supabase' })
                storage = 'local'
              }
            } else {
              console.error('Cloudinary streaming upload failed, falling back to local', err)
              storage = 'local'
            }
          }
        }
      } catch (e:any) {
        console.error('Unexpected Cloudinary error, falling back to local', e)
        storage = 'local'
      }
    }

    if (!hasCloudinary || storage === 'local') {
      storage = 'local'
      const uploadsDir = ensureUploadsDir()
      const originalName = file.originalFilename || file.originalname || 'upload'
      const sanitize = (s: string) => s.replace(/[^a-zA-Z0-9._-]/g, '-')
      const fileName = sanitize(String(originalName))
      const dest = path.join(uploadsDir, fileName)
      // If a file with the same name already exists, do not overwrite — keep existing file to avoid accidental data loss.
      if (!fs.existsSync(dest)) {
        await fs.promises.copyFile(tmpPath, dest)
      }
      url = `/uploads/${fileName}`
    }

  const originalName = file.originalFilename || file.originalname || ''
  // Avoid duplicate DB record for same URL
  const existing = await prisma.material.findFirst({ where: { url } })
  let material
  if (existing) {
    material = existing
  } else {
    material = await prisma.material.create({ data: { title: title || 'Untitled', level, semester, fileType, url, originalName } })
  }
  return res.status(200).json({ ok: true, material, storage })
  } catch (err: any) {
    console.error(err)
    return res.status(500).json({ error: err.message || 'server error' })
  }
}
