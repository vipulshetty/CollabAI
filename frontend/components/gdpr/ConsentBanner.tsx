'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Settings, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ConsentManager, ConsentPreferences } from '@/lib/gdpr/consent';
import { createClient } from '@/lib/supabase/client';

interface ConsentBannerProps {
  onConsentUpdate?: (preferences: ConsentPreferences) => void;
}

export function ConsentBanner({ onConsentUpdate }: ConsentBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    essential: true,
    analytics: false,
    marketing: false,
    personalization: false,
    transcription: false,
    ai_processing: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  const consentManager = new ConsentManager();
  const supabase = createClient();

  useEffect(() => {
    checkConsentStatus();
  }, []);

  const checkConsentStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Check if user has already provided consent
        const userConsents = await consentManager.getUserConsents(user.id);
        
        // Show banner if no consents have been recorded yet
        const hasAnyConsent = Object.values(userConsents).some(Boolean) || 
                             localStorage.getItem('gdpr-consent-shown');
        
        if (!hasAnyConsent) {
          setIsVisible(true);
        }
        
        setPreferences(userConsents);
      } else {
        // For non-authenticated users, check localStorage
        const consentShown = localStorage.getItem('gdpr-consent-shown');
        if (!consentShown) {
          setIsVisible(true);
        }
      }
    } catch (error) {
      console.error('Error checking consent status:', error);
    }
  };

  const handleAcceptAll = async () => {
    const allAccepted: ConsentPreferences = {
      essential: true,
      analytics: true,
      marketing: true,
      personalization: true,
      transcription: true,
      ai_processing: true
    };

    await saveConsents(allAccepted);
  };

  const handleAcceptEssential = async () => {
    const essentialOnly: ConsentPreferences = {
      essential: true,
      analytics: false,
      marketing: false,
      personalization: false,
      transcription: false,
      ai_processing: false
    };

    await saveConsents(essentialOnly);
  };

  const handleCustomSave = async () => {
    await saveConsents(preferences);
  };

  const saveConsents = async (consentPrefs: ConsentPreferences) => {
    setIsLoading(true);
    
    try {
      if (user) {
        // Save to database for authenticated users
        await consentManager.updateConsents(user.id, consentPrefs);
      } else {
        // Save to localStorage for non-authenticated users
        localStorage.setItem('gdpr-consent-preferences', JSON.stringify(consentPrefs));
      }
      
      localStorage.setItem('gdpr-consent-shown', 'true');
      setIsVisible(false);
      onConsentUpdate?.(consentPrefs);
    } catch (error) {
      console.error('Error saving consents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreference = (key: keyof ConsentPreferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const consentDescriptions = {
    essential: {
      title: 'Essential Cookies',
      description: 'Required for basic functionality, security, and user authentication.',
      required: true
    },
    analytics: {
      title: 'Analytics',
      description: 'Help us understand how you use our platform to improve performance.',
      required: false
    },
    marketing: {
      title: 'Marketing',
      description: 'Allow us to show you relevant content and promotional materials.',
      required: false
    },
    personalization: {
      title: 'Personalization',
      description: 'Customize your experience based on your preferences and usage.',
      required: false
    },
    transcription: {
      title: 'Meeting Transcription',
      description: 'Process your voice data to provide meeting transcripts and summaries.',
      required: false
    },
    ai_processing: {
      title: 'AI Processing',
      description: 'Use AI to analyze your content for insights, summaries, and recommendations.',
      required: false
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4"
      >
        <Card className="mx-auto max-w-4xl border-2 border-blue-200 bg-white shadow-2xl dark:border-blue-800 dark:bg-gray-900">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-blue-600" />
                <CardTitle className="text-lg">Privacy & Cookie Preferences</CardTitle>
                <Badge variant="outline" className="text-xs">
                  GDPR Compliant
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              <p>
                We use cookies and similar technologies to provide essential functionality, 
                analyze usage, and improve your experience. You can customize your preferences below.
              </p>
              <p className="mt-2">
                <a 
                  href="/privacy" 
                  className="text-blue-600 hover:underline dark:text-blue-400"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Read our Privacy Policy
                </a>
                {' | '}
                <a 
                  href="/terms" 
                  className="text-blue-600 hover:underline dark:text-blue-400"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Terms of Service
                </a>
              </p>
            </div>

            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-3 border-t pt-4"
              >
                {Object.entries(consentDescriptions).map(([key, info]) => (
                  <div key={key} className="flex items-center justify-between space-x-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{info.title}</h4>
                        {info.required && (
                          <Badge variant="secondary" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {info.description}
                      </p>
                    </div>
                    <Switch
                      checked={preferences[key as keyof ConsentPreferences]}
                      onCheckedChange={(checked) => 
                        updatePreference(key as keyof ConsentPreferences, checked)
                      }
                      disabled={info.required || isLoading}
                    />
                  </div>
                ))}
              </motion.div>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                onClick={handleAcceptAll}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving...
                  </div>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Accept All
                  </>
                )}
              </Button>

              <Button
                onClick={handleAcceptEssential}
                variant="outline"
                disabled={isLoading}
              >
                Essential Only
              </Button>

              <Button
                onClick={() => setShowDetails(!showDetails)}
                variant="ghost"
                disabled={isLoading}
              >
                <Settings className="h-4 w-4 mr-2" />
                {showDetails ? 'Hide' : 'Customize'}
              </Button>

              {showDetails && (
                <Button
                  onClick={handleCustomSave}
                  variant="outline"
                  disabled={isLoading}
                  className="border-green-600 text-green-600 hover:bg-green-50"
                >
                  Save Preferences
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <AlertCircle className="h-3 w-3" />
              <span>
                You can change these preferences anytime in your account settings.
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
