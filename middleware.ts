import { NextRequest, NextResponse } from 'next/server'

// 1. Specify protected and public routes
const protectedRoutes = ['/admin'] // Only protect admin for now

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route))

  // Temporarily disabled for testing
  // if (isProtectedRoute) {
  //   const hasAuthCookies = req.cookies.getAll().some(cookie =>
  //     cookie.name.startsWith('sb-') ||
  //     cookie.name.includes('supabase')
  //   )

  //   if (!hasAuthCookies) {
  //     return NextResponse.redirect(new URL('/login', req.nextUrl))
  //   }
  // }

  return NextResponse.next()
}

// Routes Middleware should not run on
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}