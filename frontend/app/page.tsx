'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Video, Users, Shield, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

export default function HomePage() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleGetStarted = () => {
    if (session) {
      router.push('/dashboard');
    } else {
      router.push('/auth/signup');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
      {/* Navbar */}
      <nav className="backdrop-blur-sm bg-white/50 dark:bg-gray-900/50 sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <motion.div
                initial={{ rotate: -10, scale: 0.9 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Video className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </motion.div>
              <motion.h1
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 ml-2"
              >
                CollabAI
              </motion.h1>
            </div>
            <div className="flex items-center space-x-4">
              {session ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/dashboard')}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2 rounded-lg shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300"
                >
                  Dashboard
                </motion.button>
              ) : (
                <Link href="/auth/signin">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2 rounded-lg shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300"
                  >
                    Sign In
                  </motion.button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="relative">
        {/* Hero Section */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center"
        >
          <motion.div variants={item} className="max-w-4xl mx-auto">
            <h2 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
              Smart Video Meetings with AI
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
              Transform your virtual meetings with AI-powered features. Get real-time transcription, 
              smart summaries, and collaborative tools all in one place.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300"
              >
                Get Started
                <ArrowRight className="inline-block ml-2 w-5 h-5" />
              </motion.button>
            </div>

            {/* Quick Benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-16">
              {[
                "AI-Powered Transcription",
                "Smart Meeting Summaries",
                "Team Collaboration Tools",
                "Secure & Private"
              ].map((benefit, index) => (
                <motion.div
                  key={benefit}
                  variants={item}
                  className="flex items-center gap-2 text-gray-700 dark:text-gray-300"
                >
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span>{benefit}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Features Section */}
        <section id="features" className="py-20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            >
              <Feature
                icon={<Video className="w-8 h-8 text-blue-600 dark:text-blue-400" />}
                title="AI Transcription"
                description="Get real-time transcription of your meetings powered by advanced AI."
              />
              <Feature
                icon={<Shield className="w-8 h-8 text-purple-600 dark:text-purple-400" />}
                title="Secure & Private"
                description="End-to-end encryption and advanced security features to protect your meetings."
              />
              <Feature
                icon={<Users className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />}
                title="Team Collaboration"
                description="Interactive whiteboard, file sharing, and breakout rooms for better teamwork."
              />
              <Feature
                icon={<Zap className="w-8 h-8 text-pink-600 dark:text-pink-400" />}
                title="Smart Summaries"
                description="Get AI-generated meeting summaries and action items automatically."
              />
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Feature({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <motion.div
      variants={item}
      whileHover={{ y: -5 }}
      className="p-8 rounded-xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700"
    >
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400">{description}</p>
    </motion.div>
  );
}
