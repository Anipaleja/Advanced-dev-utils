import { EventEmitter } from '../events/EventEmitter';
import { RealtimeConfig, DataStreamOptions } from '../types';

/**
 * Real-time data stream processor with WebSocket support and intelligent buffering
 */
export class RealtimeStream extends EventEmitter {
  private ws: any = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts: number;
  private reconnectInterval: number;
  private buffer: any[] = [];
  private batchSize: number;
  private flushInterval: number;
  private flushTimer: any;
  private config: RealtimeConfig;
  private dataOptions: DataStreamOptions;
  private messageCount = { received: 0, sent: 0 };
  private latencyHistory: number[] = [];
  private throughputHistory: { timestamp: number; count: number }[] = [];

  constructor(config: RealtimeConfig, dataOptions: DataStreamOptions = {}) {
    super();
    this.config = config;
    this.dataOptions = {
      batchSize: 100,
      flushInterval: 1000,
      compression: false,
      encryption: false,
      ...dataOptions
    };
    
    this.maxReconnectAttempts = config.maxReconnectAttempts || 5;
    this.reconnectInterval = config.reconnectInterval || 5000;
    this.batchSize = this.dataOptions.batchSize || 100;
    this.flushInterval = this.dataOptions.flushInterval || 1000;
  }

  /**
   * Connect to the WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // For browser environments
        if (typeof WebSocket !== 'undefined') {
          this.ws = new WebSocket(this.config.url, this.config.protocols);
        } else {
          // For Node.js environments - would need ws package
          reject(new Error('WebSocket not available in this environment'));
          return;
        }

        this.ws.onopen = () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.emit('connected');
          this.startFlushTimer();
          resolve();
        };

        this.ws.onmessage = (event: any) => {
          this.messageCount.received++;
          this.handleMessage(event);
        };

        this.ws.onclose = () => {
          this.isConnected = false;
          this.emit('disconnected');
          this.stopFlushTimer();
          this.attemptReconnect();
        };

        this.ws.onerror = (error: any) => {
          this.emit('error', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Send data through the stream
   */
  send(data: any): void {
    if (!this.isConnected || !this.ws) {
      this.buffer.push(data);
      return;
    }

    const processedData = this.processOutgoingData(data);
    this.ws.send(JSON.stringify(processedData));
  }

  /**
   * Send data in batches for better performance
   */
  sendBatch(data: any[]): void {
    if (!this.isConnected || !this.ws) {
      this.buffer.push(...data);
      return;
    }

    const processedBatch = data.map(item => this.processOutgoingData(item));
    this.ws.send(JSON.stringify({ batch: processedBatch }));
  }

  /**
   * Subscribe to specific data channels
   */
  subscribe(channel: string, callback: (data: any) => void): void {
    this.on(`channel:${channel}`, callback);
    
    if (this.isConnected) {
      this.send({
        type: 'subscribe',
        channel: channel,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Unsubscribe from data channels
   */
  unsubscribe(channel: string): void {
    this.removeAllListeners(`channel:${channel}`);
    
    if (this.isConnected) {
      this.send({
        type: 'unsubscribe',
        channel: channel,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Stream analytics and metrics
   */
  getMetrics(): {
    isConnected: boolean;
    messagesReceived: number;
    messagesSent: number;
    bufferSize: number;
    averageLatency: number;
    throughput: number;
  } {
    return {
      isConnected: this.isConnected,
      messagesReceived: this.getMessageCount('received'),
      messagesSent: this.getMessageCount('sent'),
      bufferSize: this.buffer.length,
      averageLatency: this.calculateAverageLatency(),
      throughput: this.calculateThroughput()
    };
  }

  /**
   * Real-time data transformation and filtering
   */
  addFilter(filterFn: (data: any) => boolean): void {
    this.on('data', (data) => {
      if (filterFn(data)) {
        this.emit('filtered-data', data);
      }
    });
  }

  addTransformer(transformFn: (data: any) => any): void {
    this.on('data', (data) => {
      const transformed = transformFn(data);
      this.emit('transformed-data', transformed);
    });
  }

  /**
   * Intelligent data aggregation
   */
  startAggregation(windowSize: number, aggregatorFn: (data: any[]) => any): void {
    const window: any[] = [];
    let windowTimer: any;

    this.on('data', (data) => {
      window.push(data);
      
      if (window.length >= windowSize) {
        const aggregated = aggregatorFn(window);
        this.emit('aggregated-data', aggregated);
        window.length = 0;
      }
    });

    // Time-based aggregation
    windowTimer = setInterval(() => {
      if (window.length > 0) {
        const aggregated = aggregatorFn(window);
        this.emit('aggregated-data', aggregated);
        window.length = 0;
      }
    }, this.flushInterval);
  }

  /**
   * Disconnect from the stream
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.stopFlushTimer();
  }

  private handleMessage(event: any): void {
    try {
      const data = JSON.parse(event.data);
      
      // Handle different message types
      if (data.type === 'batch') {
        data.items.forEach((item: any) => {
          this.processIncomingData(item);
        });
      } else if (data.channel) {
        this.emit(`channel:${data.channel}`, data);
      } else {
        this.processIncomingData(data);
      }
    } catch (error) {
      this.emit('error', new Error(`Failed to parse message: ${error}`));
    }
  }

  private processIncomingData(data: any): void {
    // Add timestamp if not present
    if (!data.timestamp) {
      data.timestamp = Date.now();
    }

    // Decrypt if needed
    if (this.dataOptions.encryption && data.encrypted) {
      data = this.decrypt(data);
    }

    // Decompress if needed
    if (this.dataOptions.compression && data.compressed) {
      data = this.decompress(data);
    }

    this.emit('data', data);
  }

  private processOutgoingData(data: any): any {
    let processedData = { ...data };

    // Add timestamp
    processedData.timestamp = Date.now();

    // Encrypt if needed
    if (this.dataOptions.encryption) {
      processedData = this.encrypt(processedData);
    }

    // Compress if needed
    if (this.dataOptions.compression) {
      processedData = this.compress(processedData);
    }

    return processedData;
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('max-reconnect-attempts-reached');
      return;
    }

    this.reconnectAttempts++;
    this.emit('reconnecting', this.reconnectAttempts);

    setTimeout(() => {
      this.connect().catch(() => {
        // Reconnection failed, will try again
      });
    }, this.reconnectInterval);
  }

  private startFlushTimer(): void {
    if (typeof setInterval !== 'undefined') {
      this.flushTimer = setInterval(() => {
        this.flushBuffer();
      }, this.flushInterval);
    }
  }

  private stopFlushTimer(): void {
    if (this.flushTimer && typeof clearInterval !== 'undefined') {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  private flushBuffer(): void {
    if (this.buffer.length === 0) return;

    const batch = this.buffer.splice(0, this.batchSize);
    this.sendBatch(batch);
  }

  private encrypt(data: any): any {
    // Simple encryption simulation (use real encryption in production)
    return {
      encrypted: true,
      data: typeof btoa !== 'undefined' ? btoa(JSON.stringify(data)) : Buffer.from(JSON.stringify(data)).toString('base64')
    };
  }

  private decrypt(data: any): any {
    if (data.encrypted) {
      const decoded = typeof atob !== 'undefined' ? atob(data.data) : Buffer.from(data.data, 'base64').toString();
      return JSON.parse(decoded);
    }
    return data;
  }

  private compress(data: any): any {
    // Simple compression simulation
    return {
      compressed: true,
      data: typeof btoa !== 'undefined' ? btoa(JSON.stringify(data)) : Buffer.from(JSON.stringify(data)).toString('base64')
    };
  }

  private decompress(data: any): any {
    if (data.compressed) {
      const decoded = typeof atob !== 'undefined' ? atob(data.data) : Buffer.from(data.data, 'base64').toString();
      return JSON.parse(decoded);
    }
    return data;
  }

  private getMessageCount(type: 'received' | 'sent'): number {
    return this.messageCount[type];
  }

  private calculateAverageLatency(): number {
    if (this.latencyHistory.length === 0) return 0;
    return this.latencyHistory.reduce((sum, latency) => sum + latency, 0) / this.latencyHistory.length;
  }

  private calculateThroughput(): number {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    const recentThroughput = this.throughputHistory.filter(
      entry => entry.timestamp > oneMinuteAgo
    );
    
    return recentThroughput.reduce((sum, entry) => sum + entry.count, 0);
  }
}
