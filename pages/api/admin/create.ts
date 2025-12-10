import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { isAdminAuthed } from '../../../lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  if(!isAdminAuthed(req)) return res.status(401).json({ error: 'unauthorized' })
  if(req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try{
  const { title, level, semester, fileType, url, storage, originalName } = req.body
    if(!title || !level || !semester || !fileType || !url) return res.status(400).json({ error: 'missing fields' })

    const allowedLevels = ['100','200','300','400','500']
    const allowedSemesters = ['Harmattan','Rain']
    const allowedFileTypes = ['PDF Material','Past Question','Course Form']

    if(!allowedLevels.includes(level) || !allowedSemesters.includes(semester) || !allowedFileTypes.includes(fileType)){
      return res.status(400).json({ error: 'invalid values' })
    }

  const material = await prisma.material.create({ data: { title, level, semester, fileType, url, originalName } })
  return res.json({ success: true, material, storage: storage || 'supabase' })
  }catch(err:any){
    console.error(err)
    res.status(500).json({ error: err.message || 'server error' })
  }
}
