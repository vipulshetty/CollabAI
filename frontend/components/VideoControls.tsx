'use client';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneOff, 
  Monitor, 
  StopCircle, 
  FileText, 
  PieChart, 
  FileQuestion, 
  MessageSquare, 
  Users,
  ChevronUp,
  ChevronDown,
  Palette
} from 'lucide-react';
import { TranscriptionService } from '@/services/TranscriptionService';

interface VideoControlsProps {
  localStream: MediaStream | null;
  onEndCall: () => void;
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
  currentMeeting: any;
  endMeeting: (meetingId: string) => Promise<void>;
  onToggleWhiteboard: () => void;
  showWhiteboard: boolean;
  onToggleTranscription: () => void;
  isTranscribing: boolean;
}

export default function VideoControls({ 
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
  currentMeeting,
  endMeeting,
  onToggleWhiteboard,
  showWhiteboard,
  onToggleTranscription,
  isTranscribing,
}: VideoControlsProps) {
  const [showMoreControls, setShowMoreControls] = useState(false);

  const handleRecordingToggle = () => {
    if (!localStream) return;
    isRecording ? onStopRecording() : onStartRecording();
  };

  const handleTranscriptionToggle = () => {
    onToggleTranscription();
  };

  return (
    <motion.div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-4">
      <AnimatePresence>
        {showMoreControls && (
          <motion.div className="bg-black/80 backdrop-blur-md rounded-2xl p-4 shadow-lg grid grid-cols-3 gap-3 mb-4">
            <ControlButton
              onClick={onToggleAnalytics}
              isActive={showAnalytics}
              icon={<PieChart size={24} />}
              label="Analytics"
              activeColor="bg-indigo-100 text-indigo-700"
            />
            <ControlButton
              onClick={handleRecordingToggle}
              isActive={isRecording}
              icon={<StopCircle size={24} />}
              label={isRecording ? "Stop" : "Record"}
              activeColor="bg-red-500 text-white"
            />
            <ControlButton
              onClick={onToggleWhiteboard}
              isActive={showWhiteboard}
              icon={<Palette size={24} />}
              label="Whiteboard"
              activeColor="bg-blue-500 text-white"
            />
            <ControlButton
              onClick={handleTranscriptionToggle}
              isActive={isTranscribing}
              icon={<FileText size={24} />}
              label="Transcription"
              activeColor="bg-green-500 text-white"
              inactiveColor="bg-gray-500/80 text-white"
              disabled={false}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main controls */}
      <motion.div className="bg-black/80 backdrop-blur-md rounded-2xl p-3 flex items-center gap-2 shadow-lg">
        <ControlButton
          onClick={onToggleAudio}
          isActive={!isMuted}
          icon={isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          activeColor="bg-white/20"
          inactiveColor="bg-red-500/80"
        />
        <ControlButton
          onClick={onToggleVideo}
          isActive={!isVideoOff}
          icon={isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
          activeColor="bg-white/20"
          inactiveColor="bg-red-500/80"
        />
        <ControlButton
          onClick={onScreenShare}
          isActive={isScreenSharing}
          icon={<Monitor size={24} />}
          activeColor="bg-green-500/80"
          inactiveColor="bg-white/20"
        />
        <div className="w-px h-8 bg-white/20 mx-2" />
        <ControlButton
          onClick={() => setShowMoreControls(!showMoreControls)}
          isActive={showMoreControls}
          icon={showMoreControls ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
          activeColor="bg-white/30"
          inactiveColor="bg-white/10"
        />
        <div className="w-px h-8 bg-white/20 mx-2" />
        <ControlButton
          onClick={onEndCall}
          isActive={false}
          icon={<PhoneOff size={24} />}
          inactiveColor="bg-red-500"
        />
        <ControlButton
          onClick={onToggleChat}
          isActive={showChat}
          icon={<MessageSquare size={24} />}
          activeColor="bg-blue-500/80"
          inactiveColor="bg-white/20"
        />
      </motion.div>
    </motion.div>
  );
}

interface ControlButtonProps {
  onClick: () => void;
  isActive: boolean;
  icon: React.ReactNode;
  label?: string;
  activeColor?: string;
  inactiveColor?: string;
  disabled?: boolean;
}

function ControlButton({
  onClick,
  isActive,
  icon,
  label,
  activeColor = "bg-white/20",
  inactiveColor = "bg-white/10",
  disabled = false
}: ControlButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-colors duration-200
        ${isActive ? activeColor : inactiveColor}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-80'}`}
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
    >
      {icon}
      {label && <span className="text-xs font-medium">{label}</span>}
    </motion.button>
  );
}
