import Navbar from '@/components/Navbar'
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-config";
import { redirect } from 'next/navigation'

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
