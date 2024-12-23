'use client';

import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  MessageCircle,
  PhoneOff,
  Pencil,
  CircleDot,
  StopCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

interface VideoControlsProps {
  localStream: MediaStream | null;
  onEndCall: () => void;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  isMuted: boolean;
  isVideoOff: boolean;
  showChat: boolean;
  onToggleChat: () => void;
  onToggleTranscription: () => void;
  isTranscribing: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  isRecording: boolean;
  onToggleWhiteboard: () => void;
  showWhiteboard: boolean;
  stream: MediaStream | null;
  currentMeeting: string;
  endMeeting: () => void;
}

export default function VideoControls({
  onEndCall,
  onToggleAudio,
  onToggleVideo,
  isMuted,
  isVideoOff,
  showChat,
  onToggleChat,
  onToggleWhiteboard,
  showWhiteboard,
  onStartRecording,
  onStopRecording,
  isRecording,
}: VideoControlsProps) {
  const handleVideoToggle = async () => {
    try {
      await onToggleVideo();
    } catch (error) {
      console.error('Error toggling video:', error);
    }
  };

  return (
    <div className="flex items-center justify-center space-x-2 bg-gray-900/90 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggleAudio}
        className={`p-2.5 rounded-full transition-colors ${
          isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
        }`}
      >
        {isMuted ? (
          <MicOff className="w-5 h-5 text-white" />
        ) : (
          <Mic className="w-5 h-5 text-white" />
        )}
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleVideoToggle}
        className={`p-2.5 rounded-full transition-colors ${
          isVideoOff ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
        }`}
      >
        {isVideoOff ? (
          <VideoOff className="w-5 h-5 text-white" />
        ) : (
          <Video className="w-5 h-5 text-white" />
        )}
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggleChat}
        className={`p-2.5 rounded-full transition-colors ${
          showChat ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
        }`}
      >
        <MessageCircle className="w-5 h-5 text-white" />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggleWhiteboard}
        className={`p-2.5 rounded-full transition-colors ${
          showWhiteboard ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
        }`}
      >
        <Pencil className="w-5 h-5 text-white" />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={isRecording ? onStopRecording : onStartRecording}
        className={`p-2.5 rounded-full transition-colors ${
          isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
        }`}
      >
        {isRecording ? (
          <StopCircle className="w-5 h-5 text-white" />
        ) : (
          <CircleDot className="w-5 h-5 text-white" />
        )}
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onEndCall}
        className="p-2.5 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
      >
        <PhoneOff className="w-5 h-5 text-white" />
      </motion.button>
    </div>
  );
}
