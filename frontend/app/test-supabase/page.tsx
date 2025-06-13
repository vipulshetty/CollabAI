'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestSupabasePage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      
      // Test basic connection
      const { data, error } = await supabase.from('test').select('*').limit(1)
      
      setResult({
        success: !error,
        error: error?.message,
        data: data,
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      })
    } catch (err: any) {
      setResult({
        success: false,
        error: err.message,
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      })
    } finally {
      setLoading(false)
    }
  }

  const testAuth = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      
      // Test auth session
      const { data: session, error } = await supabase.auth.getSession()
      
      setResult({
        type: 'auth',
        hasSession: !!session.session,
        user: session.session?.user?.email,
        error: error?.message,
        accessToken: session.session?.access_token ? 'Present' : 'Missing'
      })
    } catch (err: any) {
      setResult({
        type: 'auth',
        error: err.message
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Supabase Connection Test</h1>
      
      <div className="space-y-4">
        <button 
          onClick={testConnection}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Connection'}
        </button>
        
        <button 
          onClick={testAuth}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50 ml-4"
        >
          {loading ? 'Testing...' : 'Test Auth Session'}
        </button>

        {result && (
          <div className="p-4 border rounded bg-gray-50">
            <h2 className="font-semibold mb-2">Test Result:</h2>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
