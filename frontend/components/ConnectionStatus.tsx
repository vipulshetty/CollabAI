'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
  isConnecting?: boolean;
}

export function ConnectionStatus({ isConnected, isConnecting = false }: ConnectionStatusProps) {
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    // Show status when disconnected or connecting
    if (!isConnected || isConnecting) {
      setShowStatus(true);
    } else {
      // Hide status after a delay when connected
      const timer = setTimeout(() => setShowStatus(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isConnected, isConnecting]);

  if (!showStatus && isConnected && !isConnecting) {
    return null;
  }

  const getStatusConfig = () => {
    if (isConnecting) {
      return {
        icon: Loader2,
        text: 'Connecting to server...',
        bgColor: 'bg-yellow-500/90',
        textColor: 'text-white',
        iconClass: 'animate-spin'
      };
    } else if (isConnected) {
      return {
        icon: Wifi,
        text: 'Connected',
        bgColor: 'bg-green-500/90',
        textColor: 'text-white',
        iconClass: ''
      };
    } else {
      return {
        icon: WifiOff,
        text: 'Connection lost - Reconnecting...',
        bgColor: 'bg-red-500/90',
        textColor: 'text-white',
        iconClass: 'animate-pulse'
      };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
      >
        <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${config.bgColor} backdrop-blur-xl border border-white/20 shadow-lg`}>
          <Icon className={`w-4 h-4 ${config.textColor} ${config.iconClass}`} />
          <span className={`text-sm font-medium ${config.textColor}`}>
            {config.text}
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
