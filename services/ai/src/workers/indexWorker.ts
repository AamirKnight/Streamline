import amqp from 'amqplib';
import vectorService from '../services/vectorService';
import logger from '../utils/logger';
import { config } from '../config';

class IndexWorker {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;

  async connect(): Promise<void> {
    try {
      // Create connection
      this.connection = await amqp.connect(config.rabbitmq.url);

      // Create channel with null check
      this.channel = await this.connection.createChannel();

      // Ensure channel was created successfully
      if (!this.channel) {
        throw new Error('Failed to create RabbitMQ channel');
      }

      await this.channel.assertQueue('document.index', { durable: true });

      logger.info('✅ RabbitMQ connected for AI indexing');

      this.startConsuming();
    } catch (error) {
      logger.error('❌ RabbitMQ connection error:', error);
      setTimeout(() => this.connect(), 5000);
    }
  }

  private startConsuming(): void {
    if (!this.channel) return;

    const channel = this.channel;

    channel.consume('document.index', async (msg: amqp.ConsumeMessage | null) => {
      if (!msg) return;

      try {
        const data = JSON.parse(msg.content.toString());
        const { documentId, workspaceId, content, action } = data;

        logger.info('Processing document index job', { documentId, action });

        if (action === 'create' || action === 'update') {
          await vectorService.indexDocument(documentId, workspaceId, content);
        } else if (action === 'delete') {
          await vectorService.deleteDocumentEmbeddings(documentId);
        }

        channel.ack(msg);
        logger.info('Document indexed successfully', { documentId });
      } catch (error) {
        logger.error('Index job failed:', error);
        channel.nack(msg, false, true);
      }
    });
  }

  async publishIndexJob(data: {
    documentId: string;
    workspaceId: number;
    content: string;
    action: 'create' | 'update' | 'delete';
  }): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    this.channel.sendToQueue(
      'document.index',
      Buffer.from(JSON.stringify(data)),
      { persistent: true }
    );

    logger.info('Index job queued', { documentId: data.documentId });
  }

  async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      logger.info('RabbitMQ connection closed');
    } catch (error) {
      logger.error('Error closing RabbitMQ connection:', error);
    }
  }
}

export default new IndexWorker();