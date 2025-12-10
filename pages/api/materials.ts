import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  const { level, semester, fileType } = req.query
  if(req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  if(!level || !semester || !fileType) return res.status(400).json({ error: 'level, semester and fileType are required' })

  // We store level/semester/fileType as plain strings in SQLite.
  // Validate incoming values minimally and query by those strings.
  const allowedLevels = ['100','200','300','400','500']
  const allowedSemesters = ['Harmattan','Rain']
  const allowedFileTypes = ['PDF Material','Past Question','Course Form']

  const lv = level as string
  const sem = semester as string
  const ft = fileType as string

  if(!allowedLevels.includes(lv) || !allowedSemesters.includes(sem) || !allowedFileTypes.includes(ft)){
    return res.status(400).json({ error: 'invalid query values' })
  }

  const materials = await prisma.material.findMany({
    where: { level: lv, semester: sem, fileType: ft },
    orderBy: { createdAt: 'desc' }
  })

  res.json(materials)
}
