'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  PieChart,
  LineChart,
  Users,
  Clock,
  Brain,
  MessageSquare,
  Zap,
  TrendingUp,
  Calendar,
  Activity,
  Minimize2,
  Send,
  Paperclip
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart as RechartLine,
  Line,
  PieChart as RechartPie,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#3B82F6', '#6366F1', '#8B5CF6', '#D946EF'];

interface AnalyticsData {
  overview: {
    totalMeetings: number;
    totalParticipants: number;
    averageDuration: number;
    completionRate: number;
  };
  trends: {
    [key: string]: {
      meetings: number;
      participants: number;
      duration: number;
    };
  };
  engagement: {
    messageCount: number;
    averageMessagesPerMeeting: number;
    participantEngagement: Array<{
      userId: string;
      messageCount: number;
      meetingsAttended: number;
      engagementScore: number;
    }>;
  };
  aiInsights: {
    summaryQuality: Array<{
      meetingId: string;
      quality: number;
      timestamp: string;
    }>;
    transcriptionAccuracy: Array<{
      meetingId: string;
      accuracy: number;
      timestamp: string;
    }>;
    sentimentTrend: Array<{
      timestamp: string;
      score: number;
    }>;
  };
}

const MetricCard = ({ metric }: { metric: any }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{metric.title}</p>
        <div className="flex items-baseline mt-1">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {metric.value}
          </h3>
          {metric.change && (
            <span className={`ml-2 text-sm ${
              metric.change.startsWith('+') 
                ? 'text-green-500' 
                : 'text-red-500'
            }`}>
              {metric.change}
            </span>
          )}
        </div>
      </div>
      <div className={`p-3 rounded-xl bg-${metric.color}-100 dark:bg-${metric.color}-900/20`}>
        <metric.icon className={`w-6 h-6 text-${metric.color}-600 dark:text-${metric.color}-400`} />
      </div>
    </div>
  </motion.div>
);

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center p-8 text-center">
    <Activity className="w-12 h-12 text-gray-400 mb-4" />
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
      No Analytics Data Yet
    </h3>
    <p className="text-gray-500 dark:text-gray-400 mb-4">
      Start creating and joining meetings to see analytics insights.
    </p>
  </div>
);

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('month');
  const [activeTab, setActiveTab] = useState('overview');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/analytics?timeRange=${timeRange}`);
        if (!response.ok) {
          throw new Error('Failed to fetch analytics data');
        }
        const data = await response.json();
        setAnalyticsData(data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
        setError(error instanceof Error ? error.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-red-500 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">
          No analytics data available
        </div>
      </div>
    );
  }

  const hasData = analyticsData.overview.totalMeetings > 0;

  if (!hasData) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Analytics Dashboard
            </h1>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              Comprehensive insights into your meetings and team collaboration
            </p>
          </div>
        </div>
        <EmptyState />
      </div>
    );
  }

  const metrics = [
    {
      title: 'Total Meetings',
      value: analyticsData.overview.totalMeetings,
      icon: Calendar,
      color: 'blue'
    },
    {
      title: 'Active Users',
      value: analyticsData.overview.totalParticipants,
      icon: Users,
      color: 'purple'
    },
    {
      title: 'Avg. Duration',
      value: `${Math.round(analyticsData.overview.averageDuration / 60)}m`,
      icon: Clock,
      color: 'indigo'
    },
    {
      title: 'Completion Rate',
      value: `${Math.round(analyticsData.overview.completionRate)}%`,
      icon: Brain,
      color: 'pink'
    }
  ];

  // Transform trends data for charts
  const trendsData = Object.entries(analyticsData.trends).map(([month, data]) => ({
    month,
    meetings: data.meetings,
    participants: data.participants,
    duration: Math.round(data.duration / 60) // Convert to minutes
  }));

  // Transform engagement data for pie chart
  const engagementData = analyticsData.engagement.participantEngagement
    .sort((a, b) => b.engagementScore - a.engagementScore)
    .slice(0, 4)
    .map(user => ({
      name: `User ${user.userId.slice(0, 4)}`,
      value: user.engagementScore
    }));

  // Transform AI insights data for line chart
  const aiInsightsData = analyticsData.aiInsights.sentimentTrend.map(item => ({
    date: new Date(item.timestamp).toLocaleTimeString(),
    sentiment: item.score * 100,
    accuracy: analyticsData.aiInsights.transcriptionAccuracy.find(
      a => a.timestamp === item.timestamp
    )?.accuracy || 0,
    quality: analyticsData.aiInsights.summaryQuality.find(
      q => q.timestamp === item.timestamp
    )?.quality || 0
  }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Analytics Dashboard
            </h1>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              Comprehensive insights into your meetings and team collaboration
            </p>
          </div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric) => (
            <MetricCard key={metric.title} metric={metric} />
          ))}
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'engagement', label: 'Engagement', icon: Users },
            { id: 'ai-insights', label: 'AI Insights', icon: Brain },
            { id: 'performance', label: 'Performance', icon: Activity }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Meeting Trends */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Meeting Trends
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="meetings" fill="#3B82F6" name="Meetings" />
                  <Bar dataKey="participants" fill="#8B5CF6" name="Participants" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Engagement Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Top User Engagement
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartPie>
                  <Pie
                    data={engagementData}
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {engagementData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartPie>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* AI Insights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg lg:col-span-2"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              AI-Powered Insights
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartLine data={aiInsightsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="sentiment" 
                    stroke="#3B82F6" 
                    name="Sentiment Score"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="accuracy" 
                    stroke="#8B5CF6" 
                    name="Transcription Accuracy"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="quality" 
                    stroke="#D946EF" 
                    name="Summary Quality"
                  />
                </RechartLine>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Insights Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {/* Top Performers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center space-x-3 mb-4">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Top Performers
              </h3>
            </div>
            <div className="space-y-4">
              {analyticsData.engagement.participantEngagement
                .sort((a, b) => b.engagementScore - a.engagementScore)
                .slice(0, 3)
                .map((user) => (
                  <div key={user.userId} className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300">
                      User {user.userId.slice(0, 4)}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600" 
                          style={{ width: `${user.engagementScore}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {Math.round(user.engagementScore)}%
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </motion.div>

          {/* Communication Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center space-x-3 mb-4">
              <MessageSquare className="w-6 h-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Communication Stats
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">Total Messages</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {analyticsData.engagement.messageCount}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">Messages/Meeting</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {Math.round(analyticsData.engagement.averageMessagesPerMeeting)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">Active Participants</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {analyticsData.overview.totalParticipants}
                </span>
              </div>
            </div>
          </motion.div>

          {/* AI Efficiency */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Zap className="w-6 h-6 text-pink-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                AI Efficiency
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">Avg. Summary Quality</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {Math.round(
                    analyticsData.aiInsights.summaryQuality.reduce(
                      (acc, curr) => acc + curr.quality,
                      0
                    ) / analyticsData.aiInsights.summaryQuality.length
                  )}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">Transcription Accuracy</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {Math.round(
                    analyticsData.aiInsights.transcriptionAccuracy.reduce(
                      (acc, curr) => acc + curr.accuracy,
                      0
                    ) / analyticsData.aiInsights.transcriptionAccuracy.length
                  )}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">Avg. Sentiment Score</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {Math.round(
                    analyticsData.aiInsights.sentimentTrend.reduce(
                      (acc, curr) => acc + curr.score,
                      0
                    ) / analyticsData.aiInsights.sentimentTrend.length * 100
                  )}%
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
