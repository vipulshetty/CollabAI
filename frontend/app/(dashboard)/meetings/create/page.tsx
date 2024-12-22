'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Calendar, Users, Clock, AlertCircle } from 'lucide-react';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

export default function CreateMeetingPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meetingType, setMeetingType] = useState<'instant' | 'scheduled'>('instant');

  const handleCreateMeeting = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!title.trim()) {
        setError('Please enter a meeting title');
        return;
      }

      if (meetingType === 'scheduled' && !scheduledDate) {
        setError('Please select a meeting date and time');
        return;
      }

      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          status: meetingType === 'instant' ? 'scheduled' : 'scheduled',
          scheduled_date: meetingType === 'instant' 
            ? new Date().toISOString() 
            : new Date(scheduledDate).toISOString(),
          meeting_url: meetingType === 'instant' 
            ? `/video-call/${Date.now()}` // Generate a unique URL for instant meetings
            : null
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create meeting');
      }

      const { meeting } = await response.json();

      if (meetingType === 'instant') {
        // For instant meetings, redirect to the video call page
        router.push(`/meetings/${meeting.id}/video-call`);
      } else {
        // For scheduled meetings, go back to dashboard
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Error creating meeting:', err);
      setError(err instanceof Error ? err.message : 'Failed to create meeting. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-4xl mx-auto px-4 py-12"
      >
        {/* Header Section */}
        <motion.div variants={item} className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            Create New Meeting
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Choose between an instant meeting or schedule one for later
          </p>
        </motion.div>

        {/* Main Card */}
        <motion.div variants={item}>
          <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardContent className="p-6">
              {/* Meeting Type Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <Button
                  variant={meetingType === 'instant' ? 'default' : 'outline'}
                  onClick={() => setMeetingType('instant')}
                  className={`h-24 relative overflow-hidden transition-all duration-300 ${
                    meetingType === 'instant'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                      : 'hover:border-blue-500 hover:text-blue-600'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Video className="h-6 w-6" />
                    <span className="font-semibold">Instant Meeting</span>
                  </div>
                  {meetingType === 'instant' && (
                    <motion.div
                      className="absolute inset-0 bg-white/10"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </Button>

                <Button
                  variant={meetingType === 'scheduled' ? 'default' : 'outline'}
                  onClick={() => setMeetingType('scheduled')}
                  className={`h-24 relative overflow-hidden transition-all duration-300 ${
                    meetingType === 'scheduled'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                      : 'hover:border-purple-500 hover:text-purple-600'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Calendar className="h-6 w-6" />
                    <span className="font-semibold">Schedule Meeting</span>
                  </div>
                  {meetingType === 'scheduled' && (
                    <motion.div
                      className="absolute inset-0 bg-white/10"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </Button>
              </div>

              {/* Form Fields */}
              <div className="space-y-6">
                <motion.div variants={item} className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    Meeting Title
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter meeting title"
                    className="border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500"
                  />
                </motion.div>

                {meetingType === 'scheduled' && (
                  <motion.div
                    variants={item}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="date" className="text-sm font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      Date and Time
                    </Label>
                    <Input
                      id="date"
                      type="datetime-local"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500"
                    />
                  </motion.div>
                )}

                <motion.div variants={item} className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium flex items-center gap-2">
                    Description (Optional)
                  </Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter meeting description"
                    className="border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500"
                  />
                </motion.div>

                {error && (
                  <motion.div
                    variants={item}
                    className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-4 rounded-lg flex items-center gap-2"
                  >
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </motion.div>
                )}

                <motion.div variants={item} className="pt-4">
                  <Button
                    onClick={handleCreateMeeting}
                    disabled={isLoading}
                    className={`w-full h-12 relative overflow-hidden ${
                      meetingType === 'instant'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                        : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                    } text-white shadow-lg transition-all duration-300`}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Clock className="h-4 w-4" />
                        </motion.div>
                        Creating Meeting...
                      </div>
                    ) : meetingType === 'instant' ? (
                      'Start Instant Meeting'
                    ) : (
                      'Schedule Meeting'
                    )}
                  </Button>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}