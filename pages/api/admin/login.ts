import type { NextApiRequest, NextApiResponse } from 'next'
import { isAdminAuthed } from '../../../lib/auth'

export default function handler(req: NextApiRequest, res: NextApiResponse){
  if(req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const password = req.body?.password
  const adminPassword = process.env.ADMIN_PASSWORD

  // If no ADMIN_PASSWORD is set, allow login automatically
  if(!adminPassword){
    res.setHeader('Set-Cookie', `nieeesa_admin=1; Path=/; HttpOnly; Max-Age=${60*60}`)
    return res.json({ success: true })
  }

  if(password === adminPassword){
    res.setHeader('Set-Cookie', `nieeesa_admin=1; Path=/; HttpOnly; Max-Age=${60*60}`)
    return res.json({ success: true })
  }

  res.status(401).json({ error: 'invalid password' })
}
