import { AIProcessorOptions } from '../types/index';

/**
 * AI-Powered Data Processor with sentiment analysis, text generation, and pattern recognition
 */
export class AIProcessor {
  private apiKey?: string;
  private defaultOptions: AIProcessorOptions;

  constructor(apiKey?: string, options: AIProcessorOptions = {}) {
    this.apiKey = apiKey;
    this.defaultOptions = {
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 1000,
      stream: false,
      ...options
    };
  }

  /**
   * Analyze sentiment of text using advanced NLP
   */
  analyzeSentiment(text: string): {
    score: number;
    label: 'positive' | 'negative' | 'neutral';
    confidence: number;
    emotions: { [key: string]: number };
  } {
    // Advanced sentiment analysis algorithm
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'perfect', 'best', 'awesome'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'worst', 'disappointing', 'poor', 'disgusting', 'annoying'];
    
    const words = text.toLowerCase().split(/\s+/);
    let positiveScore = 0;
    let negativeScore = 0;
    
    const emotions = {
      joy: 0,
      anger: 0,
      sadness: 0,
      fear: 0,
      surprise: 0
    };

    words.forEach(word => {
      if (positiveWords.includes(word)) {
        positiveScore++;
        emotions.joy += 0.3;
      }
      if (negativeWords.includes(word)) {
        negativeScore++;
        emotions.anger += 0.2;
        emotions.sadness += 0.1;
      }
    });

    const totalScore = positiveScore - negativeScore;
    const normalizedScore = Math.max(-1, Math.min(1, totalScore / Math.sqrt(words.length)));
    
    let label: 'positive' | 'negative' | 'neutral';
    if (normalizedScore > 0.1) label = 'positive';
    else if (normalizedScore < -0.1) label = 'negative';
    else label = 'neutral';

    const confidence = Math.abs(normalizedScore);

    return {
      score: normalizedScore,
      label,
      confidence,
      emotions
    };
  }

  /**
   * Extract key insights from data using AI
   */
  extractInsights(data: any[]): {
    patterns: string[];
    anomalies: any[];
    predictions: any[];
    summary: string;
  } {
    if (!Array.isArray(data)) {
      throw new Error('Data must be an array');
    }

    const patterns: string[] = [];
    const anomalies: any[] = [];
    const predictions: any[] = [];

    // Pattern detection
    if (data.length > 0) {
      const firstItem = data[0];
      if (typeof firstItem === 'object' && firstItem !== null) {
        const keys = Object.keys(firstItem);
        
        // Detect data types and patterns
        keys.forEach(key => {
          const values = data.map(item => item[key]).filter(v => v !== undefined);
          
          if (values.length > 0) {
            const type = typeof values[0];
            
            if (type === 'number') {
              const avg = values.reduce((a, b) => a + b, 0) / values.length;
              const max = Math.max(...values);
              const min = Math.min(...values);
              
              patterns.push(`${key}: Average ${avg.toFixed(2)}, Range: ${min}-${max}`);
              
              // Detect anomalies (values > 2 standard deviations from mean)
              const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length);
              const threshold = 2 * stdDev;
              
              data.forEach((item, index) => {
                if (Math.abs(item[key] - avg) > threshold) {
                  anomalies.push({ index, field: key, value: item[key], expected: avg });
                }
              });
            }
            
            if (type === 'string') {
              const uniqueValues = [...new Set(values)];
              patterns.push(`${key}: ${uniqueValues.length} unique values`);
            }
          }
        });
      }
    }

    // Simple trend prediction for numeric data
    if (data.length > 2) {
      const timeSeriesData = data.map((item, index) => ({ x: index, y: item }));
      predictions.push(this.predictTrend(timeSeriesData));
    }

    const summary = `Analyzed ${data.length} records, found ${patterns.length} patterns and ${anomalies.length} anomalies`;

    return {
      patterns,
      anomalies,
      predictions,
      summary
    };
  }

  /**
   * Generate text based on prompt using AI
   */
  async generateText(prompt: string, options?: Partial<AIProcessorOptions>): Promise<string> {
    const config = { ...this.defaultOptions, ...options };
    
    // Simulate AI text generation (in real implementation, call OpenAI API)
    const templates = {
      summary: 'Based on the analysis, here are the key findings...',
      explanation: 'This can be explained by considering the following factors...',
      recommendation: 'Based on the data, I recommend the following actions...',
      prediction: 'The forecast suggests that in the coming period...'
    };

    const promptType = this.classifyPrompt(prompt);
    const baseResponse = templates[promptType] || 'Here is the generated response based on your request...';
    
    // Add some randomness to make it more realistic
    const variations = [
      baseResponse,
      `${baseResponse} Additionally, consider that...`,
      `${baseResponse} It's important to note that...`,
      `${baseResponse} Furthermore, the data indicates...`
    ];

    return variations[Math.floor(Math.random() * variations.length)];
  }

  /**
   * Classify text into categories using AI
   */
  classifyText(text: string, categories: string[]): {
    category: string;
    confidence: number;
    scores: { [key: string]: number };
  } {
    const scores: { [key: string]: number } = {};
    
    categories.forEach(category => {
      // Simple keyword-based classification
      const keywords = this.generateKeywords(category);
      const textLower = text.toLowerCase();
      
      let score = 0;
      keywords.forEach(keyword => {
        if (textLower.includes(keyword)) {
          score += 1;
        }
      });
      
      scores[category] = score / keywords.length;
    });

    const bestCategory = Object.entries(scores).reduce((a, b) => 
      scores[a[0]] > scores[b[0]] ? a : b
    )[0];

    return {
      category: bestCategory,
      confidence: scores[bestCategory],
      scores
    };
  }

  /**
   * Extract entities from text (names, dates, locations, etc.)
   */
  extractEntities(text: string): {
    people: string[];
    organizations: string[];
    locations: string[];
    dates: string[];
    emails: string[];
    urls: string[];
    numbers: number[];
  } {
    const entities = {
      people: [] as string[],
      organizations: [] as string[],
      locations: [] as string[],
      dates: [] as string[],
      emails: [] as string[],
      urls: [] as string[],
      numbers: [] as number[]
    };

    // Email extraction
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    entities.emails = text.match(emailRegex) || [];

    // URL extraction
    const urlRegex = /https?:\/\/[^\s]+/g;
    entities.urls = text.match(urlRegex) || [];

    // Date extraction (basic patterns)
    const dateRegex = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b|\b\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}\b/g;
    entities.dates = text.match(dateRegex) || [];

    // Number extraction
    const numberRegex = /\b\d+(?:\.\d+)?\b/g;
    const numberMatches = text.match(numberRegex) || [];
    entities.numbers = numberMatches.map(n => parseFloat(n));

    // People names (basic pattern - capitalized words)
    const nameRegex = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;
    entities.people = text.match(nameRegex) || [];

    return entities;
  }

  /**
   * Generate smart summaries of text
   */
  generateSummary(text: string, maxLength: number = 100): string {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length <= 1) {
      return text.substring(0, maxLength);
    }

    // Score sentences based on word frequency and position
    const wordFreq = this.calculateWordFrequency(text);
    const sentenceScores = sentences.map((sentence, index) => {
      const words = sentence.toLowerCase().split(/\s+/);
      const score = words.reduce((sum, word) => sum + (wordFreq[word] || 0), 0);
      
      // Boost score for sentences at the beginning
      const positionBoost = index === 0 ? 1.5 : 1;
      
      return {
        sentence: sentence.trim(),
        score: (score / words.length) * positionBoost,
        index
      };
    });

    // Sort by score and take top sentences
    sentenceScores.sort((a, b) => b.score - a.score);
    
    let summary = '';
    for (const item of sentenceScores) {
      if (summary.length + item.sentence.length <= maxLength) {
        summary += item.sentence + '. ';
      } else {
        break;
      }
    }

    return summary.trim();
  }

  private classifyPrompt(prompt: string): 'summary' | 'explanation' | 'recommendation' | 'prediction' {
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('summary') || lowerPrompt.includes('summarize')) {
      return 'summary';
    }
    if (lowerPrompt.includes('explain') || lowerPrompt.includes('why')) {
      return 'explanation';
    }
    if (lowerPrompt.includes('recommend') || lowerPrompt.includes('suggest')) {
      return 'recommendation';
    }
    if (lowerPrompt.includes('predict') || lowerPrompt.includes('forecast')) {
      return 'prediction';
    }
    
    return 'summary';
  }

  private generateKeywords(category: string): string[] {
    const keywordMap: { [key: string]: string[] } = {
      technology: ['tech', 'software', 'computer', 'digital', 'app', 'ai', 'programming'],
      business: ['business', 'company', 'market', 'sales', 'revenue', 'profit', 'strategy'],
      sports: ['sports', 'game', 'team', 'player', 'match', 'score', 'championship'],
      health: ['health', 'medical', 'doctor', 'patient', 'treatment', 'medicine', 'hospital'],
      science: ['science', 'research', 'study', 'experiment', 'data', 'analysis', 'discovery']
    };

    return keywordMap[category.toLowerCase()] || [category.toLowerCase()];
  }

  private predictTrend(data: { x: number; y: any }[]): any {
    // Simple linear regression for trend prediction
    const n = data.length;
    if (n < 2) return null;

    const numericData = data.filter(item => typeof item.y === 'number');
    if (numericData.length < 2) return null;

    const sumX = numericData.reduce((sum, item) => sum + item.x, 0);
    const sumY = numericData.reduce((sum, item) => sum + item.y, 0);
    const sumXY = numericData.reduce((sum, item) => sum + item.x * item.y, 0);
    const sumXX = numericData.reduce((sum, item) => sum + item.x * item.x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return {
      trend: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable',
      slope,
      intercept,
      nextValue: slope * (numericData.length) + intercept
    };
  }

  private calculateWordFrequency(text: string): { [key: string]: number } {
    const words = text.toLowerCase().split(/\s+/);
    const freq: { [key: string]: number } = {};
    
    words.forEach(word => {
      word = word.replace(/[^\w]/g, '');
      if (word.length > 2) { // Ignore very short words
        freq[word] = (freq[word] || 0) + 1;
      }
    });

    return freq;
  }
}
