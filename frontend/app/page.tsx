'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Video, Users, Shield, ArrowRight, Brain, FileText, Sparkles } from 'lucide-react';
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

const Feature = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <motion.div
    variants={item}
    className="relative group"
    whileHover={{ y: -5 }}
  >
    {/* Decorative elements */}
    <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl opacity-20 group-hover:opacity-40 blur transition duration-500" />
    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
    
    {/* Main content */}
    <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl p-8 rounded-2xl border border-white/20 dark:border-gray-700/30 shadow-xl hover:shadow-2xl transition-all duration-300 h-full overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Icon container with gradient background */}
      <div className="relative bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-4 w-fit mb-6 group-hover:scale-110 transition-transform duration-300">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur-sm" />
        <div className="relative">
          {icon}
        </div>
      </div>

      {/* Title with gradient text */}
      <h3 className="text-xl font-semibold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 group-hover:from-blue-500 group-hover:via-purple-500 group-hover:to-pink-500 transition-all duration-300">
        {title}
      </h3>

      {/* Description with improved typography */}
      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
        {description}
      </p>

      {/* Decorative corner elements */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-bl-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-purple-500/10 to-pink-500/10 rounded-tr-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </div>
  </motion.div>
);

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();

  const handleGetStarted = () => {
    if (user) {
      router.push('/protected/dashboard');
    } else {
      router.push('/auth/signup');
    }
  };

  const features = [
    {
      icon: <Brain className="w-8 h-8 text-blue-600/90 group-hover:text-blue-500 transition-colors duration-300" />,
      title: "AI-Powered Insights",
      description: "Experience real-time transcription and intelligent meeting summaries powered by cutting-edge AI technology."
    },
    {
      icon: <Users className="w-8 h-8 text-purple-600/90 group-hover:text-purple-500 transition-colors duration-300" />,
      title: "Seamless Collaboration",
      description: "Connect effortlessly with your team through crystal-clear video calls and intuitive collaborative tools."
    },
    {
      icon: <FileText className="w-8 h-8 text-pink-600/90 group-hover:text-pink-500 transition-colors duration-300" />,
      title: "Smart Documentation",
      description: "Let AI automatically capture and organize your meeting notes, action items, and key decisions."
    },
    {
      icon: <Shield className="w-8 h-8 text-indigo-600/90 group-hover:text-indigo-500 transition-colors duration-300" />,
      title: "Enterprise Security",
      description: "Rest easy with end-to-end encryption and enterprise-grade security protecting your meetings."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
      {/* Hero Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10 blur-3xl transform rotate-12" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-purple-500/10 via-pink-500/5 to-blue-500/10 blur-3xl transform -rotate-12" />
      </div>

      {/* Navbar */}
      <nav className="backdrop-blur-md bg-white/60 dark:bg-gray-900/60 sticky top-0 z-50 border-b border-white/20 dark:border-gray-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <motion.div
                initial={{ rotate: -10, scale: 0.9 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-md" />
                <Video className="relative w-8 h-8 text-blue-600 dark:text-blue-400" />
              </motion.div>
              <motion.h1
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 ml-3"
              >
                CollabAI
              </motion.h1>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/protected/dashboard')}
                  className="relative group"
                >
                  {/* Animated RGB border */}
                  <div className="absolute -inset-0.5 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-gradient-x"></div>

                  {/* Button content */}
                  <div className="relative bg-white dark:bg-gray-900 px-6 py-2 rounded-lg leading-none flex items-center backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg">
                    <span className="text-gray-900 dark:text-white font-medium tracking-wide">
                      Dashboard
                    </span>
                  </div>
                </motion.button>
              ) : (
                <Link href="/auth/signin">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative group px-6 py-2"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur-sm" />
                    <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-6 py-2 rounded-lg shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300">
                      Sign In
                    </div>
                  </motion.button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="relative overflow-hidden">
        {/* Hero Section */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20"
        >
          <motion.div variants={item} className="max-w-4xl mx-auto text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 bg-blue-500/10 rounded-full mb-8">
              <Sparkles className="w-4 h-4 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-600">Revolutionizing Virtual Meetings</span>
            </div>
            <h2 className="text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
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
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur-sm group-hover:blur-md transition-all duration-300" />
                <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-8 py-3 rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300 text-lg font-semibold">
                  Get Started
                  <ArrowRight className="inline-block ml-2 w-5 h-5" />
                </div>
              </motion.button>
              <Link href="/about">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-white dark:bg-gray-800 rounded-xl blur-sm group-hover:blur-md transition-all duration-300" />
                  <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-800 dark:text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-lg font-semibold">
                    Learn More
                  </div>
                </motion.button>
              </Link>
            </div>
          </motion.div>

          {/* Features Grid */}
          <motion.div 
            variants={container}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12"
          >
            {features.map((feature, index) => (
              <Feature
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
