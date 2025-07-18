/**
 * Advanced String Utilities with NLP features and intelligent parsing
 */
export class StringUtils {
  /**
   * Convert string to camelCase
   */
  static toCamelCase(str: string): string {
    return str.replace(/[-_\s]+(.)/g, (_, char) => char.toUpperCase());
  }

  /**
   * Convert string to PascalCase
   */
  static toPascalCase(str: string): string {
    return str.replace(/[-_\s]+(.)/g, (_, char) => char.toUpperCase())
              .replace(/^(.)/, char => char.toUpperCase());
  }

  /**
   * Convert string to snake_case
   */
  static toSnakeCase(str: string): string {
    return str.replace(/([A-Z])/g, '_$1')
              .replace(/[-\s]+/g, '_')
              .toLowerCase()
              .replace(/^_/, '');
  }

  /**
   * Convert string to kebab-case
   */
  static toKebabCase(str: string): string {
    return str.replace(/([A-Z])/g, '-$1')
              .replace(/[_\s]+/g, '-')
              .toLowerCase()
              .replace(/^-/, '');
  }

  /**
   * Truncate string with ellipsis
   */
  static truncate(str: string, length: number, ellipsis: string = '...'): string {
    if (str.length <= length) return str;
    return str.substring(0, length - ellipsis.length) + ellipsis;
  }

  /**
   * Extract numbers from string
   */
  static extractNumbers(str: string): number[] {
    const matches = str.match(/\d+\.?\d*/g);
    return matches ? matches.map(Number) : [];
  }

  /**
   * Extract emails from string
   */
  static extractEmails(str: string): string[] {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    return str.match(emailRegex) || [];
  }

  /**
   * Extract URLs from string
   */
  static extractUrls(str: string): string[] {
    const urlRegex = /https?:\/\/[^\s]+/g;
    return str.match(urlRegex) || [];
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  static similarity(str1: string, str2: string): number {
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;

    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    const maxLength = Math.max(len1, len2);
    return maxLength > 0 ? (maxLength - matrix[len2][len1]) / maxLength : 1;
  }

  /**
   * Generate random string
   */
  static random(length: number, charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  }

  /**
   * Word count
   */
  static wordCount(str: string): number {
    return str.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Character frequency analysis
   */
  static charFrequency(str: string): { [char: string]: number } {
    const freq: { [char: string]: number } = {};
    for (const char of str) {
      freq[char] = (freq[char] || 0) + 1;
    }
    return freq;
  }

  /**
   * Remove HTML tags
   */
  static stripHtml(str: string): string {
    return str.replace(/<[^>]*>/g, '');
  }

  /**
   * Escape HTML entities
   */
  static escapeHtml(str: string): string {
    const entityMap: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return str.replace(/[&<>"']/g, s => entityMap[s]);
  }

  /**
   * Convert string to title case
   */
  static toTitleCase(str: string): string {
    return str.replace(/\w\S*/g, txt => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }

  /**
   * Pluralize word
   */
  static pluralize(word: string, count: number): string {
    if (count === 1) return word;
    
    // Simple pluralization rules
    if (word.endsWith('s') || word.endsWith('sh') || word.endsWith('ch') || 
        word.endsWith('x') || word.endsWith('z')) {
      return word + 'es';
    }
    
    if (word.endsWith('y') && !/[aeiou]y$/i.test(word)) {
      return word.slice(0, -1) + 'ies';
    }
    
    return word + 's';
  }

  /**
   * Format template string
   */
  static template(template: string, variables: { [key: string]: any }): string {
    return template.replace(/\${(\w+)}/g, (match, key) => {
      return variables[key] !== undefined ? String(variables[key]) : match;
    });
  }
}
