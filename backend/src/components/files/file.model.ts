import mongoose, { Schema } from 'mongoose';
import { IFile } from './file.interface';
import toJson from '@plugins/toJson';

// const FileSchema: Schema<IFile> = new mongoose.Schema(
//   {
//     path: {
//       type: String,
//       required: [true, 'File path is required'],
//     },
//     filename: {
//       type: String,
//       required: [true, 'Filename is required'],
//     },
//     originalname: {
//       type: String,
//       required: [true, 'Original filename is required'],
//     },
//     mimetype: {
//       type: String,
//       required: [true, 'Mimetype is required'],
//     },
//     size: {
//       type: Number,
//     },
//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User',
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

const FileSchema = new Schema(
  {
    filename: {
      type: String,
      required: [true, 'File name is required'],
    },
    type: {
      type: String,
      enum: ['file', 'folder'],
      required: [true, 'File type is required'],
    },
    size: {
      type: Number,
      required: [true, 'File size is required'],
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner Id is required'],
    },
    key: {
      type: String,
      required: [true, 'File key is required'],
    },
    location: {
      type: String,
    },
    bucket: {
      type: String,
      required: [true, 'Bucket is required'],
    },
    etag: {
      type: String,
      required: [true, 'Etag is required'],
    },
    parent: {
      type: String,
      required: [true, 'Parent is required'],
    },
    versionId: {
      type: String,
    },
    contentType: {
      type: String,
    },
    metadata: {
      type: Map,
      of: String,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    lastModified: {
      type: Date,
    },
    sharedWithUsers: [
      {
        type: String,
      },
    ],
    sharedWithGroups: [
      {
        type: String,
      },
    ],
    permissions: {
      type: Map,
      of: {
        type: String,
        enum: ['read', 'read-write'],
      },
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'File',
  }
);

FileSchema.plugin(toJson);

export default mongoose.model<IFile>('File', FileSchema);

// Export the schema itself for use with the model provider
export { FileSchema };
