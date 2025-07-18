import { APIConfig } from '../types';

/**
 * Advanced API Helper with intelligent caching, retry logic, and request optimization
 */
export class APIHelper {
  private config: APIConfig;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private requestQueue = new Map<string, Promise<any>>();
  private retryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    backoffFactor: 2
  };

  constructor(config: APIConfig = {}) {
    this.config = {
      timeout: 30000,
      retries: 3,
      ...config
    };
  }

  /**
   * Make GET request with intelligent caching
   */
  async get<T>(url: string, options: {
    cache?: boolean;
    cacheTTL?: number;
    timeout?: number;
    retries?: number;
    headers?: Record<string, string>;
  } = {}): Promise<T> {
    const fullUrl = this.buildUrl(url);
    const cacheKey = this.getCacheKey('GET', fullUrl, options.headers);
    
    // Check cache first
    if (options.cache !== false) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Check if request is already in progress
    if (this.requestQueue.has(cacheKey)) {
      return this.requestQueue.get(cacheKey)!;
    }

    // Make request
    const requestPromise = this.makeRequest<T>('GET', fullUrl, undefined, {
      ...options,
      retries: options.retries || this.config.retries
    });

    this.requestQueue.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      
      // Cache successful response
      if (options.cache !== false) {
        this.setCache(cacheKey, result, options.cacheTTL || 300000); // 5 minutes default
      }
      
      return result;
    } finally {
      this.requestQueue.delete(cacheKey);
    }
  }

  /**
   * Make POST request with retry logic
   */
  async post<T>(url: string, data?: any, options: {
    timeout?: number;
    retries?: number;
    headers?: Record<string, string>;
  } = {}): Promise<T> {
    const fullUrl = this.buildUrl(url);
    return this.makeRequest<T>('POST', fullUrl, data, options);
  }

  /**
   * Make PUT request
   */
  async put<T>(url: string, data?: any, options: {
    timeout?: number;
    retries?: number;
    headers?: Record<string, string>;
  } = {}): Promise<T> {
    const fullUrl = this.buildUrl(url);
    return this.makeRequest<T>('PUT', fullUrl, data, options);
  }

  /**
   * Make DELETE request
   */
  async delete<T>(url: string, options: {
    timeout?: number;
    retries?: number;
    headers?: Record<string, string>;
  } = {}): Promise<T> {
    const fullUrl = this.buildUrl(url);
    return this.makeRequest<T>('DELETE', fullUrl, undefined, options);
  }

  /**
   * Make PATCH request
   */
  async patch<T>(url: string, data?: any, options: {
    timeout?: number;
    retries?: number;
    headers?: Record<string, string>;
  } = {}): Promise<T> {
    const fullUrl = this.buildUrl(url);
    return this.makeRequest<T>('PATCH', fullUrl, data, options);
  }

  /**
   * Batch multiple requests
   */
  async batch<T>(requests: Array<{
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    url: string;
    data?: any;
    options?: any;
  }>): Promise<T[]> {
    const promises = requests.map(req => {
      switch (req.method) {
        case 'GET':
          return this.get<T>(req.url, req.options);
        case 'POST':
          return this.post<T>(req.url, req.data, req.options);
        case 'PUT':
          return this.put<T>(req.url, req.data, req.options);
        case 'DELETE':
          return this.delete<T>(req.url, req.options);
        case 'PATCH':
          return this.patch<T>(req.url, req.data, req.options);
        default:
          throw new Error(`Unsupported method: ${req.method}`);
      }
    });

    return Promise.all(promises);
  }

  /**
   * Upload file with progress tracking
   */
  async upload<T>(url: string, file: File | Blob, options: {
    fieldName?: string;
    additionalData?: Record<string, any>;
    onProgress?: (progress: number) => void;
    timeout?: number;
  } = {}): Promise<T> {
    const fullUrl = this.buildUrl(url);
    const formData = new FormData();
    
    formData.append(options.fieldName || 'file', file);
    
    if (options.additionalData) {
      Object.entries(options.additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      if (options.onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            options.onProgress!(progress);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText);
            resolve(result);
          } catch (e) {
            resolve(xhr.responseText as any);
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Upload failed'));
      };

      xhr.timeout = options.timeout || this.config.timeout || 30000;
      xhr.ontimeout = () => {
        reject(new Error('Upload timeout'));
      };

      xhr.open('POST', fullUrl);
      
      // Add headers
      if (this.config.headers) {
        Object.entries(this.config.headers).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value);
        });
      }

      xhr.send(formData);
    });
  }

  /**
   * Download file with progress tracking
   */
  async download(url: string, options: {
    onProgress?: (progress: number) => void;
    timeout?: number;
  } = {}): Promise<Blob> {
    const fullUrl = this.buildUrl(url);
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.responseType = 'blob';
      
      // Track download progress
      if (options.onProgress) {
        xhr.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            options.onProgress!(progress);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr.response);
        } else {
          reject(new Error(`Download failed: ${xhr.status} ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Download failed'));
      };

      xhr.timeout = options.timeout || this.config.timeout || 30000;
      xhr.ontimeout = () => {
        reject(new Error('Download timeout'));
      };

      xhr.open('GET', fullUrl);
      
      // Add headers
      if (this.config.headers) {
        Object.entries(this.config.headers).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value);
        });
      }

      xhr.send();
    });
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    keys: string[];
    hitRate: number;
    totalRequests: number;
    cacheHits: number;
  } {
    // This is a simplified version - in a real implementation you'd track more stats
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      hitRate: 0, // Would need to track hits/misses
      totalRequests: 0,
      cacheHits: 0
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Set global timeout
   */
  setTimeout(timeout: number): void {
    this.config.timeout = timeout;
  }

  /**
   * Add global header
   */
  addHeader(key: string, value: string): void {
    if (!this.config.headers) {
      this.config.headers = {};
    }
    this.config.headers[key] = value;
  }

  /**
   * Remove global header
   */
  removeHeader(key: string): void {
    if (this.config.headers) {
      delete this.config.headers[key];
    }
  }

  /**
   * Set bearer token
   */
  setBearerToken(token: string): void {
    this.addHeader('Authorization', `Bearer ${token}`);
  }

  /**
   * Set API key
   */
  setApiKey(key: string, headerName: string = 'X-API-Key'): void {
    this.addHeader(headerName, key);
  }

  private async makeRequest<T>(
    method: string,
    url: string,
    data?: any,
    options: {
      timeout?: number;
      retries?: number;
      headers?: Record<string, string>;
    } = {}
  ): Promise<T> {
    const maxRetries = options.retries || this.config.retries || 0;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.makeRequestAttempt<T>(method, url, data, options);
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries && this.shouldRetry(error as Error)) {
          const delay = this.calculateRetryDelay(attempt);
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  private async makeRequestAttempt<T>(
    method: string,
    url: string,
    data?: any,
    options: {
      timeout?: number;
      headers?: Record<string, string>;
    } = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timeout = options.timeout || this.config.timeout || 30000;
    
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...this.config.headers,
        ...options.headers
      };

      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text() as any;
      }
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private buildUrl(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    
    const baseUrl = this.config.baseURL || '';
    return `${baseUrl}${path}`;
  }

  private getCacheKey(method: string, url: string, headers?: Record<string, string>): string {
    const headersStr = headers ? JSON.stringify(headers) : '';
    return `${method}:${url}:${headersStr}`;
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    
    if (cached) {
      this.cache.delete(key);
    }
    
    return null;
  }

  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private shouldRetry(error: Error): boolean {
    // Retry on network errors and 5xx status codes
    return error.message.includes('fetch') || 
           error.message.includes('network') || 
           error.message.includes('timeout') ||
           error.message.includes('HTTP 5');
  }

  private calculateRetryDelay(attempt: number): number {
    return this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffFactor, attempt);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
