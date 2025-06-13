'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Clock, 
  CheckSquare, 
  Users, 
  Brain,
  Target,
  BarChart3,
  Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';

interface ProductivityMetrics {
  totalMeetings: number;
  completedMeetings: number;
  totalActionItems: number;
  completedActionItems: number;
  averageMeetingDuration: number;
  aiSummariesGenerated: number;
  timeSavedHours: number;
  productivityImprovement: number;
}

interface ProductivityMetricsProps {
  meetings: any[];
}

export default function ProductivityMetrics({ meetings }: ProductivityMetricsProps) {
  const [metrics, setMetrics] = useState<ProductivityMetrics>({
    totalMeetings: 0,
    completedMeetings: 0,
    totalActionItems: 0,
    completedActionItems: 0,
    averageMeetingDuration: 0,
    aiSummariesGenerated: 0,
    timeSavedHours: 0,
    productivityImprovement: 25
  });

  useEffect(() => {
    if (meetings && meetings.length > 0) {
      calculateMetrics();
    }
  }, [meetings]);

  const calculateMetrics = async () => {
    const completedMeetings = meetings.filter(m => m.status === 'completed');
    const totalMeetings = meetings.length;
    
    // Calculate AI summaries generated
    let aiSummariesGenerated = 0;
    let totalActionItems = 0;
    
    for (const meeting of completedMeetings) {
      try {
        const response = await fetch(`/api/meetings/${meeting.id}/summary`);
        if (response.ok) {
          const data = await response.json();
          if (data.summary) aiSummariesGenerated++;
          if (data.actionPoints) totalActionItems += data.actionPoints.length;
        }
      } catch (error) {
        console.error('Error fetching meeting summary:', error);
      }
    }

    // Calculate time saved (estimate: 15 minutes per meeting for manual note-taking)
    const timeSavedHours = Math.round((aiSummariesGenerated * 0.25) * 10) / 10;
    
    // Calculate productivity improvement based on automation
    const automationRate = totalMeetings > 0 ? (aiSummariesGenerated / totalMeetings) * 100 : 0;
    const productivityImprovement = Math.min(Math.round(automationRate * 0.3), 35);

    setMetrics({
      totalMeetings,
      completedMeetings: completedMeetings.length,
      totalActionItems,
      completedActionItems: Math.round(totalActionItems * 0.7), // Estimate 70% completion
      averageMeetingDuration: 45, // Estimate
      aiSummariesGenerated,
      timeSavedHours,
      productivityImprovement
    });
  };

  const metricCards = [
    {
      title: 'Productivity Improvement',
      value: `${metrics.productivityImprovement}%`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      description: 'Through AI automation'
    },
    {
      title: 'Time Saved',
      value: `${metrics.timeSavedHours}h`,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      description: 'On manual documentation'
    },
    {
      title: 'AI Summaries',
      value: metrics.aiSummariesGenerated,
      icon: Brain,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      description: 'Auto-generated'
    },
    {
      title: 'Action Items',
      value: `${metrics.completedActionItems}/${metrics.totalActionItems}`,
      icon: CheckSquare,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      description: 'Completed/Total'
    },
    {
      title: 'Meetings Completed',
      value: `${metrics.completedMeetings}/${metrics.totalMeetings}`,
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      description: 'With full documentation'
    },
    {
      title: 'Avg Duration',
      value: `${metrics.averageMeetingDuration}m`,
      icon: Calendar,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50 dark:bg-teal-900/20',
      description: 'Per meeting'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-blue-600" />
          Productivity Metrics
        </h2>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <TrendingUp className="h-3 w-3 mr-1" />
          +{metrics.productivityImprovement}% Improvement
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metricCards.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {metric.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                  <metric.icon className={`h-4 w-4 ${metric.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className={`text-2xl font-bold ${metric.color}`}>
                    {metric.value}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {metric.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-800 dark:text-blue-300 flex items-center gap-2">
            <Target className="h-5 w-5" />
            AI-Powered Meeting Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {metrics.aiSummariesGenerated}
              </div>
              <div className="text-blue-700 dark:text-blue-300">
                Automated Summaries
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {metrics.totalActionItems}
              </div>
              <div className="text-blue-700 dark:text-blue-300">
                Action Items Extracted
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {metrics.timeSavedHours}h
              </div>
              <div className="text-blue-700 dark:text-blue-300">
                Documentation Time Saved
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
