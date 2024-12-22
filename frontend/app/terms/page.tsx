'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="prose dark:prose-invert max-w-none"
        >
          <h1>Terms of Service</h1>
          <p>Last updated: December 22, 2024</p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using CollabAI, you accept and agree to be bound by the terms
            and conditions of this agreement.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            CollabAI provides video conferencing and collaboration tools. We reserve the
            right to modify, suspend, or discontinue any aspect of the service at any time.
          </p>

          <h2>3. User Responsibilities</h2>
          <ul>
            <li>You must provide accurate registration information</li>
            <li>You are responsible for maintaining the confidentiality of your account</li>
            <li>You agree not to use the service for any illegal purposes</li>
            <li>You will not share harmful content or malware</li>
          </ul>

          <h2>4. Intellectual Property</h2>
          <p>
            All content, features, and functionality are owned by CollabAI and are protected
            by international copyright, trademark, and other intellectual property laws.
          </p>

          <h2>5. Privacy Policy</h2>
          <p>
            Your use of CollabAI is also governed by our Privacy Policy. Please review our
            <Link href="/privacy" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"> Privacy Policy</Link>.
          </p>

          <h2>6. Limitation of Liability</h2>
          <p>
            CollabAI shall not be liable for any indirect, incidental, special, consequential,
            or punitive damages resulting from your use or inability to use the service.
          </p>

          <h2>7. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. We will notify users
            of any material changes via email or through the service.
          </p>

          <h2>8. Contact Information</h2>
          <p>
            For any questions about these Terms, please contact us at:
            <br />
            Email: support@collabai.com
          </p>
        </motion.div>
      </div>
    </div>
  );
}
