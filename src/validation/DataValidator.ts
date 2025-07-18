import { ValidationRule } from '../types';

/**
 * Advanced Data Validator with AI-powered validation, schema inference, and smart error recovery
 */
export class DataValidator {
  private rules: Map<string, ValidationRule[]> = new Map();
  private schemas: Map<string, any> = new Map();
  private validationHistory: { field: string; value: any; result: boolean; timestamp: number }[] = [];

  /**
   * Add validation rules for a field
   */
  addRule(field: string, rule: ValidationRule): void {
    if (!this.rules.has(field)) {
      this.rules.set(field, []);
    }
    this.rules.get(field)!.push(rule);
  }

  /**
   * Add multiple validation rules
   */
  addRules(field: string, rules: ValidationRule[]): void {
    rules.forEach(rule => this.addRule(field, rule));
  }

  /**
   * Validate a single field
   */
  validateField(field: string, value: any): {
    isValid: boolean;
    errors: string[];
    suggestions?: string[];
  } {
    const rules = this.rules.get(field) || [];
    const errors: string[] = [];
    const suggestions: string[] = [];

    for (const rule of rules) {
      const result = this.applyRule(rule, value);
      
      // Record validation history
      this.validationHistory.push({
        field,
        value,
        result: result.isValid,
        timestamp: Date.now()
      });

      if (!result.isValid) {
        errors.push(result.error);
        if (result.suggestion) {
          suggestions.push(result.suggestion);
        }
      }
    }

    // AI-powered suggestions based on validation history
    const aiSuggestions = this.generateAISuggestions(field, value);
    suggestions.push(...aiSuggestions);

    return {
      isValid: errors.length === 0,
      errors,
      suggestions: suggestions.length > 0 ? suggestions : undefined
    };
  }

  /**
   * Validate an entire object
   */
  validateObject(obj: any): {
    isValid: boolean;
    errors: { [field: string]: string[] };
    suggestions: { [field: string]: string[] };
    summary: {
      totalFields: number;
      validFields: number;
      invalidFields: number;
      confidence: number;
    };
  } {
    const errors: { [field: string]: string[] } = {};
    const suggestions: { [field: string]: string[] } = {};
    let validFields = 0;

    const fields = Object.keys(obj);
    
    for (const field of fields) {
      const result = this.validateField(field, obj[field]);
      
      if (result.isValid) {
        validFields++;
      } else {
        errors[field] = result.errors;
        if (result.suggestions) {
          suggestions[field] = result.suggestions;
        }
      }
    }

    const confidence = validFields / fields.length;

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      suggestions,
      summary: {
        totalFields: fields.length,
        validFields,
        invalidFields: fields.length - validFields,
        confidence
      }
    };
  }

  /**
   * Infer schema from data samples
   */
  inferSchema(data: any[]): any {
    if (data.length === 0) return {};

    const schema: any = {};
    const sampleSize = Math.min(100, data.length);
    const samples = data.slice(0, sampleSize);

    // Analyze each field
    const fields = new Set<string>();
    samples.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        Object.keys(item).forEach(key => fields.add(key));
      }
    });

    fields.forEach(field => {
      const values = samples
        .filter(item => item && typeof item === 'object' && item[field] !== undefined)
        .map(item => item[field]);

      if (values.length > 0) {
        schema[field] = this.inferFieldSchema(values);
      }
    });

    return schema;
  }

  /**
   * Generate validation rules from schema
   */
  generateRulesFromSchema(schema: any): void {
    Object.keys(schema).forEach(field => {
      const fieldSchema = schema[field];
      const rules: ValidationRule[] = [];

      if (fieldSchema.required) {
        rules.push({ type: 'required', message: `${field} is required` });
      }

      if (fieldSchema.type) {
        switch (fieldSchema.type) {
          case 'string':
            rules.push({ type: 'string', message: `${field} must be a string` });
            if (fieldSchema.minLength) {
              rules.push({ 
                type: 'custom', 
                message: `${field} must be at least ${fieldSchema.minLength} characters`,
                validator: (value: string) => value.length >= fieldSchema.minLength
              });
            }
            if (fieldSchema.maxLength) {
              rules.push({ 
                type: 'custom', 
                message: `${field} must be no more than ${fieldSchema.maxLength} characters`,
                validator: (value: string) => value.length <= fieldSchema.maxLength
              });
            }
            break;

          case 'number':
            rules.push({ type: 'number', message: `${field} must be a number` });
            if (fieldSchema.min !== undefined) {
              rules.push({ 
                type: 'custom', 
                message: `${field} must be at least ${fieldSchema.min}`,
                validator: (value: number) => value >= fieldSchema.min
              });
            }
            if (fieldSchema.max !== undefined) {
              rules.push({ 
                type: 'custom', 
                message: `${field} must be no more than ${fieldSchema.max}`,
                validator: (value: number) => value <= fieldSchema.max
              });
            }
            break;

          case 'email':
            rules.push({ type: 'email', message: `${field} must be a valid email` });
            break;

          case 'url':
            rules.push({ type: 'url', message: `${field} must be a valid URL` });
            break;
        }
      }

      if (fieldSchema.pattern) {
        rules.push({ 
          type: 'custom', 
          message: `${field} does not match the required pattern`,
          validator: (value: string) => fieldSchema.pattern.test(value)
        });
      }

      this.addRules(field, rules);
    });
  }

  /**
   * Smart data cleaning and correction
   */
  cleanData(obj: any): {
    cleaned: any;
    changes: { field: string; original: any; corrected: any; reason: string }[];
  } {
    const cleaned = { ...obj };
    const changes: { field: string; original: any; corrected: any; reason: string }[] = [];

    Object.keys(cleaned).forEach(field => {
      const original = cleaned[field];
      const corrected = this.correctValue(field, original);
      
      if (corrected !== original) {
        cleaned[field] = corrected;
        changes.push({
          field,
          original,
          corrected,
          reason: this.getCorrectionReason(field, original, corrected)
        });
      }
    });

    return { cleaned, changes };
  }

  /**
   * Batch validate multiple objects
   */
  validateBatch(objects: any[]): {
    results: Array<{
      index: number;
      isValid: boolean;
      errors: { [field: string]: string[] };
      suggestions: { [field: string]: string[] };
    }>;
    summary: {
      totalObjects: number;
      validObjects: number;
      invalidObjects: number;
      commonErrors: string[];
    };
  } {
    const results = objects.map((obj, index) => {
      const validation = this.validateObject(obj);
      return {
        index,
        isValid: validation.isValid,
        errors: validation.errors,
        suggestions: validation.suggestions
      };
    });

    const validObjects = results.filter(r => r.isValid).length;
    const commonErrors = this.findCommonErrors(results);

    return {
      results,
      summary: {
        totalObjects: objects.length,
        validObjects,
        invalidObjects: objects.length - validObjects,
        commonErrors
      }
    };
  }

  /**
   * Get validation statistics
   */
  getValidationStats(): {
    totalValidations: number;
    successRate: number;
    topErrors: { field: string; errorCount: number }[];
    validationTrends: { timestamp: number; successRate: number }[];
  } {
    const totalValidations = this.validationHistory.length;
    const successfulValidations = this.validationHistory.filter(v => v.result).length;
    const successRate = totalValidations > 0 ? successfulValidations / totalValidations : 0;

    // Count errors by field
    const errorCounts = new Map<string, number>();
    this.validationHistory.forEach(v => {
      if (!v.result) {
        errorCounts.set(v.field, (errorCounts.get(v.field) || 0) + 1);
      }
    });

    const topErrors = Array.from(errorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([field, errorCount]) => ({ field, errorCount }));

    // Calculate trends (hourly buckets)
    const trends = this.calculateValidationTrends();

    return {
      totalValidations,
      successRate,
      topErrors,
      validationTrends: trends
    };
  }

  /**
   * Clear validation history
   */
  clearHistory(): void {
    this.validationHistory = [];
  }

  private applyRule(rule: ValidationRule, value: any): {
    isValid: boolean;
    error: string;
    suggestion?: string;
  } {
    switch (rule.type) {
      case 'required':
        return {
          isValid: value !== undefined && value !== null && value !== '',
          error: rule.message || 'This field is required',
          suggestion: 'Please provide a value for this field'
        };

      case 'string':
        const isString = typeof value === 'string';
        return {
          isValid: isString,
          error: rule.message || 'Must be a string',
          suggestion: isString ? undefined : 'Please provide a text value'
        };

      case 'number':
        const isNumber = typeof value === 'number' && !isNaN(value);
        return {
          isValid: isNumber,
          error: rule.message || 'Must be a number',
          suggestion: isNumber ? undefined : 'Please provide a numeric value'
        };

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValidEmail = typeof value === 'string' && emailRegex.test(value);
        return {
          isValid: isValidEmail,
          error: rule.message || 'Must be a valid email address',
          suggestion: isValidEmail ? undefined : 'Please provide a valid email (e.g., user@example.com)'
        };

      case 'url':
        const urlRegex = /^https?:\/\/.+/;
        const isValidUrl = typeof value === 'string' && urlRegex.test(value);
        return {
          isValid: isValidUrl,
          error: rule.message || 'Must be a valid URL',
          suggestion: isValidUrl ? undefined : 'Please provide a valid URL starting with http:// or https://'
        };

      case 'custom':
        if (rule.validator) {
          try {
            const isValid = rule.validator(value);
            return {
              isValid,
              error: rule.message || 'Custom validation failed',
              suggestion: isValid ? undefined : 'Please check the value format'
            };
          } catch (error) {
            return {
              isValid: false,
              error: 'Validation error occurred',
              suggestion: 'Please check the value format'
            };
          }
        }
        return {
          isValid: true,
          error: ''
        };

      default:
        return {
          isValid: true,
          error: ''
        };
    }
  }

  private inferFieldSchema(values: any[]): any {
    const schema: any = {};
    
    // Determine type
    const types = new Set(values.map(v => typeof v));
    if (types.size === 1) {
      const type = Array.from(types)[0];
      schema.type = type;
      
      if (type === 'string') {
        const lengths = values.map(v => v.length);
        schema.minLength = Math.min(...lengths);
        schema.maxLength = Math.max(...lengths);
        
        // Check for email pattern
        if (values.every(v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))) {
          schema.type = 'email';
        }
        
        // Check for URL pattern
        if (values.every(v => /^https?:\/\/.+/.test(v))) {
          schema.type = 'url';
        }
      }
      
      if (type === 'number') {
        schema.min = Math.min(...values);
        schema.max = Math.max(...values);
      }
    }
    
    // Determine if required (present in most samples)
    const nonNullValues = values.filter(v => v !== null && v !== undefined);
    schema.required = nonNullValues.length > values.length * 0.8;
    
    return schema;
  }

  private generateAISuggestions(field: string, value: any): string[] {
    const suggestions: string[] = [];
    
    // Analyze validation history for patterns
    const fieldHistory = this.validationHistory
      .filter(v => v.field === field)
      .slice(-20); // Last 20 validations
    
    if (fieldHistory.length > 5) {
      const failureRate = fieldHistory.filter(v => !v.result).length / fieldHistory.length;
      
      if (failureRate > 0.5) {
        suggestions.push(`This field has a high failure rate (${(failureRate * 100).toFixed(1)}%). Consider reviewing the validation requirements.`);
      }
    }
    
    // Type-specific suggestions
    if (typeof value === 'string') {
      if (value.length < 3) {
        suggestions.push('Consider if this value is too short');
      }
      if (value.includes(' ') && field.toLowerCase().includes('username')) {
        suggestions.push('Username typically should not contain spaces');
      }
      if (field.toLowerCase().includes('email') && !value.includes('@')) {
        suggestions.push('Email addresses should contain @ symbol');
      }
    }
    
    if (typeof value === 'number') {
      if (value < 0 && field.toLowerCase().includes('age')) {
        suggestions.push('Age cannot be negative');
      }
      if (value > 150 && field.toLowerCase().includes('age')) {
        suggestions.push('Age seems unusually high');
      }
    }
    
    return suggestions;
  }

  private correctValue(field: string, value: any): any {
    if (typeof value === 'string') {
      // Trim whitespace
      let corrected = value.trim();
      
      // Common corrections
      if (field.toLowerCase().includes('email')) {
        corrected = corrected.toLowerCase();
      }
      
      if (field.toLowerCase().includes('phone')) {
        // Remove common phone formatting
        corrected = corrected.replace(/[\s\-\(\)\.]/g, '');
      }
      
      if (field.toLowerCase().includes('url')) {
        if (!corrected.startsWith('http://') && !corrected.startsWith('https://')) {
          corrected = 'https://' + corrected;
        }
      }
      
      return corrected;
    }
    
    if (typeof value === 'number') {
      // Round to reasonable precision
      if (field.toLowerCase().includes('price') || field.toLowerCase().includes('amount')) {
        return Math.round(value * 100) / 100; // 2 decimal places
      }
    }
    
    return value;
  }

  private getCorrectionReason(field: string, original: any, corrected: any): string {
    if (typeof original === 'string' && typeof corrected === 'string') {
      if (original.trim() !== original) {
        return 'Removed leading/trailing whitespace';
      }
      if (field.toLowerCase().includes('email') && original !== corrected) {
        return 'Converted to lowercase';
      }
      if (field.toLowerCase().includes('url') && !original.startsWith('http')) {
        return 'Added https:// prefix';
      }
    }
    
    return 'Applied automatic correction';
  }

  private findCommonErrors(results: any[]): string[] {
    const errorCounts = new Map<string, number>();
    
    results.forEach(result => {
      Object.values(result.errors).forEach((errors: any) => {
        errors.forEach((error: string) => {
          errorCounts.set(error, (errorCounts.get(error) || 0) + 1);
        });
      });
    });
    
    return Array.from(errorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([error]) => error);
  }

  private calculateValidationTrends(): { timestamp: number; successRate: number }[] {
    const hourlyBuckets = new Map<number, { total: number; successful: number }>();
    
    this.validationHistory.forEach(validation => {
      const hourBucket = Math.floor(validation.timestamp / (1000 * 60 * 60)) * (1000 * 60 * 60);
      
      if (!hourlyBuckets.has(hourBucket)) {
        hourlyBuckets.set(hourBucket, { total: 0, successful: 0 });
      }
      
      const bucket = hourlyBuckets.get(hourBucket)!;
      bucket.total++;
      if (validation.result) {
        bucket.successful++;
      }
    });
    
    return Array.from(hourlyBuckets.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([timestamp, stats]) => ({
        timestamp,
        successRate: stats.successful / stats.total
      }));
  }
}
