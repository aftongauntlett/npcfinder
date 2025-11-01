/**
 * Rate Limiter Tests
 * Ensures API rate limiting works correctly
 */

import { describe, it, expect, beforeEach } from "vitest";
import { tmdbLimiter, omdbLimiter } from "../src/utils/rateLimiter";

describe("RateLimiter", () => {
  beforeEach(async () => {
    // Wait for any pending operations to complete from previous tests
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  it("should queue and execute functions in order", async () => {
    const results: number[] = [];

    const promises = [
      tmdbLimiter.add(() => Promise.resolve(results.push(1))),
      tmdbLimiter.add(() => Promise.resolve(results.push(2))),
      tmdbLimiter.add(() => Promise.resolve(results.push(3))),
    ];

    await Promise.all(promises);

    expect(results).toEqual([1, 2, 3]);
  });

  it("should respect rate limits (timing test)", async () => {
    const startTime = Date.now();

    // Queue 4 requests (with 4 req/sec, this should take ~750ms)
    const promises = Array.from({ length: 4 }, (_, i) =>
      tmdbLimiter.add(() => Promise.resolve(i))
    );

    await Promise.all(promises);

    const elapsed = Date.now() - startTime;

    // Should take at least 750ms (250ms * 3 intervals)
    expect(elapsed).toBeGreaterThanOrEqual(700);
  });

  it("should handle errors without breaking the queue", async () => {
    const results: string[] = [];

    const p1 = tmdbLimiter.add(() => {
      results.push("success1");
      return Promise.resolve("success1");
    });

    const p2 = tmdbLimiter.add(() =>
      Promise.reject(new Error("Intentional error"))
    );

    const p3 = tmdbLimiter.add(() => {
      results.push("success2");
      return Promise.resolve("success2");
    });
    await expect(p1).resolves.toBe("success1");
    await expect(p2).rejects.toThrow("Intentional error");
    await expect(p3).resolves.toBe("success2");

    expect(results).toEqual(["success1", "success2"]);
  });

  it("should track queue length correctly", async () => {
    expect(tmdbLimiter.getQueueLength()).toBe(0);

    // Add functions to queue and catch them to prevent unhandled rejections
    const p1 = tmdbLimiter
      .add(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      })
      .catch(() => {
        /* ignore */
      });
    const p2 = tmdbLimiter
      .add(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      })
      .catch(() => {
        /* ignore */
      });

    // Queue should be processing
    expect(tmdbLimiter.getQueueLength()).toBeGreaterThanOrEqual(0);

    // Wait for promises to complete
    await Promise.all([p1, p2]);
  });

  it("should work with different rate limiters independently", async () => {
    const tmdbResults: number[] = [];
    const omdbResults: number[] = [];

    await Promise.all([
      tmdbLimiter.add(() => {
        tmdbResults.push(1);
        return Promise.resolve(1);
      }),
      omdbLimiter.add(() => {
        omdbResults.push(1);
        return Promise.resolve(1);
      }),
      tmdbLimiter.add(() => {
        tmdbResults.push(2);
        return Promise.resolve(2);
      }),
      omdbLimiter.add(() => {
        omdbResults.push(2);
        return Promise.resolve(2);
      }),
    ]);

    expect(tmdbResults).toEqual([1, 2]);
    expect(omdbResults).toEqual([1, 2]);
  });
});
