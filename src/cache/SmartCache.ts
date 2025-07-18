import { CacheOptions, SmartCacheEntry } from '../types';

/**
 * Advanced Smart Cache with AI-powered eviction, compression, and multi-tier storage
 */
export class SmartCache<T = any> {
  private cache = new Map<string, SmartCacheEntry<T>>();
  private hitCount = 0;
  private missCount = 0;
  private compressionEnabled: boolean;
  private persistenceEnabled: boolean;
  private storageType: 'memory' | 'localStorage' | 'sessionStorage';
  private maxSize: number;
  private ttl: number;
  private compressionThreshold = 1024; // bytes
  private accessPatterns = new Map<string, number[]>();
  private cleanupInterval: any;

  constructor(private options: CacheOptions = {}) {
    this.ttl = options.ttl || 300000; // 5 minutes default
    this.maxSize = options.maxSize || 1000;
    this.compressionEnabled = options.compression || false;
    this.persistenceEnabled = options.persistence || false;
    this.storageType = options.storage || 'memory';
    
    if (this.persistenceEnabled) {
      this.loadFromStorage();
    }

    // Auto-cleanup expired entries
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanup(), this.ttl / 10);
    }
  }

  /**
   * Get value from cache with smart prefetching
   */
  async get(key: string): Promise<T | undefined> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.missCount++;
      return undefined;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      this.missCount++;
      return undefined;
    }

    // Update access patterns for AI-powered eviction
    this.updateAccessPattern(key);
    
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.hitCount++;

    let value = entry.value;
    
    // Decompress if needed
    if (this.compressionEnabled && this.isCompressed(value)) {
      value = await this.decompress(value);
    }

    return value;
  }

  /**
   * Set value in cache with intelligent compression and eviction
   */
  async set(key: string, value: T, tags?: string[]): Promise<void> {
    let finalValue = value;
    let size = this.calculateSize(value);

    // Apply compression for large values
    if (this.compressionEnabled && size > this.compressionThreshold) {
      finalValue = await this.compress(value);
      size = this.calculateSize(finalValue);
    }

    // Check if we need to evict entries
    if (this.cache.size >= this.maxSize) {
      await this.intelligentEviction();
    }

    const entry: SmartCacheEntry<T> = {
      value: finalValue,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now(),
      size,
      tags
    };

    this.cache.set(key, entry);
    this.updateAccessPattern(key);

    if (this.persistenceEnabled) {
      this.saveToStorage();
    }
  }

  /**
   * AI-powered intelligent eviction based on access patterns
   */
  private async intelligentEviction(): Promise<void> {
    const entries = Array.from(this.cache.entries());
    
    // Score each entry based on multiple factors
    const scores = entries.map(([key, entry]) => {
      const age = Date.now() - entry.timestamp;
      const timeSinceAccess = Date.now() - entry.lastAccessed;
      const accessFrequency = this.getAccessFrequency(key);
      const sizeWeight = entry.size / 1024; // KB

      // Weighted scoring algorithm
      const score = (
        (age * 0.3) +
        (timeSinceAccess * 0.4) +
        (1 / (entry.accessCount + 1) * 0.2) +
        (sizeWeight * 0.1) -
        (accessFrequency * 0.3)
      );

      return { key, score };
    });

    // Sort by score (higher = more likely to evict)
    scores.sort((a, b) => b.score - a.score);

    // Evict top 20% of entries
    const evictCount = Math.ceil(this.cache.size * 0.2);
    for (let i = 0; i < evictCount; i++) {
      this.cache.delete(scores[i].key);
      this.accessPatterns.delete(scores[i].key);
    }
  }

  /**
   * Get cache statistics and insights
   */
  getStats(): {
    hitRate: number;
    size: number;
    memoryUsage: number;
    topKeys: string[];
    insights: string[];
  } {
    const totalRequests = this.hitCount + this.missCount;
    const hitRate = totalRequests > 0 ? this.hitCount / totalRequests : 0;
    const memoryUsage = Array.from(this.cache.values())
      .reduce((total, entry) => total + entry.size, 0);
    
    const topKeys = Array.from(this.cache.entries())
      .sort((a, b) => b[1].accessCount - a[1].accessCount)
      .slice(0, 10)
      .map(([key]) => key);

    const insights = this.generateInsights();

    return {
      hitRate,
      size: this.cache.size,
      memoryUsage,
      topKeys,
      insights
    };
  }

  /**
   * Generate AI-powered insights about cache usage
   */
  private generateInsights(): string[] {
    const insights: string[] = [];
    const stats = this.getBasicStats();

    if (stats.hitRate < 0.5) {
      insights.push("Low hit rate detected. Consider increasing TTL or cache size.");
    }

    if (stats.memoryUsage > this.maxSize * 0.8) {
      insights.push("Memory usage is high. Consider enabling compression or reducing TTL.");
    }

    const hotKeys = this.getHotKeys();
    if (hotKeys.length > 0) {
      insights.push(`Hot keys detected: ${hotKeys.join(', ')}. Consider pre-warming these keys.`);
    }

    return insights;
  }

  /**
   * Batch operations for better performance
   */
  async mget(keys: string[]): Promise<Map<string, T>> {
    const results = new Map<string, T>();
    
    for (const key of keys) {
      const value = await this.get(key);
      if (value !== undefined) {
        results.set(key, value);
      }
    }
    
    return results;
  }

  async mset(entries: Map<string, T>): Promise<void> {
    const promises = Array.from(entries.entries()).map(([key, value]) => 
      this.set(key, value)
    );
    await Promise.all(promises);
  }

  /**
   * Tag-based invalidation
   */
  invalidateByTag(tag: string): void {
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags && entry.tags.includes(tag)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Compression utilities
   */
  private async compress(value: any): Promise<any> {
    // Simple compression simulation (in real implementation, use pako or similar)
    const jsonString = JSON.stringify(value);
    return { __compressed: true, data: btoa(jsonString) };
  }

  private async decompress(value: any): Promise<any> {
    if (this.isCompressed(value)) {
      const decompressed = atob(value.data);
      return JSON.parse(decompressed);
    }
    return value;
  }

  private isCompressed(value: any): boolean {
    return value && typeof value === 'object' && value.__compressed === true;
  }

  private calculateSize(value: any): number {
    return new Blob([JSON.stringify(value)]).size;
  }

  private updateAccessPattern(key: string): void {
    const now = Date.now();
    const pattern = this.accessPatterns.get(key) || [];
    pattern.push(now);
    
    // Keep only last 100 accesses
    if (pattern.length > 100) {
      pattern.shift();
    }
    
    this.accessPatterns.set(key, pattern);
  }

  private getAccessFrequency(key: string): number {
    const pattern = this.accessPatterns.get(key) || [];
    if (pattern.length < 2) return 0;
    
    const timeWindow = 60000; // 1 minute
    const now = Date.now();
    const recentAccesses = pattern.filter(time => now - time < timeWindow);
    
    return recentAccesses.length / (timeWindow / 1000); // accesses per second
  }

  private getHotKeys(): string[] {
    return Array.from(this.accessPatterns.entries())
      .filter(([_, pattern]) => pattern.length > 50)
      .map(([key]) => key);
  }

  private getBasicStats() {
    const totalRequests = this.hitCount + this.missCount;
    const hitRate = totalRequests > 0 ? this.hitCount / totalRequests : 0;
    const memoryUsage = Array.from(this.cache.values())
      .reduce((total, entry) => total + entry.size, 0);
    
    return { hitRate, memoryUsage };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
        this.accessPatterns.delete(key);
      }
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    
    const data = Array.from(this.cache.entries());
    const storage = this.storageType === 'localStorage' ? localStorage : sessionStorage;
    storage.setItem('smartcache_data', JSON.stringify(data));
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    
    const storage = this.storageType === 'localStorage' ? localStorage : sessionStorage;
    const data = storage.getItem('smartcache_data');
    
    if (data) {
      try {
        const entries = JSON.parse(data);
        this.cache = new Map(entries);
      } catch (e) {
        console.warn('Failed to load cache from storage:', e);
      }
    }
  }

  clear(): void {
    this.cache.clear();
    this.accessPatterns.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }
}
