import * as amqp from 'amqplib';
import type { Connection, Channel } from 'amqplib';
import logger from './logger';

class AIPublisher {
  private connection: Connection | null = null;
  private channel: Channel | null = null;

  async connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(
        process.env.RABBITMQ_URL || 'amqp://localhost:5672'
      );
      this.channel = await this.connection.createChannel();
      await this.channel.assertQueue('document.index', { durable: true });
      logger.info('✅ AI Publisher connected to RabbitMQ');
    } catch (error) {
      logger.error('❌ AI Publisher connection error:', error);
    }
  }

  async publishForIndexing(
    documentId: string,
    workspaceId: number,
    content: string,
    action: 'create' | 'update' | 'delete'
  ): Promise<void> {
    if (!this.channel) {
      await this.connect();
    }

    try {
      if (!this.channel) {
        throw new Error('RabbitMQ channel not available');
      }

      this.channel.sendToQueue(
        'document.index',
        Buffer.from(
          JSON.stringify({
            documentId,
            workspaceId,
            content,
            action,
          })
        ),
        { persistent: true }
      );
      logger.info('📦 Document queued for AI indexing', { documentId, action });
    } catch (error) {
      logger.error('❌ Failed to queue document for indexing:', error);
    }
  }

  async close(): Promise<void> {
    try {
      await this.channel?.close();
      await this.connection?.close();
      logger.info('🛑 AI Publisher connection closed');
    } catch (error) {
      logger.error('Error closing RabbitMQ connection:', error);
    }
  }
}

export default new AIPublisher();