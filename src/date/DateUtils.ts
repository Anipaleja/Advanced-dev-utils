/**
 * Advanced Date Utilities with timezone support and intelligent formatting
 */
export class DateUtils {
  /**
   * Format date with custom pattern
   */
  static format(date: Date, pattern: string): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    
    return pattern
      .replace('YYYY', year.toString())
      .replace('YY', year.toString().slice(-2))
      .replace('MM', month.toString().padStart(2, '0'))
      .replace('M', month.toString())
      .replace('DD', day.toString().padStart(2, '0'))
      .replace('D', day.toString())
      .replace('HH', hours.toString().padStart(2, '0'))
      .replace('H', hours.toString())
      .replace('mm', minutes.toString().padStart(2, '0'))
      .replace('m', minutes.toString())
      .replace('ss', seconds.toString().padStart(2, '0'))
      .replace('s', seconds.toString());
  }

  /**
   * Parse date from string
   */
  static parse(dateString: string, format?: string): Date {
    if (format) {
      // Custom format parsing (simplified)
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? new Date() : date;
    }
    
    // Auto-detect common formats
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? new Date() : date;
  }

  /**
   * Add time to date
   */
  static add(date: Date, amount: number, unit: 'years' | 'months' | 'days' | 'hours' | 'minutes' | 'seconds'): Date {
    const result = new Date(date);
    
    switch (unit) {
      case 'years':
        result.setFullYear(result.getFullYear() + amount);
        break;
      case 'months':
        result.setMonth(result.getMonth() + amount);
        break;
      case 'days':
        result.setDate(result.getDate() + amount);
        break;
      case 'hours':
        result.setHours(result.getHours() + amount);
        break;
      case 'minutes':
        result.setMinutes(result.getMinutes() + amount);
        break;
      case 'seconds':
        result.setSeconds(result.getSeconds() + amount);
        break;
    }
    
    return result;
  }

  /**
   * Get difference between dates
   */
  static diff(date1: Date, date2: Date, unit: 'years' | 'months' | 'days' | 'hours' | 'minutes' | 'seconds' = 'days'): number {
    const diffMs = date2.getTime() - date1.getTime();
    
    switch (unit) {
      case 'years':
        return diffMs / (1000 * 60 * 60 * 24 * 365.25);
      case 'months':
        return diffMs / (1000 * 60 * 60 * 24 * 30.44);
      case 'days':
        return diffMs / (1000 * 60 * 60 * 24);
      case 'hours':
        return diffMs / (1000 * 60 * 60);
      case 'minutes':
        return diffMs / (1000 * 60);
      case 'seconds':
        return diffMs / 1000;
      default:
        return diffMs;
    }
  }

  /**
   * Check if date is valid
   */
  static isValid(date: Date): boolean {
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Check if date is in the past
   */
  static isPast(date: Date): boolean {
    return date.getTime() < Date.now();
  }

  /**
   * Check if date is in the future
   */
  static isFuture(date: Date): boolean {
    return date.getTime() > Date.now();
  }

  /**
   * Check if date is today
   */
  static isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  /**
   * Get start of day
   */
  static startOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  /**
   * Get end of day
   */
  static endOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  }

  /**
   * Get start of week
   */
  static startOfWeek(date: Date, weekStartsOn: number = 0): Date {
    const result = new Date(date);
    const day = result.getDay();
    const diff = (day + 7 - weekStartsOn) % 7;
    result.setDate(result.getDate() - diff);
    return DateUtils.startOfDay(result);
  }

  /**
   * Get end of week
   */
  static endOfWeek(date: Date, weekStartsOn: number = 0): Date {
    const result = DateUtils.startOfWeek(date, weekStartsOn);
    result.setDate(result.getDate() + 6);
    return DateUtils.endOfDay(result);
  }

  /**
   * Get start of month
   */
  static startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  /**
   * Get end of month
   */
  static endOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  /**
   * Get start of year
   */
  static startOfYear(date: Date): Date {
    return new Date(date.getFullYear(), 0, 1);
  }

  /**
   * Get end of year
   */
  static endOfYear(date: Date): Date {
    return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
  }

  /**
   * Get days in month
   */
  static daysInMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  /**
   * Check if year is leap year
   */
  static isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  }

  /**
   * Get age from birthdate
   */
  static age(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Get timezone offset
   */
  static getTimezoneOffset(date: Date = new Date()): number {
    return date.getTimezoneOffset();
  }

  /**
   * Convert to UTC
   */
  static toUTC(date: Date): Date {
    return new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  }

  /**
   * Convert from UTC
   */
  static fromUTC(date: Date): Date {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  }

  /**
   * Get relative time (e.g., "2 hours ago")
   */
  static relativeTime(date: Date, baseDate: Date = new Date()): string {
    const diff = baseDate.getTime() - date.getTime();
    const absDiff = Math.abs(diff);
    
    const minute = 60 * 1000;
    const hour = minute * 60;
    const day = hour * 24;
    const week = day * 7;
    const month = day * 30;
    const year = day * 365;
    
    const suffix = diff > 0 ? 'ago' : 'from now';
    
    if (absDiff < minute) {
      return 'just now';
    } else if (absDiff < hour) {
      const minutes = Math.floor(absDiff / minute);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ${suffix}`;
    } else if (absDiff < day) {
      const hours = Math.floor(absDiff / hour);
      return `${hours} hour${hours > 1 ? 's' : ''} ${suffix}`;
    } else if (absDiff < week) {
      const days = Math.floor(absDiff / day);
      return `${days} day${days > 1 ? 's' : ''} ${suffix}`;
    } else if (absDiff < month) {
      const weeks = Math.floor(absDiff / week);
      return `${weeks} week${weeks > 1 ? 's' : ''} ${suffix}`;
    } else if (absDiff < year) {
      const months = Math.floor(absDiff / month);
      return `${months} month${months > 1 ? 's' : ''} ${suffix}`;
    } else {
      const years = Math.floor(absDiff / year);
      return `${years} year${years > 1 ? 's' : ''} ${suffix}`;
    }
  }

  /**
   * Get quarter of year
   */
  static quarter(date: Date): number {
    return Math.floor((date.getMonth() + 3) / 3);
  }

  /**
   * Get week of year
   */
  static weekOfYear(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  /**
   * Get day of year
   */
  static dayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if two dates are same day
   */
  static isSameDay(date1: Date, date2: Date): boolean {
    return date1.toDateString() === date2.toDateString();
  }

  /**
   * Check if date is weekend
   */
  static isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6;
  }

  /**
   * Check if date is weekday
   */
  static isWeekday(date: Date): boolean {
    return !DateUtils.isWeekend(date);
  }

  /**
   * Generate date range
   */
  static range(start: Date, end: Date, step: number = 1, unit: 'days' | 'hours' | 'minutes' = 'days'): Date[] {
    const dates: Date[] = [];
    let current = new Date(start);
    
    while (current <= end) {
      dates.push(new Date(current));
      current = DateUtils.add(current, step, unit);
    }
    
    return dates;
  }

  /**
   * Get business days between dates
   */
  static businessDays(start: Date, end: Date): Date[] {
    const dates = DateUtils.range(start, end);
    return dates.filter(date => DateUtils.isWeekday(date));
  }

  /**
   * Get closest date from array
   */
  static closest(targetDate: Date, dates: Date[]): Date | null {
    if (dates.length === 0) return null;
    
    return dates.reduce((closest, date) => {
      const closestDiff = Math.abs(targetDate.getTime() - closest.getTime());
      const dateDiff = Math.abs(targetDate.getTime() - date.getTime());
      return dateDiff < closestDiff ? date : closest;
    });
  }

  /**
   * Get month name
   */
  static monthName(month: number, locale: string = 'en-US'): string {
    const date = new Date(2000, month - 1, 1);
    return date.toLocaleDateString(locale, { month: 'long' });
  }

  /**
   * Get day name
   */
  static dayName(day: number, locale: string = 'en-US'): string {
    const date = new Date(2000, 0, day + 1);
    return date.toLocaleDateString(locale, { weekday: 'long' });
  }
}
