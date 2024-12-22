'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  MonitorUp,
  MonitorOff,
  PhoneOff,
  ChevronUp,
  ChevronDown,
  MessageCircle,
  Users,
  BarChart2,
  FileText,
  CircleDot,
  StopCircle,
  Edit3,
  Headphones
} from 'lucide-react';

interface VideoControlsProps {
  localStream: MediaStream | null;
  onEndCall: () => Promise<void>;
  onScreenShare: () => void;
  isScreenSharing: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  isRecording: boolean;
  onToggleAnalytics: () => void;
  showAnalytics: boolean;
  onToggleSummary: () => void;
  showSummary: boolean;
  showChat: boolean;
  onToggleChat: () => void;
  showBreakoutRooms: boolean;
  onToggleBreakoutRooms: () => void;
  isMuted: boolean;
  isVideoOff: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleWhiteboard: () => void;
  showWhiteboard: boolean;
  onToggleTranscription: () => void;
  isTranscribing: boolean;
  stream: MediaStream | null;
}

const VideoControls = ({ 
  localStream, 
  onEndCall, 
  onScreenShare,
  isScreenSharing,
  onStartRecording,
  onStopRecording,
  isRecording,
  onToggleAnalytics,
  showAnalytics,
  onToggleSummary,
  showSummary,
  showChat,
  onToggleChat,
  showBreakoutRooms,
  onToggleBreakoutRooms,
  isMuted,
  isVideoOff,
  onToggleAudio,
  onToggleVideo,
  onToggleWhiteboard,
  showWhiteboard,
  onToggleTranscription,
  isTranscribing,
  stream
}: VideoControlsProps) => {
  const [showMoreControls, setShowMoreControls] = useState(false);

  const handleEndCall = async () => {
    try {
      // Stop recording if it's active
      if (isRecording) {
        await onStopRecording();
      }

      // Stop transcription if it's active
      if (isTranscribing) {
        onToggleTranscription();
      }

      // Wait a moment for cleanup
      await new Promise(resolve => setTimeout(resolve, 500));

      // Call the endMeeting function from props
      await onEndCall();
    } catch (error) {
      console.error('Error ending meeting:', error);
      // Don't throw here, just log the error
    }
  };

  return (
    <motion.div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-4">
      <AnimatePresence>
        {showMoreControls && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-black/80 backdrop-blur-md rounded-2xl p-4 shadow-lg grid grid-cols-3 gap-3 mb-4"
          >
            <ControlButton
              onClick={onToggleChat}
              isActive={showChat}
              icon={<MessageCircle />}
              label="Chat"
            />
            <ControlButton
              onClick={onToggleBreakoutRooms}
              isActive={showBreakoutRooms}
              icon={<Users />}
              label="Breakout"
            />
            <ControlButton
              onClick={onToggleAnalytics}
              isActive={showAnalytics}
              icon={<BarChart2 />}
              label="Analytics"
            />
            <ControlButton
              onClick={onToggleSummary}
              isActive={showSummary}
              icon={<FileText />}
              label="Summary"
            />
            <ControlButton
              onClick={isRecording ? onStopRecording : onStartRecording}
              isActive={isRecording}
              icon={isRecording ? <StopCircle /> : <CircleDot />}
              label={isRecording ? "Stop" : "Record"}
            />
            <ControlButton
              onClick={onToggleWhiteboard}
              isActive={showWhiteboard}
              icon={<Edit3 />}
              label="Board"
            />
            <ControlButton
              onClick={onToggleTranscription}
              isActive={isTranscribing}
              icon={<Headphones />}
              label="Transcribe"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div className="bg-black/80 backdrop-blur-md rounded-2xl p-4 shadow-lg flex items-center gap-4">
        <ControlButton
          onClick={onToggleAudio}
          isActive={!isMuted}
          icon={isMuted ? <MicOff /> : <Mic />}
          activeColor="bg-white/20"
          inactiveColor="bg-red-500/80"
        />
        <ControlButton
          onClick={onToggleVideo}
          isActive={!isVideoOff}
          icon={isVideoOff ? <VideoOff /> : <Video />}
          activeColor="bg-white/20"
          inactiveColor="bg-red-500/80"
        />
        <ControlButton
          onClick={onScreenShare}
          isActive={isScreenSharing}
          icon={isScreenSharing ? <MonitorOff /> : <MonitorUp />}
        />
        <ControlButton
          onClick={handleEndCall}
          isActive={false}
          icon={<PhoneOff />}
          inactiveColor="bg-red-500"
        />
        <ControlButton
          onClick={() => setShowMoreControls(!showMoreControls)}
          isActive={showMoreControls}
          icon={showMoreControls ? <ChevronDown /> : <ChevronUp />}
        />
      </motion.div>
    </motion.div>
  );
};

interface ControlButtonProps {
  onClick: () => void;
  isActive: boolean;
  icon: React.ReactNode;
  label?: string;
  activeColor?: string;
  inactiveColor?: string;
  disabled?: boolean;
}

const ControlButton = ({
  onClick,
  isActive,
  icon,
  label,
  activeColor = "bg-white/20",
  inactiveColor = "bg-white/10",
  disabled = false
}: ControlButtonProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative p-3 rounded-xl transition-all duration-200
        ${isActive ? activeColor : inactiveColor}
        hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed
        flex flex-col items-center gap-1
      `}
    >
      {icon}
      {label && (
        <span className="text-xs font-medium opacity-80">{label}</span>
      )}
    </button>
  );
};

export default VideoControls;
