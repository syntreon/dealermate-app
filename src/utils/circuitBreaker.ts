/**
 * Circuit Breaker Pattern Implementation
 * Prevents excessive API calls when errors occur
 */

interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
}

enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Circuit is open, requests fail fast
  HALF_OPEN = 'HALF_OPEN' // Testing if service is back
}

interface CircuitStats {
  failures: number;
  successes: number;
  lastFailureTime: number;
  state: CircuitState;
}

class CircuitBreaker {
  private config: CircuitBreakerConfig;
  private stats: CircuitStats;
  private nextAttempt: number = 0;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      failureThreshold: 5,
      resetTimeout: 60000, // 1 minute
      monitoringPeriod: 300000, // 5 minutes
      ...config
    };

    this.stats = {
      failures: 0,
      successes: 0,
      lastFailureTime: 0,
      state: CircuitState.CLOSED
    };
  }

  /**
   * Execute a request through the circuit breaker
   */
  async execute<T>(requestFn: () => Promise<T>, fallbackFn?: () => T): Promise<T> {
    if (this.stats.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        console.warn('🚫 Circuit breaker is OPEN, request blocked');
        if (fallbackFn) {
          return fallbackFn();
        }
        throw new Error('Circuit breaker is OPEN');
      } else {
        this.stats.state = CircuitState.HALF_OPEN;
        console.log('🔄 Circuit breaker is HALF_OPEN, testing service');
      }
    }

    try {
      const result = await requestFn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      if (fallbackFn) {
        return fallbackFn();
      }
      throw error;
    }
  }

  /**
   * Handle successful request
   */
  private onSuccess() {
    this.stats.successes++;
    if (this.stats.state === CircuitState.HALF_OPEN) {
      console.log('✅ Circuit breaker reset to CLOSED');
      this.stats.state = CircuitState.CLOSED;
      this.stats.failures = 0;
    }
  }

  /**
   * Handle failed request
   */
  private onFailure() {
    this.stats.failures++;
    this.stats.lastFailureTime = Date.now();

    if (this.stats.failures >= this.config.failureThreshold) {
      this.stats.state = CircuitState.OPEN;
      this.nextAttempt = Date.now() + this.config.resetTimeout;
      console.error(`🔴 Circuit breaker OPENED after ${this.stats.failures} failures`);
    }
  }

  /**
   * Get current circuit breaker stats
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Reset circuit breaker
   */
  reset() {
    this.stats = {
      failures: 0,
      successes: 0,
      lastFailureTime: 0,
      state: CircuitState.CLOSED
    };
    this.nextAttempt = 0;
    console.log('🔄 Circuit breaker manually reset');
  }
}

// Global circuit breakers for different services
export const databaseCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  resetTimeout: 30000, // 30 seconds
  monitoringPeriod: 60000 // 1 minute
});

export const adminDashboardCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 60000, // 1 minute
  monitoringPeriod: 300000 // 5 minutes
});

/**
 * Hook for circuit breaker functionality
 */
export const useCircuitBreaker = (breakerName: 'database' | 'adminDashboard' = 'database') => {
  const breaker = breakerName === 'database' ? databaseCircuitBreaker : adminDashboardCircuitBreaker;
  
  return {
    execute: breaker.execute.bind(breaker),
    getStats: breaker.getStats.bind(breaker),
    reset: breaker.reset.bind(breaker)
  };
};