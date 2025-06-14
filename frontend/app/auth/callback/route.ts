import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/dashboard'

  console.log('Auth callback called with:', {
    code: !!code,
    error,
    origin,
    next,
    fullUrl: request.url,
    hasParams: searchParams.toString(),
    environment: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    isProduction: process.env.NODE_ENV === 'production'
  })

  if (error) {
    console.error('OAuth error:', error)
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(error)}`)
  }

  if (code) {
    const supabase = createClient()
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    console.log('Exchange result:', {
      success: !exchangeError,
      error: exchangeError?.message,
      user: data?.user?.email
    })

    if (!exchangeError) {
      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'

      let redirectUrl;
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        redirectUrl = `${origin}${next}`;
      } else if (forwardedHost) {
        redirectUrl = `https://${forwardedHost}${next}`;
      } else {
        redirectUrl = `${origin}${next}`;
      }

      console.log('Auth callback: Redirecting to:', redirectUrl);
      return NextResponse.redirect(redirectUrl);
    } else {
      console.error('Exchange error:', exchangeError)
    }
  }

  // If no code and no error, this might be an incorrect callback
  if (!code && !error) {
    console.log('Callback called without code or error - redirecting to sign-in')
    return NextResponse.redirect(`${origin}/auth/signin`)
  }

  // return the user to an error page with instructions
  console.log('Redirecting to error page')
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
