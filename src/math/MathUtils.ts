/**
 * Advanced Math Utilities with statistical functions and complex calculations
 */
export class MathUtils {
  /**
   * Calculate factorial
   */
  static factorial(n: number): number {
    if (n < 0) throw new Error('Factorial is not defined for negative numbers');
    if (n === 0 || n === 1) return 1;
    
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  }

  /**
   * Calculate fibonacci number
   */
  static fibonacci(n: number): number {
    if (n < 0) throw new Error('Fibonacci is not defined for negative numbers');
    if (n === 0) return 0;
    if (n === 1) return 1;
    
    let a = 0, b = 1;
    for (let i = 2; i <= n; i++) {
      [a, b] = [b, a + b];
    }
    return b;
  }

  /**
   * Check if number is prime
   */
  static isPrime(n: number): boolean {
    if (n < 2) return false;
    if (n === 2) return true;
    if (n % 2 === 0) return false;
    
    for (let i = 3; i <= Math.sqrt(n); i += 2) {
      if (n % i === 0) return false;
    }
    return true;
  }

  /**
   * Generate prime numbers up to n
   */
  static primes(n: number): number[] {
    const primes: number[] = [];
    for (let i = 2; i <= n; i++) {
      if (MathUtils.isPrime(i)) {
        primes.push(i);
      }
    }
    return primes;
  }

  /**
   * Calculate greatest common divisor
   */
  static gcd(a: number, b: number): number {
    while (b !== 0) {
      [a, b] = [b, a % b];
    }
    return Math.abs(a);
  }

  /**
   * Calculate least common multiple
   */
  static lcm(a: number, b: number): number {
    return Math.abs(a * b) / MathUtils.gcd(a, b);
  }

  /**
   * Clamp number between min and max
   */
  static clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  /**
   * Linear interpolation
   */
  static lerp(start: number, end: number, factor: number): number {
    return start + (end - start) * factor;
  }

  /**
   * Map value from one range to another
   */
  static map(value: number, fromMin: number, fromMax: number, toMin: number, toMax: number): number {
    return (value - fromMin) * (toMax - toMin) / (fromMax - fromMin) + toMin;
  }

  /**
   * Round to specific decimal places
   */
  static round(value: number, decimals: number): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }

  /**
   * Calculate distance between two points
   */
  static distance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  /**
   * Convert degrees to radians
   */
  static toRadians(degrees: number): number {
    return degrees * Math.PI / 180;
  }

  /**
   * Convert radians to degrees
   */
  static toDegrees(radians: number): number {
    return radians * 180 / Math.PI;
  }

  /**
   * Calculate average of numbers
   */
  static average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  /**
   * Calculate median of numbers
   */
  static median(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  }

  /**
   * Calculate mode of numbers
   */
  static mode(numbers: number[]): number[] {
    if (numbers.length === 0) return [];
    
    const freq = new Map<number, number>();
    numbers.forEach(num => {
      freq.set(num, (freq.get(num) || 0) + 1);
    });
    
    const maxFreq = Math.max(...freq.values());
    return Array.from(freq.entries())
      .filter(([_, frequency]) => frequency === maxFreq)
      .map(([value]) => value);
  }

  /**
   * Calculate standard deviation
   */
  static standardDeviation(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    
    const mean = MathUtils.average(numbers);
    const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
    return Math.sqrt(variance);
  }

  /**
   * Calculate variance
   */
  static variance(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    
    const mean = MathUtils.average(numbers);
    return numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
  }

  /**
   * Calculate percentile
   */
  static percentile(numbers: number[], p: number): number {
    if (numbers.length === 0) return 0;
    
    const sorted = [...numbers].sort((a, b) => a - b);
    const index = (p / 100) * (sorted.length - 1);
    
    if (index % 1 === 0) {
      return sorted[index];
    } else {
      const lower = Math.floor(index);
      const upper = Math.ceil(index);
      const weight = index - lower;
      return sorted[lower] * (1 - weight) + sorted[upper] * weight;
    }
  }

  /**
   * Generate random number between min and max
   */
  static random(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  /**
   * Generate random integer between min and max (inclusive)
   */
  static randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Check if number is even
   */
  static isEven(n: number): boolean {
    return n % 2 === 0;
  }

  /**
   * Check if number is odd
   */
  static isOdd(n: number): boolean {
    return n % 2 !== 0;
  }

  /**
   * Calculate sum of array
   */
  static sum(numbers: number[]): number {
    return numbers.reduce((sum, num) => sum + num, 0);
  }

  /**
   * Calculate product of array
   */
  static product(numbers: number[]): number {
    return numbers.reduce((product, num) => product * num, 1);
  }

  /**
   * Calculate combinations (nCr)
   */
  static combinations(n: number, r: number): number {
    if (r > n || r < 0) return 0;
    if (r === 0 || r === n) return 1;
    
    return MathUtils.factorial(n) / (MathUtils.factorial(r) * MathUtils.factorial(n - r));
  }

  /**
   * Calculate permutations (nPr)
   */
  static permutations(n: number, r: number): number {
    if (r > n || r < 0) return 0;
    if (r === 0) return 1;
    
    return MathUtils.factorial(n) / MathUtils.factorial(n - r);
  }

  /**
   * Calculate correlation coefficient
   */
  static correlation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;
    
    const n = x.length;
    const meanX = MathUtils.average(x);
    const meanY = MathUtils.average(y);
    
    let numerator = 0;
    let denomX = 0;
    let denomY = 0;
    
    for (let i = 0; i < n; i++) {
      const diffX = x[i] - meanX;
      const diffY = y[i] - meanY;
      
      numerator += diffX * diffY;
      denomX += diffX * diffX;
      denomY += diffY * diffY;
    }
    
    const denominator = Math.sqrt(denomX * denomY);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Calculate linear regression
   */
  static linearRegression(x: number[], y: number[]): { slope: number; intercept: number; r2: number } {
    if (x.length !== y.length || x.length === 0) {
      return { slope: 0, intercept: 0, r2: 0 };
    }
    
    const n = x.length;
    const sumX = MathUtils.sum(x);
    const sumY = MathUtils.sum(y);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R-squared
    const meanY = MathUtils.average(y);
    const totalSumSquares = y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0);
    const residualSumSquares = y.reduce((sum, yi, i) => {
      const predicted = slope * x[i] + intercept;
      return sum + Math.pow(yi - predicted, 2);
    }, 0);
    
    const r2 = 1 - (residualSumSquares / totalSumSquares);
    
    return { slope, intercept, r2 };
  }

  /**
   * Calculate compound interest
   */
  static compoundInterest(principal: number, rate: number, time: number, compoundingFrequency: number = 1): number {
    return principal * Math.pow(1 + rate / compoundingFrequency, compoundingFrequency * time);
  }

  /**
   * Calculate simple interest
   */
  static simpleInterest(principal: number, rate: number, time: number): number {
    return principal * (1 + rate * time);
  }

  /**
   * Check if two numbers are approximately equal
   */
  static approximately(a: number, b: number, epsilon: number = 1e-10): boolean {
    return Math.abs(a - b) < epsilon;
  }

  /**
   * Calculate nth root
   */
  static nthRoot(value: number, n: number): number {
    return Math.pow(value, 1 / n);
  }

  /**
   * Calculate log with custom base
   */
  static logBase(value: number, base: number): number {
    return Math.log(value) / Math.log(base);
  }
}
