'use client';

import { useEffect, useState } from 'react';
import { useMeetingContext } from '@/contexts/MeetingContext';
import { useAuth } from '@/contexts/AuthContext';
import { Meeting } from '@/types/meeting';
import { MeetingCard } from '@/components/MeetingCard';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Calendar,
  History,
  Loader2,
  Video,
  Clock,
  Users,
  TrendingUp,
  Sparkles,
  ArrowRight,
  PlayCircle,
  BarChart3,
  Zap,
  Star,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';


const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function DashboardClient() {
  const { meetings, fetchMeetings, loading } = useMeetingContext();
  const { user } = useAuth();
  const router = useRouter();
  const [recentMeetings, setRecentMeetings] = useState<Meeting[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (meetings) {
      const now = new Date();
      const recent = meetings
        .filter((meeting) => meeting.status === 'completed')
        .sort((a, b) => new Date(b.scheduled_date || b.created_at).getTime() - new Date(a.scheduled_date || a.created_at).getTime())
        .slice(0, 3);

      const upcoming = meetings
        .filter((meeting) => meeting.status === 'scheduled' && new Date(meeting.scheduled_date || meeting.created_at) > now)
        .sort((a, b) => new Date(a.scheduled_date || a.created_at).getTime() - new Date(b.scheduled_date || b.created_at).getTime())
        .slice(0, 3);

      setRecentMeetings(recent);
      setUpcomingMeetings(upcoming);
    }
  }, [meetings]);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center relative overflow-hidden">
        {/* Animated Background Elements */}
        <motion.div
          className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-48 h-48 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
            scale: [1, 0.8, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />

        <motion.div
          className="flex flex-col items-center space-y-8 relative z-10"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          {/* Main Loading Animation */}
          <div className="relative">
            {/* Outer Ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="w-24 h-24 border-4 border-blue-200/30 dark:border-blue-800/30 rounded-full"
            />

            {/* Middle Ring */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-2 w-20 h-20 border-4 border-transparent border-t-purple-500 border-r-blue-500 rounded-full"
            />

            {/* Inner Ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="absolute inset-4 w-16 h-16 border-4 border-transparent border-t-pink-500 border-l-indigo-500 rounded-full"
            />

            {/* Center Logo */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 180, 360]
                }}
                transition={{
                  scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                  rotate: { duration: 4, repeat: Infinity, ease: "linear" }
                }}
                className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-3 rounded-xl shadow-lg"
              >
                <Video className="w-6 h-6 text-white" />
              </motion.div>
            </div>

            {/* Floating Particles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                style={{
                  left: `${50 + Math.cos(i * 60 * Math.PI / 180) * 40}px`,
                  top: `${50 + Math.sin(i * 60 * Math.PI / 180) * 40}px`,
                }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                  rotate: [0, 360]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>

          {/* Loading Text with Animation */}
          <motion.div
            className="text-center space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <motion.h2
              className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              CollabAI
            </motion.h2>
            <motion.p
              className="text-gray-600 dark:text-gray-300 font-medium"
              animate={{
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              Preparing your intelligent workspace...
            </motion.p>

            {/* Progress Dots */}
            <div className="flex justify-center space-x-2 mt-4">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 1, 0.3]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20">
        {/* Floating Orbs */}
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
            scale: [1, 0.8, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 5
          }}
        />
        <motion.div
          className="absolute bottom-20 left-1/3 w-64 h-64 bg-gradient-to-r from-green-400/25 to-blue-400/25 rounded-full blur-3xl"
          animate={{
            x: [0, 120, 0],
            y: [0, -80, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 10
          }}
        />

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Section */}
        <motion.div
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8 md:p-12 text-white shadow-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          whileHover={{ scale: 1.01 }}
        >
          {/* Animated Background Gradient */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"
            animate={{
              background: [
                "linear-gradient(45deg, #2563eb, #7c3aed, #db2777)",
                "linear-gradient(45deg, #7c3aed, #db2777, #2563eb)",
                "linear-gradient(45deg, #db2777, #2563eb, #7c3aed)",
                "linear-gradient(45deg, #2563eb, #7c3aed, #db2777)"
              ]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />

          {/* Mesh Gradient Overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1)_0%,transparent_50%),radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.08)_0%,transparent_50%)]" />

          {/* Floating Particles */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white/30 rounded-full"
              style={{
                left: `${20 + i * 15}%`,
                top: `${10 + i * 10}%`,
              }}
              animate={{
                y: [-20, 20, -20],
                opacity: [0.3, 0.8, 0.3],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 4 + i,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.5,
              }}
            />
          ))}

          {/* Corner Decorations */}
          <div className="absolute top-4 right-4 opacity-30">
            <motion.div
              animate={{
                rotate: 360,
                scale: [1, 1.2, 1]
              }}
              transition={{
                rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
              }}
            >
              <Sparkles className="w-8 h-8" />
            </motion.div>
          </div>

          <div className="absolute bottom-4 left-4 opacity-30">
            <motion.div
              animate={{
                y: [-10, 10, -10],
                rotate: [0, 10, -10, 0]
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Video className="w-6 h-6" />
            </motion.div>
          </div>

          {/* Glowing Orbs */}
          <motion.div
            className="absolute top-1/4 right-1/4 w-32 h-32 bg-white/10 rounded-full blur-2xl"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-1/4 left-1/4 w-24 h-24 bg-yellow-300/20 rounded-full blur-2xl"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
          />

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-6 md:mb-0">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h1 className="text-3xl md:text-5xl font-bold mb-2">
                    {getGreeting()}, {user?.user_metadata?.full_name?.split(' ')[0] || 'there'}! 👋
                  </h1>
                  <p className="text-blue-100 text-lg md:text-xl mb-4">
                    Ready to collaborate and create amazing meetings?
                  </p>
                  <div className="flex items-center space-x-4 text-blue-100">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">{formatTime(currentTime)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm font-medium">{formatDate(currentTime)}</span>
                    </div>
                  </div>
                </motion.div>
              </div>

              <motion.div
                className="flex flex-col sm:flex-row gap-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Button
                  onClick={() => router.push('/dashboard/meetings/instant')}
                  size="lg"
                  className="bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/50 backdrop-blur-sm transition-all duration-300 group"
                >
                  <PlayCircle className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Start Meeting
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  onClick={() => router.push('/dashboard/meetings/schedule')}
                  size="lg"
                  variant="outline"
                  className="bg-white text-blue-600 hover:bg-blue-50 border-white hover:border-blue-200 transition-all duration-300"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Schedule
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          {[
            {
              title: 'Total Meetings',
              value: meetings?.length || 0,
              icon: Video,
              color: 'from-blue-500 to-blue-600',
              bgColor: 'bg-blue-50 dark:bg-blue-900/20',
              change: '+12%'
            },
            {
              title: 'This Week',
              value: meetings?.filter(m => {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return new Date(m.created_at) > weekAgo;
              }).length || 0,
              icon: Calendar,
              color: 'from-green-500 to-green-600',
              bgColor: 'bg-green-50 dark:bg-green-900/20',
              change: '+8%'
            },
            {
              title: 'Team Members',
              value: '24',
              icon: Users,
              color: 'from-purple-500 to-purple-600',
              bgColor: 'bg-purple-50 dark:bg-purple-900/20',
              change: '+3%'
            },
            {
              title: 'Productivity',
              value: '94%',
              icon: TrendingUp,
              color: 'from-pink-500 to-pink-600',
              bgColor: 'bg-pink-50 dark:bg-pink-900/20',
              change: '+5%'
            }
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + (index * 0.1) }}
            >
              <Card className={`${stat.bgColor} border-0 shadow-lg hover:shadow-2xl transition-all duration-500 group cursor-pointer relative overflow-hidden`}>
                {/* Hover Glow Effect */}
                <div className={`absolute inset-0 bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

                {/* Animated Border */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-20`}
                  initial={false}
                  whileHover={{
                    opacity: 0.2,
                    background: [
                      `linear-gradient(0deg, ${stat.color.split(' ')[1]}, ${stat.color.split(' ')[3]})`,
                      `linear-gradient(90deg, ${stat.color.split(' ')[1]}, ${stat.color.split(' ')[3]})`,
                      `linear-gradient(180deg, ${stat.color.split(' ')[1]}, ${stat.color.split(' ')[3]})`,
                      `linear-gradient(270deg, ${stat.color.split(' ')[1]}, ${stat.color.split(' ')[3]})`,
                      `linear-gradient(360deg, ${stat.color.split(' ')[1]}, ${stat.color.split(' ')[3]})`
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />

                <CardContent className="p-6 relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <motion.p
                        className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1"
                        whileHover={{ scale: 1.05 }}
                      >
                        {stat.title}
                      </motion.p>
                      <motion.p
                        className="text-3xl font-bold text-gray-900 dark:text-white"
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      >
                        {stat.value}
                      </motion.p>
                      <motion.div
                        className="flex items-center mt-2"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 + (index * 0.1) }}
                      >
                        <motion.div
                          animate={{ rotate: [0, 360] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        >
                          <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                        </motion.div>
                        <span className="text-xs text-green-600 font-medium">{stat.change}</span>
                        <span className="text-xs text-gray-500 ml-1">vs last week</span>
                      </motion.div>
                    </div>
                    <motion.div
                      className={`p-3 rounded-xl bg-gradient-to-r ${stat.color} shadow-lg relative overflow-hidden`}
                      whileHover={{
                        scale: 1.15,
                        rotate: 5,
                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      {/* Icon Glow */}
                      <motion.div
                        className="absolute inset-0 bg-white/20 rounded-xl"
                        animate={{ opacity: [0, 0.3, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      />
                      <stat.icon className="w-6 h-6 text-white relative z-10" />
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>



        {/* Recent and Upcoming Meetings */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Meetings */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 }}
          >
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-0 shadow-xl hover:shadow-2xl transition-all duration-500 relative overflow-hidden group">
              {/* Card Glow Effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                animate={{
                  background: [
                    "linear-gradient(45deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1), rgba(236,72,153,0.1))",
                    "linear-gradient(45deg, rgba(139,92,246,0.1), rgba(236,72,153,0.1), rgba(59,130,246,0.1))",
                    "linear-gradient(45deg, rgba(236,72,153,0.1), rgba(59,130,246,0.1), rgba(139,92,246,0.1))"
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />

              <CardHeader className="pb-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <motion.div
                      className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                      >
                        <History className="w-5 h-5 text-white" />
                      </motion.div>
                    </motion.div>
                    <div>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      >
                        <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                          Recent Meetings
                        </CardTitle>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          ✨ Your latest collaboration sessions
                        </p>
                      </motion.div>
                    </div>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push('/dashboard/meetings')}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 group/btn relative overflow-hidden"
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"
                      />
                      <span className="relative z-10">View All</span>
                      <motion.div
                        className="relative z-10"
                        animate={{ x: [0, 3, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </motion.div>
                    </Button>
                  </motion.div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <AnimatePresence>
                  {recentMeetings.length > 0 ? (
                    recentMeetings.map((meeting, index) => (
                      <motion.div
                        key={meeting.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.1 }}
                        className="group"
                      >
                        <div className="p-4 rounded-xl bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300 group-hover:scale-[1.02]">
                          <MeetingCard meeting={meeting} />
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12"
                    >
                      <div className="relative mb-6">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-xl"></div>
                        <div className="relative bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 p-6 rounded-full w-24 h-24 mx-auto flex items-center justify-center">
                          <History className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        No recent meetings
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        Start your first meeting to see it here
                      </p>
                      <Button
                        onClick={() => router.push('/dashboard/meetings/instant')}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Start Meeting
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>

          {/* Upcoming Meetings & Quick Actions */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.0 }}
          >
            {/* Upcoming Meetings */}
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-0 shadow-xl">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
                      Upcoming
                    </CardTitle>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Scheduled meetings
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingMeetings.length > 0 ? (
                  upcomingMeetings.map((meeting, index) => (
                    <motion.div
                      key={meeting.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200/50 dark:border-green-700/50"
                    >
                      <MeetingCard meeting={meeting} />
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <Calendar className="w-8 h-8 mx-auto mb-3 text-gray-400" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No upcoming meetings
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white border-0 shadow-xl relative overflow-hidden group">
              {/* Animated Background */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500"
                animate={{
                  background: [
                    "linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)",
                    "linear-gradient(135deg, #8b5cf6, #ec4899, #6366f1)",
                    "linear-gradient(135deg, #ec4899, #6366f1, #8b5cf6)",
                    "linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)"
                  ]
                }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              />

              {/* Floating Elements */}
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white/40 rounded-full"
                  style={{
                    left: `${20 + i * 20}%`,
                    top: `${15 + i * 15}%`,
                  }}
                  animate={{
                    y: [-10, 10, -10],
                    opacity: [0.4, 0.8, 0.4],
                    scale: [1, 1.5, 1],
                  }}
                  transition={{
                    duration: 3 + i,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.5,
                  }}
                />
              ))}

              <CardContent className="p-6 relative z-10">
                <motion.div
                  className="text-center mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                >
                  <motion.div
                    animate={{
                      rotate: [0, 360],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{
                      rotate: { duration: 4, repeat: Infinity, ease: "linear" },
                      scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                    }}
                  >
                    <Zap className="w-8 h-8 mx-auto mb-2" />
                  </motion.div>
                  <motion.h3
                    className="font-bold text-lg"
                    whileHover={{ scale: 1.05 }}
                  >
                    Quick Actions
                  </motion.h3>
                  <motion.p
                    className="text-indigo-100 text-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.4 }}
                  >
                    🚀 Start collaborating instantly
                  </motion.p>
                </motion.div>
                <div className="space-y-3">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={() => router.push('/dashboard/meetings/instant')}
                      className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/50 backdrop-blur-sm transition-all duration-300 relative overflow-hidden group/btn"
                    >
                      <motion.div
                        className="absolute inset-0 bg-white/10 transform translate-x-full group-hover/btn:translate-x-0 transition-transform duration-500"
                      />
                      <PlayCircle className="w-4 h-4 mr-2 relative z-10" />
                      <span className="relative z-10">Instant Meeting</span>
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={() => router.push('/dashboard/meetings/schedule')}
                      variant="outline"
                      className="w-full bg-white text-purple-600 hover:bg-purple-50 border-white hover:border-purple-200 relative overflow-hidden group/btn"
                    >
                      <motion.div
                        className="absolute inset-0 bg-purple-100 transform translate-x-full group-hover/btn:translate-x-0 transition-transform duration-500"
                      />
                      <Calendar className="w-4 h-4 mr-2 relative z-10" />
                      <span className="relative z-10">Schedule</span>
                    </Button>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
