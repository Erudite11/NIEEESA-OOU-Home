export function isAdminAuthed(req: any){
  // Dev convenience: if no admin password or secret set, allow access
  const adminPassword = process.env.ADMIN_PASSWORD
  const adminSecret = process.env.ADMIN_SECRET
  if(!adminPassword && !adminSecret) return true

  // Check cookie
  const cookie = req.headers?.cookie || ''
  if(cookie.includes('nieeesa_admin=1')) return true

  // Check header
  const header = req.headers?.['x-admin-key'] || req.headers?.['X-Admin-Key']
  if(header && adminSecret && String(header) === adminSecret) return true

  // Check query param
  const url = req.url || ''
  const q = url.includes('admin_key=') ? new URL('http://localhost'+url).searchParams.get('admin_key') : null
  if(q && adminSecret && q === adminSecret) return true

  // As a fallback, check password cookie
  if(adminPassword){
    if(cookie.includes('nieeesa_admin=1')) return true
  }

  return false
}
