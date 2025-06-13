'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Download, 
  Trash2, 
  Eye, 
  Settings, 
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { gdprCompliance } from '@/lib/gdpr';
import { createClient } from '@/lib/supabase/client';

export function PrivacyDashboard() {
  const [user, setUser] = useState<any>(null);
  const [gdprStatus, setGdprStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const supabase = createClient();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const status = await gdprCompliance.getUserGDPRStatus(user.id);
        setGdprStatus(status);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConsentUpdate = async (consentType: string, value: boolean) => {
    if (!user) return;

    try {
      const currentPreferences = gdprStatus?.consents || {};
      const updatedPreferences = {
        ...currentPreferences,
        [consentType]: value
      };

      await gdprCompliance.consent.updateConsents(user.id, updatedPreferences);
      await loadUserData(); // Refresh data
    } catch (error) {
      console.error('Error updating consent:', error);
    }
  };

  const handleDataExport = async () => {
    if (!user) return;

    try {
      const result = await gdprCompliance.processGDPRRequest(user.id, 'export', {
        exportType: 'full',
        fileFormat: 'json'
      });

      if (result.success) {
        alert('Data export request submitted successfully. You will be notified when ready.');
      } else {
        alert('Failed to submit data export request: ' + result.message);
      }
    } catch (error) {
      console.error('Error requesting data export:', error);
    }
  };

  const handleAccountDeletion = async () => {
    if (!user) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data.'
    );

    if (confirmed) {
      try {
        const result = await gdprCompliance.processGDPRRequest(user.id, 'deletion', {
          fullAccount: true,
          reason: 'user_request'
        });

        if (result.success) {
          alert('Account deletion request submitted. Please check your email for verification.');
        } else {
          alert('Failed to submit deletion request: ' + result.message);
        }
      } catch (error) {
        console.error('Error requesting account deletion:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Please sign in to access your privacy settings.
        </AlertDescription>
      </Alert>
    );
  }

  const complianceScore = gdprStatus?.complianceScore || 0;
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold">Privacy & Data Protection</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your data, privacy preferences, and GDPR rights
          </p>
        </div>
      </div>

      {/* Compliance Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Privacy Compliance Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Progress value={complianceScore} className="h-3" />
            </div>
            <div className={`text-2xl font-bold ${getScoreColor(complianceScore)}`}>
              {complianceScore}%
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
            Your privacy settings and data handling compliance score
          </p>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="consents">Consents</TabsTrigger>
          <TabsTrigger value="data">Your Data</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Data Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Meetings Created:</span>
                  <Badge variant="outline">{gdprStatus?.dataRetention?.length || 0}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Active Exports:</span>
                  <Badge variant="outline">{gdprStatus?.activeExports?.length || 0}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Audit Log Entries:</span>
                  <Badge variant="outline">{gdprStatus?.auditLogCount || 0}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Last Login:</span>
                    <span className="text-gray-600">
                      {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Account Created:</span>
                    <span className="text-gray-600">
                      {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="consents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Consent Preferences</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Control how your data is used across our platform
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(gdprStatus?.consents || {}).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium capitalize">{key.replace('_', ' ')}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {getConsentDescription(key)}
                    </p>
                  </div>
                  <Switch
                    checked={value as boolean}
                    onCheckedChange={(checked) => handleConsentUpdate(key, checked)}
                    disabled={key === 'essential'}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export Your Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Download a copy of all your data in a portable format (GDPR Article 20)
                </p>
                <Button onClick={handleDataExport} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Request Data Export
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5 text-red-600" />
                  Delete Account
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Permanently delete your account and all associated data (GDPR Article 17)
                </p>
                <Button 
                  onClick={handleAccountDeletion} 
                  variant="destructive" 
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </div>

          {gdprStatus?.dataRetention && gdprStatus.dataRetention.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Data Retention Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {gdprStatus.dataRetention.map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{item.table}</h4>
                        <p className="text-sm text-gray-600">
                          {item.record_count} records • Retention until {new Date(item.retention_until).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={item.can_be_deleted ? "destructive" : "secondary"}>
                        {item.can_be_deleted ? "Can Delete" : "Retained"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <div className="space-y-4">
            {gdprStatus?.activeExports && gdprStatus.activeExports.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Data Export Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {gdprStatus.activeExports.map((exportReq: any) => (
                      <div key={exportReq.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">Export Request</h4>
                          <p className="text-sm text-gray-600">
                            Requested: {new Date(exportReq.requested_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={
                          exportReq.status === 'completed' ? 'default' :
                          exportReq.status === 'failed' ? 'destructive' : 'secondary'
                        }>
                          {exportReq.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {gdprStatus?.deletionRequests && gdprStatus.deletionRequests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Deletion Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {gdprStatus.deletionRequests.map((delReq: any) => (
                      <div key={delReq.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">Deletion Request</h4>
                          <p className="text-sm text-gray-600">
                            Requested: {new Date(delReq.requested_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={
                          delReq.status === 'completed' ? 'default' :
                          delReq.status === 'failed' ? 'destructive' : 'secondary'
                        }>
                          {delReq.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function getConsentDescription(consentType: string): string {
  const descriptions: Record<string, string> = {
    essential: 'Required for basic functionality and security',
    analytics: 'Help us improve our platform through usage analytics',
    marketing: 'Receive relevant promotional content and updates',
    personalization: 'Customize your experience based on preferences',
    transcription: 'Process voice data for meeting transcripts',
    ai_processing: 'Use AI to analyze content for insights and summaries'
  };
  
  return descriptions[consentType] || 'Manage this data processing consent';
}
