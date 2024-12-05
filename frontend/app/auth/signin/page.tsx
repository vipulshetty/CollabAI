'use client'

import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Video, Github, Mail } from 'lucide-react'
import Link from 'next/link'

export default function SignInPage() {
  const router = useRouter()

  const handleSignIn = async (provider: string) => {
    const result = await signIn(provider, {
      callbackUrl: '/dashboard',
      redirect: true
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <Video className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Welcome Back</h1>
          <p className="text-gray-600 mt-2">Sign in to continue to CollabAI</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => handleSignIn('github')}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white p-3 rounded-lg hover:bg-gray-800"
          >
            <Github className="w-5 h-5" />
            Continue with GitHub
          </button>

          <button
            onClick={() => handleSignIn('google')}
            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 p-3 rounded-lg hover:bg-gray-50"
          >
            <Mail className="w-5 h-5 text-red-500" />
            Continue with Google
          </button>
        </div>

        <p className="text-center text-sm text-gray-600 mt-8">
          Don't have an account?{' '}
          <Link href="/auth/signup" className="text-blue-500 hover:text-blue-600">
            Sign up
          </Link>
        </p>
      </motion.div>
    </div>
  )
}

