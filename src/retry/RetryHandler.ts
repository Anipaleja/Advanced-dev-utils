/**
 * Advanced Retry Handler with exponential backoff and intelligent failure analysis
 */
export class RetryHandler {
  private maxRetries: number;
  private baseDelay: number;
  private maxDelay: number;
  private backoffFactor: number;
  private jitter: boolean;
  private retryCondition: (error: Error) => boolean;
  private onRetry?: (error: Error, attempt: number) => void;
  private statistics = {
    totalAttempts: 0,
    totalRetries: 0,
    successfulRetries: 0,
    failedRetries: 0
  };

  constructor(options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
    jitter?: boolean;
    retryCondition?: (error: Error) => boolean;
    onRetry?: (error: Error, attempt: number) => void;
  } = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.baseDelay = options.baseDelay || 1000;
    this.maxDelay = options.maxDelay || 30000;
    this.backoffFactor = options.backoffFactor || 2;
    this.jitter = options.jitter || true;
    this.retryCondition = options.retryCondition || this.defaultRetryCondition;
    this.onRetry = options.onRetry;
  }

  /**
   * Execute function with retry logic
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      this.statistics.totalAttempts++;
      
      try {
        const result = await fn();
        if (attempt > 0) {
          this.statistics.successfulRetries++;
        }
        return result;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.maxRetries && this.retryCondition(lastError)) {
          this.statistics.totalRetries++;
          
          if (this.onRetry) {
            this.onRetry(lastError, attempt + 1);
          }
          
          const delay = this.calculateDelay(attempt);
          await this.sleep(delay);
        } else {
          this.statistics.failedRetries++;
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Execute with custom retry options
   */
  async executeWithOptions<T>(
    fn: () => Promise<T>,
    options: {
      maxRetries?: number;
      baseDelay?: number;
      retryCondition?: (error: Error) => boolean;
    }
  ): Promise<T> {
    const originalMaxRetries = this.maxRetries;
    const originalBaseDelay = this.baseDelay;
    const originalRetryCondition = this.retryCondition;
    
    try {
      if (options.maxRetries !== undefined) this.maxRetries = options.maxRetries;
      if (options.baseDelay !== undefined) this.baseDelay = options.baseDelay;
      if (options.retryCondition !== undefined) this.retryCondition = options.retryCondition;
      
      return await this.execute(fn);
    } finally {
      this.maxRetries = originalMaxRetries;
      this.baseDelay = originalBaseDelay;
      this.retryCondition = originalRetryCondition;
    }
  }

  /**
   * Get retry statistics
   */
  getStats(): {
    totalAttempts: number;
    totalRetries: number;
    successfulRetries: number;
    failedRetries: number;
    successRate: number;
    retryRate: number;
  } {
    return {
      ...this.statistics,
      successRate: this.statistics.totalAttempts > 0 
        ? (this.statistics.totalAttempts - this.statistics.failedRetries) / this.statistics.totalAttempts 
        : 0,
      retryRate: this.statistics.totalAttempts > 0 
        ? this.statistics.totalRetries / this.statistics.totalAttempts 
        : 0
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.statistics = {
      totalAttempts: 0,
      totalRetries: 0,
      successfulRetries: 0,
      failedRetries: 0
    };
  }

  /**
   * Create a wrapper function with retry logic
   */
  wrap<T extends (...args: any[]) => Promise<any>>(fn: T): T {
    return ((...args: any[]) => this.execute(() => fn(...args))) as T;
  }

  /**
   * Batch retry multiple functions
   */
  async executeBatch<T>(functions: Array<() => Promise<T>>): Promise<T[]> {
    return Promise.all(functions.map(fn => this.execute(fn)));
  }

  /**
   * Execute with timeout
   */
  async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return this.execute(async () => {
      return new Promise<T>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Operation timeout'));
        }, timeout);

        fn()
          .then(result => {
            clearTimeout(timeoutId);
            resolve(result);
          })
          .catch(error => {
            clearTimeout(timeoutId);
            reject(error);
          });
      });
    });
  }

  /**
   * Create retry policy for specific error types
   */
  static createPolicy(policies: {
    [errorType: string]: {
      maxRetries: number;
      baseDelay: number;
      backoffFactor?: number;
    };
  }): RetryHandler {
    return new RetryHandler({
      retryCondition: (error: Error) => {
        const policy = policies[error.constructor.name] || policies[error.name];
        return Boolean(policy);
      },
      onRetry: (error: Error, attempt: number) => {
        const policy = policies[error.constructor.name] || policies[error.name];
        if (policy) {
          console.log(`Retrying ${error.constructor.name} (attempt ${attempt}/${policy.maxRetries})`);
        }
      }
    });
  }

  /**
   * Circuit breaker pattern implementation
   */
  static createCircuitBreaker(options: {
    failureThreshold: number;
    resetTimeout: number;
    monitoringPeriod: number;
  }) {
    let failures = 0;
    let lastFailureTime = 0;
    let state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
    
    return {
      async execute<T>(fn: () => Promise<T>): Promise<T> {
        const now = Date.now();
        
        // Reset failures if monitoring period has passed
        if (now - lastFailureTime > options.monitoringPeriod) {
          failures = 0;
        }
        
        // Check circuit breaker state
        if (state === 'OPEN') {
          if (now - lastFailureTime > options.resetTimeout) {
            state = 'HALF_OPEN';
          } else {
            throw new Error('Circuit breaker is OPEN');
          }
        }
        
        try {
          const result = await fn();
          
          if (state === 'HALF_OPEN') {
            state = 'CLOSED';
            failures = 0;
          }
          
          return result;
        } catch (error) {
          failures++;
          lastFailureTime = now;
          
          if (failures >= options.failureThreshold) {
            state = 'OPEN';
          }
          
          throw error;
        }
      },
      
      getState: () => state,
      getFailures: () => failures,
      reset: () => {
        failures = 0;
        state = 'CLOSED';
      }
    };
  }

  private calculateDelay(attempt: number): number {
    let delay = this.baseDelay * Math.pow(this.backoffFactor, attempt);
    
    // Apply maximum delay limit
    delay = Math.min(delay, this.maxDelay);
    
    // Add jitter to prevent thundering herd
    if (this.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }
    
    return delay;
  }

  private defaultRetryCondition(error: Error): boolean {
    // Retry on network errors, timeout errors, and server errors
    const retryableErrors = [
      'NetworkError',
      'TimeoutError',
      'ECONNRESET',
      'ECONNREFUSED',
      'ETIMEDOUT'
    ];
    
    return retryableErrors.some(errorType => 
      error.name.includes(errorType) || 
      error.message.includes(errorType)
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
