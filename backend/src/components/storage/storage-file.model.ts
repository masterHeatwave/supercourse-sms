// storage-file.model.ts

import mongoose, { Schema } from 'mongoose';
import { IStorageFile } from '@components/storage/storage-file.interface';
import { tenantAwarePlugin } from '@plugins/tenantAware';

const StorageFileSchema = new Schema(
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
  }
);

StorageFileSchema.plugin(tenantAwarePlugin);

const StorageFile = mongoose.model<IStorageFile>('StorageFile', StorageFileSchema);

export default StorageFile;
export { StorageFileSchema };
