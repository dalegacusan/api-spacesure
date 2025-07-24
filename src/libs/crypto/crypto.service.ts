import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class CryptoService {
  private readonly key: Buffer;
  private readonly ivLength = 16;

  constructor() {
    const rawKey = process.env.AES_SECRET_KEY;
    if (!rawKey || rawKey.length < 16) {
      throw new InternalServerErrorException(
        'AES_SECRET_KEY is missing or too short (minimum 16 characters).',
      );
    }

    this.key = Buffer.from(rawKey.padEnd(32, '0').slice(0, 32));
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.key, iv);
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return iv.toString('base64') + ':' + encrypted;
  }

  decrypt(text: string): string {
    try {
      const [ivBase64, encrypted] = text.split(':');
      const iv = Buffer.from(ivBase64, 'base64');
      const decipher = crypto.createDecipheriv('aes-256-cbc', this.key, iv);
      let decrypted = decipher.update(encrypted, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch {
      return text; // fallback for plaintext
    }
  }
}
