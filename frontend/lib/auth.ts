import { createClient } from '@/lib/supabase/client'

export async function signInWithEmail(email: string, password: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  return { data, error }
}

export async function signUpWithEmail(email: string, password: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  return { data, error }
}

export async function signInWithGoogle(redirectTo?: string) {
  const supabase = createClient()

  // Get the current URL to determine the correct redirect URL
  let currentUrl;
  if (typeof window !== 'undefined') {
    currentUrl = window.location.origin;
    console.log('Google OAuth: Client-side origin:', currentUrl);
  } else {
    // Server-side fallback - prioritize localhost for development
    const isDevelopment = process.env.NODE_ENV === 'development' ||
                         !process.env.VERCEL_URL;

    if (isDevelopment) {
      currentUrl = 'http://localhost:3000';
      console.log('Google OAuth: Using development URL (server-side):', currentUrl);
    } else {
      currentUrl = process.env.NEXT_PUBLIC_APP_URL ||
                   process.env.NEXTAUTH_URL ||
                   process.env.FRONTEND_URL ||
                   'https://collabai-frontend.vercel.app';
      console.log('Google OAuth: Using production URL (server-side):', currentUrl);
    }
  }

  console.log('Google OAuth: Final base URL:', currentUrl);

  // Build the callback URL with the redirect parameter if provided
  let callbackUrl = `${currentUrl}/auth/callback`
  if (redirectTo) {
    callbackUrl += `?next=${encodeURIComponent(redirectTo)}`
    console.log('Google OAuth: Redirect URL preserved:', redirectTo);
  }

  console.log('Google OAuth: Full callback URL:', callbackUrl);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl
    }
  })

  return { data, error }
}

export async function signOut() {
  const supabase = createClient()
  
  const { error } = await supabase.auth.signOut()
  
  return { error }
}
