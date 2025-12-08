import 'zod-openapi/extend';
import { z } from 'zod';
import { SuccessResponseSchema } from '@components/auth/auth-validate.schemas';

const ObjectIdPattern = /^[0-9a-fA-F]{24}$/;

export const StorageFileSchema = z
  .object({
    filename: z.string().min(1, 'File name is required').describe('Name of the file'),
    type: z.enum(['file', 'folder']).describe('File type'),
    size: z.number().min(0, 'File size must be a positive number').describe('File size in bytes'),
    ownerId: z.string().regex(ObjectIdPattern, 'Invalid MongoDB ObjectId').describe('Owner user ID'),
    key: z.string().min(1, 'File key is required').describe('S3 or storage key'),
    location: z.string().optional().describe('File location path'),
    bucket: z.string().min(1, 'Bucket is required').describe('Storage bucket name'),
    etag: z.string().min(1, 'Etag is required').describe('Entity tag for versioning'),
    parent: z.string().min(1, 'Parent is required').describe('Parent folder ID'),
    versionId: z.string().optional().describe('Version ID for file versioning'),
    contentType: z.string().optional().describe('MIME type of the file'),
    metadata: z.record(z.string()).optional().describe('Custom metadata key-value pairs'),
    deleted: z.boolean().default(false).describe('Soft delete flag'),
    deletedAt: z.date().optional().describe('Timestamp when file was deleted'),
    lastModified: z.date().optional().describe('Last modification timestamp'),
    sharedWithUsers: z.array(z.string()).default([]).describe('List of user IDs with access'),
    sharedWithGroups: z.array(z.string()).default([]).describe('List of group IDs with access'),
    permissions: z
      .record(z.enum(['read', 'read-write']))
      .optional()
      .describe('Permission map by user/group ID'),
    createdAt: z.date().optional().describe('Creation timestamp'),
    updatedAt: z.date().optional().describe('Last update timestamp'),
  })
  .openapi({
    title: 'Storage File',
    description: 'Storage File model',
  });

export const StorageFileResponseSchema = SuccessResponseSchema.extend({
  data: StorageFileSchema,
});

export const StorageFileResponseListSchema = SuccessResponseSchema.extend({
  data: z.array(StorageFileSchema),
});

export const StorageUploadSchema = z
  .object({
    userId: z
      .string()
      .min(1, 'User ID is required')
      .regex(ObjectIdPattern, 'Invalid MongoDB ObjectId format')
      .describe('Owner user ID (MongoDB ObjectId)'),
    prefix: z.string().min(1, 'Prefix is required').describe('Path/folder prefix for file upload'),
  })
  .strict();

export const StorageFilesSchema = z
  .object({
    userId: z
      .string()
      .min(1, 'User ID is required')
      .regex(ObjectIdPattern, 'Invalid MongoDB ObjectId format')
      .describe('Owner user ID (MongoDB ObjectId)'),
    prefix: z.string().min(1, 'Prefix is required').describe('Path/folder prefix for file upload'),
  })
  .strict();

export const PresignedUrlResponseSchema = z
  .object({
    url: z
      .string()
      .url('Presigned URL must be a valid URI')
      .describe('The presigned URL that the client can use to access the file'),
  })
  .strict();

export const FileUploadSchema = z.object({
  file: z.any().openapi({
    type: 'string',
    format: 'binary',
    description: 'The file to upload',
  }),
});

export const SizeInfoSchema = z.object({
  used: z.number(),
  quota: z.number(),
});
