'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  Video,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Filter,
  SortAsc,
  Bell,
} from 'lucide-react';
import { InstantMeeting } from '@/components/InstantMeeting';
import { MeetingCard } from '@/components/MeetingCard';
import { Meeting } from '@/types/meeting';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, isPast, isFuture } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';

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

export default function UpcomingMeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'today' | 'upcoming' | 'past'>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/meetings/upcoming');
        if (!response.ok) {
          throw new Error('Failed to fetch upcoming meetings');
        }
        const data = await response.json();
        setMeetings(data);
      } catch (error) {
        console.error('Failed to load upcoming meetings:', error);
        setError(error instanceof Error ? error.message : 'Failed to load meetings');
      } finally {
        setLoading(false);
      }
    };

    fetchMeetings();
  }, []);

  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const getMeetingsForDate = (date: Date) => {
    return meetings.filter(meeting => 
      isSameDay(new Date(meeting.scheduled_date), date)
    );
  };

  const toggleNotifications = async () => {
    if (!notificationsEnabled) {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setNotificationsEnabled(true);
          // You could save this preference to user settings
        }
      } catch (error) {
        console.error('Failed to enable notifications:', error);
      }
    } else {
      setNotificationsEnabled(false);
    }
  };

  const filteredMeetings = meetings
    .filter(meeting => {
      const meetingDate = new Date(meeting.scheduled_date);
      // Apply date filter
      if (selectedDate && !isSameDay(meetingDate, selectedDate)) return false;
      
      // Apply status filter
      switch (filterStatus) {
        case 'today':
          if (!isToday(meetingDate)) return false;
          break;
        case 'upcoming':
          if (!isFuture(meetingDate)) return false;
          break;
        case 'past':
          if (!isPast(meetingDate)) return false;
          break;
      }
      
      // Apply search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        return (
          meeting.title.toLowerCase().includes(searchLower) ||
          meeting.description?.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.scheduled_date);
      const dateB = new Date(b.scheduled_date);
      return sortOrder === 'asc' 
        ? dateA.getTime() - dateB.getTime()
        : dateB.getTime() - dateA.getTime();
    });

  const meetingStats = {
    total: meetings.length,
    today: meetings.filter(m => isToday(new Date(m.scheduled_date))).length,
    upcoming: meetings.filter(m => isFuture(new Date(m.scheduled_date))).length,
    past: meetings.filter(m => isPast(new Date(m.scheduled_date))).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"
        />
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-4 rounded-lg"
      >
        {error}
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <motion.div variants={item} className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              Upcoming Meetings
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              View and manage your scheduled meetings, or create an instant meeting
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleNotifications}
              className={`${notificationsEnabled ? 'text-blue-600' : 'text-gray-500'}`}
            >
              <Bell className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => window.location.href = '/meetings/create'}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Meeting
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Meetings', value: meetingStats.total, color: 'from-blue-500 to-blue-600' },
            { label: "Today's Meetings", value: meetingStats.today, color: 'from-green-500 to-green-600' },
            { label: 'Upcoming Meetings', value: meetingStats.upcoming, color: 'from-purple-500 to-purple-600' },
            { label: 'Past Meetings', value: meetingStats.past, color: 'from-gray-500 to-gray-600' },
          ].map((stat, index) => (
            <Card key={index} className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</h3>
              <p className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                {stat.value}
              </p>
            </Card>
          ))}
        </motion.div>

        {/* Search and Filters */}
        <motion.div variants={item} className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search meetings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterStatus('all')}>
                All Meetings
                {filterStatus === 'all' && <Badge className="ml-2">Active</Badge>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus('today')}>
                Today's Meetings
                {filterStatus === 'today' && <Badge className="ml-2">Active</Badge>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus('upcoming')}>
                Upcoming Meetings
                {filterStatus === 'upcoming' && <Badge className="ml-2">Active</Badge>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus('past')}>
                Past Meetings
                {filterStatus === 'past' && <Badge className="ml-2">Active</Badge>}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            onClick={() => setSortOrder(order => order === 'asc' ? 'desc' : 'asc')}
            className="gap-2"
          >
            <SortAsc className="h-4 w-4" />
            {sortOrder === 'asc' ? 'Oldest First' : 'Newest First'}
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar Section */}
          <motion.div variants={item} className="lg:col-span-1">
            <Card className="p-4 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  {format(currentDate, 'MMMM yyyy')}
                </h2>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={prevMonth}
                    className="h-8 w-8"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={nextMonth}
                    className="h-8 w-8"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-sm mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-gray-500 dark:text-gray-400 font-medium py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {days.map((day, dayIdx) => {
                  const dayMeetings = getMeetingsForDate(day);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isToday = isSameDay(day, new Date());
                  const isCurrentMonth = isSameMonth(day, currentDate);

                  return (
                    <motion.button
                      key={day.toString()}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedDate(isSelected ? null : day)}
                      className={`
                        relative p-2 rounded-lg transition-all duration-200
                        ${!isCurrentMonth && 'text-gray-400 dark:text-gray-600'}
                        ${isSelected && 'bg-blue-500 text-white'}
                        ${isToday && !isSelected && 'bg-blue-100 dark:bg-blue-900/30'}
                        ${dayMeetings.length > 0 && !isSelected && 'font-bold text-blue-600 dark:text-blue-400'}
                        hover:bg-blue-50 dark:hover:bg-blue-900/20
                      `}
                    >
                      {format(day, 'd')}
                      {dayMeetings.length > 0 && (
                        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                          <div className={`h-1 w-1 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500'}`} />
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </Card>

            {/* Quick Actions */}
            <motion.div variants={item} className="mt-6">
              <InstantMeeting />
            </motion.div>
          </motion.div>

          {/* Meetings List Section */}
          <motion.div variants={item} className="lg:col-span-2 space-y-6">
            {filteredMeetings.length > 0 ? (
              <motion.div
                variants={container}
                className="space-y-4"
              >
                {filteredMeetings.map((meeting) => (
                  <motion.div key={meeting.id} variants={item}>
                    <MeetingCard meeting={meeting} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                variants={item}
                className="text-center py-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700"
              >
                <CalendarIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No meetings found
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {searchQuery 
                    ? 'No meetings match your search criteria'
                    : selectedDate
                    ? 'No meetings scheduled for the selected date'
                    : 'Schedule a meeting to get started'}
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
