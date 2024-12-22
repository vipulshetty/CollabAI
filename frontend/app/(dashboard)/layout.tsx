'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Video, BarChart2, Calendar, Users, Settings, LogOut, PieChart } from 'lucide-react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { MeetingProvider } from '@/contexts/MeetingContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      useRouter().push('/auth/signin');
    }
  });
  const router = useRouter();

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-2xl text-gray-600"
        >
          Loading...
        </motion.div>
      </div>
    );
  }

  return (
    <MeetingProvider>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b fixed w-full top-0 z-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link href="/" className="flex items-center">
                  <Video className="w-8 h-8 text-blue-500" />
                  <span className="ml-2 font-semibold text-xl">CollabAI</span>
                </Link>
                <div className="hidden md:flex ml-10 space-x-8">
                  {[
                    { href: '/dashboard', icon: <BarChart2 className="w-5 h-5" />, label: 'Dashboard' },
                    { href: '/meetings/create', icon: <Video className="w-5 h-5" />, label: 'New Meeting' },
                    { href: '/meetings/upcoming', icon: <Calendar className="w-5 h-5" />, label: 'Upcoming' },
                    { href: '/analytics', icon: <PieChart className="w-5 h-5" />, label: 'Analytics' },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-500"
                    >
                      {item.icon}
                      <span className="ml-2">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="flex items-center">
                {session?.user?.email && (
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">{session.user.email}</span>
                    <button
                      onClick={() => signOut()}
                      className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-red-500"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="ml-2">Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>

        <main className="pt-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </MeetingProvider>
  );
}