/**
 * Advanced Array Utilities with functional programming features and performance optimizations
 */
export class ArrayUtils {
  /**
   * Remove duplicates from array
   */
  static unique<T>(arr: T[]): T[] {
    return [...new Set(arr)];
  }

  /**
   * Remove duplicates based on a property
   */
  static uniqueBy<T>(arr: T[], key: keyof T): T[] {
    const seen = new Set();
    return arr.filter(item => {
      const value = item[key];
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
  }

  /**
   * Group array elements by a key
   */
  static groupBy<T>(arr: T[], key: keyof T): { [key: string]: T[] } {
    return arr.reduce((groups, item) => {
      const groupKey = String(item[key]);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
      return groups;
    }, {} as { [key: string]: T[] });
  }

  /**
   * Chunk array into smaller arrays
   */
  static chunk<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Flatten nested arrays
   */
  static flatten<T>(arr: any[]): T[] {
    return arr.reduce((flat, item) => {
      return flat.concat(Array.isArray(item) ? ArrayUtils.flatten(item) : item);
    }, []);
  }

  /**
   * Find intersection of arrays
   */
  static intersection<T>(...arrays: T[][]): T[] {
    if (arrays.length === 0) return [];
    if (arrays.length === 1) return arrays[0];
    
    return arrays.reduce((acc, arr) => 
      acc.filter(item => arr.includes(item))
    );
  }

  /**
   * Find union of arrays
   */
  static union<T>(...arrays: T[][]): T[] {
    return ArrayUtils.unique(arrays.flat());
  }

  /**
   * Find difference between arrays
   */
  static difference<T>(arr1: T[], arr2: T[]): T[] {
    return arr1.filter(item => !arr2.includes(item));
  }

  /**
   * Shuffle array
   */
  static shuffle<T>(arr: T[]): T[] {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Sample random elements from array
   */
  static sample<T>(arr: T[], count: number): T[] {
    const shuffled = ArrayUtils.shuffle(arr);
    return shuffled.slice(0, count);
  }

  /**
   * Sort array by multiple properties
   */
  static sortBy<T>(arr: T[], ...keys: (keyof T)[]): T[] {
    return [...arr].sort((a, b) => {
      for (const key of keys) {
        const aVal = a[key];
        const bVal = b[key];
        
        if (aVal < bVal) return -1;
        if (aVal > bVal) return 1;
      }
      return 0;
    });
  }

  /**
   * Partition array based on predicate
   */
  static partition<T>(arr: T[], predicate: (item: T) => boolean): [T[], T[]] {
    const passed: T[] = [];
    const failed: T[] = [];
    
    arr.forEach(item => {
      if (predicate(item)) {
        passed.push(item);
      } else {
        failed.push(item);
      }
    });
    
    return [passed, failed];
  }

  /**
   * Find min/max values
   */
  static minMax(arr: number[]): { min: number; max: number } {
    if (arr.length === 0) throw new Error('Array is empty');
    
    let min = arr[0];
    let max = arr[0];
    
    for (let i = 1; i < arr.length; i++) {
      if (arr[i] < min) min = arr[i];
      if (arr[i] > max) max = arr[i];
    }
    
    return { min, max };
  }

  /**
   * Calculate array statistics
   */
  static stats(arr: number[]): {
    mean: number;
    median: number;
    mode: number[];
    min: number;
    max: number;
    sum: number;
    variance: number;
    stdDev: number;
  } {
    if (arr.length === 0) throw new Error('Array is empty');
    
    const sorted = [...arr].sort((a, b) => a - b);
    const sum = arr.reduce((acc, val) => acc + val, 0);
    const mean = sum / arr.length;
    
    // Median
    const mid = Math.floor(arr.length / 2);
    const median = arr.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
    
    // Mode
    const freq = new Map<number, number>();
    arr.forEach(val => {
      freq.set(val, (freq.get(val) || 0) + 1);
    });
    
    const maxFreq = Math.max(...freq.values());
    const mode = Array.from(freq.entries())
      .filter(([_, frequency]) => frequency === maxFreq)
      .map(([value]) => value);
    
    // Variance and standard deviation
    const variance = arr.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / arr.length;
    const stdDev = Math.sqrt(variance);
    
    const { min, max } = ArrayUtils.minMax(arr);
    
    return {
      mean,
      median,
      mode,
      min,
      max,
      sum,
      variance,
      stdDev
    };
  }

  /**
   * Rotate array elements
   */
  static rotate<T>(arr: T[], positions: number): T[] {
    const len = arr.length;
    if (len === 0) return arr;
    
    const normalized = ((positions % len) + len) % len;
    return [...arr.slice(normalized), ...arr.slice(0, normalized)];
  }

  /**
   * Create array range
   */
  static range(start: number, end: number, step: number = 1): number[] {
    const result: number[] = [];
    
    if (step > 0) {
      for (let i = start; i < end; i += step) {
        result.push(i);
      }
    } else {
      for (let i = start; i > end; i += step) {
        result.push(i);
      }
    }
    
    return result;
  }

  /**
   * Zip arrays together
   */
  static zip<T, U>(arr1: T[], arr2: U[]): [T, U][] {
    const length = Math.min(arr1.length, arr2.length);
    const result: [T, U][] = [];
    
    for (let i = 0; i < length; i++) {
      result.push([arr1[i], arr2[i]]);
    }
    
    return result;
  }

  /**
   * Transpose 2D array
   */
  static transpose<T>(matrix: T[][]): T[][] {
    if (matrix.length === 0) return [];
    
    const rows = matrix.length;
    const cols = matrix[0].length;
    const result: T[][] = [];
    
    for (let j = 0; j < cols; j++) {
      result[j] = [];
      for (let i = 0; i < rows; i++) {
        result[j][i] = matrix[i][j];
      }
    }
    
    return result;
  }

  /**
   * Find moving average
   */
  static movingAverage(arr: number[], windowSize: number): number[] {
    if (windowSize <= 0 || windowSize > arr.length) {
      throw new Error('Invalid window size');
    }
    
    const result: number[] = [];
    
    for (let i = 0; i <= arr.length - windowSize; i++) {
      const window = arr.slice(i, i + windowSize);
      const average = window.reduce((sum, val) => sum + val, 0) / windowSize;
      result.push(average);
    }
    
    return result;
  }

  /**
   * Binary search
   */
  static binarySearch<T>(arr: T[], target: T, compareFn?: (a: T, b: T) => number): number {
    let left = 0;
    let right = arr.length - 1;
    
    const compare = compareFn || ((a: T, b: T) => {
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    });
    
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const comparison = compare(arr[mid], target);
      
      if (comparison === 0) {
        return mid;
      } else if (comparison < 0) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    
    return -1;
  }

  /**
   * Check if array is sorted
   */
  static isSorted<T>(arr: T[], compareFn?: (a: T, b: T) => number): boolean {
    if (arr.length <= 1) return true;
    
    const compare = compareFn || ((a: T, b: T) => {
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    });
    
    for (let i = 1; i < arr.length; i++) {
      if (compare(arr[i - 1], arr[i]) > 0) {
        return false;
      }
    }
    
    return true;
  }
}
