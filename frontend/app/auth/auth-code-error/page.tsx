'use client'

import { motion } from 'framer-motion'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useSearchParams } from 'next/navigation'

export default function AuthCodeErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md text-center"
      >
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/20">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-red-500/25">
            <AlertCircle className="h-8 w-8 text-white" />
          </div>

          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">
            Authentication Error
          </h1>
          
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            There was an error during the authentication process. Please try signing in again.
          </p>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-700 dark:text-red-300">
                <strong>Error details:</strong> {error}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <Button asChild className="w-full">
              <Link href="/auth/signin">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sign In
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="w-full">
              <Link href="/">
                Go to Home
              </Link>
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
