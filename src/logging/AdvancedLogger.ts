import { LogLevel, LoggerConfig } from '../types';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  metadata?: any;
  source?: string;
  context?: any;
}

/**
 * Advanced Logger with multiple outputs, intelligent filtering, and real-time analytics
 */
export class AdvancedLogger {
  private config: LoggerConfig;
  private logs: LogEntry[] = [];
  private maxLogSize = 10000;
  private logCounts: { [key in LogLevel]: number } = {
    debug: 0,
    info: 0,
    warn: 0,
    error: 0
  };
  private outputStreams: Map<string, (log: LogEntry) => void> = new Map();
  private filters: Array<(log: LogEntry) => boolean> = [];
  private isRemoteEnabled = false;

  constructor(config: LoggerConfig) {
    this.config = {
      format: 'text',
      outputs: ['console'],
      ...config
    };
    
    this.setupOutputStreams();
  }

  /**
   * Log debug message
   */
  debug(message: string, metadata?: any): void {
    this.log('debug', message, metadata);
  }

  /**
   * Log info message
   */
  info(message: string, metadata?: any): void {
    this.log('info', message, metadata);
  }

  /**
   * Log warning message
   */
  warn(message: string, metadata?: any): void {
    this.log('warn', message, metadata);
  }

  /**
   * Log error message
   */
  error(message: string, metadata?: any): void {
    this.log('error', message, metadata);
  }

  /**
   * Log with custom level
   */
  log(level: LogLevel, message: string, metadata?: any): void {
    if (!this.shouldLog(level)) return;

    const logEntry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      metadata,
      source: this.getCallStack(),
      context: this.getContext()
    };

    // Apply filters
    if (!this.filters.every(filter => filter(logEntry))) {
      return;
    }

    // Store log
    this.logs.push(logEntry);
    this.logCounts[level]++;

    // Maintain max size
    if (this.logs.length > this.maxLogSize) {
      this.logs.shift();
    }

    // Send to outputs
    this.outputToStreams(logEntry);
  }

  /**
   * Create a child logger with context
   */
  createChild(context: any): AdvancedLogger {
    const childLogger = new AdvancedLogger(this.config);
    childLogger.logs = this.logs; // Share log history
    childLogger.logCounts = this.logCounts; // Share counters
    childLogger.outputStreams = this.outputStreams; // Share streams
    childLogger.filters = [...this.filters]; // Copy filters
    
    // Add context to all logs
    childLogger.addFilter((log: LogEntry) => {
      log.context = { ...log.context, ...context };
      return true;
    });

    return childLogger;
  }

  /**
   * Add custom filter
   */
  addFilter(filter: (log: LogEntry) => boolean): void {
    this.filters.push(filter);
  }

  /**
   * Remove all filters
   */
  clearFilters(): void {
    this.filters = [];
  }

  /**
   * Add custom output stream
   */
  addOutputStream(name: string, handler: (log: LogEntry) => void): void {
    this.outputStreams.set(name, handler);
  }

  /**
   * Remove output stream
   */
  removeOutputStream(name: string): void {
    this.outputStreams.delete(name);
  }

  /**
   * Get log analytics
   */
  getAnalytics(): {
    totalLogs: number;
    logsByLevel: { [key in LogLevel]: number };
    recentActivity: { level: LogLevel; count: number; timestamp: number }[];
    topSources: { source: string; count: number }[];
    errorRate: number;
    averageLogsPerMinute: number;
  } {
    const totalLogs = this.logs.length;
    const recentLogs = this.logs.filter(log => 
      Date.now() - log.timestamp < 60000 // Last minute
    );

    // Group recent logs by level
    const recentActivity = Object.keys(this.logCounts).map(level => ({
      level: level as LogLevel,
      count: recentLogs.filter(log => log.level === level).length,
      timestamp: Date.now()
    }));

    // Count logs by source
    const sourceCounts = new Map<string, number>();
    this.logs.forEach(log => {
      if (log.source) {
        sourceCounts.set(log.source, (sourceCounts.get(log.source) || 0) + 1);
      }
    });

    const topSources = Array.from(sourceCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([source, count]) => ({ source, count }));

    const errorRate = totalLogs > 0 ? 
      (this.logCounts.error + this.logCounts.warn) / totalLogs : 0;

    const oldestLog = this.logs.length > 0 ? this.logs[0].timestamp : Date.now();
    const timeSpan = (Date.now() - oldestLog) / 1000 / 60; // minutes
    const averageLogsPerMinute = timeSpan > 0 ? totalLogs / timeSpan : 0;

    return {
      totalLogs,
      logsByLevel: { ...this.logCounts },
      recentActivity,
      topSources,
      errorRate,
      averageLogsPerMinute
    };
  }

  /**
   * Search logs
   */
  searchLogs(query: string, options: {
    level?: LogLevel;
    timeRange?: { start: number; end: number };
    limit?: number;
  } = {}): LogEntry[] {
    let filteredLogs = this.logs;

    // Filter by level
    if (options.level) {
      filteredLogs = filteredLogs.filter(log => log.level === options.level);
    }

    // Filter by time range
    if (options.timeRange) {
      filteredLogs = filteredLogs.filter(log => 
        log.timestamp >= options.timeRange!.start && 
        log.timestamp <= options.timeRange!.end
      );
    }

    // Search in message and metadata
    const searchResults = filteredLogs.filter(log => {
      const searchText = [
        log.message,
        JSON.stringify(log.metadata || {}),
        log.source || ''
      ].join(' ').toLowerCase();
      
      return searchText.includes(query.toLowerCase());
    });

    // Apply limit
    if (options.limit) {
      return searchResults.slice(0, options.limit);
    }

    return searchResults;
  }

  /**
   * Export logs
   */
  exportLogs(format: 'json' | 'csv' | 'text' = 'json'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(this.logs, null, 2);
      
      case 'csv':
        const headers = ['timestamp', 'level', 'message', 'source', 'metadata'];
        const rows = this.logs.map(log => [
          new Date(log.timestamp).toISOString(),
          log.level,
          log.message.replace(/,/g, ';'), // Escape commas
          log.source || '',
          JSON.stringify(log.metadata || {}).replace(/,/g, ';')
        ]);
        return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
      
      case 'text':
        return this.logs.map(log => this.formatLogEntry(log)).join('\n');
      
      default:
        return JSON.stringify(this.logs);
    }
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
    this.logCounts = { debug: 0, info: 0, warn: 0, error: 0 };
  }

  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Monitor log patterns and anomalies
   */
  detectAnomalies(): {
    anomalies: Array<{
      type: 'spike' | 'pattern' | 'frequency';
      description: string;
      severity: 'low' | 'medium' | 'high';
      timestamp: number;
    }>;
    insights: string[];
  } {
    const anomalies: Array<{
      type: 'spike' | 'pattern' | 'frequency';
      description: string;
      severity: 'low' | 'medium' | 'high';
      timestamp: number;
    }> = [];
    const insights: string[] = [];

    // Detect error spikes
    const recentErrors = this.logs.filter(log => 
      log.level === 'error' && Date.now() - log.timestamp < 300000 // Last 5 minutes
    );

    if (recentErrors.length > 10) {
      anomalies.push({
        type: 'spike',
        description: `High error rate detected: ${recentErrors.length} errors in last 5 minutes`,
        severity: 'high',
        timestamp: Date.now()
      });
    }

    // Detect repeated patterns
    const recentMessages = this.logs
      .filter(log => Date.now() - log.timestamp < 600000) // Last 10 minutes
      .map(log => log.message);
    
    const messageCounts = new Map<string, number>();
    recentMessages.forEach(message => {
      messageCounts.set(message, (messageCounts.get(message) || 0) + 1);
    });

    messageCounts.forEach((count, message) => {
      if (count > 5) {
        anomalies.push({
          type: 'pattern',
          description: `Repeated message detected: "${message}" appeared ${count} times`,
          severity: count > 20 ? 'high' : 'medium',
          timestamp: Date.now()
        });
      }
    });

    // Generate insights
    const analytics = this.getAnalytics();
    
    if (analytics.errorRate > 0.1) {
      insights.push(`High error rate (${(analytics.errorRate * 100).toFixed(1)}%) - investigate recent errors`);
    }

    if (analytics.averageLogsPerMinute > 100) {
      insights.push(`High logging volume (${analytics.averageLogsPerMinute.toFixed(1)} logs/min) - consider log level optimization`);
    }

    if (analytics.topSources.length > 0) {
      const topSource = analytics.topSources[0];
      insights.push(`Top logging source: ${topSource.source} (${topSource.count} logs)`);
    }

    return { anomalies, insights };
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const logLevelIndex = levels.indexOf(level);
    
    return logLevelIndex >= currentLevelIndex;
  }

  private setupOutputStreams(): void {
    this.config.outputs?.forEach(output => {
      switch (output) {
        case 'console':
          this.outputStreams.set('console', (log: LogEntry) => {
            const formatted = this.formatLogEntry(log);
            
            switch (log.level) {
              case 'error':
                console.error(formatted);
                break;
              case 'warn':
                console.warn(formatted);
                break;
              case 'info':
                console.info(formatted);
                break;
              case 'debug':
                console.debug(formatted);
                break;
            }
          });
          break;

        case 'file':
          if (this.config.file) {
            this.outputStreams.set('file', (log: LogEntry) => {
              // File writing would be implemented here
              // For now, just store the intent
              const formatted = this.formatLogEntry(log);
              // In a real implementation, you'd write to file
            });
          }
          break;

        case 'remote':
          if (this.config.remote) {
            this.outputStreams.set('remote', (log: LogEntry) => {
              this.sendToRemote(log);
            });
          }
          break;
      }
    });
  }

  private outputToStreams(log: LogEntry): void {
    this.outputStreams.forEach(handler => {
      try {
        handler(log);
      } catch (error) {
        console.error('Error in log output handler:', error);
      }
    });
  }

  private formatLogEntry(log: LogEntry): string {
    const timestamp = new Date(log.timestamp).toISOString();
    const level = log.level.toUpperCase().padEnd(5);
    
    if (this.config.format === 'json') {
      return JSON.stringify({
        timestamp,
        level: log.level,
        message: log.message,
        source: log.source,
        metadata: log.metadata,
        context: log.context
      });
    }

    // Text format
    let formatted = `[${timestamp}] ${level} ${log.message}`;
    
    if (log.source) {
      formatted += ` (${log.source})`;
    }
    
    if (log.metadata) {
      formatted += ` ${JSON.stringify(log.metadata)}`;
    }
    
    return formatted;
  }

  private getCallStack(): string {
    const stack = new Error().stack;
    if (!stack) return 'unknown';
    
    const lines = stack.split('\n');
    // Skip first few lines (Error, this method, log method)
    for (let i = 3; i < lines.length; i++) {
      const line = lines[i];
      if (line && !line.includes('AdvancedLogger')) {
        const match = line.match(/at\s+(.+?)\s+\(/);
        return match ? match[1] : 'unknown';
      }
    }
    
    return 'unknown';
  }

  private getContext(): any {
    // Get current context (could include request ID, user ID, etc.)
    return {
      processId: typeof process !== 'undefined' ? process.pid : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location?.href : undefined
    };
  }

  private async sendToRemote(log: LogEntry): Promise<void> {
    if (!this.config.remote) return;
    
    try {
      const response = await fetch(this.config.remote.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.config.remote.headers
        },
        body: JSON.stringify(log)
      });
      
      if (!response.ok) {
        console.error('Failed to send log to remote:', response.statusText);
      }
    } catch (error) {
      console.error('Error sending log to remote:', error);
    }
  }
}
