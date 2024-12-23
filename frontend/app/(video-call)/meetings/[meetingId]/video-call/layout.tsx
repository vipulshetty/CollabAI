'use client'

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function VideoCallLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      useRouter().push('/auth/signin');
    }
  });
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const setupVideoCallLayout = () => {
      // Apply minimal layout adjustments without forcing fullscreen
      const root = document.documentElement;
      root.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      
      // Add fullscreen change listener
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
      
      return () => {
        // Cleanup
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
        document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        root.style.overflow = '';
        document.body.style.overflow = '';
        document.body.style.margin = '';
        document.body.style.padding = '';
      };
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    return setupVideoCallLayout();
  }, []);

  if (status === 'loading') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative min-h-screen bg-black"
    >
      <div className="relative w-full h-full">
        {children}
      </div>
    </motion.div>
  );
}
