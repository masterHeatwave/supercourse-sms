// src/components/storage/storage.service.ts

import {
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';
import { StatusCodes } from 'http-status-codes';
import { ErrorResponse } from '@utils/errorResponse';
import User from '@components/users/user.model';
import { IUser } from '@components/users/user.interface';
import { ISizeInfo, IStorageFile } from './storage-file.interface';
import StorageFile from './storage-file.model';
import { requestContextLocalStorage } from '@config/asyncLocalStorage';
import mongoose from 'mongoose';  

export class StorageService {
  private s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
    });
  }

  // Get tenant-aware collection name
  private getStorageFilesCollectionName(): string {
    const tenantId = requestContextLocalStorage.getStore();
    if (!tenantId) {
      throw new ErrorResponse('Tenant context not available', StatusCodes.INTERNAL_SERVER_ERROR);
    }
    return `${tenantId}_storagefiles`;
  }

  // Get tenant-aware StorageFile model
  private getStorageFileModel() {
    const collectionName = this.getStorageFilesCollectionName();
    
    // Use the base model but with tenant-specific collection
    return mongoose.model(
      'StorageFile', 
      StorageFile.schema, 
      collectionName
    );
  }

  async uploadFile(userId: string, prefix: string, file: Express.Multer.File): Promise<IStorageFile> {
    if (!file) {
      throw new ErrorResponse('Missing required: file', StatusCodes.BAD_REQUEST);
    }

    if (!file.buffer) {
      throw new ErrorResponse('File buffer is missing', StatusCodes.BAD_REQUEST);
    }

    const user: IUser | null = await User.findById(userId);

    if (!user) {
      throw new ErrorResponse('User not found', StatusCodes.NOT_FOUND);
    }

    try {
      const normalizedPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;
      const fileKey = `${normalizedPrefix}${file.originalname}`;

      const upload = new Upload({
        client: this.s3Client,
        params: {
          ACL: 'private',
          Bucket: process.env.S3_BUCKET!,
          Key: fileKey,
          Body: file.buffer,
          ContentType: file.mimetype,
        },
      });

      const response = await upload.done();

      // ✅ Get tenant-aware model
      const StorageFileModel = this.getStorageFileModel();
      const collectionName = this.getStorageFilesCollectionName();

      // Create or ensure folder documents exist
      const parts = normalizedPrefix.split('/').filter(Boolean);
      let currentPath = '';
      for (let i = 0; i < parts.length; i++) {
        currentPath += parts[i] + '/';
        const parentPath = i > 0 ? parts.slice(0, i).join('/') + '/' : '';

        await StorageFileModel.updateOne(
          { key: currentPath, type: 'folder', bucket: response.Bucket },
          {
            $setOnInsert: {
              filename: parts[i],
              type: 'folder',
              size: 0,
              ownerId: user._id,
              key: currentPath,
              bucket: response.Bucket,
              etag: response.ETag,
              parent: parentPath,
            },
          },
          { upsert: true }
        );
      }

      const uploadedFile = await StorageFileModel.findOneAndUpdate(
        { key: response.Key },
        {
          $set: {
            filename: file.originalname,
            type: 'file',
            size: file.size,
            ownerId: user._id,
            key: response.Key,
            location: response.Location,
            bucket: response.Bucket,
            etag: response.ETag,
            parent: normalizedPrefix,
            versionId: response.VersionId,
            contentType: file.mimetype,
          },
        },
        {
          upsert: true,
          new: true,
        }
      );

      if (!uploadedFile) {
        throw new ErrorResponse('Failed to create StorageFile document', StatusCodes.INTERNAL_SERVER_ERROR);
      }

      return uploadedFile as IStorageFile;
    } catch (error) {
      console.error('❌ Error uploading file:', error);
      throw new ErrorResponse('Error uploading file', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async listFiles(prefix: string): Promise<IStorageFile[]> {
    try {
      // ✅ Use tenant-aware model
      const StorageFileModel = this.getStorageFileModel();
      
      const normalizedPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;
      const files = await StorageFileModel.find({ parent: normalizedPrefix });
      return files as IStorageFile[];
    } catch (error) {
      console.error('No files listing:', error);
      throw new ErrorResponse('Error files listing', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async getSizeInfo(prefix: string): Promise<ISizeInfo> {
    try {
      const normalizedPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;

      const command = new ListObjectsV2Command({ Bucket: process.env.S3_BUCKET!, Prefix: normalizedPrefix });

      const data = await this.s3Client.send(command);

      const used = data.Contents ? data.Contents.reduce((acc, curr) => acc + (curr.Size ?? 0), 0) : 0;

      const info: ISizeInfo = {
        used: used,
        quota: 1074000000, // It will be retrieved from database - user.model or ...
      };

      return info;
    } catch (error) {
      console.error('No size info:', error);
      throw new ErrorResponse('No size info for specific path', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async getFile(prefix: string, force: boolean = false): Promise<string> {
    try {
      const parts = prefix.split('/');
      const fileName = parts[parts.length - 1];

      let command;

      if (force) {
        command = new GetObjectCommand({
          Bucket: process.env.S3_BUCKET!,
          Key: prefix,
          ResponseContentDisposition: `attachment; filename=${fileName}`,
        });
      } else {
        command = new GetObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: prefix });
      }

      const url = await getSignedUrl(this.s3Client, command, { expiresIn: 300 });
      return url;
    } catch (error) {
      console.error('No presigned Url:', error);
      throw new ErrorResponse('No url for specific path', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async createFolder(userId: string, prefix: string): Promise<IStorageFile> {
    if (!prefix) {
      throw new ErrorResponse('Missing required: folder name', StatusCodes.BAD_REQUEST);
    }

    const user: IUser | null = await User.findById(userId);

    if (!user) {
      throw new ErrorResponse('User not found', StatusCodes.NOT_FOUND);
    }

    try {
      // ✅ Use tenant-aware model
      const StorageFileModel = this.getStorageFileModel();
      
      const normalizedPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;

      // Remove trailing slash if present
      const cleanPath = normalizedPrefix.replace(/\/$/, '');

      // Split into parts
      const parts = cleanPath.split('/');

      // Parent path = everything except last
      const parent = parts.slice(0, -1).join('/') + '/';

      // Last folder = last element
      const folder = parts[parts.length - 1];

      const command = new PutObjectCommand({
        ACL: 'private',
        Bucket: process.env.S3_BUCKET!,
        Key: normalizedPrefix,
      });

      const data = await this.s3Client.send(command);

      const createdFolder = await StorageFileModel.findOneAndUpdate(
        { key: normalizedPrefix, type: 'folder', bucket: process.env.S3_BUCKET! },
        {
          $setOnInsert: {
            filename: folder,
            type: 'folder',
            size: 0,
            ownerId: user._id,
            key: normalizedPrefix,
            bucket: process.env.S3_BUCKET!,
            etag: data.ETag,
            parent: parent,
          },
        },
        { upsert: true, new: true }
      );

      return createdFolder as unknown as IStorageFile;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw new ErrorResponse('Error creating folder', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteObject(userId: string, prefix: string) {
    if (!prefix) {
      throw new ErrorResponse('Missing required: object path', StatusCodes.BAD_REQUEST);
    }

    const user: IUser | null = await User.findById(userId);

    if (!user) {
      throw new ErrorResponse('User not found', StatusCodes.NOT_FOUND);
    }

    try {
      // ✅ Use tenant-aware model
      const StorageFileModel = this.getStorageFileModel();
      
      const listParams = {
        Bucket: process.env.S3_BUCKET!,
        Prefix: prefix,
      };

      const listedObjects = await this.s3Client.send(new ListObjectsV2Command(listParams));
      if (!listedObjects.Contents?.length) return;

      const deleteParams = {
        Bucket: process.env.S3_BUCKET!,
        Delete: { Objects: listedObjects.Contents.map(({ Key }) => ({ Key })) },
      };

      const data = await this.s3Client
        .send(new DeleteObjectsCommand(deleteParams))
        .then(async (data) => {
          await StorageFileModel.deleteMany({
            key: { $regex: '^' + prefix },
          });
          return data;
        })
        .catch((err) => {
          console.error('Error deleting object document:', err);
          throw new ErrorResponse('Error deleting object', StatusCodes.INTERNAL_SERVER_ERROR);
        });
    } catch (error) {
      console.error('Error deleting object:', error);
      throw new ErrorResponse('Error deleting object', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}