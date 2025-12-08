import * as cron from 'node-cron';
import Post from '@components/posts/post.model';
import { PostStatus } from '@components/posts/post.interface';
import { PostNotificationService } from '@components/posts/post.notification.service';
import { logger } from '@utils/logger';

const postNotificationService = new PostNotificationService();

export const startPostScheduler = () => {
  // Run every minute to check for scheduled posts
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();

      // Find posts that are scheduled and should be published now
      const scheduledPosts = await Post.find({
        status: PostStatus.SCHEDULED,
        scheduled_at: { $lte: now },
      }).populate('author', 'name email');

      if (scheduledPosts.length === 0) {
        return;
      }

      logger.info(`Found ${scheduledPosts.length} scheduled posts to publish`);

      for (const post of scheduledPosts) {
        try {
          // Update post status to published
          post.status = PostStatus.PUBLISHED;
          post.published_at = new Date();
          await post.save();

          logger.info(`Published scheduled post: ${post.title}`);

          // Send notification emails to recipients
          await postNotificationService.sendPostNotification(post);
        } catch (error) {
          logger.error(`Error publishing scheduled post ${post._id}:`, error);
        }
      }
    } catch (error) {
      logger.error('Error in post scheduler:', error);
    }
  });

  logger.info('Post scheduler started - checking for scheduled posts every minute');
};
