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
documentSchema.index({ workspaceId: 1, createdAt: -1 });
documentSchema.index({ title: 'text', content: 'text' }); // Text search

documentSchema.set('autoIndex', true);

const Document = mongoose.model<IDocument>('Document', documentSchema);

export default Document;