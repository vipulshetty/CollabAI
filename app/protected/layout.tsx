'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Video, BarChart2, Calendar, Settings, LogOut, PieChart, Bell } from 'lucide-react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { MeetingProvider } from '@/contexts/MeetingContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from '@/components/theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const shakeAnimation = {
  initial: { rotate: 0 },
  animate: {
    rotate: [0, -10, 10, -10, 10, -5, 5, -5, 5, 0],
    transition: {
      duration: 0.8,
      ease: "easeInOut",
      times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 1]
    }
  }
};

const OnUnauthenticated = () => {
  const router = useRouter();
  useEffect(() => {
    router.push('/auth/signin');
  }, [router]);
  return null;
};

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/auth/signin');
    }
  });

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const getInitials = (email: string) => {
    return email
      .split('@')[0]
      .split('.')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <MeetingProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 fixed w-full top-0 z-50 backdrop-blur-lg bg-opacity-80 dark:bg-opacity-80">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link href="/" className="flex items-center group">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-200"></div>
                    <motion.div 
                      className="relative"
                      initial="initial"
                      animate="animate"
                      variants={shakeAnimation}
                    >
                      <Video className="w-8 h-8 text-blue-500" />
                    </motion.div>
                  </div>
                  <span className="ml-2 font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">CollabAI</span>
                </Link>
                <div className="hidden md:flex ml-10 space-x-1">
                  {[
                    { href: '/dashboard', icon: <BarChart2 className="w-4 h-4" />, label: 'Dashboard' },
                    { href: '/meetings/create', icon: <Video className="w-4 h-4" />, label: 'New Meeting' },
                    { href: '/meetings/upcoming', icon: <Calendar className="w-4 h-4" />, label: 'Upcoming' },
                    { href: '/analytics', icon: <PieChart className="w-4 h-4" />, label: 'Analytics' },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                    >
                      <Button
                        variant="ghost"
                        className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200"
                      >
                        {item.icon}
                        <span className="ml-2">{item.label}</span>
                      </Button>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full"></span>
                </Button>

                <ThemeToggle />

                {session?.user?.email && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                        <Avatar className="h-10 w-10 rounded-full ring-2 ring-gray-200 dark:ring-gray-700">
                          <AvatarImage src={session.user.image || ''} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                            {getInitials(session.user.email)}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end">
                      <DropdownMenuLabel>
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{session.user.name || 'User'}</p>
                          <p className="text-xs leading-none text-muted-foreground">{session.user.email}</p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600 dark:text-red-400" onClick={() => signOut()}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign Out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </div>
        </nav>

        <main className="pt-20 min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </MeetingProvider>
  );
}
