import { HfInference } from '@huggingface/inference';
import logger from '../utils/logger';
import { config } from '../config';

const hf = new HfInference(config.huggingface.apiKey); // Changed from config.hfToken

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
   * Generate embedding using HuggingFace Inference API
   */
  private async generateHuggingFaceEmbedding(text: string): Promise<number[]> {
    try {
      const result = await hf.featureExtraction({
        model: config.huggingface.model,
        inputs: text,
      });

      let embedding: number[];
      
      if (Array.isArray(result)) {
        if (Array.isArray(result[0])) {
          embedding = result[0] as number[];
        } else {
          embedding = result as number[];
        }
      } else {
        throw new Error('Unexpected embedding format from HuggingFace');
      }

      if (!embedding || embedding.length === 0) {
        throw new Error('Empty embedding received');
      }

      return embedding;

    } catch (error: any) {
      if (error.message?.includes('401') || error.message?.includes('authentication')) {
        throw new Error('HuggingFace API token is invalid. Get a new one from https://huggingface.co/settings/tokens');
      } else if (error.message?.includes('429') || error.message?.includes('rate limit')) {
        throw new Error('HuggingFace rate limit exceeded. Try again in a few minutes.');
      } else if (error.message?.includes('fetch') || error.message?.includes('blob')) {
        throw new Error('Network error connecting to HuggingFace. Check your internet connection.');
      }
      
      throw error;
    }
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
}

export default new EmbeddingService();