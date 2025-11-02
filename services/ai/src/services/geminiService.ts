import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';
import logger from '../utils/logger';

interface QueueTask {
  fn: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private requestQueue: QueueTask[] = [];
  private isProcessing: boolean = false;
  private lastRequestTime: number = 0;
  private readonly RATE_LIMIT_DELAY = 1000;

  constructor() {
    if (!config.gemini.apiKey) {
      throw new Error('GEMINI_API_KEY is required');
    }
    
    this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: config.gemini.model });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.requestQueue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;

      if (timeSinceLastRequest < this.RATE_LIMIT_DELAY) {
        await new Promise((resolve) =>
          setTimeout(resolve, this.RATE_LIMIT_DELAY - timeSinceLastRequest)
        );
      }

      const task = this.requestQueue.shift();
      if (task) {
        try {
          const result = await task.fn();
          task.resolve(result);
          this.lastRequestTime = Date.now();
        } catch (error) {
          logger.error('Gemini queue task failed:', error);
          task.reject(error);
        }
      }
    }

    this.isProcessing = false;
  }

  private queueRequest<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ fn, resolve, reject });
      this.processQueue();
    });
  }

  async generateText(prompt: string): Promise<string> {
    return this.queueRequest(async () => {
      try {
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        return response.text();
      } catch (error: any) {
        logger.error('Gemini generation error:', error);
        throw new Error(`AI generation failed: ${error.message}`);
      }
    });
  }

  async summarize(
    text: string
  ): Promise<{ summary: string; keyPoints: string[]; topics: string[] }> {
    const prompt = `Summarize this document in JSON format with these exact keys:
{
  "summary": "2-3 sentence executive summary",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "topics": ["topic 1", "topic 2"]
}

Document:
${text.slice(0, 10000)}

Respond ONLY with valid JSON, no markdown or other text.`;

    const response = await this.generateText(prompt);

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found in response');
    } catch (error) {
      logger.error('Failed to parse Gemini JSON:', error);
      return {
        summary: text.slice(0, 200) + '...',
        keyPoints: [],
        topics: [],
      };
    }
  }

  async improveWriting(text: string): Promise<string> {
    const prompt = `Improve this text for clarity and grammar. Return ONLY the improved version with no explanations:

"${text}"`;

    return this.generateText(prompt);
  }

  async detectInconsistencies(docA: string, docB: string): Promise<string[]> {
    const prompt = `Compare these two documents and list inconsistencies. Return as JSON array: ["issue 1", "issue 2"]

Document A:
${docA.slice(0, 5000)}

Document B:
${docB.slice(0, 5000)}

Respond ONLY with JSON array.`;

    const response = await this.generateText(prompt);

    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return [];
    } catch (error) {
      logger.error('Failed to parse inconsistencies:', error);
      return [];
    }
  }

  async mergeConflicts(
    original: string,
    versionA: string,
    versionB: string
  ): Promise<string> {
    const prompt = `Merge these conflicting versions intelligently:

Original: "${original}"
Version A: "${versionA}"
Version B: "${versionB}"

Return ONLY the merged text.`;

    return this.generateText(prompt);
  }

  async generateInsights(
    documentContent: string,
    relatedDocs: string[]
  ): Promise<{
    suggestedTopics: string[];
    missingInfo: string[];
    improvements: string[];
  }> {
    const relatedContext = relatedDocs.slice(0, 3).join('\n\n---\n\n');

    const prompt = `Analyze this document. Return JSON:
{
  "suggestedTopics": ["topic 1", "topic 2"],
  "missingInfo": ["missing 1", "missing 2"],
  "improvements": ["suggestion 1", "suggestion 2"]
}

Main Document:
${documentContent.slice(0, 8000)}

Related Documents:
${relatedContext.slice(0, 2000)}

Respond ONLY with valid JSON.`;

    const response = await this.generateText(prompt);

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found');
    } catch (error) {
      return {
        suggestedTopics: [],
        missingInfo: [],
        improvements: [],
      };
    }
  }
}

export default new GeminiService();