/**
 * Advanced Object Utilities with deep operations and functional programming features
 */
export class ObjectUtils {
  /**
   * Deep clone an object
   */
  static deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj;
    
    if (obj instanceof Date) return new Date(obj.getTime()) as any;
    if (obj instanceof Array) return obj.map(item => ObjectUtils.deepClone(item)) as any;
    if (obj instanceof RegExp) return new RegExp(obj) as any;
    
    const cloned = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = ObjectUtils.deepClone(obj[key]);
      }
    }
    
    return cloned;
  }

  /**
   * Deep merge objects
   */
  static deepMerge<T>(...objects: Partial<T>[]): T {
    const result = {} as T;
    
    for (const obj of objects) {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const value = obj[key];
          
          if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
            result[key] = ObjectUtils.deepMerge(result[key] || {}, value);
          } else {
            result[key] = value as any;
          }
        }
      }
    }
    
    return result;
  }

  /**
   * Get nested property value
   */
  static get(obj: any, path: string, defaultValue?: any): any {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current == null || typeof current !== 'object') {
        return defaultValue;
      }
      current = current[key];
    }
    
    return current !== undefined ? current : defaultValue;
  }

  /**
   * Set nested property value
   */
  static set(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  /**
   * Check if object has nested property
   */
  static has(obj: any, path: string): boolean {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current == null || typeof current !== 'object' || !(key in current)) {
        return false;
      }
      current = current[key];
    }
    
    return true;
  }

  /**
   * Delete nested property
   */
  static unset(obj: any, path: string): boolean {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (current == null || typeof current !== 'object' || !(key in current)) {
        return false;
      }
      current = current[key];
    }
    
    const lastKey = keys[keys.length - 1];
    if (current && typeof current === 'object' && lastKey in current) {
      delete current[lastKey];
      return true;
    }
    
    return false;
  }

  /**
   * Get all paths in an object
   */
  static paths(obj: any, prefix: string = ''): string[] {
    const paths: string[] = [];
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const path = prefix ? `${prefix}.${key}` : key;
        paths.push(path);
        
        if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
          paths.push(...ObjectUtils.paths(obj[key], path));
        }
      }
    }
    
    return paths;
  }

  /**
   * Flatten object with dot notation
   */
  static flatten(obj: any, prefix: string = ''): { [key: string]: any } {
    const flattened: { [key: string]: any } = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const path = prefix ? `${prefix}.${key}` : key;
        
        if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key]) && !(obj[key] instanceof Date)) {
          Object.assign(flattened, ObjectUtils.flatten(obj[key], path));
        } else {
          flattened[path] = obj[key];
        }
      }
    }
    
    return flattened;
  }

  /**
   * Unflatten object from dot notation
   */
  static unflatten(obj: { [key: string]: any }): any {
    const result: any = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        ObjectUtils.set(result, key, obj[key]);
      }
    }
    
    return result;
  }

  /**
   * Pick specific properties from object
   */
  static pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
    const result = {} as Pick<T, K>;
    
    for (const key of keys) {
      if (obj && typeof obj === 'object' && key in obj) {
        result[key] = obj[key];
      }
    }
    
    return result;
  }

  /**
   * Omit specific properties from object
   */
  static omit<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
    const result = { ...obj } as any;
    
    for (const key of keys) {
      delete result[key];
    }
    
    return result;
  }

  /**
   * Transform object values
   */
  static mapValues<T, U>(obj: { [key: string]: T }, mapper: (value: T, key: string) => U): { [key: string]: U } {
    const result: { [key: string]: U } = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        result[key] = mapper(obj[key], key);
      }
    }
    
    return result;
  }

  /**
   * Transform object keys
   */
  static mapKeys<T>(obj: { [key: string]: T }, mapper: (key: string, value: T) => string): { [key: string]: T } {
    const result: { [key: string]: T } = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = mapper(key, obj[key]);
        result[newKey] = obj[key];
      }
    }
    
    return result;
  }

  /**
   * Check if object is empty
   */
  static isEmpty(obj: any): boolean {
    if (obj == null) return true;
    if (Array.isArray(obj)) return obj.length === 0;
    if (typeof obj === 'object') return Object.keys(obj).length === 0;
    return false;
  }

  /**
   * Deep equality check
   */
  static isEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) return true;
    
    if (obj1 == null || obj2 == null) return obj1 === obj2;
    
    if (typeof obj1 !== typeof obj2) return false;
    
    if (typeof obj1 !== 'object') return obj1 === obj2;
    
    if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;
    
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) return false;
    
    for (const key of keys1) {
      if (!keys2.includes(key)) return false;
      if (!ObjectUtils.isEqual(obj1[key], obj2[key])) return false;
    }
    
    return true;
  }

  /**
   * Get object size (number of properties)
   */
  static size(obj: any): number {
    if (obj == null) return 0;
    if (Array.isArray(obj)) return obj.length;
    if (typeof obj === 'object') return Object.keys(obj).length;
    return 0;
  }

  /**
   * Invert object (swap keys and values)
   */
  static invert(obj: { [key: string]: string | number }): { [key: string]: string } {
    const result: { [key: string]: string } = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        result[String(obj[key])] = key;
      }
    }
    
    return result;
  }

  /**
   * Create object from key-value pairs
   */
  static fromEntries<T>(entries: [string, T][]): { [key: string]: T } {
    const result: { [key: string]: T } = {};
    
    for (const [key, value] of entries) {
      result[key] = value;
    }
    
    return result;
  }

  /**
   * Convert object to key-value pairs
   */
  static entries<T>(obj: { [key: string]: T }): [string, T][] {
    const result: [string, T][] = [];
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        result.push([key, obj[key]]);
      }
    }
    
    return result;
  }

  /**
   * Filter object properties
   */
  static filter<T>(obj: { [key: string]: T }, predicate: (value: T, key: string) => boolean): { [key: string]: T } {
    const result: { [key: string]: T } = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key) && predicate(obj[key], key)) {
        result[key] = obj[key];
      }
    }
    
    return result;
  }

  /**
   * Merge objects with custom merge function
   */
  static mergeWith<T>(target: T, source: Partial<T>, customizer: (targetValue: any, sourceValue: any, key: string) => any): T {
    const result = { ...target };
    
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        const targetValue = (result as any)[key];
        const sourceValue = source[key];
        const customValue = customizer(targetValue, sourceValue, key);
        
        if (customValue !== undefined) {
          (result as any)[key] = customValue;
        } else {
          (result as any)[key] = sourceValue;
        }
      }
    }
    
    return result;
  }

  /**
   * Get object schema/structure
   */
  static schema(obj: any): any {
    if (obj === null) return null;
    if (typeof obj !== 'object') return typeof obj;
    
    if (Array.isArray(obj)) {
      return obj.length > 0 ? [ObjectUtils.schema(obj[0])] : [];
    }
    
    const schema: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        schema[key] = ObjectUtils.schema(obj[key]);
      }
    }
    
    return schema;
  }

  /**
   * Validate object against schema
   */
  static validateSchema(obj: any, schema: any): boolean {
    if (schema === null) return obj === null;
    if (typeof schema === 'string') return typeof obj === schema;
    
    if (Array.isArray(schema)) {
      if (!Array.isArray(obj)) return false;
      return schema.length === 0 || obj.every(item => ObjectUtils.validateSchema(item, schema[0]));
    }
    
    if (typeof schema === 'object' && schema !== null) {
      if (typeof obj !== 'object' || obj === null) return false;
      
      for (const key in schema) {
        if (schema.hasOwnProperty(key)) {
          if (!(key in obj)) return false;
          if (!ObjectUtils.validateSchema(obj[key], schema[key])) return false;
        }
      }
      
      return true;
    }
    
    return false;
  }
}
