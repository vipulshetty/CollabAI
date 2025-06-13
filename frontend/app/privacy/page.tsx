'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Shield, Lock, Eye, Download, Trash2, AlertCircle, CheckCircle, Globe } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Button
          asChild
          variant="ghost"
          className="mb-8"
        >
          <Link href="/" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="h-12 w-12 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Privacy Policy
            </h1>
          </div>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              GDPR Compliant
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <Globe className="h-3 w-3 mr-1" />
              EU Privacy Standards
            </Badge>
          </div>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Last updated: December 22, 2024 • Effective Date: December 22, 2024
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-blue-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-4 text-center">
              <Download className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Export Your Data</h3>
              <p className="text-sm text-gray-600 mb-3">Download all your personal data</p>
              <Button size="sm" variant="outline" asChild>
                <Link href="/privacy-settings">Request Export</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-green-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-4 text-center">
              <Eye className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Privacy Settings</h3>
              <p className="text-sm text-gray-600 mb-3">Manage your data preferences</p>
              <Button size="sm" variant="outline" asChild>
                <Link href="/privacy-settings">Manage Settings</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-red-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-4 text-center">
              <Trash2 className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Delete Account</h3>
              <p className="text-sm text-gray-600 mb-3">Permanently remove your data</p>
              <Button size="sm" variant="outline" asChild>
                <Link href="/privacy-settings">Delete Data</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg">
          <div className="p-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="prose dark:prose-invert max-w-none"
            >
              <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      Your Privacy Rights Under GDPR
                    </h3>
                    <p className="text-blue-800 dark:text-blue-200 text-sm">
                      As a user, you have comprehensive rights over your personal data including the right to access,
                      rectify, erase, restrict processing, data portability, and object to processing.
                      You can exercise these rights through our privacy dashboard or by contacting us directly.
                    </p>
                  </div>
                </div>
              </div>

              <h2 className="flex items-center gap-2">
                <Lock className="h-6 w-6 text-blue-600" />
                1. Data Controller and Contact Information
              </h2>
              <p>
                <strong>Data Controller:</strong> CollabAI Platform<br/>
                <strong>Contact:</strong> privacy@collabai.com<br/>
                <strong>Data Protection Officer:</strong> dpo@collabai.com<br/>
                <strong>Address:</strong> [Your Business Address]
              </p>

              <h2>2. Legal Basis for Processing</h2>
              <p>We process your personal data based on the following legal grounds:</p>
              <ul>
                <li><strong>Contract Performance:</strong> To provide our video meeting and collaboration services</li>
                <li><strong>Legitimate Interest:</strong> For security, fraud prevention, and service improvement</li>
                <li><strong>Consent:</strong> For marketing communications, analytics, and AI processing</li>
                <li><strong>Legal Obligation:</strong> To comply with applicable laws and regulations</li>
              </ul>

              <h2>3. Information We Collect</h2>

              <h3>3.1 Personal Data Categories</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose mb-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Identity Data</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <ul className="space-y-1">
                      <li>• Name and email address</li>
                      <li>• User ID and profile information</li>
                      <li>• Authentication credentials</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Technical Data</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <ul className="space-y-1">
                      <li>• IP address and device information</li>
                      <li>• Browser type and version</li>
                      <li>• Usage analytics and logs</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Meeting Data</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <ul className="space-y-1">
                      <li>• Meeting recordings and transcripts</li>
                      <li>• Voice and video data</li>
                      <li>• Chat messages and shared files</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Behavioral Data</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <ul className="space-y-1">
                      <li>• Platform usage patterns</li>
                      <li>• Feature preferences</li>
                      <li>• Interaction history</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <h3>3.2 Special Categories of Data</h3>
              <p>
                We may process special categories of personal data (biometric data) when you use our
                transcription services. This includes voice recordings that are processed to generate
                meeting transcripts. We only process this data with your explicit consent.
              </p>

              <h2>4. How We Use Your Information</h2>
              <p>We use your personal data for the following purposes:</p>

              <h3>4.1 Service Provision (Legal Basis: Contract)</h3>
              <ul>
                <li>Creating and managing your account</li>
                <li>Providing video meeting and collaboration services</li>
                <li>Processing meeting recordings and transcripts</li>
                <li>Enabling real-time communication features</li>
              </ul>

              <h3>4.2 Service Improvement (Legal Basis: Legitimate Interest)</h3>
              <ul>
                <li>Analyzing usage patterns to improve our platform</li>
                <li>Monitoring system performance and security</li>
                <li>Developing new features and functionality</li>
                <li>Ensuring platform stability and reliability</li>
              </ul>

              <h3>4.3 AI Processing (Legal Basis: Consent)</h3>
              <ul>
                <li>Generating meeting summaries and insights</li>
                <li>Extracting action items from transcripts</li>
                <li>Providing personalized recommendations</li>
                <li>Analyzing content for productivity metrics</li>
              </ul>

              <h2>5. Data Sharing and International Transfers</h2>

              <h3>5.1 Third-Party Service Providers</h3>
              <p>We share your data with the following categories of processors:</p>
              <ul>
                <li><strong>Authentication Services:</strong> Supabase (EU/US)</li>
                <li><strong>AI Processing:</strong> Google AI/Gemini (Global)</li>
                <li><strong>Cloud Infrastructure:</strong> Vercel, Railway (EU/US)</li>
                <li><strong>Analytics:</strong> Only with your consent</li>
              </ul>

              <h3>5.2 International Transfers</h3>
              <p>
                When we transfer your data outside the EU/EEA, we ensure adequate protection through:
              </p>
              <ul>
                <li>Standard Contractual Clauses (SCCs)</li>
                <li>Adequacy decisions by the European Commission</li>
                <li>Binding Corporate Rules where applicable</li>
              </ul>

              <h2>6. Data Security and Encryption</h2>
              <p>We implement comprehensive security measures including:</p>
              <ul>
                <li><strong>Encryption:</strong> AES-256 encryption for data at rest and in transit</li>
                <li><strong>Access Controls:</strong> Role-based access with multi-factor authentication</li>
                <li><strong>Monitoring:</strong> Continuous security monitoring and audit logging</li>
                <li><strong>Compliance:</strong> Regular security assessments and penetration testing</li>
              </ul>

              <h2>7. Data Retention</h2>
              <p>We retain your personal data for the following periods:</p>
              <ul>
                <li><strong>Account Data:</strong> Until account deletion + 30 days for security</li>
                <li><strong>Meeting Transcripts:</strong> 7 years for business records (or until deletion request)</li>
                <li><strong>Analytics Data:</strong> 2 years (with consent)</li>
                <li><strong>Audit Logs:</strong> 3-7 years depending on legal requirements</li>
                <li><strong>Marketing Data:</strong> Until consent withdrawal + 30 days</li>
              </ul>

              <h2>8. Your Rights Under GDPR</h2>
              <p>You have the following rights regarding your personal data:</p>

              <h3>8.1 Right of Access (Article 15)</h3>
              <p>You can request a copy of all personal data we hold about you.</p>

              <h3>8.2 Right to Rectification (Article 16)</h3>
              <p>You can request correction of inaccurate or incomplete data.</p>

              <h3>8.3 Right to Erasure (Article 17)</h3>
              <p>You can request deletion of your personal data in certain circumstances.</p>

              <h3>8.4 Right to Data Portability (Article 20)</h3>
              <p>You can request your data in a structured, machine-readable format.</p>

              <h3>8.5 Right to Object (Article 21)</h3>
              <p>You can object to processing based on legitimate interests or for marketing.</p>

              <h2>9. Cookies and Tracking</h2>
              <p>We use the following types of cookies:</p>
              <ul>
                <li><strong>Essential Cookies:</strong> Required for platform functionality</li>
                <li><strong>Analytics Cookies:</strong> With your consent, for usage analysis</li>
                <li><strong>Preference Cookies:</strong> To remember your settings</li>
              </ul>
              <p>
                You can manage your cookie preferences through our consent banner or privacy settings.
              </p>

              <h2>10. Children's Privacy</h2>
              <p>
                Our service is not intended for children under 16. We do not knowingly collect
                personal data from children under 16. If you believe we have collected such data,
                please contact us immediately.
              </p>

              <h2>11. Changes to This Policy</h2>
              <p>
                We may update this privacy policy from time to time. We will notify you of any
                material changes by email or through our platform. The "Last updated" date at
                the top indicates when this policy was last revised.
              </p>

              <h2>12. Contact Information</h2>
              <p>
                For any privacy-related questions or to exercise your rights, contact us at:
              </p>
              <div className="not-prose bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <p><strong>Email:</strong> privacy@collabai.com</p>
                <p><strong>Data Protection Officer:</strong> dpo@collabai.com</p>
                <p><strong>Response Time:</strong> Within 30 days (as required by GDPR)</p>
              </div>

              <h2>13. Supervisory Authority</h2>
              <p>
                If you are not satisfied with our response to your privacy concerns, you have the
                right to lodge a complaint with your local data protection authority.
              </p>

              <div className="mt-8 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                      Privacy by Design
                    </h3>
                    <p className="text-green-800 dark:text-green-200 text-sm">
                      Our platform is built with privacy by design principles, ensuring your data
                      is protected at every level of our system architecture and business processes.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
