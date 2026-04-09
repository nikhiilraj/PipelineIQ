import { Redis } from 'ioredis';

// Regular client — for queues, caching, rate limiting
let _redis: InstanceType<typeof Redis> | null = null;

// Blocking client — for BullMQ workers (requires maxRetriesPerRequest: null)
let _workerRedis: InstanceType<typeof Redis> | null = null;

function getUrl(): string {
  const url = process.env['REDIS_URL'];
  if (!url) throw new Error('REDIS_URL environment variable is required');
  return url;
}

export function getRedis(): InstanceType<typeof Redis> {
  if (_redis) return _redis;
  _redis = new Redis(getUrl(), {
    maxRetriesPerRequest: 3,
    lazyConnect: false,
    enableReadyCheck: true,
  });
  _redis.on('error', (err: Error) => {
    console.error('[Redis] Connection error:', err.message);
  });
  return _redis;
}

// Separate connection for BullMQ workers — maxRetriesPerRequest MUST be null
export function getWorkerRedis(): InstanceType<typeof Redis> {
  if (_workerRedis) return _workerRedis;
  _workerRedis = new Redis(getUrl(), {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: false,
  });
  _workerRedis.on('error', (err: Error) => {
    console.error('[Redis/Worker] Connection error:', err.message);
  });
  return _workerRedis;
}

export async function closeRedis(): Promise<void> {
  await Promise.all([
    _redis ? _redis.quit().catch(() => null) : Promise.resolve(),
    _workerRedis ? _workerRedis.quit().catch(() => null) : Promise.resolve(),
  ]);
  _redis = null;
  _workerRedis = null;
}
