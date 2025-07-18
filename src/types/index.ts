// Core types for the advanced-dev-utils package

export interface CacheOptions {
  ttl?: number;
  maxSize?: number;
  compression?: boolean;
  persistence?: boolean;
  storage?: 'memory' | 'localStorage' | 'sessionStorage';
}

export interface ValidationRule {
  type: 'required' | 'string' | 'number' | 'email' | 'url' | 'custom';
  message?: string;
  validator?: (value: any) => boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
}

export interface APIConfig {
  baseURL?: string;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
  interceptors?: {
    request?: (config: any) => any;
    response?: (response: any) => any;
    error?: (error: any) => any;
  };
}

export interface PerformanceMetrics {
  executionTime: number;
  memoryUsage: number;
  cpuUsage?: number;
  timestamp: number;
}

export interface AsyncQueueOptions {
  concurrency?: number;
  delay?: number;
  retries?: number;
  timeout?: number;
}

export interface RateLimitOptions {
  requests: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface EventCallback {
  (...args: any[]): void;
}

export interface SmartCacheEntry<T> {
  value: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
  tags?: string[];
}

export interface AIProcessorOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface RealtimeConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  protocols?: string[];
}

export interface DataStreamOptions {
  batchSize?: number;
  flushInterval?: number;
  compression?: boolean;
  encryption?: boolean;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LoggerConfig {
  level: LogLevel;
  format?: 'json' | 'text';
  outputs?: ('console' | 'file' | 'remote')[];
  file?: string;
  remote?: {
    url: string;
    headers?: Record<string, string>;
  };
}

export interface SentimentResult {
  score: number;
  label: 'positive' | 'negative' | 'neutral';
  confidence: number;
  emotions?: Record<string, number>;
}

export interface ValidationResult {
  valid: boolean;
  errors: Array<{
    field: string;
    message: string;
    value: any;
    rule: string;
  }>;
  warnings: Array<{
    field: string;
    message: string;
    value: any;
    suggestion?: string;
  }>;
  data?: any;
}

export interface StreamMessage<T> {
  id: string;
  type: string;
  data: T;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface QueueTask<T> {
  id: string;
  data: T;
  priority: number;
  timeout: number;
  retries: number;
  attempts: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  error?: Error;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export interface APIResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: any;
}

export interface APIError {
  message: string;
  status?: number;
  statusText?: string;
  data?: any;
  config?: any;
}

export interface EncryptionResult {
  encrypted: ArrayBuffer;
  iv: Uint8Array;
  tag?: Uint8Array;
}

export interface JWTPayload {
  [key: string]: any;
  iss?: string;
  sub?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  iat?: number;
  jti?: string;
}

// Function types
export type AsyncFunction<T = any, R = any> = (arg: T) => Promise<R>;
export type SyncFunction<T = any, R = any> = (arg: T) => R;
export type AnyFunction<T = any, R = any> = AsyncFunction<T, R> | SyncFunction<T, R>;

export type Predicate<T> = (value: T) => boolean;
export type Comparator<T> = (a: T, b: T) => number;
export type Transformer<T, R> = (value: T) => R;
export type Reducer<T, R> = (acc: R, value: T, index: number) => R;

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};

export type Optional<T, K extends keyof T> = {
  [P in K]?: T[P];
} & {
  [P in Exclude<keyof T, K>]: T[P];
};
