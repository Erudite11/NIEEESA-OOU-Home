import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { isAdminAuthed } from '../../../lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  if(req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  if(!isAdminAuthed(req)) return res.status(401).json({ error: 'unauthenticated' })

  try{
    const materials = await prisma.material.findMany({ orderBy: { createdAt: 'desc' } })
    res.json(materials)
  }catch(err:any){
    console.error(err)
    res.status(500).json({ error: err.message || 'server error' })
  }
}
