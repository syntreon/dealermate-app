/**
 * Request Deduplication Utility
 * Prevents multiple identical requests from being made simultaneously
 */

interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
}

class RequestDeduplicator {
  private pendingRequests = new Map<string, PendingRequest>();
  private readonly maxAge = 5000; // 5 seconds

  /**
   * Deduplicate requests by key
   */
  async deduplicate<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // Clean up old requests
    this.cleanup();

    // Check if request is already pending
    const existing = this.pendingRequests.get(key);
    if (existing) {
      console.log(`🔄 Deduplicating request: ${key}`);
      return existing.promise;
    }

    // Create new request
    console.log(`🚀 New request: ${key}`);
    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now()
    });

    return promise;
  }

  /**
   * Clean up old pending requests
   */
  private cleanup() {
    const now = Date.now();
    for (const [key, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp > this.maxAge) {
        this.pendingRequests.delete(key);
      }
    }
  }

  /**
   * Clear all pending requests
   */
  clear() {
    this.pendingRequests.clear();
  }

  /**
   * Get stats about pending requests
   */
  getStats() {
    return {
      pendingCount: this.pendingRequests.size,
      keys: Array.from(this.pendingRequests.keys())
    };
  }
}

// Global instance
export const requestDeduplicator = new RequestDeduplicator();

/**
 * Hook for request deduplication
 */
export const useRequestDeduplication = () => {
  return {
    deduplicate: requestDeduplicator.deduplicate.bind(requestDeduplicator),
    getStats: requestDeduplicator.getStats.bind(requestDeduplicator),
    clear: requestDeduplicator.clear.bind(requestDeduplicator)
  };
};