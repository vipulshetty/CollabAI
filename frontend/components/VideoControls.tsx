import React from 'react';
import { Video, VideoOff, Mic, MicOff, Phone, FileText, StopCircle, Circle, Pencil, MessageSquare } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface VideoControlsProps {
  localStream: MediaStream | null;
  onEndCall: () => void;
  isVideoOff: boolean;
  isMuted: boolean;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  onToggleTranscription: () => void;
  isTranscribing: boolean;
  onToggleRecording: () => void;
  isRecording: boolean;
  onToggleWhiteboard: () => void;
  showWhiteboard: boolean;
  onToggleChat?: () => void;
  showChat?: boolean;
}

const VideoControls: React.FC<VideoControlsProps> = ({
  onEndCall,
  isVideoOff,
  isMuted,
  onToggleVideo,
  onToggleAudio,
  onToggleTranscription,
  isTranscribing,
  onToggleRecording,
  isRecording,
  onToggleWhiteboard,
  showWhiteboard,
  onToggleChat,
  showChat = true,
}) => {
  const buttonVariants = {
    hover: { scale: 1.05, transition: { duration: 0.2 } },
    tap: { scale: 0.95 },
  };

  const controlsVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={controlsVariants}
      className="relative z-10"
    >
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="flex items-center justify-center space-x-2 backdrop-blur-xl bg-white/90 dark:bg-gray-900/80 border border-gray-300/50 dark:border-gray-700/50 px-6 py-3 rounded-2xl shadow-lg"
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
        >
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={onToggleVideo}
            className={`p-3 rounded-xl ${
              isVideoOff
                ? 'bg-red-500/90 hover:bg-red-500 shadow-red-500/20 border border-red-400/30'
                : 'bg-blue-500/90 hover:bg-blue-500 shadow-blue-500/20 border border-blue-400/30'
            } transition-all duration-200 shadow-md backdrop-blur-sm`}
            aria-label={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
            title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
          >
            {isVideoOff ? (
              <VideoOff className="w-5 h-5 text-white" />
            ) : (
              <Video className="w-5 h-5 text-white" />
            )}
          </motion.button>

          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={onToggleAudio}
            className={`p-3 rounded-xl ${
              isMuted
                ? 'bg-red-500/90 hover:bg-red-500 shadow-red-500/20 border border-red-400/30'
                : 'bg-green-500/90 hover:bg-green-500 shadow-green-500/20 border border-green-400/30'
            } transition-all duration-200 shadow-md backdrop-blur-sm`}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? (
              <MicOff className="w-5 h-5 text-white" />
            ) : (
              <Mic className="w-5 h-5 text-white" />
            )}
          </motion.button>

          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={onToggleWhiteboard}
            className={`p-3 rounded-xl ${
              showWhiteboard
                ? 'bg-purple-500/90 hover:bg-purple-500 shadow-purple-500/20 border border-purple-400/30'
                : 'bg-gray-600/90 hover:bg-gray-600 shadow-gray-600/20 border border-gray-500/30'
            } transition-all duration-200 shadow-md backdrop-blur-sm`}
            aria-label={showWhiteboard ? 'Hide whiteboard' : 'Show whiteboard'}
            title={showWhiteboard ? 'Hide whiteboard' : 'Show whiteboard'}
          >
            <Pencil className="w-5 h-5 text-white" />
          </motion.button>

          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={onToggleTranscription}
            className={`p-3 rounded-xl ${
              isTranscribing
                ? 'bg-emerald-500/90 hover:bg-emerald-500 shadow-emerald-500/20 border border-emerald-400/30'
                : 'bg-gray-600/90 hover:bg-gray-600 shadow-gray-600/20 border border-gray-500/30'
            } transition-all duration-200 shadow-md backdrop-blur-sm`}
            aria-label={isTranscribing ? 'Stop transcription' : 'Start transcription'}
            title={isTranscribing ? 'Stop transcription' : 'Start transcription'}
          >
            <FileText className="w-5 h-5 text-white" />
          </motion.button>

          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={onToggleRecording}
            className={`p-3 rounded-xl ${
              isRecording
                ? 'bg-red-500/90 hover:bg-red-500 shadow-red-500/20 border border-red-400/30'
                : 'bg-gray-600/90 hover:bg-gray-600 shadow-gray-600/20 border border-gray-500/30'
            } transition-all duration-200 shadow-md backdrop-blur-sm`}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            title={isRecording ? 'Stop recording' : 'Start recording'}
          >
            {isRecording ? (
              <StopCircle className="w-5 h-5 text-white" />
            ) : (
              <Circle className="w-5 h-5 text-white fill-current" />
            )}
          </motion.button>

          {onToggleChat && (
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={onToggleChat}
              className={`p-3 rounded-xl ${
                showChat
                  ? 'bg-blue-500/90 hover:bg-blue-500 shadow-blue-500/20 border border-blue-400/30'
                  : 'bg-gray-600/90 hover:bg-gray-600 shadow-gray-600/20 border border-gray-500/30'
              } transition-all duration-200 shadow-md backdrop-blur-sm`}
              aria-label={showChat ? 'Hide chat' : 'Show chat'}
              title={showChat ? 'Hide chat' : 'Show chat'}
            >
              <MessageSquare className="w-5 h-5 text-white" />
            </motion.button>
          )}

          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={onEndCall}
            className="p-3 rounded-xl bg-red-600/90 hover:bg-red-600 shadow-red-600/30 border border-red-500/30 transition-all duration-200 shadow-md backdrop-blur-sm"
            aria-label="End call"
            title="End call"
          >
            <Phone className="w-5 h-5 text-white transform rotate-135" />
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default VideoControls;
