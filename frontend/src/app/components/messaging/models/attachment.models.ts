// src/app/components/messaging/models/attachment.models.ts

/**
 * Attachment interface matching backend StorageFile model
 */
export interface Attachment {
  _id: string;
  filename: string;
  type: 'file' | 'folder';
  size: number;
  ownerId: string;
  key: string;
  location?: string;
  bucket: string;
  etag: string;
  parent: string;
  versionId?: string;
  contentType?: string;
  metadata?: Map<string, string>;
  deleted?: boolean;
  deletedAt?: Date;
  lastModified?: Date;
  sharedWithUsers?: string[];
  sharedWithGroups?: string[];
  permissions?: Map<string, 'read' | 'read-write'>;
  createdAt?: Date;
  updatedAt?: Date;
  
  // Frontend-only fields
  url?: string; // Signed URL for preview/download
  uploadProgress?: number;
  uploadStatus?: 'pending' | 'uploading' | 'ready' | 'failed';
}

/**
 * Message attachment reference (stored in Message model)
 */
export interface MessageAttachment {
  fileId: string;
  filename: string;
  key: string;
  size: number;
  contentType: string;
  url?: string; // Populated when fetching messages
}

/**
 * Attachment upload request
 */
export interface AttachmentUploadRequest {
  files: File[];
  userId: string;
  prefix: string;
  chatId: string;      
  messageId?: string;
}

/**
 * Attachment upload response
 */
export interface AttachmentUploadResponse {
  success: boolean;
  data: Attachment;
  message?: string;
}

/**
 * Attachment limits configuration
 */
export const ATTACHMENT_LIMITS = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB per file
  MAX_FILES_PER_UPLOAD: 10,
  MAX_TOTAL_SIZE: 200 * 1024 * 1024, // 200MB total
  ALLOWED_EXTENSIONS: [
    // Images
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp',
    // Documents
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'csv',
    // Archives
    'zip', 'rar', '7z', 'tar', 'gz',
    // Audio
    'mp3', 'wav', 'ogg', 'flac', 'm4a',
    // Video
    'mp4', 'avi', 'mkv', 'mov', 'wmv', 'webm'
  ],
  ALLOWED_MIME_TYPES: [
    // Images
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'text/csv', 'text/rtf',
    // Archives
    'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
    'application/x-tar', 'application/gzip',
    // Audio
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/mp4',
    // Video
    'video/mp4', 'video/x-msvideo', 'video/x-matroska', 'video/quicktime', 
    'video/x-ms-wmv', 'video/webm'
  ]
} as const;

/**
 * File validation result
 */
export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Utility class for attachment operations
 */
export class AttachmentUtils {
  /**
   * Validate a single file
   */
  static validateFile(file: File): FileValidationResult {
    const errors: string[] = [];

    // Check file size
    if (file.size > ATTACHMENT_LIMITS.MAX_FILE_SIZE) {
      errors.push(`File size exceeds ${this.formatFileSize(ATTACHMENT_LIMITS.MAX_FILE_SIZE)} limit`);
    }

    // Check file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !ATTACHMENT_LIMITS.ALLOWED_EXTENSIONS.includes(extension as any)) {
      errors.push(`File type ".${extension}" is not allowed`);
    }

    // Check MIME type if provided
    if (file.type && !ATTACHMENT_LIMITS.ALLOWED_MIME_TYPES.includes(file.type as any)) {
      errors.push(`MIME type "${file.type}" is not allowed`);
    }

    // Check for empty file
    if (file.size === 0) {
      errors.push('File is empty');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get icon class for file type
   */
  static getFileIcon(filenameOrMime: string): string {
    const mime = filenameOrMime.includes('/') ? filenameOrMime : this.getMimeFromFilename(filenameOrMime);
    
    if (mime.startsWith('image/')) return 'pi pi-image';
    if (mime.startsWith('video/')) return 'pi pi-video';
    if (mime.startsWith('audio/')) return 'pi pi-volume-up';
    if (mime.includes('pdf')) return 'pi pi-file-pdf';
    if (mime.includes('word') || mime.includes('document')) return 'pi pi-file-word';
    if (mime.includes('excel') || mime.includes('spreadsheet')) return 'pi pi-file-excel';
    if (mime.includes('zip') || mime.includes('rar') || mime.includes('tar')) return 'pi pi-folder';
    return 'pi pi-file';
  }

  /**
   * Format file size to human readable
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Check if file is an image
   */
  static isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  /**
   * Check if file is a video
   */
  static isVideo(mimeType: string): boolean {
    return mimeType.startsWith('video/');
  }

  /**
   * Check if file is audio
   */
  static isAudio(mimeType: string): boolean {
    return mimeType.startsWith('audio/');
  }

  /**
   * Check if file is a document
   */
  static isDocument(mimeType: string): boolean {
    return mimeType.includes('pdf') || 
           mimeType.includes('document') || 
           mimeType.includes('word') ||
           mimeType.includes('excel') ||
           mimeType.includes('powerpoint') ||
           mimeType.includes('text');
  }

  /**
   * Get file category
   */
  static getFileCategory(mimeType: string): 'image' | 'video' | 'audio' | 'document' | 'archive' | 'other' {
    if (this.isImage(mimeType)) return 'image';
    if (this.isVideo(mimeType)) return 'video';
    if (this.isAudio(mimeType)) return 'audio';
    if (this.isDocument(mimeType)) return 'document';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return 'archive';
    return 'other';
  }

  /**
   * Get MIME type from filename extension
   */
  private static getMimeFromFilename(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeMap: { [key: string]: string } = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'mp4': 'video/mp4',
      'mp3': 'audio/mpeg',
      'zip': 'application/zip'
    };
    return mimeMap[ext || ''] || 'application/octet-stream';
  }

  /**
   * Get severity color for file type badge
   */
  static getFileSeverity(mimeType: string): "success" | "info" | "warning" | "danger" | "secondary" {
    if (this.isImage(mimeType)) return 'info';
    if (this.isVideo(mimeType)) return 'warning';
    if (this.isAudio(mimeType)) return 'success';
    if (this.isDocument(mimeType)) return 'secondary';
    return 'danger';
  }
}