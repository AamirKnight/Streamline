import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export interface IDocumentVersion extends MongooseDocument {
  documentId: string;
  content: string;
  versionNumber: number;
  createdBy: number;
  createdAt: Date;
}

const documentVersionSchema = new Schema<IDocumentVersion>(
  {
    documentId: {
      type: String,
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
    versionNumber: {
      type: Number,
      required: true,
    },
    createdBy: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

documentVersionSchema.index({ documentId: 1, versionNumber: -1 });
documentVersionSchema.index({ documentId: 1, createdAt: -1 });

const DocumentVersion = mongoose.model<IDocumentVersion>(
  'DocumentVersion',
  documentVersionSchema
);
// Add indexes

DocumentVersion.createIndexes();
export default DocumentVersion;