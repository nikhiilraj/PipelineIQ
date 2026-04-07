import { Redis } from 'ioredis';

let _redis: InstanceType<typeof Redis> | null = null;

export function getRedis(): InstanceType<typeof Redis> {
  if (_redis) return _redis;

  const url = process.env['REDIS_URL'];
  if (!url) throw new Error('REDIS_URL environment variable is required');

  _redis = new Redis(url, {
    maxRetriesPerRequest: 3,
    lazyConnect: false,
    enableReadyCheck: true,
  });

  _redis.on('error', (err: Error) => {
    console.error('[Redis] Connection error:', err.message);
  });

  return _redis;
}

export async function closeRedis(): Promise<void> {
  if (_redis) {
    await _redis.quit();
    _redis = null;
  }
}
