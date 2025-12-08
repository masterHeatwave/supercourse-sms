import mongoose, { Schema } from 'mongoose';
import { IFile } from './file.interface';
import toJson from '@plugins/toJson';

const FileSchema: Schema<IFile> = new mongoose.Schema(
  {
    path: {
      type: String,
      required: [true, 'File path is required'],
    },
    filename: {
      type: String,
      required: [true, 'Filename is required'],
    },
    originalname: {
      type: String,
      required: [true, 'Original filename is required'],
    },
    mimetype: {
      type: String,
      required: [true, 'Mimetype is required'],
    },
    size: {
      type: Number,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

FileSchema.plugin(toJson);

export default mongoose.model<IFile>('File', FileSchema);

// Export the schema itself for use with the model provider
export { FileSchema };
