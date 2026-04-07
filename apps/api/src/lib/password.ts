import crypto from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(crypto.scrypt);

const SALT_LENGTH = 32;
const KEY_LENGTH = 64;

// Using scrypt (Node built-in, no extra deps, OWASP-recommended)
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt, storedKey] = hash.split(':');
  if (!salt || !storedKey) return false;
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  const storedBuffer = Buffer.from(storedKey, 'hex');
  // Constant-time comparison to prevent timing attacks
  return (
    derivedKey.length === storedBuffer.length &&
    crypto.timingSafeEqual(derivedKey, storedBuffer)
  );
}
