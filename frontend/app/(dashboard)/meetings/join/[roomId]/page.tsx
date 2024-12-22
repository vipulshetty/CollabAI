'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useMeeting } from '@/contexts/MeetingContext';
import VideoCall from '@/components/VideoCall';
import ParticipantList from '@/components/ParticipantList';
import MeetingTimer from '@/components/MeetingTimer';
import ChatSystem from '@/components/ChatSystem';
import TabButton from '@/components/TabButton';

export default function MeetingRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { currentMeeting, joinMeeting, endMeeting } = useMeeting();
  const [isLoading, setIsLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    const init = async () => {
      try {
        if (typeof params.meetingId === 'string') {
          await joinMeeting(params.meetingId);
        }
      } catch (error) {
        console.error('Failed to join meeting:', error);
        router.push('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [params.meetingId, joinMeeting, router]);

  useEffect(() => {
    if (!isLoading && !currentMeeting) {
      router.push('/dashboard');
    }
  }, [currentMeeting, isLoading, router]);

  const handleMeetingEnd = async () => {
    try {
      await endMeeting(params.meetingId as string);
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to end meeting:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  if (!currentMeeting) {
    return null;
  }

  return (
    <div className="h-screen bg-[#1a1b1e] flex flex-col">
      <header className="bg-[#2d2e32] px-6 py-3 flex items-center border-b border-gray-800">
        <div className="flex items-center space-x-4">
          <h1 className="text-white font-semibold">{currentMeeting?.title}</h1>
          <div className="h-6 w-px bg-gray-700" />
          <MeetingTimer />
        </div>
      </header>

      <main className="flex-1 flex relative">
        <VideoCall 
          peerId={params.meetingId as string} 
          onToggleChat={() => setShowChat(!showChat)}
          showChat={showChat}
          onMeetingEnd={handleMeetingEnd}
        />
        
        <motion.div 
          className={`absolute right-0 top-0 bottom-0 bg-[#2d2e32] shadow-xl transition-all duration-300 ease-in-out
            ${showChat ? 'w-80' : 'w-0'}`}
          initial={false}
        >
          {showChat && (
            <ChatSystem 
              socket={socketService.socket} 
              roomId={params.meetingId as string} 
              onClose={() => setShowChat(false)}
            />
          )}
        </motion.div>
      </main>
    </div>
  );
}