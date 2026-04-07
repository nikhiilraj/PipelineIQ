#!/usr/bin/env node
// Run: node apps/api/scripts/generate-keys.mjs
// Generates RS256 key pair for JWT signing

import crypto from 'node:crypto';

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

// Escape newlines for .env file (single-line format)
const escapedPrivate = privateKey.replace(/\n/g, '\\n');
const escapedPublic = publicKey.replace(/\n/g, '\\n');

console.log('# Add these to your .env file:\n');
console.log(`JWT_PRIVATE_KEY="${escapedPrivate}"`);
console.log('');
console.log(`JWT_PUBLIC_KEY="${escapedPublic}"`);
console.log('');
console.log('# Done! These are RSA-2048 keys using RS256 algorithm.');
