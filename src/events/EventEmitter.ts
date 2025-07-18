import { EventCallback } from '../types';

/**
 * Custom EventEmitter implementation for browser and Node.js compatibility
 */
export class EventEmitter {
  private events: { [key: string]: EventCallback[] } = {};

  /**
   * Add an event listener
   */
  on(event: string, callback: EventCallback): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  /**
   * Add a one-time event listener
   */
  once(event: string, callback: EventCallback): void {
    const onceWrapper = (...args: any[]) => {
      callback(...args);
      this.off(event, onceWrapper);
    };
    this.on(event, onceWrapper);
  }

  /**
   * Remove an event listener
   */
  off(event: string, callback: EventCallback): void {
    if (!this.events[event]) return;
    
    const index = this.events[event].indexOf(callback);
    if (index > -1) {
      this.events[event].splice(index, 1);
    }
  }

  /**
   * Emit an event
   */
  emit(event: string, ...args: any[]): void {
    if (!this.events[event]) return;
    
    this.events[event].forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners(event?: string): void {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }

  /**
   * Get all event names
   */
  eventNames(): string[] {
    return Object.keys(this.events);
  }

  /**
   * Get listener count for an event
   */
  listenerCount(event: string): number {
    return this.events[event] ? this.events[event].length : 0;
  }
}
