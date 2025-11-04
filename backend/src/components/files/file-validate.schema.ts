import 'zod-openapi/extend';
import { z } from 'zod';

const ObjectIdPattern = /^[0-9a-fA-F]{24}$/;

export const FileValidateSchema = z
    .object({
        filename: z
            .string()
            .min(1, 'File name is required')
            .describe('Name of the file'),

        type: z
            .enum(['file', 'folder'])
            .describe('File type'),

        size: z
            .number()
            .min(0, 'File size must be a positive number')
            .describe('File size in bytes'),

        ownerId: z
            .string()
            .regex(ObjectIdPattern, 'Invalid MongoDB ObjectId')
            .describe('Owner user ID'),

        key: z
            .string()
            .min(1, 'File key is required')
            .describe('S3 or storage key'),

        location: z
            .string()
            .optional()
            .describe('File location path'),

        bucket: z
            .string()
            .min(1, 'Bucket is required')
            .describe('Storage bucket name'),

        etag: z
            .string()
            .min(1, 'Etag is required')
            .describe('Entity tag for versioning'),

        parent: z
            .string()
            .min(1, 'Parent is required')
            .describe('Parent folder ID'),

        versionId: z
            .string()
            .optional()
            .describe('Version ID for file versioning'),

        contentType: z
            .string()
            .optional()
            .describe('MIME type of the file'),

        metadata: z
            .record(z.string())
            .optional()
            .describe('Custom metadata key-value pairs'),

        deleted: z
            .boolean()
            .default(false)
            .describe('Soft delete flag'),

        deletedAt: z
            .date()
            .optional()
            .describe('Timestamp when file was deleted'),

        lastModified: z
            .date()
            .optional()
            .describe('Last modification timestamp'),

        sharedWithUsers: z
            .array(z.string())
            .default([])
            .describe('List of user IDs with access'),

        sharedWithGroups: z
            .array(z.string())
            .default([])
            .describe('List of group IDs with access'),

        permissions: z
            .record(z.enum(['read', 'read-write']))
            .optional()
            .describe('Permission map by user/group ID'),

        createdAt: z
            .date()
            .optional()
            .describe('Creation timestamp'),

        updatedAt: z
            .date()
            .optional()
            .describe('Last update timestamp'),
    })
    .openapi({
        title: 'File',
        description: 'File model',
    });

export const FileCreateSchema = z
    .object({
        filename: z
            .string()
            .min(1, 'File name is required')
            .describe('Name of the file'),

        type: z
            .enum(['file', 'folder'])
            .describe('File type'),

        size: z
            .number()
            .min(0, 'File size must be a positive number')
            .describe('File size in bytes'),

        ownerId: z
            .string()
            .regex(ObjectIdPattern, 'Invalid MongoDB ObjectId')
            .describe('Owner user ID'),

        key: z
            .string()
            .min(1, 'File key is required')
            .describe('S3 or storage key'),

        bucket: z
            .string()
            .min(1, 'Bucket is required')
            .describe('Storage bucket name'),

        etag: z
            .string()
            .min(1, 'Etag is required')
            .describe('Entity tag for versioning'),

        parent: z
            .string()
            .min(1, 'Parent is required')
            .describe('Parent folder ID'),

        location: z
            .string()
            .optional()
            .describe('File location path'),

        versionId: z
            .string()
            .optional()
            .describe('Version ID for file versioning'),

        contentType: z
            .string()
            .optional()
            .describe('MIME type of the file'),

        metadata: z
            .record(z.string())
            .optional()
            .describe('Custom metadata key-value pairs'),

        lastModified: z
            .date()
            .optional()
            .describe('Last modification timestamp'),

        sharedWithUsers: z
            .array(z.string())
            .optional()
            .describe('List of user IDs with access'),

        sharedWithGroups: z
            .array(z.string())
            .optional()
            .describe('List of group IDs with access'),

        permissions: z
            .record(z.enum(['read', 'read-write']))
            .optional()
            .describe('Permission map by user/group ID'),
    })
    .strict()
    .openapi({
        title: 'CreateFile',
        description: 'Schema for creating a new file',
    });

export const FileUpdateSchema = z
    .object({
        filename: z
            .string()
            .min(1, 'File name must not be empty')
            .optional()
            .describe('Name of the file'),

        type: z
            .enum(['file', 'folder'])
            .optional()
            .describe('File type'),

        size: z
            .number()
            .min(0, 'File size must be a positive number')
            .optional()
            .describe('File size in bytes'),

        location: z
            .string()
            .optional()
            .describe('File location path'),

        versionId: z
            .string()
            .optional()
            .describe('Version ID for file versioning'),

        contentType: z
            .string()
            .optional()
            .describe('MIME type of the file'),

        metadata: z
            .record(z.string())
            .optional()
            .describe('Custom metadata key-value pairs'),

        deleted: z
            .boolean()
            .optional()
            .describe('Soft delete flag'),

        deletedAt: z
            .date()
            .optional()
            .describe('Timestamp when file was deleted'),

        lastModified: z
            .date()
            .optional()
            .describe('Last modification timestamp'),

        sharedWithUsers: z
            .array(z.string())
            .optional()
            .describe('List of user IDs with access'),

        sharedWithGroups: z
            .array(z.string())
            .optional()
            .describe('List of group IDs with access'),

        permissions: z
            .record(z.enum(['read', 'read-write']))
            .optional()
            .describe('Permission map by user/group ID'),
    })
    .strict()
    .openapi({
        title: 'UpdateFile',
        description: 'Schema for updating a new file',
    });