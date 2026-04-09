import { Worker } from 'bullmq';
import { getWorkerRedis, closeRedis } from './lib/redis.js';
import { closeAllQueues } from './lib/queues.js';
import { handleWebhookJob } from './jobs/webhookHandler.js';

const IS_DEV = process.env['NODE_ENV'] !== 'production';

// BullMQ workers MUST use a connection with maxRetriesPerRequest: null
const connection = getWorkerRedis();

console.log('[Worker] Starting BullMQ workers...');

const webhookWorker = new Worker('webhook.process', handleWebhookJob, {
  connection,
  concurrency: 20,
});

const doraWorker = new Worker(
  'dora.compute',
  async (job) => {
    if (IS_DEV) console.log('[Worker] dora.compute (stub):', job.data);
  },
  { connection, concurrency: 3 }
);

const postmortemWorker = new Worker(
  'postmortem.generate',
  async (job) => {
    if (IS_DEV) console.log('[Worker] postmortem.generate (stub):', job.data);
  },
  { connection, concurrency: 2 }
);

const predictionWorker = new Worker(
  'prediction.score',
  async (job) => {
    if (IS_DEV) console.log('[Worker] prediction.score (stub):', job.data);
  },
  { connection, concurrency: 5 }
);

const alertWorker = new Worker(
  'alert.send',
  async (job) => {
    if (IS_DEV) console.log('[Worker] alert.send (stub):', job.data);
  },
  { connection, concurrency: 5 }
);

const workers = [webhookWorker, doraWorker, postmortemWorker, predictionWorker, alertWorker];

workers.forEach((worker) => {
  worker.on('completed', (job) => {
    if (IS_DEV) console.log(`[Worker] ✅ ${worker.name}:${job.id} completed`);
  });
  worker.on('failed', (job, err) => {
    console.error(`[Worker] ❌ ${worker.name}:${job?.id} failed:`, err.message);
  });
  worker.on('error', (err) => {
    console.error(`[Worker] Error in ${worker.name}:`, err.message);
  });
});

console.log('[Worker] All workers running:');
workers.forEach((w) => console.log(`  - ${w.name}`));

const shutdown = async (signal: string) => {
  console.log(`[Worker] Received ${signal}, shutting down...`);
  await Promise.all(workers.map((w) => w.close()));
  await closeAllQueues();
  await closeRedis();
  process.exit(0);
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
