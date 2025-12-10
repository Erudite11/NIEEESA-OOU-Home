import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Protect /admin routes at the middleware level so they cannot be viewed without auth
export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl

  // only run for /admin paths
  if (!pathname.startsWith('/admin')) return NextResponse.next()

  // Allow the login page itself
  if (pathname === '/admin/login') return NextResponse.next()

  // Check cookie: nieeesa_admin=1
  const cookie = req.cookies.get('nieeesa_admin')?.value
  if (cookie === '1') return NextResponse.next()

  // Check admin secret header
  const header = req.headers.get('x-admin-key') || req.headers.get('X-Admin-Key')
  if (header && process.env.ADMIN_SECRET && header === process.env.ADMIN_SECRET) return NextResponse.next()

  // If admin_key query param present and matches ADMIN_SECRET, allow and set cookie
  const adminKey = searchParams.get('admin_key')
  if (adminKey && process.env.ADMIN_SECRET && adminKey === process.env.ADMIN_SECRET) {
    const url = req.nextUrl.clone()
    url.pathname = '/admin'
    const res = NextResponse.redirect(url)
    res.cookies.set('nieeesa_admin', '1', { path: '/', httpOnly: false, maxAge: 60 * 60 })
    return res
  }

  // Not authenticated — redirect to login
  const loginUrl = req.nextUrl.clone()
  loginUrl.pathname = '/admin/login'
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/admin/:path*'],
}
