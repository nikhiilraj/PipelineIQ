import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import crypto from 'node:crypto';

// Access token: 15 minutes
const ACCESS_TOKEN_TTL = 15 * 60; // seconds
// Refresh token: 7 days
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // seconds

function getKeys() {
  const privateKeyPem = process.env['JWT_PRIVATE_KEY'];
  const publicKeyPem = process.env['JWT_PUBLIC_KEY'];

  if (!privateKeyPem || !publicKeyPem) {
    throw new Error('JWT_PRIVATE_KEY and JWT_PUBLIC_KEY must be set');
  }

  const privateKey = crypto.createPrivateKey(privateKeyPem.replace(/\\n/g, '\n'));
  const publicKey = crypto.createPublicKey(publicKeyPem.replace(/\\n/g, '\n'));

  return { privateKey, publicKey };
}

export interface AccessTokenPayload extends JWTPayload {
  userId: string;
  email: string;
}

export async function signAccessToken(payload: Omit<AccessTokenPayload, 'iat' | 'exp' | 'iss'>): Promise<string> {
  const { privateKey } = getKeys();
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt()
    .setIssuer('pipelineiq')
    .setExpirationTime(`${ACCESS_TOKEN_TTL}s`)
    .sign(privateKey);
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const { publicKey } = getKeys();
  const { payload } = await jwtVerify(token, publicKey, {
    issuer: 'pipelineiq',
    algorithms: ['RS256'],
  });
  return payload as AccessTokenPayload;
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function getRefreshTokenExpiry(): Date {
  return new Date(Date.now() + REFRESH_TOKEN_TTL * 1000);
}
