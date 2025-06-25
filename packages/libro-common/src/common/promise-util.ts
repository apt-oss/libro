import { CancellationToken, cancelled } from './cancellation.js';
import { Deferred } from './deferred.js';

/**
 * @returns resolves after a specified number of milliseconds
 * @throws cancelled if a given token is cancelled before a specified number of milliseconds
 */
export function timeout(ms: number, token = CancellationToken.None): Promise<void> {
  const deferred = new Deferred<void>();
  const handle = setTimeout(() => deferred.resolve(), ms);
  token.onCancellationRequested(() => {
    clearTimeout(handle);
    deferred.reject(cancelled());
  });
  return deferred.promise;
}

export async function retry<T>(
  task: () => Promise<T>,
  delay: number,
  retries: number,
): Promise<T | undefined> {
  let lastError: Error | undefined;

  for (let i = 0; i < retries; i += 1) {
    try {
      return await task();
    } catch (error: any) {
      lastError = error;
      await timeout(delay);
    }
  }
  throw lastError;
}
