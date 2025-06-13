#!/usr/bin/env node

/**
 * Generate a secure 32-character encryption key for GDPR compliance
 * Run with: node scripts/generate-encryption-key.js
 */

const crypto = require('crypto');

function generateSecureKey() {
  // Generate a random 32-byte key
  const key = crypto.randomBytes(32).toString('hex').substring(0, 32);
  return key;
}

function main() {
  console.log('🔐 GDPR Encryption Key Generator');
  console.log('================================');
  console.log('');
  
  const encryptionKey = generateSecureKey();
  
  console.log('Generated secure encryption key:');
  console.log('');
  console.log(`ENCRYPTION_KEY=${encryptionKey}`);
  console.log('');
  console.log('⚠️  IMPORTANT SECURITY NOTES:');
  console.log('1. Store this key securely in your environment variables');
  console.log('2. Never commit this key to version control');
  console.log('3. Use different keys for different environments');
  console.log('4. Backup this key securely - losing it means losing encrypted data');
  console.log('5. Rotate this key periodically for enhanced security');
  console.log('');
  console.log('📝 Add this to your .env.local file:');
  console.log(`ENCRYPTION_KEY=${encryptionKey}`);
  console.log('');
  console.log('✅ Key generated successfully!');
}

if (require.main === module) {
  main();
}

module.exports = { generateSecureKey };
