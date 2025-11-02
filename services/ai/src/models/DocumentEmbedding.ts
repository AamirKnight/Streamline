import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database';

interface DocumentEmbeddingAttributes {
  id: number;
  documentId: string;
  workspaceId: number;
  chunkText: string;
  chunkIndex: number;
  embedding: number[];
  createdAt: Date;
}

interface DocumentEmbeddingCreationAttributes
  extends Optional<DocumentEmbeddingAttributes, 'id' | 'createdAt'> {}

class DocumentEmbedding
  extends Model<DocumentEmbeddingAttributes, DocumentEmbeddingCreationAttributes>
  implements DocumentEmbeddingAttributes
{
  declare id: number;
  declare documentId: string;
  declare workspaceId: number;
  declare chunkText: string;
  declare chunkIndex: number;
  declare embedding: number[];
  declare readonly createdAt: Date;
}

DocumentEmbedding.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    documentId: {
      type: DataTypes.STRING(24),
      allowNull: false,
    },
    workspaceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    chunkText: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    chunkIndex: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    embedding: {
      type: DataTypes.ARRAY(DataTypes.FLOAT),
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'document_embeddings',
    timestamps: false,
    indexes: [
      { fields: ['documentId'] },
      { fields: ['workspaceId'] },
    ],
  }
);

export async function setupVectorExtension(): Promise<void> {
  try {
    // Enable pgvector extension
    await sequelize.query('CREATE EXTENSION IF NOT EXISTS vector;');
    console.log('✅ pgvector extension enabled');

    // Drop and recreate table in development
    if (process.env.NODE_ENV === 'development') {
      await sequelize.query('DROP TABLE IF EXISTS document_embeddings CASCADE;');
    }

    // Create table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS document_embeddings (
        id SERIAL PRIMARY KEY,
        document_id VARCHAR(24) NOT NULL,
        workspace_id INTEGER NOT NULL,
        chunk_text TEXT NOT NULL,
        chunk_index INTEGER NOT NULL,
        embedding vector(384) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Document embeddings table created with vector(384)');

    // Create indexes
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_document_id 
      ON document_embeddings(document_id);
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_workspace_id 
      ON document_embeddings(workspace_id);
    `);

    // Create vector similarity index
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_embedding_vector 
      ON document_embeddings 
      USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100);
    `);
    console.log('✅ Vector indexes created');

  } catch (error) {
    console.error('❌ Vector setup error:', error);
    throw error;
  }
}

export default DocumentEmbedding;