'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  FileText,
  Cloud,
  Trello,
  MessageCircle,
  Brain,
  Rocket,
  BarChart,
  ChevronRight,
  Check
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: string;
  connected: boolean;
}

const integrations: Integration[] = [
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Sync your meetings with Google Calendar',
    icon: Calendar,
    category: 'Calendar',
    connected: false
  },
  {
    id: 'google-docs',
    name: 'Google Docs',
    description: 'Collaborate on documents in real-time',
    icon: FileText,
    category: 'Document',
    connected: true
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    description: 'Store and share files securely',
    icon: Cloud,
    category: 'Storage',
    connected: false
  },
  {
    id: 'jira',
    name: 'Jira',
    description: 'Track projects and manage tasks',
    icon: Trello,
    category: 'Project',
    connected: false
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Get notifications and chat with team',
    icon: MessageCircle,
    category: 'Communication',
    connected: true
  },
  {
    id: 'openai',
    name: 'OpenAI GPT-4',
    description: 'Enhanced meeting summaries and insights',
    icon: Brain,
    category: 'AI',
    connected: false
  },
  {
    id: 'miro',
    name: 'Miro',
    description: 'Collaborative whiteboarding',
    icon: Rocket,
    category: 'Productivity',
    connected: false
  },
  {
    id: 'analytics',
    name: 'Google Analytics',
    description: 'Track usage and engagement',
    icon: BarChart,
    category: 'Analytics',
    connected: false
  }
];

const categories = [
  'All',
  'Calendar',
  'Document',
  'Storage',
  'Project',
  'Communication',
  'AI',
  'Productivity',
  'Analytics'
];

export default function IntegrationsPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredIntegrations = integrations.filter(integration => {
    const matchesCategory = selectedCategory === 'All' || integration.category === selectedCategory;
    const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Integrations
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Connect your favorite tools and services to enhance your meetings
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Integrations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIntegrations.map(integration => (
            <motion.div
              key={integration.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <integration.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {integration.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {integration.description}
                      </p>
                    </div>
                  </div>
                  {integration.connected ? (
                    <span className="flex items-center text-sm text-green-600 dark:text-green-400">
                      <Check className="w-4 h-4 mr-1" />
                      Connected
                    </span>
                  ) : (
                    <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
