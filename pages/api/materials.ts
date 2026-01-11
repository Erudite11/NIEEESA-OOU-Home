import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  const { level, semester, fileType } = req.query
  if(req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  if(!level || !semester || !fileType) return res.status(400).json({ error: 'level, semester and fileType are required' })

  // Normalize inputs (trim and ensure string)
  const lv = String(level).trim()
  const sem = String(semester).trim()
  const ft = String(fileType).trim()

  // Query by exact stored strings (DB stores plain text values)
  try{
    const materials = await prisma.material.findMany({
      where: { level: lv, semester: sem, fileType: ft },
      orderBy: { createdAt: 'desc' }
    })
    res.json(materials)
  }catch(err:any){
    res.status(500).json({ error: err.message || 'server error' })
  }
}
