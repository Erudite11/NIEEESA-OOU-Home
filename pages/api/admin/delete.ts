import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { isAdminAuthed } from '../../../lib/auth'
import fs from 'fs'
import path from 'path'
import { v2 as cloudinary } from 'cloudinary'

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  if(!isAdminAuthed(req)) return res.status(401).json({ error: 'unauthorized' })
  if(req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { id } = req.body
  if(!id) return res.status(400).json({ error: 'id required' })
  try{
    const mat = await prisma.material.findUnique({ where: { id: Number(id) } })
    if(mat){
      const url = mat.url || ''
      // delete from cloudinary if it looks like cloudinary
      const hasCloudinary = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
      if(hasCloudinary && url.includes('res.cloudinary.com')){
        try{
          cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET })
          // attempt to extract public_id after folder (nieeesa/) and before extension
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
        }catch(e:any){
          console.error('Failed to delete from Cloudinary', e)
        }
      }

      // delete from supabase if service role key available
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      if(supabaseServiceKey && url.includes('/storage/v1/object/public/materials/')){
        try{
          const parts = url.split('/storage/v1/object/public/materials/')
          const objectPath = parts[1]
          if(objectPath){
            const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '')
            await fetch(`${supabaseUrl}/storage/v1/object/materials/${encodeURIComponent(objectPath)}`, { method: 'DELETE', headers: { Authorization: `Bearer ${supabaseServiceKey}` } as any } )
          }
        }catch(e:any){
          console.error('Failed to delete from Supabase', e)
        }
      }

      // delete local file if under /uploads/
      if(url.startsWith('/uploads/')){
        try{
          const p = path.join(process.cwd(), 'public', url.replace('/uploads/', 'uploads/'))
          if(fs.existsSync(p)) await fs.promises.unlink(p)
        }catch(e:any){ console.error('Failed to delete local file', e) }
      }

      await prisma.material.delete({ where: { id: Number(id) } })
    }
    res.json({ success: true })
  }catch(err:any){
    res.status(500).json({ error: err.message || 'server error' })
  }
}
