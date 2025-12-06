/**
 * Rate Limiter Utility
 * Prevents hitting API rate limits by queuing requests and spacing them out
 * SECURITY: Enhanced with attempt-based rate limiting for auth operations
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

/**
 * Attempt-based Rate Limiter for authentication operations
 * SECURITY: Prevents brute force attacks by limiting attempts per key
 */
interface AttemptRecord {
  attempts: number;
  firstAttempt: number;
  blockedUntil?: number;
}

export class AttemptRateLimiter {
  private attempts = new Map<string, AttemptRecord>();
  private maxAttempts: number;
  private windowMs: number;
  private blockDurationMs: number;

  /**
   * @param maxAttempts Maximum number of attempts allowed
   * @param windowMs Time window in milliseconds
   * @param blockDurationMs How long to block after exceeding attempts (defaults to windowMs)
   */
  constructor(maxAttempts: number, windowMs: number, blockDurationMs?: number) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
    this.blockDurationMs = blockDurationMs || windowMs;
  }

  /**
   * Check if a key has exceeded rate limit
   * @param key Unique identifier (e.g., email, IP address, or combination)
   * @returns true if within limit, false if blocked
   */
  checkLimit(key: string): boolean {
    const now = Date.now();
    const record = this.attempts.get(key);

    // If blocked, check if block has expired
    if (record?.blockedUntil && now < record.blockedUntil) {
      return false;
    }

    // If no record or window expired, allow and create/reset record
    if (!record || now - record.firstAttempt > this.windowMs) {
      this.attempts.set(key, {
        attempts: 1,
        firstAttempt: now,
      });
      return true;
    }

    // Increment attempts
    record.attempts++;

    // If exceeded, block
    if (record.attempts > this.maxAttempts) {
      record.blockedUntil = now + this.blockDurationMs;
      return false;
    }

    return true;
  }

  /**
   * Reset attempts for a key (e.g., after successful auth)
   */
  reset(key: string): void {
    this.attempts.delete(key);
  }

  /**
   * Get remaining attempts for a key
   */
  getRemainingAttempts(key: string): number {
    const record = this.attempts.get(key);
    if (!record) return this.maxAttempts;

    const now = Date.now();
    if (now - record.firstAttempt > this.windowMs) {
      return this.maxAttempts;
    }

    return Math.max(0, this.maxAttempts - record.attempts);
  }

  /**
   * Clean up expired records (call periodically)
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.attempts.entries()) {
      if (
        (!record.blockedUntil || now > record.blockedUntil) &&
        now - record.firstAttempt > this.windowMs
      ) {
        this.attempts.delete(key);
      }
    }
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

// SECURITY: Authentication rate limiters
// Sign in: 5 attempts per 15 minutes
export const signInRateLimiter = new AttemptRateLimiter(
  5,
  15 * 60 * 1000, // 15 minutes
  30 * 60 * 1000 // Block for 30 minutes after exceeding
);

// Sign up: 3 attempts per hour per IP/email
export const signUpRateLimiter = new AttemptRateLimiter(
  3,
  60 * 60 * 1000, // 1 hour
  60 * 60 * 1000 // Block for 1 hour
);

// Invite code validation: 10 attempts per hour
export const inviteCodeRateLimiter = new AttemptRateLimiter(
  10,
  60 * 60 * 1000, // 1 hour
  60 * 60 * 1000 // Block for 1 hour
);

// Cleanup expired records every 10 minutes
setInterval(() => {
  signInRateLimiter.cleanup();
  signUpRateLimiter.cleanup();
  inviteCodeRateLimiter.cleanup();
}, 10 * 60 * 1000);
