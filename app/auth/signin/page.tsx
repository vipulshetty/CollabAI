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
      console.error('Auth error from URL:', error);
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
      
      console.log('Starting sign in...', {
        provider,
        callbackUrl,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        FRONTEND_URL: process.env.FRONTEND_URL
      });
      
      const result = await signIn(provider, {
        callbackUrl,
        redirect: true
      })
      
      if (result) {
        console.log('Sign in result:', result);
        if (result.error) {
          console.error('Sign in error:', result.error);
          toast.error(`Authentication failed: ${result.error}`);
        } else if (result.url) {
          console.log('Redirecting to:', result.url);
          router.push(result.url);
        }
      }
    } catch (error) {
      console.error('Sign in error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(prev => ({ ...prev, [provider]: false }))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950 flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02] bg-center pointer-events-none" />
      
      <div className="absolute inset-0">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-blue-500 to-indigo-500 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-200 dark:border-gray-800"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-block group">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-200" />
              <div className="relative">
                <Video className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              </div>
            </div>
          </Link>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Welcome Back</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Sign in to continue to CollabAI</p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={() => handleSignIn('github')}
            disabled={isLoading.github}
            className="w-full h-12 bg-gray-900 hover:bg-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 text-white"
          >
            {isLoading.github ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Github className="w-5 h-5 mr-2" />
                Continue with GitHub
              </>
            )}
          </Button>

          <Button
            onClick={() => handleSignIn('google')}
            disabled={isLoading.google}
            variant="outline"
            className="w-full h-12 border-2"
          >
            {isLoading.google ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Mail className="w-5 h-5 mr-2 text-red-500" />
                Continue with Google
              </>
            )}
          </Button>
        </div>

        <div className="relative mt-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">Don't have an account?</span>
          </div>
        </div>

        <Button
          asChild
          variant="ghost"
          className="w-full mt-4 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
        >
          <Link href="/auth/signup">Create an account</Link>
        </Button>
      </motion.div>
    </div>
  )
}
