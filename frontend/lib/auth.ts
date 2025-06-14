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
  const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'

  // Build the callback URL with the redirect parameter if provided
  let callbackUrl = `${currentUrl}/auth/callback`
  if (redirectTo) {
    callbackUrl += `?next=${encodeURIComponent(redirectTo)}`
  }

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
