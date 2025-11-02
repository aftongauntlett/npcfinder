/**
 * Rate Limiter Utility
 * Prevents hitting API rate limits by queuing requests and spacing them out
 */

interface QueueItem<T> {
  fn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
}

class RateLimiter {
  private queue: QueueItem<unknown>[] = [];
  private processing = false;
  private lastRequest = 0;
  private minInterval: number;

  /**
   * @param requestsPerSecond Maximum number of requests allowed per second
   */
  constructor(requestsPerSecond: number = 4) {
    this.minInterval = 1000 / requestsPerSecond;
  }

  /**
   * Add a function to the rate-limited queue
   * Returns a promise that resolves when the function executes
   */
  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({ fn, resolve, reject } as QueueItem<unknown>);
      if (!this.processing) {
        void this.processQueue();
      }
    });
  }

  private async processQueue() {
    this.processing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (!item) continue;

      // Calculate time since last request
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequest;

      // Wait if we need to respect the rate limit
      if (timeSinceLastRequest < this.minInterval) {
        await new Promise((resolve) =>
          setTimeout(resolve, this.minInterval - timeSinceLastRequest)
        );
      }

      // Execute the function
      try {
        this.lastRequest = Date.now();
        const result = await item.fn();
        item.resolve(result);
      } catch (error) {
        item.reject(error);
      }
    }

    this.processing = false;
  }

  /**
   * Get current queue length
   */
  getQueueLength(): number {
    return this.queue.length;
  }

  /**
   * Clear the queue (use with caution)
   */
  clear(): void {
    this.queue.forEach((item) => {
      item.reject(new Error("Queue cleared"));
    });
    this.queue = [];
  }
}

// TMDB allows 40 requests per 10 seconds = 4 requests per second
export const tmdbLimiter = new RateLimiter(4);

// OMDB has a daily limit but no per-second limit, so we'll be conservative
export const omdbLimiter = new RateLimiter(2);

// iTunes has no documented rate limit, but we'll be reasonable
export const itunesLimiter = new RateLimiter(5);

// Google Books API allows 1000 requests per day, ~1 per second is safe
export const googleBooksLimiter = new RateLimiter(1);
