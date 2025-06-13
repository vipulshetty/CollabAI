import crypto from 'crypto';

// GDPR-compliant encryption utilities
export class GDPREncryption {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32;
  private static readonly IV_LENGTH = 16;
  private static readonly TAG_LENGTH = 16;

  private static getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error('ENCRYPTION_KEY environment variable is required for GDPR compliance');
    }
    
    if (key.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be exactly 32 characters long');
    }
    
    return Buffer.from(key, 'utf8');
  }

  /**
   * Encrypt sensitive personal data for GDPR compliance
   * @param plaintext - The data to encrypt
   * @returns Encrypted data with IV and auth tag
   */
  static encrypt(plaintext: string): string {
    try {
      const key = this.getEncryptionKey();
      const iv = crypto.randomBytes(this.IV_LENGTH);
      const cipher = crypto.createCipher(this.ALGORITHM, key);
      cipher.setAAD(Buffer.from('gdpr-compliant-data', 'utf8'));

      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      // Combine IV, auth tag, and encrypted data
      const combined = iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
      return combined;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt sensitive data');
    }
  }

  /**
   * Decrypt sensitive personal data
   * @param encryptedData - The encrypted data string
   * @returns Decrypted plaintext
   */
  static decrypt(encryptedData: string): string {
    try {
      const key = this.getEncryptionKey();
      const parts = encryptedData.split(':');
      
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];

      const decipher = crypto.createDecipher(this.ALGORITHM, key);
      decipher.setAAD(Buffer.from('gdpr-compliant-data', 'utf8'));
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt sensitive data');
    }
  }

  /**
   * Hash data for anonymization (one-way)
   * @param data - Data to hash
   * @returns SHA-256 hash
   */
  static hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate a secure random token for consent tracking
   * @returns Random token
   */
  static generateConsentToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Anonymize email for logging purposes
   * @param email - Email to anonymize
   * @returns Anonymized email
   */
  static anonymizeEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!local || !domain) return 'anonymous@domain.com';
    
    const anonymizedLocal = local.length > 2 
      ? local.substring(0, 2) + '*'.repeat(local.length - 2)
      : '**';
    
    return `${anonymizedLocal}@${domain}`;
  }

  /**
   * Securely delete data by overwriting memory
   * @param data - Data to securely delete
   */
  static secureDelete(data: string | Buffer): void {
    if (typeof data === 'string') {
      // Overwrite string memory (best effort in JavaScript)
      for (let i = 0; i < data.length; i++) {
        (data as any)[i] = '\0';
      }
    } else if (Buffer.isBuffer(data)) {
      data.fill(0);
    }
  }
}

// Data classification for GDPR compliance
export enum DataClassification {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  PERSONAL = 'personal',
  SENSITIVE_PERSONAL = 'sensitive_personal'
}

// GDPR data categories
export enum GDPRDataCategory {
  IDENTITY = 'identity',
  CONTACT = 'contact',
  BIOMETRIC = 'biometric',
  BEHAVIORAL = 'behavioral',
  TECHNICAL = 'technical',
  FINANCIAL = 'financial',
  HEALTH = 'health',
  LOCATION = 'location'
}

export interface EncryptedField {
  value: string;
  classification: DataClassification;
  category: GDPRDataCategory;
  encrypted_at: string;
  retention_until?: string;
}

/**
 * Utility to create encrypted field objects
 */
export function createEncryptedField(
  plaintext: string,
  classification: DataClassification,
  category: GDPRDataCategory,
  retentionDays?: number
): EncryptedField {
  const encrypted = GDPREncryption.encrypt(plaintext);
  const now = new Date();
  
  let retentionUntil: string | undefined;
  if (retentionDays) {
    const retentionDate = new Date(now);
    retentionDate.setDate(retentionDate.getDate() + retentionDays);
    retentionUntil = retentionDate.toISOString();
  }

  return {
    value: encrypted,
    classification,
    category,
    encrypted_at: now.toISOString(),
    retention_until: retentionUntil
  };
}
