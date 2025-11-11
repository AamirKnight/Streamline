import amqp, { Connection, Channel, ConsumeMessage } from 'amqplib';
import vectorService from '../services/vectorService';
import logger from '../utils/logger';
import { config } from '../config';

class IndexWorker {
  private connection: Connection | null = null;
  private channel: Channel | null = null;

  async connect(): Promise<void> {
    try {
      // Properly type the connection
      const connection = await amqp.connect(config.rabbitmq.url);
      this.connection = connection;

      // Properly create the channel
      const channel = await connection.createChannel();
      this.channel = channel;

      await channel.assertQueue('document.index', { durable: true });

      logger.info('✅ RabbitMQ connected for AI indexing');

      this.startConsuming();
    } catch (error) {
      logger.error('❌ RabbitMQ connection error:', error);
      setTimeout(() => this.connect(), 5000);
    }
  }

  private startConsuming(): void {
    // ✅ Ensure channel is not null
    const channel = this.channel;
    if (!channel) return;

    channel.consume('document.index', async (msg: ConsumeMessage | null) => {
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

    // ✅ await not required for sendToQueue (it's synchronous)
    this.channel.sendToQueue(
      'document.index',
      Buffer.from(JSON.stringify(data)),
      { persistent: true }
    );

    logger.info('Index job queued', { documentId: data.documentId });
  }
}

export default new IndexWorker();
