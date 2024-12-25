'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Video, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  User,
  Calendar,
  MessageSquare,
  Bell,
  BarChart3
} from 'lucide-react';

export default function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    {
      id: 1,
      title: 'New Meeting Scheduled',
      message: 'Team Sync at 3 PM',
      time: '1 hour ago'
    },
    {
      id: 2,
      title: 'Meeting Summary Ready',
      message: 'Project Review summary is ready',
      time: '2 hours ago'
    }
  ];

  const menuItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: Calendar
    },
    {
      label: 'Meetings',
      href: '/meetings',
      icon: Video
    },
    {
      label: 'Analytics',
      href: '/dashboard/analytics',
      icon: BarChart3
    },
    {
      label: 'Messages',
      href: '/messages',
      icon: MessageSquare
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: Settings
    }
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <motion.div
              initial={{ rotate: -10, scale: 0.9 }}
              animate={{ rotate: 0, scale: 1 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-md"></div>
              <Video className="relative w-8 h-8 text-blue-600 dark:text-blue-400" />
            </motion.div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
              CollabAI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {session && menuItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center space-x-1 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            ))}

            {/* Notifications */}
            {session && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    2
                  </span>
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      >
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {notification.title}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {notification.message}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {notification.time}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* User Menu */}
            {session ? (
              <div className="relative">
                <button className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <User className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  <span className="text-gray-700 dark:text-gray-300">{session.user?.name}</span>
                </button>
              </div>
            ) : (
              <Link
                href="/auth/signin"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {isOpen ? (
              <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4">
            {session && menuItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center space-x-2 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <item.icon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                <span className="text-gray-700 dark:text-gray-300">{item.label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
