import { IPost, IPostRecipients } from './post.interface';
import User from '@components/users/user.model';
import Customer from '@components/customers/customer.model';
import Taxi from '@components/taxi/taxi.model';
import { sendEmail } from '@utils/sendEmail';
import { logger } from '@utils/logger';

export class PostNotificationService {
  async sendPostNotification(post: IPost) {
    try {
      const recipients = await this.resolveRecipients(post.recipients);

      if (recipients.length === 0) {
        logger.info('No recipients found for post notification');
        return;
      }

      const emailContent = this.generateEmailContent(post);

      for (const email of recipients) {
        await sendEmail({
          to: email,
          subject: `New Post: ${post.title}`,
          html: emailContent,
        });
      }

      logger.info(`Post notification sent to ${recipients.length} recipients`);
    } catch (error) {
      logger.error('Error sending post notification:', error);
      throw error;
    }
  }

  private async resolveRecipients(recipients: IPostRecipients): Promise<string[]> {
    const emailSet = new Set<string>();

    try {
      // Resolve users from branches (customers)
      if (recipients.branches && recipients.branches.length > 0) {
        const branchUsers = await User.find({
          $or: [{ customers: { $in: recipients.branches } }, { branches: { $in: recipients.branches } }],
        }).select('email');

        branchUsers.forEach((user) => {
          if (user.email) emailSet.add(user.email);
        });
      }

      // Resolve users from taxis (classes)
      if (recipients.taxis && recipients.taxis.length > 0) {
        const taxiUsers = await User.find({
          taxis: { $in: recipients.taxis },
        }).select('email');

        taxiUsers.forEach((user) => {
          if (user.email) emailSet.add(user.email);
        });
      }

      // Resolve direct users
      if (recipients.users && recipients.users.length > 0) {
        const directUsers = await User.find({
          _id: { $in: recipients.users },
        }).select('email');

        directUsers.forEach((user) => {
          if (user.email) emailSet.add(user.email);
        });
      }

      return Array.from(emailSet);
    } catch (error) {
      logger.error('Error resolving recipients:', error);
      return [];
    }
  }

  private generateEmailContent(post: IPost): string {
    const publishDate = post.published_at ? new Date(post.published_at).toLocaleDateString() : 'Now';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Post: ${post.title}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f4f4f4; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
          .content { background: white; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
          .priority { display: inline-block; padding: 4px 8px; border-radius: 3px; font-size: 12px; font-weight: bold; }
          .priority-high { background: #ffebee; color: #c62828; }
          .priority-normal { background: #e8f5e8; color: #2e7d32; }
          .priority-low { background: #e3f2fd; color: #1565c0; }
          .pinned { background: #fff3e0; color: #ef6c00; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Post Published</h1>
            <p><strong>Published:</strong> ${publishDate}</p>
            ${post.priority ? `<span class="priority priority-${post.priority}">${post.priority.toUpperCase()}</span>` : ''}
            ${post.pinned ? '<span class="pinned">📌 PINNED</span>' : ''}
          </div>
          
          <div class="content">
            <h2>${post.title}</h2>
            <div>${post.content}</div>
            
            ${
              post.poll
                ? `
              <div style="margin-top: 20px; padding: 15px; background: #f9f9f9; border-radius: 5px;">
                <h3>📊 Poll: ${post.poll.question}</h3>
                <p>Multiple votes allowed: ${post.poll.allowMultiple ? 'Yes' : 'No'}</p>
                <p>Options:</p>
                <ul>
                  ${post.poll.options.map((option) => `<li>${option.text}</li>`).join('')}
                </ul>
              </div>
            `
                : ''
            }
            
            ${
              post.tags && post.tags.length > 0
                ? `
              <div style="margin-top: 15px;">
                <strong>Tags:</strong> ${post.tags.join(', ')}
              </div>
            `
                : ''
            }
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
