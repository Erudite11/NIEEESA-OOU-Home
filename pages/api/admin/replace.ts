import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
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
  const form = formidable({ multiples: false })
  return new Promise<{ fields: any, files: any }>((resolve, reject) => {
    form.parse(req as any, (err: any, fields: any, files: any) => {
      if(err) reject(err)
      resolve({ fields, files })
    })
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  if(!isAdminAuthed(req)) return res.status(401).json({ error: 'unauthorized' })
  if(req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try{
    const { fields, files } = await parseForm(req)
    const id = Number(fields.id)
    const file = files.file as any
    if(!id || !file) return res.status(400).json({ error: 'id and file required' })
    // delete existing stored file for this material if possible
    try{
      const existing = await prisma.material.findUnique({ where: { id } })
      if(existing && existing.url){
        const url = existing.url
        const hasCloudinary = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
        if(hasCloudinary && url.includes('res.cloudinary.com')){
          try{
            cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET })
            const marker = '/nieeesa/'
            const idx = url.indexOf(marker)
            if(idx !== -1){
              const after = url.slice(idx + marker.length)
              const dot = after.lastIndexOf('.')
              const publicId = dot !== -1 ? `nieeesa/${after.slice(0, dot)}` : `nieeesa/${after}`
              await new Promise((resolve, reject) => {
                cloudinary.uploader.destroy(publicId, { resource_type: 'auto' }, (err:any, res2:any) => {
                  if(err) return reject(err)
                  resolve(res2)
                })
              })
            }
          }catch(e:any){ console.error('failed deleting old cloudinary resource', e) }
        }
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if(supabaseServiceKey && url.includes('/storage/v1/object/public/materials/')){
          try{
            const parts = url.split('/storage/v1/object/public/materials/')
            const objectPath = parts[1]
            if(objectPath){
              const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '')
              await fetch(`${supabaseUrl}/storage/v1/object/materials/${encodeURIComponent(objectPath)}`, { method: 'DELETE', headers: { Authorization: `Bearer ${supabaseServiceKey}` } as any } )
            }
          }catch(e:any){ console.error('failed deleting old supabase resource', e) }
        }
        if(url.startsWith('/uploads/')){
          try{ const p = path.join(process.cwd(), 'public', url.replace('/uploads/', 'uploads/')); if(fs.existsSync(p)) await fs.promises.unlink(p) }catch(e:any){ console.error('failed deleting old local file', e) }
        }
      }
    }catch(e:any){ console.error('failed deleting existing resource', e) }
    
    // Decide whether to use Cloudinary or local
    const hasCloudinary = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
  let url: string = ''
  let storage: 'cloudinary' | 'local' = 'cloudinary'

    if(hasCloudinary){
      const tmpPath = file.filepath || file.path
      const tmpSize = file.size || (tmpPath ? (await fs.promises.stat(tmpPath)).size : 0)
      const CLOUDINARY_SINGLE_LIMIT = 10 * 1024 * 1024

      const uploadLarge = (filePath: string) =>
        new Promise<any>((resolve, reject) => {
          // @ts-ignore
          cloudinary.uploader.upload_large(filePath, { folder: 'nieeesa', resource_type: 'auto', chunk_size: 6000000 }, (err: any, result: any) => {
            if (err) return reject(err)
            resolve(result)
          })
        })

      try{
        if (tmpSize > CLOUDINARY_SINGLE_LIMIT) {
          const r = await uploadLarge(tmpPath)
          url = r.secure_url
        } else {
          try{
            const uploadResult = await cloudinary.uploader.upload(tmpPath, { folder: 'nieeesa', resource_type: 'auto' })
            url = uploadResult.secure_url
          }catch(e:any){
            const isSizeLimit = e && (e.http_code === 400 || e.http_code === '400') && /Maximum is \d+/.test(String(e.message || ''))
            if(isSizeLimit){
              try{
                const r = await uploadLarge(tmpPath)
                url = r.secure_url
              }catch(e2:any){
                console.error('Cloudinary upload_large also failed', e2)
                const supabaseAvailable = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
                if(supabaseAvailable) return res.status(400).json({ success: false, error: 'cloudinary_size_limit', message: String(e.message || e), fallback: 'supabase' })
                storage = 'local'
              }
            }else{
              console.error('Cloudinary replace failed, falling back to local', e)
              storage = 'local'
            }
          }
        }
      }catch(e:any){
        console.error('Unexpected Cloudinary error, falling back to local', e)
        storage = 'local'
      }
    }

    if(!hasCloudinary || storage === 'local'){
      storage = 'local'
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
      if(!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
      const originalName = file.originalFilename || file.originalname || 'upload'
      const sanitize = (s: string) => s.replace(/[^a-zA-Z0-9._-]/g, '-')
      const fileName = sanitize(String(originalName))
      const dest = path.join(uploadsDir, fileName)
      // For replace, we assume old file was removed above; write the new file unless it already exists.
      if (!fs.existsSync(dest)) {
        await fs.promises.copyFile(file.filepath || file.path, dest)
      }
      url = `/uploads/${fileName}`
    }

  const originalName = file.originalFilename || file.originalname || ''
  const material = await prisma.material.update({ where: { id }, data: { url, originalName } })
  res.json({ success: true, material, storage })
  }catch(err:any){
    console.error(err)
    res.status(500).json({ error: err.message || 'server error' })
  }
}
