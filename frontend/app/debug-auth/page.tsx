'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export default function DebugAuthPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  if (loading) {
    return <div className="p-8">Loading authentication state...</div>
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Authentication Debug</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h2 className="font-semibold">Authentication Status:</h2>
          <p>Loading: {loading ? 'Yes' : 'No'}</p>
          <p>User: {user ? 'Signed In' : 'Not Signed In'}</p>
        </div>

        {user && (
          <div className="p-4 border rounded">
            <h2 className="font-semibold">User Details:</h2>
            <pre className="text-sm bg-gray-100 p-2 rounded mt-2">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        )}

        <div className="space-x-4">
          <button 
            onClick={() => router.push('/protected/dashboard')}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Go to Protected Dashboard
          </button>
          
          <button 
            onClick={() => router.push('/auth/signin')}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Go to Sign In
          </button>
          
          <button 
            onClick={() => router.push('/')}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  )
}
