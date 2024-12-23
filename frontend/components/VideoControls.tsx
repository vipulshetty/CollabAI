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
  StopCircle,
  FileText,
  Loader2
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
  onGenerateSummary: () => void;
  isSummarizing: boolean;
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
  onGenerateSummary,
  isSummarizing
}: VideoControlsProps) {
  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex flex-col items-center gap-4"
    >
      <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/40 backdrop-blur-lg border border-white/10">
        <motion.button
          onClick={onToggleAudio}
          className="relative group flex flex-col items-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className={`p-3.5 rounded-xl ${isMuted ? 'bg-red-500/80 hover:bg-red-600/80' : 'bg-gray-800/80 hover:bg-gray-700/80'} transition-colors duration-200`}>
            {isMuted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
          </div>
          <div className="absolute -bottom-8 scale-0 group-hover:scale-100 transition-transform duration-200">
            <span className="px-2 py-1 text-xs text-white bg-black/80 rounded-md whitespace-nowrap">
              {isMuted ? 'Unmute' : 'Mute'}
            </span>
          </div>
        </motion.button>

        <motion.button
          onClick={onToggleVideo}
          className="relative group flex flex-col items-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className={`p-3.5 rounded-xl ${isVideoOff ? 'bg-red-500/80 hover:bg-red-600/80' : 'bg-gray-800/80 hover:bg-gray-700/80'} transition-colors duration-200`}>
            {isVideoOff ? <VideoOff className="w-6 h-6 text-white" /> : <Video className="w-6 h-6 text-white" />}
          </div>
          <div className="absolute -bottom-8 scale-0 group-hover:scale-100 transition-transform duration-200">
            <span className="px-2 py-1 text-xs text-white bg-black/80 rounded-md whitespace-nowrap">
              {isVideoOff ? 'Start Video' : 'Stop Video'}
            </span>
          </div>
        </motion.button>

        <motion.button
          onClick={onToggleChat}
          className="relative group flex flex-col items-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className={`p-3.5 rounded-xl ${showChat ? 'bg-blue-500/80 hover:bg-blue-600/80' : 'bg-gray-800/80 hover:bg-gray-700/80'} transition-colors duration-200`}>
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div className="absolute -bottom-8 scale-0 group-hover:scale-100 transition-transform duration-200">
            <span className="px-2 py-1 text-xs text-white bg-black/80 rounded-md whitespace-nowrap">
              Chat
            </span>
          </div>
        </motion.button>

        <motion.button
          onClick={onToggleWhiteboard}
          className="relative group flex flex-col items-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className={`p-3.5 rounded-xl ${showWhiteboard ? 'bg-blue-500/80 hover:bg-blue-600/80' : 'bg-gray-800/80 hover:bg-gray-700/80'} transition-colors duration-200`}>
            <Pencil className="w-6 h-6 text-white" />
          </div>
          <div className="absolute -bottom-8 scale-0 group-hover:scale-100 transition-transform duration-200">
            <span className="px-2 py-1 text-xs text-white bg-black/80 rounded-md whitespace-nowrap">
              Whiteboard
            </span>
          </div>
        </motion.button>

        <motion.button
          onClick={isRecording ? onStopRecording : onStartRecording}
          className="relative group flex flex-col items-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className={`p-3.5 rounded-xl ${isRecording ? 'bg-red-500/80 hover:bg-red-600/80' : 'bg-gray-800/80 hover:bg-gray-700/80'} transition-colors duration-200`}>
            {isRecording ? <StopCircle className="w-6 h-6 text-white" /> : <CircleDot className="w-6 h-6 text-white" />}
          </div>
          <div className="absolute -bottom-8 scale-0 group-hover:scale-100 transition-transform duration-200">
            <span className="px-2 py-1 text-xs text-white bg-black/80 rounded-md whitespace-nowrap">
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </span>
          </div>
        </motion.button>

        <motion.button
          onClick={onGenerateSummary}
          disabled={isSummarizing}
          className="relative group flex flex-col items-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className={`p-3.5 rounded-xl bg-gray-800/80 hover:bg-gray-700/80 transition-colors duration-200 ${isSummarizing ? 'opacity-50' : ''}`}>
            {isSummarizing ? (
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            ) : (
              <FileText className="w-6 h-6 text-white" />
            )}
          </div>
          <div className="absolute -bottom-8 scale-0 group-hover:scale-100 transition-transform duration-200">
            <span className="px-2 py-1 text-xs text-white bg-black/80 rounded-md whitespace-nowrap">
              {isSummarizing ? 'Generating...' : 'Generate Summary'}
            </span>
          </div>
        </motion.button>
        
        <div className="w-px h-8 bg-white/20 mx-2" />
        
        <motion.button
          onClick={onEndCall}
          className="relative group flex flex-col items-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="p-3.5 rounded-xl bg-red-500 hover:bg-red-600 transition-colors duration-200">
            <PhoneOff className="w-6 h-6 text-white" />
          </div>
          <div className="absolute -bottom-8 scale-0 group-hover:scale-100 transition-transform duration-200">
            <span className="px-2 py-1 text-xs text-white bg-black/80 rounded-md whitespace-nowrap">
              End Call
            </span>
          </div>
        </motion.button>
      </div>
    </motion.div>
  );
}
