import { App } from '@octokit/app';
import { Octokit } from '@octokit/rest';
import crypto from 'node:crypto';
import { getRedis } from './redis.js';

let _app: App | null = null;

export function getGitHubApp(): App {
  if (_app) return _app;

  const appId = process.env['GITHUB_APP_ID'];
  const privateKey = process.env['GITHUB_APP_PRIVATE_KEY'];
  const webhookSecret = process.env['GITHUB_WEBHOOK_SECRET'];
  const clientId = process.env['GITHUB_CLIENT_ID'];
  const clientSecret = process.env['GITHUB_CLIENT_SECRET'];

  if (!appId || !privateKey || !webhookSecret || !clientId || !clientSecret) {
    throw new Error('Missing GitHub App environment variables');
  }

  const parsedKey = privateKey.replace(/\\n/g, '\n');

  _app = new App({
    appId: parseInt(appId, 10),
    privateKey: parsedKey,
    webhooks: { secret: webhookSecret },
    oauth: { clientId, clientSecret },
  });

  return _app;
}

export async function getInstallationOctokit(installationId: number): Promise<Octokit> {
  const redis = getRedis();
  const cacheKey = `github:token:${installationId}`;

  const cached = await redis.get(cacheKey);
  if (cached) {
    return new Octokit({ auth: cached });
  }

  const app = getGitHubApp();
  const octokit = await app.getInstallationOctokit(installationId);

  const auth = await (octokit as unknown as {
    auth: (opts: { type: string }) => Promise<{ token: string }>;
  }).auth({ type: 'installation' });

  await redis.set(cacheKey, auth.token, 'EX', 55 * 60);

  return new Octokit({ auth: auth.token });
}

export function verifyWebhookSignature(
  payload: string,
  signature: string | undefined,
  secret: string
): boolean {
  if (!signature) return false;

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload, 'utf-8');
  const digest = `sha256=${hmac.digest('hex')}`;

  if (digest.length !== signature.length) return false;

  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
}
