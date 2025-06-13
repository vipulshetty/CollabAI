import RecentMeetings from '@/components/RecentMeetings';
import UpcomingMeetings from '@/components/UpcomingMeetings';
import { InstantMeeting } from '@/components/InstantMeeting';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Calendar, Plus } from 'lucide-react';
import Link from 'next/link';

export default function MeetingsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
            Meetings
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Manage your meetings, start instant sessions, and schedule future calls
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-8">
          <Link href="/dashboard/meetings/instant">
            <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300">
              <Video className="w-4 h-4 mr-2" />
              Start Instant Meeting
            </Button>
          </Link>
          <Link href="/dashboard/meetings/schedule">
            <Button variant="outline" className="w-full sm:w-auto border-2 hover:bg-gray-50 dark:hover:bg-gray-800">
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Meeting
            </Button>
          </Link>
        </div>

        {/* Instant Meeting Card */}
        <div className="max-w-2xl mx-auto mb-8">
          <InstantMeeting />
        </div>

        {/* Recent and Upcoming Meetings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Meetings */}
          <Card className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-800/50 border-gray-100 dark:border-gray-800">
            <CardHeader className="border-b border-gray-100 dark:border-gray-800">
              <CardTitle>Recent Meetings</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <RecentMeetings />
            </CardContent>
          </Card>

          {/* Upcoming Meetings */}
          <Card className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-800/50 border-gray-100 dark:border-gray-800">
            <CardHeader className="border-b border-gray-100 dark:border-gray-800">
              <CardTitle>Upcoming Meetings</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <UpcomingMeetings />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
