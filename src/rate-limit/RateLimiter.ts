import { RateLimitOptions } from '../types';

/**
 * Advanced Rate Limiter with multiple algorithms and intelligent throttling
 */
export class RateLimiter {
  private requests: number[];
  private windowMs: number;
  private maxRequests: number;
  private skipSuccessfulRequests: boolean;
  private skipFailedRequests: boolean;
  private algorithm: 'sliding-window' | 'token-bucket' | 'leaky-bucket';
  private tokens: number;
  private lastRefill: number;

  constructor(options: Partial<RateLimitOptions> & { algorithm?: 'sliding-window' | 'token-bucket' | 'leaky-bucket' } = {}) {
    this.maxRequests = options.requests || 100;
    this.windowMs = options.windowMs || 60000;
    this.skipSuccessfulRequests = options.skipSuccessfulRequests || false;
    this.skipFailedRequests = options.skipFailedRequests || false;
    this.algorithm = options.algorithm || 'sliding-window';
    this.requests = [];
    this.tokens = this.maxRequests;
    this.lastRefill = Date.now();
  }

  /**
   * Check if request is allowed
   */
  isAllowed(): boolean {
    switch (this.algorithm) {
      case 'sliding-window':
        return this.slidingWindowCheck();
      case 'token-bucket':
        return this.tokenBucketCheck();
      case 'leaky-bucket':
        return this.leakyBucketCheck();
      default:
        return this.slidingWindowCheck();
    }
  }

  /**
   * Attempt to consume a request
   */
  consume(): {
    allowed: boolean;
    resetTime: number;
    remainingRequests: number;
    retryAfter?: number;
  } {
    const now = Date.now();
    const allowed = this.isAllowed();
    
    if (allowed) {
      this.recordRequest();
    }
    
    const resetTime = this.getResetTime();
    const remainingRequests = this.getRemainingRequests();
    const retryAfter = allowed ? undefined : this.getRetryAfter();
    
    return {
      allowed,
      resetTime,
      remainingRequests,
      retryAfter
    };
  }

  /**
   * Get current statistics
   */
  getStats(): {
    algorithm: string;
    maxRequests: number;
    windowMs: number;
    currentRequests: number;
    remainingRequests: number;
    resetTime: number;
    utilizationRate: number;
  } {
    return {
      algorithm: this.algorithm,
      maxRequests: this.maxRequests,
      windowMs: this.windowMs,
      currentRequests: this.getCurrentRequests(),
      remainingRequests: this.getRemainingRequests(),
      resetTime: this.getResetTime(),
      utilizationRate: this.getCurrentRequests() / this.maxRequests
    };
  }

  /**
   * Reset rate limiter
   */
  reset(): void {
    this.requests = [];
    this.tokens = this.maxRequests;
    this.lastRefill = Date.now();
  }

  /**
   * Create a middleware function for rate limiting
   */
  middleware() {
    return (req: any, res: any, next: any) => {
      const result = this.consume();
      
      if (result.allowed) {
        res.setHeader('X-RateLimit-Limit', this.maxRequests);
        res.setHeader('X-RateLimit-Remaining', result.remainingRequests);
        res.setHeader('X-RateLimit-Reset', result.resetTime);
        next();
      } else {
        res.setHeader('X-RateLimit-Limit', this.maxRequests);
        res.setHeader('X-RateLimit-Remaining', 0);
        res.setHeader('X-RateLimit-Reset', result.resetTime);
        if (result.retryAfter) {
          res.setHeader('Retry-After', Math.ceil(result.retryAfter / 1000));
        }
        res.status(429).json({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded',
          retryAfter: result.retryAfter
        });
      }
    };
  }

  /**
   * Create a decorator for rate limiting methods
   */
  static decorator(options: RateLimitOptions) {
    const limiter = new RateLimiter(options);
    
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value;
      
      descriptor.value = async function (...args: any[]) {
        const result = limiter.consume();
        
        if (!result.allowed) {
          throw new Error(`Rate limit exceeded. Retry after ${result.retryAfter}ms`);
        }
        
        return originalMethod.apply(this, args);
      };
      
      return descriptor;
    };
  }

  /**
   * Create a wrapper function with rate limiting
   */
  wrap<T extends (...args: any[]) => any>(fn: T): T {
    return ((...args: any[]) => {
      const result = this.consume();
      
      if (!result.allowed) {
        throw new Error(`Rate limit exceeded. Retry after ${result.retryAfter}ms`);
      }
      
      return fn(...args);
    }) as T;
  }

  /**
   * Batch rate limiting for multiple requests
   */
  async consumeBatch(count: number): Promise<{
    allowed: number;
    rejected: number;
    results: Array<{
      allowed: boolean;
      resetTime: number;
      remainingRequests: number;
      retryAfter?: number;
    }>;
  }> {
    const results = [];
    let allowed = 0;
    let rejected = 0;
    
    for (let i = 0; i < count; i++) {
      const result = this.consume();
      results.push(result);
      
      if (result.allowed) {
        allowed++;
      } else {
        rejected++;
      }
    }
    
    return { allowed, rejected, results };
  }

  /**
   * Smart rate limiting with burst handling
   */
  static createSmartLimiter(options: {
    steadyRate: number;
    burstRate: number;
    burstDuration: number;
    windowMs: number;
  }) {
    const steadyLimiter = new RateLimiter({
      requests: options.steadyRate,
      windowMs: options.windowMs
    });
    
    const burstLimiter = new RateLimiter({
      requests: options.burstRate,
      windowMs: options.burstDuration
    });
    
    return {
      consume: () => {
        const steadyResult = steadyLimiter.consume();
        const burstResult = burstLimiter.consume();
        
        // Allow if either limiter allows (burst can exceed steady rate temporarily)
        const allowed = steadyResult.allowed || burstResult.allowed;
        
        return {
          allowed,
          resetTime: Math.min(steadyResult.resetTime, burstResult.resetTime),
          remainingRequests: Math.min(steadyResult.remainingRequests, burstResult.remainingRequests),
          retryAfter: allowed ? undefined : Math.min(steadyResult.retryAfter || Infinity, burstResult.retryAfter || Infinity)
        };
      },
      
      getStats: () => ({
        steady: steadyLimiter.getStats(),
        burst: burstLimiter.getStats()
      })
    };
  }

  private slidingWindowCheck(): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Remove expired requests
    this.requests = this.requests.filter(time => time > windowStart);
    
    return this.requests.length < this.maxRequests;
  }

  private tokenBucketCheck(): boolean {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    
    // Refill tokens based on time passed
    const tokensToAdd = Math.floor(timePassed / this.windowMs * this.maxRequests);
    this.tokens = Math.min(this.maxRequests, this.tokens + tokensToAdd);
    
    if (tokensToAdd > 0) {
      this.lastRefill = now;
    }
    
    return this.tokens > 0;
  }

  private leakyBucketCheck(): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Remove expired requests (simulate leaking)
    this.requests = this.requests.filter(time => time > windowStart);
    
    // Check if bucket has space
    return this.requests.length < this.maxRequests;
  }

  private recordRequest(): void {
    const now = Date.now();
    
    switch (this.algorithm) {
      case 'sliding-window':
      case 'leaky-bucket':
        this.requests.push(now);
        break;
      case 'token-bucket':
        this.tokens--;
        break;
    }
  }

  private getCurrentRequests(): number {
    switch (this.algorithm) {
      case 'sliding-window':
      case 'leaky-bucket':
        const now = Date.now();
        const windowStart = now - this.windowMs;
        return this.requests.filter(time => time > windowStart).length;
      case 'token-bucket':
        return this.maxRequests - this.tokens;
      default:
        return 0;
    }
  }

  private getRemainingRequests(): number {
    return Math.max(0, this.maxRequests - this.getCurrentRequests());
  }

  private getResetTime(): number {
    switch (this.algorithm) {
      case 'sliding-window':
      case 'leaky-bucket':
        return this.requests.length > 0 ? this.requests[0] + this.windowMs : Date.now();
      case 'token-bucket':
        return this.lastRefill + this.windowMs;
      default:
        return Date.now();
    }
  }

  private getRetryAfter(): number {
    return Math.max(0, this.getResetTime() - Date.now());
  }
}
