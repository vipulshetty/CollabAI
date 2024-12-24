'use client'

import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Video, Github, Mail, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState<{[key: string]: boolean}>({
    github: false,
    google: false
  })

  // Handle error from URL
  useEffect(() => {
    const error = searchParams.get('error')
    if (error) {
      console.error('Auth error:', error)
      toast.error(
        error === 'OAuthSignin' 
          ? 'Could not sign in with this provider. Please try again.' 
          : 'An error occurred during sign in.'
      )
    }
  }, [searchParams])

  const handleSignIn = async (provider: string) => {
    try {
      setIsLoading(prev => ({ ...prev, [provider]: true }))
      
      const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
      console.log('Starting sign in with:', provider, 'callback:', callbackUrl)
      
      await signIn(provider, {
        callbackUrl: callbackUrl.startsWith('/') ? callbackUrl : '/dashboard',
        redirect: true
      })
    } catch (error) {
      console.error('Sign in error:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(prev => ({ ...prev, [provider]: false }))
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Video className="mx-auto h-12 w-12 text-blue-500" />
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10 dark:bg-gray-800">
          <div className="space-y-4">
            <Button
              onClick={() => handleSignIn('google')}
              disabled={isLoading.google}
              className="w-full flex items-center justify-center gap-2"
              variant="outline"
            >
              {isLoading.google ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Mail className="h-5 w-5" />
              )}
              Continue with Google
            </Button>

            <Button
              onClick={() => handleSignIn('github')}
              disabled={isLoading.github}
              className="w-full flex items-center justify-center gap-2"
              variant="outline"
            >
              {isLoading.github ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Github className="h-5 w-5" />
              )}
              Continue with GitHub
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
