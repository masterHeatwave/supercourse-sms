// src/components/messaging/services/attachment.service.ts
import { ErrorResponse } from '@utils/errorResponse';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import FormData from 'form-data';
import Attachment from '../models/attachment.model';
import {
  IAttachment,
  IAttachmentCreateDTO,
  AttachmentStatus,
  VirusScanStatus,
} from '../messaging.interface';
import { Server as SocketIOServer } from 'socket.io';

// ✅ ADD THIS INTERFACE FOR UPLOAD RESPONSE
interface FileServerUploadResponse {
  $metadata?: {
    httpStatusCode: number;
  };
  ETag?: string;
  Location?: string;
  Key?: string;
  error?: string;
}

export class AttachmentService {
  private io: SocketIOServer | null = null;

  /**
   * File size limits by category
   */
  private FILE_SIZE_LIMITS = {
    image: 10 * 1024 * 1024, // 10MB
    document: 50 * 1024 * 1024, // 50MB
    audio: 25 * 1024 * 1024, // 25MB
    video: 100 * 1024 * 1024, // 100MB
    other: 5 * 1024 * 1024, // 5MB
  };

  private MAX_FILES_PER_UPLOAD = 10;

  /**
   * File server configuration
   */
  private fileServerConfig = {
    fileServerUrl: process.env.FILE_SERVER_URL,
    uploadEndpoint: process.env.FILE_UPLOAD_ENDPOINT,
    accessToken: process.env.FILE_ACCESS_TOKEN,
    uploadPrefix: process.env.UPLOAD_PREFIX || '',
  };

  /**
   * Set Socket.IO instance for real-time updates
   */
  setSocketIO(ioInstance: SocketIOServer): void {
    this.io = ioInstance;
  }

  /**
   * Validate file upload constraints
   */
  validateFileUpload(files: Express.Multer.File[]): { isValid: boolean; errors: string[] } {
    if (!files || files.length === 0) {
      return { isValid: false, errors: ['No files provided'] };
    }

    if (files.length > this.MAX_FILES_PER_UPLOAD) {
      return {
        isValid: false,
        errors: [`Maximum ${this.MAX_FILES_PER_UPLOAD} files allowed`],
      };
    }

    const errors: string[] = [];
    for (const file of files) {
      const category = this.getFileCategory(file.originalname);
      const maxSize = this.FILE_SIZE_LIMITS[category] || this.FILE_SIZE_LIMITS.other;

      if (file.size > maxSize) {
        errors.push(`${file.originalname}: File too large (max ${this.formatFileSize(maxSize)})`);
      }

      if (file.size === 0) {
        errors.push(`${file.originalname}: File is empty`);
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Get file category based on extension
   */
  getFileCategory(filename: string): 'image' | 'document' | 'audio' | 'video' | 'other' {
    const ext = path.extname(filename).toLowerCase().slice(1);
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return 'image';
    if (['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) return 'document';
    if (['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(ext)) return 'audio';
    if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext)) return 'video';
    return 'other';
  }

  /**
   * Get MIME type from filename
   */
  getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.bmp': 'image/bmp',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mov': 'video/quicktime',
      '.zip': 'application/zip',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Format file size to human-readable string
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Extract image metadata using sharp
   */
  async extractImageMetadata(filePath: string): Promise<any> {
    try {
      const image = sharp(filePath);
      const metadata = await image.metadata();

      return {
        width: metadata.width,
        height: metadata.height,
        exif: {
          camera: null,
          location: null,
          dateTaken: null,
        },
      };
    } catch (error: any) {
      console.error('Image metadata extraction failed:', error);
      return {};
    }
  }

  /**
   * Upload file to external file server
   */
  async uploadFileToServer(
    filePath: string,
    filename: string,
    userId: string
  ): Promise<{ url: string; serverId: string; success: boolean }> {
    try {
      console.log(`Starting upload for ${filename} to external file server...`);

      if (!this.fileServerConfig.fileServerUrl || !this.fileServerConfig.accessToken) {
        throw new ErrorResponse('File server configuration is incomplete', StatusCodes.INTERNAL_SERVER_ERROR);
      }

      const fileBuffer = await fs.readFile(filePath);
      const formData = new FormData();

      formData.append('file', fileBuffer, {
        filename: filename,
        contentType: this.getMimeType(filename),
      });

      const baseUrl = this.fileServerConfig.fileServerUrl.replace(/\/$/, '');
      const prefix = this.fileServerConfig.uploadPrefix || `${userId}/`;
      const uploadUrl = `${baseUrl}/api/upload-files/?userId=${userId}&prefix=${prefix}`;

      console.log('Upload URL:', uploadUrl);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'x-access-token': this.fileServerConfig.accessToken,
          ...formData.getHeaders(),
        },
        body: formData as any,
      });

      console.log(`External server response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ External server error details:', errorText);
        throw new ErrorResponse(
          `Upload failed: ${response.status} ${response.statusText} - ${errorText}`,
          StatusCodes.INTERNAL_SERVER_ERROR
        );
      }

      // ✅ FIX: Add type assertion for the response
      const result = await response.json() as FileServerUploadResponse;
      console.log('External server response:', JSON.stringify(result, null, 2));

      if (result.$metadata?.httpStatusCode === 200 && result.ETag) {
        const downloadUrl = result.Location || `${baseUrl}/uploads/${prefix}${filename}`;
        console.log(`✅ Upload successful. File URL: ${downloadUrl}`);

        await fs.unlink(filePath).catch((err) => console.warn('Could not delete temp file:', err.message));

        return {
          url: downloadUrl,
          serverId: result.Key || filename,
          success: true,
        };
      }

      throw new ErrorResponse(result.error || 'Upload failed on external server', StatusCodes.INTERNAL_SERVER_ERROR);
    } catch (error: any) {
      console.error(`❌ File upload error for ${filename}:`, error);
      await fs.unlink(filePath).catch(() => {});
      throw error;
    }
  }

  /**
   * Process file asynchronously (metadata extraction + upload)
   */
  async processFileAsync(attachment: IAttachment, filePath: string, userId: string): Promise<IAttachment> {
    try {
      console.log(`Processing file: ${attachment.originalName}`);

      if (this.getFileCategory(attachment.filename) === 'image') {
        const imageMetadata = await this.extractImageMetadata(filePath);
        if (imageMetadata && Object.keys(imageMetadata).length > 0) {
          attachment.metadata = imageMetadata;
        }
      }

      const uploadResult = await this.uploadFileToServer(filePath, attachment.filename, userId);

      attachment.url = uploadResult.url;
      attachment.status = AttachmentStatus.READY;
      attachment.virusScanStatus = VirusScanStatus.CLEAN;
      attachment.uploadedAt = new Date();

      await attachment.save();
      console.log(`✅ Processing completed for ${attachment.originalName}`);

      return attachment;
    } catch (error: any) {
      console.error(`❌ Processing failed for ${attachment.originalName}:`, error);
      attachment.status = AttachmentStatus.ERROR;
      attachment.virusScanStatus = VirusScanStatus.PENDING;
      if (!attachment.metadata) attachment.metadata = {};
      (attachment.metadata as any).errorMessage = error.message;

      try {
        await attachment.save();
      } catch (saveError) {
        console.error('Failed to save error status:', saveError);
      }
      throw error;
    }
  }

  /**
   * Create attachment records and process files
   */
  async uploadAttachments(
    files: Express.Multer.File[],
    chatId: string,
    userId: string,
    messageId?: string
  ): Promise<{ attachments: IAttachment[]; errors: string[] }> {
    try {
      const attachments: IAttachment[] = [];
      const errors: string[] = [];

      const validation = this.validateFileUpload(files);
      if (!validation.isValid) {
        await this.cleanupFiles(files);
        throw new ErrorResponse(validation.errors.join(', '), StatusCodes.BAD_REQUEST);
      }

      for (const file of files) {
        try {
          const fileExtension = path.extname(file.originalname).toLowerCase().slice(1);
          const timestamp = Date.now();
          const filename = `att_${timestamp}_${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

          const attachmentData: IAttachmentCreateDTO = {
            filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            fileSize: file.size,
            fileExtension,
            uploadedBy: userId,
            chatId,
            messageId,
            url: `/uploads/attachments/${filename}`,
            status: AttachmentStatus.UPLOADING,
          };

          console.log('Creating attachment with data:', JSON.stringify(attachmentData, null, 2));

          const attachment = await Attachment.create({
            ...attachmentData,
            uploadedBy: new Types.ObjectId(userId),
            chatId: new Types.ObjectId(chatId),
            messageId: messageId ? new Types.ObjectId(messageId) : undefined,
            uploadedAt: new Date(),
            virusScanStatus: VirusScanStatus.PENDING,
            metadata: {},
          });

          console.log(`✅ Created attachment record: ${attachment._id} for file: ${file.originalname}`);

          this.processFileAsync(attachment, file.path, userId)
            .then(() => {
              console.log(`✅ Successfully processed: ${attachment.originalName}`);
              if (this.io) {
                this.io.to(chatId).emit('attachmentUploaded', {
                  attachmentId: attachment._id,
                  chatId,
                  messageId,
                  filename: attachment.filename,
                  status: attachment.status,
                });
              }
            })
            .catch((err) => {
              console.error(`❌ Processing error for ${attachment.originalName}:`, err);
            });

          attachments.push(attachment);
        } catch (error: any) {
          console.error(`❌ Error creating attachment for ${file.originalname}:`, error);
          errors.push(`Failed to process ${file.originalname}: ${error.message}`);

          try {
            await fs.unlink(file.path);
          } catch (unlinkError) {
            console.error(`Failed to cleanup file:`, unlinkError);
          }
        }
      }

      return { attachments, errors };
    } catch (error: any) {
      console.error('❌ Upload attachments error:', error);
      throw error;
    }
  }

  /**
   * Get attachments by chat ID
   */
  async getChatAttachments(chatId: string, limit: number = 50): Promise<IAttachment[]> {
    try {
      const attachments = await Attachment.find({ chatId: new Types.ObjectId(chatId) })
        .sort({ uploadedAt: -1 })
        .limit(limit)
        .populate('uploadedBy', 'firstname lastname email username avatar')
        .lean();

      return attachments as IAttachment[];
    } catch (error: any) {
      console.error('❌ Error getting chat attachments:', error);
      throw new ErrorResponse(`Failed to retrieve attachments: ${error.message}`, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get attachments by message ID
   */
  async getMessageAttachments(messageId: string): Promise<IAttachment[]> {
    try {
      const attachments = await Attachment.find({ messageId: new Types.ObjectId(messageId) })
        .sort({ uploadedAt: 1 })
        .lean();

      return attachments as IAttachment[];
    } catch (error: any) {
      console.error('❌ Error getting message attachments:', error);
      throw new ErrorResponse(`Failed to retrieve attachments: ${error.message}`, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get single attachment by ID
   */
  async getAttachmentById(attachmentId: string): Promise<IAttachment> {
    try {
      const attachment = await Attachment.findById(attachmentId).populate(
        'uploadedBy',
        'firstname lastname email username avatar'
      );

      if (!attachment) {
        throw new ErrorResponse('Attachment not found', StatusCodes.NOT_FOUND);
      }

      return attachment;
    } catch (error: any) {
      console.error('❌ Error getting attachment:', error);
      throw error;
    }
  }

  /**
   * Delete attachment
   */
  async deleteAttachment(attachmentId: string, userId: string): Promise<IAttachment> {
    try {
      const attachment = await Attachment.findById(attachmentId);

      if (!attachment) {
        throw new ErrorResponse('Attachment not found', StatusCodes.NOT_FOUND);
      }

      if (attachment.uploadedBy.toString() !== userId) {
        throw new ErrorResponse('You do not have permission to delete this attachment', StatusCodes.FORBIDDEN);
      }

      const deleted = await Attachment.findByIdAndDelete(attachmentId);

      if (!deleted) {
        throw new ErrorResponse('Attachment could not be deleted', StatusCodes.INTERNAL_SERVER_ERROR);
      }

      console.log(`✅ Database record deleted: ${deleted._id}`);

      return deleted;
    } catch (error: any) {
      console.error('❌ Error deleting attachment:', error);
      throw error;
    }
  }

  /**
   * Get upload status for multiple attachments
   */
  async getUploadStatus(attachmentIds: string[], userId: string): Promise<Record<string, any>> {
    try {
      const attachments = await Attachment.find({
        _id: { $in: attachmentIds.map((id) => new Types.ObjectId(id)) },
        uploadedBy: new Types.ObjectId(userId),
      }).select('_id filename originalName status url uploadedAt virusScanStatus');

      const statusMap: Record<string, any> = {};
      attachments.forEach((attachment) => {
        statusMap[attachment._id.toString()] = {
          status: attachment.status,
          filename: attachment.filename,
          originalName: attachment.originalName,
          url: attachment.url,
          uploadedAt: attachment.uploadedAt,
          virusScanStatus: attachment.virusScanStatus,
        };
      });

      return statusMap;
    } catch (error: any) {
      console.error('❌ Error getting upload status:', error);
      throw new ErrorResponse(`Failed to retrieve upload status: ${error.message}`, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Cleanup temporary files
   */
  async cleanupFiles(files: Express.Multer.File[]): Promise<void> {
    const promises = files.map(async (file) => {
      try {
        if (file.path) {
          await fs.unlink(file.path);
          console.log(`Cleaned up temp file: ${file.path}`);
        }
      } catch (error: any) {
        console.warn(`Could not cleanup file ${file.path}:`, error.message);
      }
    });
    await Promise.allSettled(promises);
  }
}