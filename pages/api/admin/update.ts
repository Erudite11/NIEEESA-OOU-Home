import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { isAdminAuthed } from '../../../lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  if(!isAdminAuthed(req)) return res.status(401).json({ error: 'unauthorized' })
  if(req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { id, title, level, semester, fileType, url } = req.body
  if(!id) return res.status(400).json({ error: 'id required' })

  try{
    const data: any = {}
    if(title) data.title = title
    if(level) data.level = level
    if(semester) data.semester = semester
    if(fileType) data.fileType = fileType
    if(url) data.url = url

    const material = await prisma.material.update({ where: { id: Number(id) }, data })
    res.json({ success: true, material })
  }catch(err:any){
    console.error(err)
    res.status(500).json({ error: err.message || 'server error' })
  }
}
