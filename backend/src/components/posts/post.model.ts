import mongoose, { Schema } from 'mongoose';
import { IPost, PostStatus } from './post.interface';
import toJson from '../../plugins/toJson';
import { advancedResultsPlugin } from '@plugins/advancedResults';
import { IAdvancedResultsModel } from '@plugins/advancedResults.interface';
import { createdBy, ICreatorModel } from '@plugins/createdBy';
import { notificationPlugin } from '@plugins/notifications';
import { ActivityEntityType } from '@components/activity/activity.interface';
import { activityTrackerPlugin } from '@plugins/activityTracker';

const PostSchema: Schema<IPost> = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a title'],
      trim: true,
      maxLength: [200, 'Title cannot be more than 200 characters'],
    },
    content: {
      type: String,
      required: [true, 'Please add content'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please add an author'],
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: Object.values(PostStatus),
      default: PostStatus.DRAFT,
    },
    featured_image: {
      type: String,
    },
    published_at: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

PostSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === PostStatus.PUBLISHED && !this.published_at) {
    this.published_at = new Date();
  }
  next();
});

PostSchema.plugin(toJson);
PostSchema.plugin(advancedResultsPlugin);
PostSchema.plugin(createdBy);
PostSchema.plugin(notificationPlugin, [
  {
    action: 'create',
    title: (doc: IPost) => `New Post "${doc.title}" has been created`,
  },
  {
    action: 'update',
    title: (doc: IPost) => {
      if (doc.status === PostStatus.PUBLISHED) {
        return `Post "${doc.title}" has been published`;
      }
      return `Post "${doc.title}" has been updated`;
    },
  },
]);

// Apply activity tracker plugin with custom details for different post statuses
PostSchema.plugin(activityTrackerPlugin, {
  entityType: ActivityEntityType.POST,
  entityNameField: 'title',
  getActivityDetails: (doc, isNew) => {
    // Custom activity details based on post status
    if (doc.status === PostStatus.PUBLISHED && doc.published_at) {
      return `Published post: ${doc.title}`;
    } else if (doc.status === PostStatus.ARCHIVED) {
      return `Archived post: ${doc.title}`;
    } else {
      return isNew ? `Created new post: ${doc.title}` : `Updated post: ${doc.title}`;
    }
  },
});

export default mongoose.model<
  IPost,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  IAdvancedResultsModel<any> & ICreatorModel<IPost>
>('Post', PostSchema);

export { PostSchema };
