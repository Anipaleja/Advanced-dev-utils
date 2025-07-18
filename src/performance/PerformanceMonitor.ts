import { PerformanceMetrics } from '../types';

/**
 * Advanced Performance Monitor with real-time metrics, bottleneck detection, and optimization suggestions
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private currentOperations = new Map<string, { startTime: number; memoryStart: number }>();
  private thresholds = {
    executionTime: 1000, // ms
    memoryUsage: 50 * 1024 * 1024, // 50MB
    cpuUsage: 80 // percentage
  };
  private observers: PerformanceObserver[] = [];
  private isMonitoring = false;

  constructor() {
    this.setupPerformanceObservers();
  }

  /**
   * Start monitoring performance for a specific operation
   */
  startOperation(operationName: string): void {
    this.currentOperations.set(operationName, {
      startTime: this.getHighResTime(),
      memoryStart: this.getMemoryUsage()
    });
  }

  /**
   * End monitoring for a specific operation
   */
  endOperation(operationName: string): PerformanceMetrics | null {
    const operation = this.currentOperations.get(operationName);
    if (!operation) return null;

    const endTime = this.getHighResTime();
    const endMemory = this.getMemoryUsage();
    
    const metrics: PerformanceMetrics = {
      executionTime: endTime - operation.startTime,
      memoryUsage: endMemory - operation.memoryStart,
      cpuUsage: this.getCPUUsage(),
      timestamp: Date.now()
    };

    this.metrics.push(metrics);
    this.currentOperations.delete(operationName);

    // Check for performance issues
    this.analyzePerformance(metrics, operationName);

    return metrics;
  }

  /**
   * Monitor a function's performance
   */
  monitor<T>(fn: () => T, operationName?: string): T {
    const name = operationName || fn.name || 'anonymous';
    this.startOperation(name);
    
    try {
      const result = fn();
      this.endOperation(name);
      return result;
    } catch (error) {
      this.endOperation(name);
      throw error;
    }
  }

  /**
   * Monitor an async function's performance
   */
  async monitorAsync<T>(fn: () => Promise<T>, operationName?: string): Promise<T> {
    const name = operationName || fn.name || 'anonymous';
    this.startOperation(name);
    
    try {
      const result = await fn();
      this.endOperation(name);
      return result;
    } catch (error) {
      this.endOperation(name);
      throw error;
    }
  }

  /**
   * Get comprehensive performance analytics
   */
  getAnalytics(): {
    summary: {
      totalOperations: number;
      averageExecutionTime: number;
      averageMemoryUsage: number;
      averageCPUUsage: number;
      slowestOperation: number;
      memoryPeak: number;
    };
    trends: {
      executionTime: number[];
      memoryUsage: number[];
      cpuUsage: number[];
    };
    bottlenecks: string[];
    recommendations: string[];
  } {
    if (this.metrics.length === 0) {
      return {
        summary: {
          totalOperations: 0,
          averageExecutionTime: 0,
          averageMemoryUsage: 0,
          averageCPUUsage: 0,
          slowestOperation: 0,
          memoryPeak: 0
        },
        trends: { executionTime: [], memoryUsage: [], cpuUsage: [] },
        bottlenecks: [],
        recommendations: []
      };
    }

    const summary = {
      totalOperations: this.metrics.length,
      averageExecutionTime: this.average(this.metrics.map(m => m.executionTime)),
      averageMemoryUsage: this.average(this.metrics.map(m => m.memoryUsage)),
      averageCPUUsage: this.average(this.metrics.map(m => m.cpuUsage || 0)),
      slowestOperation: Math.max(...this.metrics.map(m => m.executionTime)),
      memoryPeak: Math.max(...this.metrics.map(m => m.memoryUsage))
    };

    const trends = {
      executionTime: this.metrics.slice(-20).map(m => m.executionTime),
      memoryUsage: this.metrics.slice(-20).map(m => m.memoryUsage),
      cpuUsage: this.metrics.slice(-20).map(m => m.cpuUsage || 0)
    };

    const bottlenecks = this.detectBottlenecks();
    const recommendations = this.generateRecommendations();

    return { summary, trends, bottlenecks, recommendations };
  }

  /**
   * Real-time performance monitoring
   */
  startRealtimeMonitoring(interval: number = 1000): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    
    const monitor = () => {
      if (!this.isMonitoring) return;

      const metrics: PerformanceMetrics = {
        executionTime: 0, // Real-time doesn't have execution time
        memoryUsage: this.getMemoryUsage(),
        cpuUsage: this.getCPUUsage(),
        timestamp: Date.now()
      };

      this.metrics.push(metrics);
      
      // Keep only last 1000 entries for real-time monitoring
      if (this.metrics.length > 1000) {
        this.metrics.shift();
      }

      setTimeout(monitor, interval);
    };

    monitor();
  }

  /**
   * Stop real-time monitoring
   */
  stopRealtimeMonitoring(): void {
    this.isMonitoring = false;
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const analytics = this.getAnalytics();
    
    return `
Performance Report
==================

Summary:
- Total Operations: ${analytics.summary.totalOperations}
- Average Execution Time: ${analytics.summary.averageExecutionTime.toFixed(2)}ms
- Average Memory Usage: ${(analytics.summary.averageMemoryUsage / 1024 / 1024).toFixed(2)}MB
- Average CPU Usage: ${analytics.summary.averageCPUUsage.toFixed(2)}%
- Slowest Operation: ${analytics.summary.slowestOperation.toFixed(2)}ms
- Memory Peak: ${(analytics.summary.memoryPeak / 1024 / 1024).toFixed(2)}MB

Bottlenecks:
${analytics.bottlenecks.map(b => `- ${b}`).join('\n')}

Recommendations:
${analytics.recommendations.map(r => `- ${r}`).join('\n')}

Trends:
- Execution Time: ${this.getTrendDirection(analytics.trends.executionTime)}
- Memory Usage: ${this.getTrendDirection(analytics.trends.memoryUsage)}
- CPU Usage: ${this.getTrendDirection(analytics.trends.cpuUsage)}
    `;
  }

  /**
   * Set custom performance thresholds
   */
  setThresholds(thresholds: Partial<{
    executionTime: number;
    memoryUsage: number;
    cpuUsage: number;
  }>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  /**
   * Get current system performance
   */
  getSystemPerformance(): {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      usage: number;
      cores: number;
    };
    timing: {
      domContentLoaded?: number;
      pageLoad?: number;
      firstPaint?: number;
      firstContentfulPaint?: number;
    };
  } {
    const memoryUsage = this.getMemoryUsage();
    const totalMemory = this.getTotalMemory();
    
    return {
      memory: {
        used: memoryUsage,
        total: totalMemory,
        percentage: (memoryUsage / totalMemory) * 100
      },
      cpu: {
        usage: this.getCPUUsage(),
        cores: this.getCPUCores()
      },
      timing: this.getTimingMetrics()
    };
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.currentOperations.clear();
  }

  private setupPerformanceObservers(): void {
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        // Observe navigation timing
        const navObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.entryType === 'navigation') {
              // Handle navigation timing
            }
          });
        });
        navObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navObserver);

        // Observe resource timing
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.entryType === 'resource') {
              // Handle resource timing
            }
          });
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);
      } catch (error) {
        console.warn('Performance Observer not supported or failed to initialize');
      }
    }
  }

  private getHighResTime(): number {
    return typeof performance !== 'undefined' && performance.now ? 
      performance.now() : Date.now();
  }

  private getMemoryUsage(): number {
    if (typeof performance !== 'undefined' && 
        (performance as any).memory && 
        (performance as any).memory.usedJSHeapSize) {
      return (performance as any).memory.usedJSHeapSize;
    }
    
    // Fallback for Node.js
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    
    return 0;
  }

  private getTotalMemory(): number {
    if (typeof performance !== 'undefined' && 
        (performance as any).memory && 
        (performance as any).memory.totalJSHeapSize) {
      return (performance as any).memory.totalJSHeapSize;
    }
    
    // Fallback for Node.js
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapTotal;
    }
    
    return 100 * 1024 * 1024; // 100MB default
  }

  private getCPUUsage(): number {
    // This is a simplified CPU usage calculation
    // In a real implementation, you'd use more sophisticated methods
    if (typeof process !== 'undefined' && process.cpuUsage) {
      const usage = process.cpuUsage();
      return (usage.user + usage.system) / 1000000; // Convert to percentage
    }
    
    return 0;
  }

  private getCPUCores(): number {
    if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) {
      return navigator.hardwareConcurrency;
    }
    
    // Fallback for Node.js
    if (typeof require !== 'undefined') {
      try {
        const os = require('os');
        return os.cpus().length;
      } catch (e) {
        // Ignore
      }
    }
    
    return 1;
  }

  private getTimingMetrics(): any {
    if (typeof performance !== 'undefined' && performance.timing) {
      const timing = performance.timing;
      return {
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        pageLoad: timing.loadEventEnd - timing.navigationStart,
        firstPaint: this.getFirstPaint(),
        firstContentfulPaint: this.getFirstContentfulPaint()
      };
    }
    
    return {};
  }

  private getFirstPaint(): number | undefined {
    if (typeof performance !== 'undefined' && performance.getEntriesByType) {
      const paintEntries = performance.getEntriesByType('paint');
      const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
      return firstPaint ? firstPaint.startTime : undefined;
    }
    return undefined;
  }

  private getFirstContentfulPaint(): number | undefined {
    if (typeof performance !== 'undefined' && performance.getEntriesByType) {
      const paintEntries = performance.getEntriesByType('paint');
      const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      return fcp ? fcp.startTime : undefined;
    }
    return undefined;
  }

  private analyzePerformance(metrics: PerformanceMetrics, operationName: string): void {
    const issues: string[] = [];

    if (metrics.executionTime > this.thresholds.executionTime) {
      issues.push(`Slow execution time: ${metrics.executionTime.toFixed(2)}ms`);
    }

    if (metrics.memoryUsage > this.thresholds.memoryUsage) {
      issues.push(`High memory usage: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`);
    }

    if (metrics.cpuUsage && metrics.cpuUsage > this.thresholds.cpuUsage) {
      issues.push(`High CPU usage: ${metrics.cpuUsage.toFixed(2)}%`);
    }

    if (issues.length > 0) {
      console.warn(`Performance issues detected in ${operationName}:`, issues);
    }
  }

  private detectBottlenecks(): string[] {
    const bottlenecks: string[] = [];
    
    // Analyze execution time trends
    const executionTimes = this.metrics.map(m => m.executionTime);
    const avgExecution = this.average(executionTimes);
    
    if (avgExecution > this.thresholds.executionTime) {
      bottlenecks.push(`Average execution time (${avgExecution.toFixed(2)}ms) exceeds threshold`);
    }

    // Analyze memory usage trends
    const memoryUsages = this.metrics.map(m => m.memoryUsage);
    const avgMemory = this.average(memoryUsages);
    
    if (avgMemory > this.thresholds.memoryUsage) {
      bottlenecks.push(`Average memory usage (${(avgMemory / 1024 / 1024).toFixed(2)}MB) exceeds threshold`);
    }

    // Detect memory leaks
    if (this.detectMemoryLeak()) {
      bottlenecks.push('Potential memory leak detected');
    }

    return bottlenecks;
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const analytics = this.getAnalytics();

    if (analytics.summary.averageExecutionTime > 500) {
      recommendations.push('Consider optimizing slow operations or using async processing');
    }

    if (analytics.summary.averageMemoryUsage > 10 * 1024 * 1024) {
      recommendations.push('Monitor memory usage and implement garbage collection strategies');
    }

    if (analytics.summary.averageCPUUsage > 50) {
      recommendations.push('Consider using Web Workers or breaking down CPU-intensive tasks');
    }

    if (this.detectMemoryLeak()) {
      recommendations.push('Investigate potential memory leaks and implement proper cleanup');
    }

    return recommendations;
  }

  private detectMemoryLeak(): boolean {
    if (this.metrics.length < 10) return false;

    const recentMetrics = this.metrics.slice(-10);
    const memoryUsages = recentMetrics.map(m => m.memoryUsage);
    
    // Simple leak detection: consistently increasing memory usage
    let increasingCount = 0;
    for (let i = 1; i < memoryUsages.length; i++) {
      if (memoryUsages[i] > memoryUsages[i - 1]) {
        increasingCount++;
      }
    }

    return increasingCount > 7; // 70% of samples showing increase
  }

  private average(numbers: number[]): number {
    return numbers.length > 0 ? numbers.reduce((a, b) => a + b, 0) / numbers.length : 0;
  }

  private getTrendDirection(values: number[]): string {
    if (values.length < 2) return 'stable';
    
    const first = values.slice(0, Math.floor(values.length / 2));
    const second = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = this.average(first);
    const secondAvg = this.average(second);
    
    if (secondAvg > firstAvg * 1.1) return 'increasing';
    if (secondAvg < firstAvg * 0.9) return 'decreasing';
    return 'stable';
  }
}
