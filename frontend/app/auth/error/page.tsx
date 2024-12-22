'use client'

import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Video, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (error: string) => {
    switch (error) {
      case 'AccessDenied':
        return 'Access denied. Please try signing in with a different account.'
      case 'Verification':
        return 'The verification link is invalid or has expired.'
      default:
        return 'An error occurred during authentication. Please try again.'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-900 dark:to-red-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 w-full max-w-md border border-red-200 dark:border-red-800"
      >
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">Authentication Error</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {error ? getErrorMessage(error) : 'An unexpected error occurred'}
          </p>
        </div>

        <div className="space-y-4">
          <Button
            asChild
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            <Link href="/auth/signin">
              Try Again
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="w-full"
          >
            <Link href="/">
              Return Home
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
