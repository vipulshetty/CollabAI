import React from 'react';
import { Video, VideoOff, Mic, MicOff, Phone, FileText, StopCircle, Circle, Pencil } from 'lucide-react';
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
      className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent"
    >
      <div className="max-w-4xl mx-auto">
        <motion.div 
          className="flex items-center justify-center space-x-6 backdrop-blur-md bg-white/10 p-4 rounded-2xl shadow-lg"
        >
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={onToggleVideo}
            className={`p-3 rounded-xl ${
              isVideoOff 
                ? 'bg-red-500 hover:bg-red-600 shadow-red-500/50' 
                : 'bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/50'
            } transition-all duration-200 shadow-lg`}
            aria-label={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
          >
            {isVideoOff ? (
              <VideoOff className="w-6 h-6 text-white" />
            ) : (
              <Video className="w-6 h-6 text-white" />
            )}
          </motion.button>

          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={onToggleAudio}
            className={`p-3 rounded-xl ${
              isMuted 
                ? 'bg-red-500 hover:bg-red-600 shadow-red-500/50' 
                : 'bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/50'
            } transition-all duration-200 shadow-lg`}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <MicOff className="w-6 h-6 text-white" />
            ) : (
              <Mic className="w-6 h-6 text-white" />
            )}
          </motion.button>

          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={onToggleWhiteboard}
            className={`p-3 rounded-xl ${
              showWhiteboard 
                ? 'bg-purple-500 hover:bg-purple-600 shadow-purple-500/50' 
                : 'bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/50'
            } transition-all duration-200 shadow-lg`}
            aria-label={showWhiteboard ? 'Hide whiteboard' : 'Show whiteboard'}
          >
            <Pencil className="w-6 h-6 text-white" />
          </motion.button>

          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={onToggleTranscription}
            className={`p-3 rounded-xl ${
              isTranscribing 
                ? 'bg-green-500 hover:bg-green-600 shadow-green-500/50' 
                : 'bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/50'
            } transition-all duration-200 shadow-lg`}
            aria-label={isTranscribing ? 'Stop transcription' : 'Start transcription'}
          >
            <FileText className="w-6 h-6 text-white" />
          </motion.button>

          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={onToggleRecording}
            className={`p-3 rounded-xl ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 shadow-red-500/50' 
                : 'bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/50'
            } transition-all duration-200 shadow-lg`}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          >
            {isRecording ? (
              <StopCircle className="w-6 h-6 text-white" />
            ) : (
              <Circle className="w-6 h-6 text-white fill-current" />
            )}
          </motion.button>

          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={onEndCall}
            className="p-3 rounded-xl bg-red-500 hover:bg-red-600 transition-all duration-200 shadow-lg shadow-red-500/50"
            aria-label="End call"
          >
            <Phone className="w-6 h-6 text-white transform rotate-135" />
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default VideoControls;
