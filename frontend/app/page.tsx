'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Video, Users, Shield, Zap } from 'lucide-react';
import { signIn } from 'next-auth/react';

export default function HomePage() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleGetStarted = () => {
    if (session) {
      router.push('/dashboard');
    } else {
      signIn('google', { callbackUrl: '/dashboard' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="flex justify-between items-center p-6">
        <div className="flex items-center">
          <Video className="w-8 h-8 text-blue-500" />
          <h1 className="text-2xl font-bold text-gray-800 ml-2">CollabAI</h1>
        </div>
        <div className="flex items-center space-x-4">
          {session ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/dashboard')}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
            >
              Dashboard
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
            >
              Sign In
            </motion.button>
          )}
        </div>
      </nav>

      <main className="container mx-auto px-6 py-12">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-800 mb-6">
            Smart Video Meetings with AI
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Transform your virtual meetings with AI-powered features. Get real-time transcription, smart summaries, and more.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGetStarted}
            className="bg-blue-500 text-white px-8 py-3 rounded-lg text-lg hover:bg-blue-600"
          >
            Get Started
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-16">
          <Feature
            icon={<Video className="w-8 h-8 text-blue-500" />}
            title="AI Transcription"
            description="Get real-time transcription of your meetings powered by advanced AI."
          />
          <Feature
            icon={<Shield className="w-8 h-8 text-blue-500" />}
            title="Secure & Private"
            description="End-to-end encryption and advanced security features to protect your meetings."
          />
          <Feature
            icon={<Users className="w-8 h-8 text-blue-500" />}
            title="Team Collaboration"
            description="Interactive whiteboard, file sharing, and breakout rooms for better teamwork."
          />
          <Feature
            icon={<Zap className="w-8 h-8 text-blue-500" />}
            title="Smart Summaries"
            description="Get AI-generated meeting summaries and action items automatically."
          />
        </div>
      </main>
    </div>
  );
}

function Feature({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="p-6 bg-white rounded-xl shadow-md"
    >
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </motion.div>
  );
}
