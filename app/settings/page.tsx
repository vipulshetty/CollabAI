'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Video, Bell, Lock, Palette, Volume2, Globe, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

const settingsSections = [
  {
    title: 'General',
    icon: Settings,
    settings: [
      {
        name: 'Theme',
        description: 'Choose between light and dark mode',
        type: 'theme',
      },
      {
        name: 'Language',
        description: 'Select your preferred language',
        type: 'select',
        options: ['English', 'Spanish', 'French', 'German', 'Chinese'],
      }
    ]
  },
  {
    title: 'Video & Audio',
    icon: Video,
    settings: [
      {
        name: 'Default Video Quality',
        description: 'Set your preferred video quality',
        type: 'select',
        options: ['Auto', '720p', '1080p', '1440p']
      },
      {
        name: 'Noise Cancellation',
        description: 'Enable AI-powered noise cancellation',
        type: 'toggle'
      },
      {
        name: 'Echo Cancellation',
        description: 'Reduce echo during calls',
        type: 'toggle'
      }
    ]
  },
  {
    title: 'Notifications',
    icon: Bell,
    settings: [
      {
        name: 'Meeting Reminders',
        description: 'Get notified before meetings',
        type: 'toggle'
      },
      {
        name: 'Chat Notifications',
        description: 'Receive notifications for new messages',
        type: 'toggle'
      }
    ]
  },
  {
    title: 'Privacy & Security',
    icon: Lock,
    settings: [
      {
        name: 'End-to-End Encryption',
        description: 'Enable encryption for all meetings',
        type: 'toggle'
      },
      {
        name: 'Waiting Room',
        description: 'Enable waiting room for participants',
        type: 'toggle'
      }
    ]
  }
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [language, setLanguage] = useState('English');
  const [videoQuality, setVideoQuality] = useState('Auto');
  const [settings, setSettings] = useState({
    noiseCancellation: true,
    echoCancellation: true,
    meetingReminders: true,
    chatNotifications: true,
    encryption: true,
    waitingRoom: true,
  });

  const handleToggle = (setting: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-4 mb-8">
          <Settings className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              {settingsSections.map((section) => (
                <button
                  key={section.title}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left hover:bg-white dark:hover:bg-gray-800 transition-colors"
                >
                  <section.icon className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">{section.title}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-2 space-y-8">
            {settingsSections.map((section) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
              >
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <section.icon className="w-5 h-5 text-blue-600" />
                  {section.title}
                </h2>

                <div className="space-y-6">
                  {section.settings.map((setting) => (
                    <div key={setting.name} className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          {setting.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {setting.description}
                        </p>
                      </div>

                      {setting.type === 'toggle' && (
                        <button
                          onClick={() => handleToggle(setting.name.toLowerCase().replace(/\s/g, '') as keyof typeof settings)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings[setting.name.toLowerCase().replace(/\s/g, '') as keyof typeof settings]
                              ? 'bg-blue-600'
                              : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings[setting.name.toLowerCase().replace(/\s/g, '') as keyof typeof settings]
                                ? 'translate-x-6'
                                : 'translate-x-1'
                            }`}
                          />
                        </button>
                      )}

                      {setting.type === 'select' && (
                        <select
                          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-1.5"
                          value={
                            setting.name === 'Language'
                              ? language
                              : setting.name === 'Default Video Quality'
                              ? videoQuality
                              : undefined
                          }
                          onChange={(e) => {
                            if (setting.name === 'Language') setLanguage(e.target.value);
                            if (setting.name === 'Default Video Quality') setVideoQuality(e.target.value);
                          }}
                        >
                          {setting.options?.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      )}

                      {setting.type === 'theme' && (
                        <button
                          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          {theme === 'dark' ? (
                            <Sun className="w-5 h-5 text-gray-500" />
                          ) : (
                            <Moon className="w-5 h-5 text-gray-500" />
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
