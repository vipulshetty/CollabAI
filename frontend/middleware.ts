import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Update the request cookies
          request.cookies.set({
            name,
            value,
            ...options,
          })
          // Create a new response with updated cookies
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          // Set the cookie in the response
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          // Update the request cookies
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          // Create a new response with updated cookies
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          // Remove the cookie from the response
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Check if user is authenticated
  const { data: { user }, error } = await supabase.auth.getUser()

  // Debug: Check what cookies are available
  const allCookies = request.cookies.getAll()
  const supabaseCookies = allCookies.filter(cookie =>
    cookie.name.includes('supabase') ||
    cookie.name.includes('sb-') ||
    cookie.name.includes('auth')
  )

  console.log('Middleware auth check:', {
    path: request.nextUrl.pathname,
    user: !!user,
    email: user?.email,
    error: error?.message,
    totalCookies: allCookies.length,
    supabaseCookies: supabaseCookies.map(c => ({ name: c.name, hasValue: !!c.value }))
  })

  // If user is not authenticated and trying to access protected routes
  if (!user && (
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/protected') ||
    request.nextUrl.pathname.startsWith('/profile') ||
    request.nextUrl.pathname.startsWith('/meetings') ||
    request.nextUrl.pathname.startsWith('/room')
  )) {
    console.log('Redirecting to sign-in:', request.nextUrl.pathname)
    // Preserve the original URL as a redirect parameter
    const redirectUrl = new URL('/auth/signin', request.url)
    redirectUrl.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/protected/:path*',
    '/profile/:path*',
    '/meetings/:path*',
    '/room/:path*'
  ]
};