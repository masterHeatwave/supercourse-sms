// src/components/messaging/models/attachment.model.ts
import mongoose, { Schema, Model } from 'mongoose';
import toJson from '../../../plugins/toJson';
import { advancedResultsPlugin } from '@plugins/advancedResults';
import { IAdvancedResultsModel } from '@plugins/advancedResults.interface';
import { tenantAwarePlugin } from '@plugins/tenantAware';
import {
  IAttachment,
  IAttachmentModel,
  AttachmentStatus,
  VirusScanStatus,
  FileCategory,
  IAttachmentMetadata,
} from '../messaging.interface';

// Type for the complete model (Document + Statics)
type AttachmentModel = Model<IAttachment> & IAttachmentModel;

/**
 * Metadata Schema
 */
const MetadataSchema = new Schema<IAttachmentMetadata>(
  {
    width: { type: Number },
    height: { type: Number },
    exif: {
      camera: { type: String },
      location: { type: String },
      dateTaken: { type: Date },
    },
  },
  { _id: false }
);

/**
 * Attachment Schema
 * ✅ FIXED: Use Taxi pattern - only one generic
 */
const AttachmentSchema: Schema<IAttachment> = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
      trim: true,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileExtension: {
      type: String,
      lowercase: true,
      trim: true,
    },
    fileSize: {
      type: Number,
      required: true,
      min: 0,
    },
    url: {
      type: String,
      trim: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    chatId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Chat',
      index: true,
    },
    messageId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: 'Message',
    },
    status: {
      type: String,
      enum: Object.values(AttachmentStatus),
      default: AttachmentStatus.READY,
    },
    virusScanStatus: {
      type: String,
      enum: Object.values(VirusScanStatus),
      default: VirusScanStatus.CLEAN,
    },
    metadata: {
      type: MetadataSchema,
      required: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ==================== INDEXES ====================
AttachmentSchema.index({ chatId: 1, uploadedAt: -1 });
AttachmentSchema.index({ messageId: 1 });
AttachmentSchema.index({ uploadedBy: 1 });

// ==================== VIRTUALS ====================

/**
 * Virtual: File Category
 * Determines the category of file based on extension
 */
AttachmentSchema.virtual('fileCategory').get(function (this: IAttachment): FileCategory {
  const ext = this.fileExtension?.toLowerCase();
  
  if (!ext) return 'other';
  
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
  const documentExts = ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx'];
  const audioExts = ['mp3', 'wav', 'ogg', 'm4a', 'aac'];
  const videoExts = ['mp4', 'webm', 'mov', 'avi', 'mkv'];
  
  if (imageExts.includes(ext)) return 'image';
  if (documentExts.includes(ext)) return 'document';
  if (audioExts.includes(ext)) return 'audio';
  if (videoExts.includes(ext)) return 'video';
  
  return 'other';
});

/**
 * Virtual: Formatted File Size
 * Converts bytes to human-readable format
 */
AttachmentSchema.virtual('fileSizeFormatted').get(function (this: IAttachment): string {
  const bytes = this.fileSize;
  
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
});

// ==================== STATIC METHODS ====================

/**
 * Find attachments by chat ID
 * @param chatId - Chat ID to search for
 * @param limit - Maximum number of results (default: 50)
 */
AttachmentSchema.statics.findByChat = function (
  chatId: string | mongoose.Types.ObjectId,
  limit: number = 50
): Promise<IAttachment[]> {
  return this.find({ chatId })
    .sort({ uploadedAt: -1 })
    .limit(limit)
    .populate('uploadedBy', 'firstname lastname avatar')
    .exec();
};

/**
 * Find attachments by message ID
 * @param messageId - Message ID to search for
 */
AttachmentSchema.statics.findByMessage = function (
  messageId: string | mongoose.Types.ObjectId
): Promise<IAttachment[]> {
  return this.find({ messageId })
    .populate('uploadedBy', 'firstname lastname avatar')
    .exec();
};

// ==================== MIDDLEWARE ====================

/**
 * Pre-save hook
 * Auto-populate fileExtension and url if not provided
 */
AttachmentSchema.pre('save', function (this: IAttachment, next) {
  // Auto-extract file extension from filename
  if (!this.fileExtension && this.filename) {
    const parts = this.filename.toLowerCase().split('.');
    if (parts.length > 1) {
      this.fileExtension = parts[parts.length - 1];
    }
  }
  
  // Auto-generate URL if not provided
  if (!this.url && this.filename) {
    this.url = `/uploads/attachments/${this.filename}`;
  }
  
  next();
});

/**
 * Post-save hook
 * Emit signals for real-time updates
 */
AttachmentSchema.post('save', async function (doc: IAttachment, next) {
  try {
    // TODO: Emit socket event for new attachment
    // emitAttachmentSignal('ATTACHMENT_UPLOADED', {
    //   attachmentId: doc._id,
    //   chatId: doc.chatId,
    //   messageId: doc.messageId
    // });
  } catch (error) {
    console.error('Error emitting attachment signal:', error);
  }
  next();
});

// ==================== PLUGINS ====================
AttachmentSchema.plugin(toJson);
AttachmentSchema.plugin(advancedResultsPlugin);
AttachmentSchema.plugin(tenantAwarePlugin); // ✅ NO "as any" needed!

// ==================== EXPORT ====================
const Attachment = mongoose.model<IAttachment, AttachmentModel & IAdvancedResultsModel<IAttachment>>(
  'Attachment',
  AttachmentSchema
);

export default Attachment;
export { AttachmentSchema };