import logger from '../utils/logger';
import { config } from '../config';

interface EmbeddingTask {
  text: string;
  fn: (embedding: number[]) => Promise<void>;
}

class EmbeddingService {
  private queue: EmbeddingTask[] = [];
  private processing = false;
  private readonly BATCH_SIZE = 5;
  private readonly RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY = 2000;

  constructor() {
    // Validate config on startup
    if (!config.huggingface.apiKey) {
      logger.error('❌ HF_TOKEN is not set in environment variables');
      throw new Error('HF_TOKEN environment variable is required');
    }
    logger.info('🤖 Embedding service initialized');
  }

  /**
   * Generate single embedding with retry logic
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    const truncatedText = text.slice(0, 5000);

    for (let attempt = 1; attempt <= this.RETRY_ATTEMPTS; attempt++) {
      try {
        logger.info(`📊 Generating embedding (attempt ${attempt}/${this.RETRY_ATTEMPTS})`);

        try {
          const embedding = await this.generateHuggingFaceEmbedding(truncatedText);
          logger.info('✅ HuggingFace embedding generated');
          return embedding;
        } catch (hfError: any) {
          logger.warn(`⚠️  HuggingFace failed: ${hfError.message}`);
          
          // Only fall back to local if it's not a rate limit or auth error
          if (hfError.message.includes('429') || hfError.message.includes('401')) {
            throw hfError;
          }
          
          logger.info('🔄 Falling back to local embedding generation');
          return this.generateLocalEmbedding(truncatedText);
        }

      } catch (error: any) {
        logger.error(`❌ Embedding attempt ${attempt} failed:`, error.message);
        
        if (attempt < this.RETRY_ATTEMPTS) {
          logger.info(`⏳ Retrying in ${this.RETRY_DELAY}ms...`);
          await this.sleep(this.RETRY_DELAY);
        } else {
          throw new Error(`Embedding failed after ${this.RETRY_ATTEMPTS} attempts: ${error.message}`);
        }
      }
    }

    throw new Error('Embedding generation failed');
  }

  /**
   * Generate batch embeddings (processes one at a time with delays)
   */
  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    logger.info(`📦 Generating ${texts.length} embeddings in batch`);
    
    const embeddings: number[][] = [];
    
    for (let i = 0; i < texts.length; i++) {
      try {
        logger.info(`Processing ${i + 1}/${texts.length}`);
        const embedding = await this.generateEmbedding(texts[i]);
        embeddings.push(embedding);
        
        // Small delay between requests to avoid rate limiting
        if (i < texts.length - 1) {
          await this.sleep(500);
        }
      } catch (error: any) {
        logger.error(`Failed to generate embedding for chunk ${i}:`, error.message);
        // Use fallback for this chunk
        embeddings.push(this.generateLocalEmbedding(texts[i]));
      }
    }
    
    logger.info(`✅ Generated ${embeddings.length} embeddings`);
    return embeddings;
  }

  /**
   * Generate embedding using HuggingFace API (Direct Fetch)
   * FIXED: Uses correct /models/ endpoint instead of /pipeline/feature-extraction/
   */
  private async generateHuggingFaceEmbedding(text: string): Promise<number[]> {
    try {
      // ✅ FIXED: Construct API URL correctly
      const apiUrl = `${config.huggingface.apiUrl}/${config.huggingface.model}`;
      logger.info(`Calling HuggingFace API: ${apiUrl}`);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.huggingface.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: text,
          options: {
            wait_for_model: true,
            use_cache: false,
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        if (response.status === 401) {
          throw new Error('Invalid HuggingFace token (401) - check HF_TOKEN');
        } else if (response.status === 403) {
          throw new Error('Token lacks permissions (403)');
        } else if (response.status === 404) {
          throw new Error(`Model not found (404) - check model name: ${config.huggingface.model}`);
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded (429) - upgrade account or wait');
        } else if (response.status === 503) {
          throw new Error('Model loading, retry in 20s (503)');
        }
        
        throw new Error(`HuggingFace API error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      // Handle response format
      if (!Array.isArray(result)) {
        throw new Error('Invalid response format from HuggingFace');
      }
      
      if (result.length === 0) {
        throw new Error('Empty response from HuggingFace');
      }
      
      // Check if it's a flat array of numbers (single embedding)
      if (typeof result[0] === 'number') {
        logger.info(`✅ Embedding generated (dimension: ${result.length})`);
        return result as number[];
      }
      
      // Check if it's token embeddings (2D array) - apply mean pooling
      if (Array.isArray(result[0])) {
        logger.info('Token embeddings detected, applying mean pooling');
        const embedding = this.meanPooling(result as number[][]);
        logger.info(`✅ Embedding generated via mean pooling (dimension: ${embedding.length})`);
        return embedding;
      }
      
      throw new Error('Invalid response format from HuggingFace');
      
    } catch (error: any) {
      logger.error('HuggingFace API error:', error.message);
      throw error;
    }
  }

  /**
   * Mean pooling for token embeddings
   */
  private meanPooling(tokenEmbeddings: number[][]): number[] {
    const numTokens = tokenEmbeddings.length;
    const dimension = tokenEmbeddings[0].length;
    const pooled = new Array(dimension).fill(0);

    for (let i = 0; i < numTokens; i++) {
      for (let j = 0; j < dimension; j++) {
        pooled[j] += tokenEmbeddings[i][j];
      }
    }

    return pooled.map(val => val / numTokens);
  }

  /**
   * Fallback: Generate a simple local embedding
   */
  private generateLocalEmbedding(text: string): number[] {
    logger.warn('⚠️  Using local embedding (not suitable for production!)');
    
    const dimension = config.huggingface.embeddingDimension;
    const embedding = new Array(dimension).fill(0);
    
    const words = text.toLowerCase().split(/\s+/).slice(0, 100);
    
    words.forEach((word, idx) => {
      for (let i = 0; i < word.length; i++) {
        const charCode = word.charCodeAt(i);
        const position = (charCode + idx + i) % dimension;
        embedding[position] += 1 / (idx + 1);
      }
    });
    
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => magnitude > 0 ? val / magnitude : 0);
  }

  /**
   * Add task to queue
   */
  async addToQueue(text: string, callback: (embedding: number[]) => Promise<void>): Promise<void> {
    this.queue.push({ text, fn: callback });
    
    if (!this.processing) {
      this.processQueue();
    }
  }

  /**
   * Process embedding queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    logger.info(`📋 Processing ${this.queue.length} embedding tasks`);

    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.BATCH_SIZE);

      for (const task of batch) {
        try {
          const embedding = await this.generateEmbedding(task.text);
          await task.fn(embedding);
        } catch (error: any) {
          logger.error('Embedding queue task failed:', error.message);
        }
      }

      if (this.queue.length > 0) {
        await this.sleep(1000);
      }
    }

    this.processing = false;
    logger.info('✅ Embedding queue processed');
  }

  /**
   * Get queue status
   */
  getQueueStatus() {
    return {
      pending: this.queue.length,
      processing: this.processing,
    };
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Health check for embedding service
   */
  async healthCheck(): Promise<{ status: string; provider: string; dimension?: number }> {
    try {
      const testEmbedding = await this.generateHuggingFaceEmbedding('test');
      return {
        status: 'healthy',
        provider: 'huggingface',
        dimension: testEmbedding.length
      };
    } catch (error: any) {
      logger.warn(`HuggingFace health check failed: ${error.message}`);
      return {
        status: 'degraded',
        provider: 'local'
      };
    }
  }
}

export default new EmbeddingService();
