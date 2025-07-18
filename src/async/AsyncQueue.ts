import { AsyncQueueOptions } from '../types';

/**
 * Advanced Async Queue with concurrency control and intelligent scheduling
 */
export class AsyncQueue {
  private queue: Array<() => Promise<any>> = [];
  private running = 0;
  private maxConcurrency: number;
  private delay: number;
  private retries: number;
  private timeout: number;
  private paused = false;
  private statistics = {
    processed: 0,
    failed: 0,
    totalTime: 0,
    avgTime: 0
  };

  constructor(options: AsyncQueueOptions = {}) {
    this.maxConcurrency = options.concurrency || 1;
    this.delay = options.delay || 0;
    this.retries = options.retries || 0;
    this.timeout = options.timeout || 30000;
  }

  /**
   * Add task to queue
   */
  async add<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const wrappedTask = async () => {
        const startTime = Date.now();
        let lastError: Error | null = null;
        
        for (let attempt = 0; attempt <= this.retries; attempt++) {
          try {
            const result = await this.executeWithTimeout(task);
            this.statistics.processed++;
            this.statistics.totalTime += Date.now() - startTime;
            this.statistics.avgTime = this.statistics.totalTime / this.statistics.processed;
            resolve(result);
            return;
          } catch (error) {
            lastError = error as Error;
            if (attempt < this.retries) {
              await this.sleep(Math.pow(2, attempt) * 1000); // Exponential backoff
            }
          }
        }
        
        this.statistics.failed++;
        reject(lastError);
      };

      this.queue.push(wrappedTask);
      this.process();
    });
  }

  /**
   * Add multiple tasks to queue
   */
  async addAll<T>(tasks: Array<() => Promise<T>>): Promise<T[]> {
    return Promise.all(tasks.map(task => this.add(task)));
  }

  /**
   * Pause queue processing
   */
  pause(): void {
    this.paused = true;
  }

  /**
   * Resume queue processing
   */
  resume(): void {
    this.paused = false;
    this.process();
  }

  /**
   * Clear all pending tasks
   */
  clear(): void {
    this.queue = [];
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    pending: number;
    running: number;
    processed: number;
    failed: number;
    avgTime: number;
    successRate: number;
  } {
    const total = this.statistics.processed + this.statistics.failed;
    return {
      pending: this.queue.length,
      running: this.running,
      processed: this.statistics.processed,
      failed: this.statistics.failed,
      avgTime: this.statistics.avgTime,
      successRate: total > 0 ? this.statistics.processed / total : 0
    };
  }

  /**
   * Wait for all tasks to complete
   */
  async drain(): Promise<void> {
    while (this.queue.length > 0 || this.running > 0) {
      await this.sleep(10);
    }
  }

  /**
   * Set concurrency limit
   */
  setConcurrency(concurrency: number): void {
    this.maxConcurrency = concurrency;
    this.process();
  }

  /**
   * Get current concurrency
   */
  getConcurrency(): number {
    return this.maxConcurrency;
  }

  /**
   * Check if queue is empty
   */
  isEmpty(): boolean {
    return this.queue.length === 0 && this.running === 0;
  }

  /**
   * Check if queue is paused
   */
  isPaused(): boolean {
    return this.paused;
  }

  private async process(): Promise<void> {
    if (this.paused || this.running >= this.maxConcurrency || this.queue.length === 0) {
      return;
    }

    const task = this.queue.shift();
    if (!task) return;

    this.running++;

    try {
      await task();
    } catch (error) {
      // Error is already handled in wrappedTask
    }

    this.running--;

    if (this.delay > 0) {
      await this.sleep(this.delay);
    }

    // Process next task
    this.process();
  }

  private async executeWithTimeout<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Task timeout'));
      }, this.timeout);

      task()
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
