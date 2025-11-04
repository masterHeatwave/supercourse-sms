import crypto from 'crypto';
import { logger } from './logger';
import { config } from '@config/config';

const algorithm: string = 'aes-256-cbc';
const keystring: string = config.ENCRYPT.KEY;
const ivstring: string = config.ENCRYPT.IV;
const key: Buffer = Buffer.from(keystring);

function encrypt(text: string): string {
  const iv: Buffer = Buffer.from(ivstring);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
  let encrypted: Buffer = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return encrypted.toString('hex');
}

function decrypt(text: string): string {
  const iv: Buffer = Buffer.from(ivstring);
  const encryptedText: Buffer = Buffer.from(text, 'hex');
  logger.info(`encrypted text length ${encryptedText.length}`);
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
  let decrypted: Buffer = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

export default { encrypt, decrypt };
