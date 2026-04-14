import { type PerformCheckInInput } from '@/api/checkIn/checkInTimers';
import { storage } from '@/lib/storage';

const QUEUE_KEY = 'checkIn:pendingQueue';

export interface QueuedCheckIn {
  input: PerformCheckInInput;
  queuedAt: number;
}

export function getQueuedCheckIns(): QueuedCheckIn[] {
  const raw = storage.getString(QUEUE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as QueuedCheckIn[];
  } catch {
    return [];
  }
}

export function enqueueCheckIn(input: PerformCheckInInput): void {
  const queue = getQueuedCheckIns();
  queue.push({ input, queuedAt: Date.now() });
  storage.set(QUEUE_KEY, JSON.stringify(queue));
}

export function dequeueCheckIn(index: number): void {
  const queue = getQueuedCheckIns();
  queue.splice(index, 1);
  storage.set(QUEUE_KEY, JSON.stringify(queue));
}

export function clearCheckInQueue(): void {
  storage.delete(QUEUE_KEY);
}

export function getQueueLength(): number {
  return getQueuedCheckIns().length;
}
