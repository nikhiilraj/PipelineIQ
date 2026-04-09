import { Queue } from 'bullmq';
import { getRedis } from './redis.js';

function makeConnection() {
  return getRedis();
}

// Lazily created queues
let _webhookQueue: Queue | null = null;
let _doraQueue: Queue | null = null;
let _postmortemQueue: Queue | null = null;
let _predictionQueue: Queue | null = null;
let _alertQueue: Queue | null = null;

export function getWebhookQueue(): Queue {
  if (!_webhookQueue) {
    _webhookQueue = new Queue('webhook.process', { connection: makeConnection() });
  }
  return _webhookQueue;
}

export function getDoraQueue(): Queue {
  if (!_doraQueue) {
    _doraQueue = new Queue('dora.compute', { connection: makeConnection() });
  }
  return _doraQueue;
}

export function getPostmortemQueue(): Queue {
  if (!_postmortemQueue) {
    _postmortemQueue = new Queue('postmortem.generate', { connection: makeConnection() });
  }
  return _postmortemQueue;
}

export function getPredictionQueue(): Queue {
  if (!_predictionQueue) {
    _predictionQueue = new Queue('prediction.score', { connection: makeConnection() });
  }
  return _predictionQueue;
}

export function getAlertQueue(): Queue {
  if (!_alertQueue) {
    _alertQueue = new Queue('alert.send', { connection: makeConnection() });
  }
  return _alertQueue;
}

export async function closeAllQueues(): Promise<void> {
  await Promise.all([
    _webhookQueue?.close(),
    _doraQueue?.close(),
    _postmortemQueue?.close(),
    _predictionQueue?.close(),
    _alertQueue?.close(),
  ]);
}
