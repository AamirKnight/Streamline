import mongoose, { Schema, Document as MongooseDocument,Types } from 'mongoose';

export interface IDocument extends MongooseDocument {
_id: Types.ObjectId; 
  title: string;
  content: string;
  workspaceId: number;
  createdBy: number;
  lastEditedBy?: number;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

const documentSchema = new Schema<IDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      default: '',
    },
    workspaceId: {
      type: Number,
      required: true,
      index: true,
    },
    createdBy: {
      type: Number,
      required: true,
    },
    lastEditedBy: {
      type: Number,
    },
    version: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
// Add compound indexes for better query performance
documentSchema.index({ workspaceId: 1, createdAt: -1 });
documentSchema.index({ workspaceId: 1, updatedAt: -1 });
documentSchema.index({ createdBy: 1, createdAt: -1 });
documentSchema.index({ title: 'text', content: 'text' }); // Already exists

// Ensure indexes are created

documentSchema.set('autoIndex', true);

const Document = mongoose.model<IDocument>('Document', documentSchema);
Document.createIndexes();
export default Document;