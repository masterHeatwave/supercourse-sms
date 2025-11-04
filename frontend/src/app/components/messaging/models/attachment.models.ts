// Attachment models
export interface Attachment {
    _id: string;
    chatId: string;
    messageId?: string;
    userId: string;
    originalName: string;
    storedName: string;
    mimeType: string;
    size: number;
    status: 'pending' | 'uploading' | 'ready' | 'failed';
    virusScanStatus?: 'pending' | 'scanning' | 'clean' | 'infected';
    uploadedAt: Date;
    url?: string;
    thumbnailUrl?: string;
    metadata?: AttachmentMetadata;
  }
  
  export interface AttachmentMetadata {
    width?: number;
    height?: number;
    duration?: number;
    codec?: string;
    exif?: {
      make?: string;
      model?: string;
      dateTaken?: Date;
      gps?: {
        latitude: number;
        longitude: number;
      };
    };
  }
  
  export interface AttachmentUploadRequest {
    files: File[];
    chatId: string;
    messageId?: string;
  }
  
  export interface AttachmentUploadResponse {
    success: boolean;
    attachments: Attachment[];
    message?: string;
  }
  
  // ✅ ADD: Attachment limits configuration
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
  
  // ✅ ADD: File validation interface
  export interface FileValidationResult {
    isValid: boolean;
    errors: string[];
  }
  
  // Utility class for attachment operations
  export class AttachmentUtils {
    // ✅ ADD: Validate a single file
    static validateFile(file: File): FileValidationResult {
      const errors: string[] = [];
  
      // Check file size
      if (file.size > ATTACHMENT_LIMITS.MAX_FILE_SIZE) {
        errors.push(`File size exceeds ${this.formatFileSize(ATTACHMENT_LIMITS.MAX_FILE_SIZE)} limit`);
      }
  
      // Check file extension
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !ATTACHMENT_LIMITS.ALLOWED_EXTENSIONS.includes(extension as (typeof ATTACHMENT_LIMITS.ALLOWED_EXTENSIONS)[number])) {
        errors.push(`File type ".${extension}" is not allowed`);
      }
  
      // Check MIME type
      if (!ATTACHMENT_LIMITS.ALLOWED_MIME_TYPES.includes(file.type as (typeof ATTACHMENT_LIMITS.ALLOWED_MIME_TYPES)[number])) {
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
  
    static getFileIcon(mimeType: string): string {
      if (mimeType.startsWith('image/')) return 'pi-image';
      if (mimeType.startsWith('video/')) return 'pi-video';
      if (mimeType.startsWith('audio/')) return 'pi-volume-up';
      if (mimeType.includes('pdf')) return 'pi-file-pdf';
      if (mimeType.includes('word') || mimeType.includes('document')) return 'pi-file-word';
      if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'pi-file-excel';
      return 'pi-file';
    }
  
    static formatFileSize(bytes: number): string {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
  
    static isImage(mimeType: string): boolean {
      return mimeType.startsWith('image/');
    }
  
    static isVideo(mimeType: string): boolean {
      return mimeType.startsWith('video/');
    }
  
    static isAudio(mimeType: string): boolean {
      return mimeType.startsWith('audio/');
    }
  
    static isDocument(mimeType: string): boolean {
      return mimeType.includes('pdf') || 
             mimeType.includes('document') || 
             mimeType.includes('word') ||
             mimeType.includes('excel') ||
             mimeType.includes('powerpoint') ||
             mimeType.includes('text');
    }
  
    static getFileCategory(mimeType: string): 'image' | 'video' | 'audio' | 'document' | 'archive' | 'other' {
      if (this.isImage(mimeType)) return 'image';
      if (this.isVideo(mimeType)) return 'video';
      if (this.isAudio(mimeType)) return 'audio';
      if (this.isDocument(mimeType)) return 'document';
      if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return 'archive';
      return 'other';
    }
  }