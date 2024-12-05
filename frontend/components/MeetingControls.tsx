'use client';
import { motion } from 'framer-motion';
import { Palette, MessageSquare, Users } from 'lucide-react';

interface MeetingControlsProps {
  onToggleWhiteboard: () => void;
  onToggleChat: () => void;
  onToggleParticipants: () => void;
}

export default function MeetingControls({
  onToggleWhiteboard,
  onToggleChat,
  onToggleParticipants
}: MeetingControlsProps) {
  return (
    <motion.div 
      className="fixed top-4 right-4 flex gap-2"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <ControlButton onClick={onToggleWhiteboard} icon={<Palette size={20} />} label="Whiteboard" />
      <ControlButton onClick={onToggleChat} icon={<MessageSquare size={20} />} label="Chat" />
      <ControlButton onClick={onToggleParticipants} icon={<Users size={20} />} label="Participants" />
    </motion.div>
  );
}

interface ControlButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function ControlButton({ onClick, icon, label }: ControlButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className="p-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors duration-200 flex items-center gap-2"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </motion.button>
  );
}
