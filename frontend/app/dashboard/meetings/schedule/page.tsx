'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Calendar, Clock, Users, FileText, ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMeetingContext } from '@/contexts/MeetingContext';

export default function ScheduleMeetingPage() {
  const router = useRouter();
  const { createMeeting } = useMeetingContext();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduledDate: '',
    scheduledTime: '',
    participants: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Combine date and time
      const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
      
      // Parse participants (comma-separated emails)
      const participantList = formData.participants
        .split(',')
        .map(email => email.trim())
        .filter(email => email.length > 0);

      const meetingData = {
        title: formData.title,
        description: formData.description,
        scheduled_date: scheduledDateTime.toISOString(),
        participants: participantList
      };

      const meetingId = await createMeeting(meetingData);
      
      // Redirect to dashboard with success message
      router.push('/dashboard?scheduled=true');
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      alert('Failed to schedule meeting. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Get current date and time for minimum values
  const now = new Date();
  const currentDate = now.toISOString().split('T')[0];
  const currentTime = now.toTimeString().slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              Schedule New Meeting
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Plan and organize your upcoming meeting
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card className="bg-white dark:bg-gray-800 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Meeting Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Meeting Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Meeting Title *
                    </Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Enter meeting title"
                      required
                      className="w-full"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Meeting agenda, topics to discuss..."
                      rows={4}
                      className="w-full"
                    />
                  </div>

                  {/* Date and Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="scheduledDate" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Date *
                      </Label>
                      <Input
                        id="scheduledDate"
                        name="scheduledDate"
                        type="date"
                        value={formData.scheduledDate}
                        onChange={handleInputChange}
                        min={currentDate}
                        required
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="scheduledTime" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Time *
                      </Label>
                      <Input
                        id="scheduledTime"
                        name="scheduledTime"
                        type="time"
                        value={formData.scheduledTime}
                        onChange={handleInputChange}
                        required
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Participants */}
                  <div className="space-y-2">
                    <Label htmlFor="participants" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Participants (Email addresses)
                    </Label>
                    <Textarea
                      id="participants"
                      name="participants"
                      value={formData.participants}
                      onChange={handleInputChange}
                      placeholder="Enter email addresses separated by commas (e.g., john@example.com, jane@example.com)"
                      rows={3}
                      className="w-full"
                    />
                    <p className="text-sm text-gray-500">
                      Separate multiple email addresses with commas
                    </p>
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-4 pt-4">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                    >
                      {isLoading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="mr-2"
                        >
                          <Plus className="h-4 w-4" />
                        </motion.div>
                      ) : (
                        <Calendar className="mr-2 h-4 w-4" />
                      )}
                      {isLoading ? 'Scheduling...' : 'Schedule Meeting'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                      className="px-8"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Preview/Info */}
          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-blue-800 dark:text-blue-300">
                  Meeting Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-blue-700 dark:text-blue-400">
                    {formData.title || 'Meeting Title'}
                  </h4>
                  <p className="text-sm text-blue-600 dark:text-blue-500 mt-1">
                    {formData.description || 'No description provided'}
                  </p>
                </div>
                {formData.scheduledDate && formData.scheduledTime && (
                  <div className="text-sm text-blue-600 dark:text-blue-500">
                    <strong>Scheduled:</strong><br />
                    {new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toLocaleString()}
                  </div>
                )}
                {formData.participants && (
                  <div className="text-sm text-blue-600 dark:text-blue-500">
                    <strong>Participants:</strong><br />
                    {formData.participants.split(',').length} invitees
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Features Included</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  AI-powered transcription
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Automated meeting summaries
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Action item extraction
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Real-time collaboration
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
