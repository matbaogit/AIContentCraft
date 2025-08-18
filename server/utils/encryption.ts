import crypto from 'crypto';

/**
 * Encryption utilities for secure data transfer between proxy and app
 */

export class DataEncryption {
  private secretKey: Buffer;
  private algorithm = 'aes-256-gcm';

  constructor(secretKey: string) {
    this.secretKey = crypto.createHash('sha256').update(secretKey).digest();
  }

  encrypt(data: any): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', this.secretKey);
    
    const jsonData = JSON.stringify(data);
    let encrypted = cipher.update(jsonData, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: '' // Not used in CBC mode
    };
  }

  decrypt(encrypted: string, iv: string, tag: string): any {
    try {
      const decipher = crypto.createDecipher('aes-256-cbc', this.secretKey);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return JSON.parse(decrypted);
    } catch (error: any) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  // Simple JWT-like token for quick validation
  createToken(data: any, expiresInMinutes: number = 10): string {
    const payload = {
      data,
      exp: Date.now() + (expiresInMinutes * 60 * 1000),
      iat: Date.now()
    };

    const token = Buffer.from(JSON.stringify(payload)).toString('base64');
    const signature = crypto.createHmac('sha256', this.secretKey).update(token).digest('hex');
    
    return `${token}.${signature}`;
  }

  verifyToken(token: string): any {
    try {
      const [payload, signature] = token.split('.');
      const expectedSignature = crypto.createHmac('sha256', this.secretKey).update(payload).digest('hex');
      
      if (signature !== expectedSignature) {
        throw new Error('Invalid signature');
      }

      const data = JSON.parse(Buffer.from(payload, 'base64').toString());
      
      if (Date.now() > data.exp) {
        throw new Error('Token expired');
      }

      return data.data;
    } catch (error: any) {
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }
}

export function createEncryption(secretKey: string): DataEncryption {
  return new DataEncryption(secretKey);
}