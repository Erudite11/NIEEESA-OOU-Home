import type { NextApiRequest, NextApiResponse } from 'next'
import { isAdminAuthed } from '../../../lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  if(!isAdminAuthed(req)) return res.status(401).json({ error: 'unauthorized' })
  if(req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { bucket } = req.body || {}
  const bucketName = (bucket || process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'materials') as string

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '')
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if(!supabaseUrl || !serviceKey) return res.status(400).json({ error: 'Supabase URL or service role key missing on server' })

  try{
    // Try creating the bucket. If it already exists, Supabase may return 409 — treat that as success.
    const createRes = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceKey}`
      },
      body: JSON.stringify({ name: bucketName, public: true })
    })

    // Read the body text (some Supabase responses include useful JSON)
    const txt = await createRes.text()
    let parsed: any = null
    try { parsed = JSON.parse(txt) } catch (e) { /* ignore parse errors */ }

    // Treat OK or 409 (already exists) as success. Also be tolerant: if the
    // response contains 'Duplicate' or 'already exists' in its JSON, treat as success.
    if (createRes.ok || createRes.status === 409) {
      // created true when 2xx, false when 409
      return res.json({ success: true, created: createRes.ok, bucket: bucketName })
    }

    if (parsed) {
      const detailText = (parsed.error || parsed.message || parsed.detail || '').toString()
      if (/duplicate/i.test(detailText) || /already exists/i.test(detailText)) {
        return res.json({ success: true, created: false, bucket: bucketName })
      }
    }

    return res.status(500).json({ error: 'Failed to ensure bucket', detail: txt })
  }catch(err:any){
    console.error('ensure-bucket error', err)
    return res.status(500).json({ error: err?.message || 'server error' })
  }
}
