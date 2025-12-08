import { logger } from '@utils/logger';
import Chance from 'chance';
import { requestContextLocalStorage } from '@config/asyncLocalStorage';
import Post from './post.model';
import User from '@components/users/user.model';
import Customer from '@components/customers/customer.model';
import { PostStatus } from './post.interface';
import { markComponentComplete } from '@utils/seedingLogger';

const chance = new Chance();

const seedTenantPosts = async (tenantId: string) => {
  await requestContextLocalStorage.run(tenantId, async () => {
    try {
      const existingPosts = await Post.countDocuments();
      if (existingPosts > 0) {
        markComponentComplete('posts', tenantId);
        return;
      }

      // Fetch users who can be authors (admin, teacher, manager)
      const potentialAuthors = await User.find({
        user_type: { $in: ['admin', 'teacher', 'manager'] },
      }).limit(10);

      if (potentialAuthors.length === 0) {
        logger.warn(`[${tenantId}] No potential authors found (admins, teachers, managers), skipping post seeding.`);
        markComponentComplete('posts', tenantId);
        return;
      }

      // Get main tenant customer
      const tenantCustomer = await Customer.findOne({ slug: tenantId, is_primary: true });
      if (!tenantCustomer) {
        logger.warn(`[${tenantId}] No tenant customer found, skipping post seeding.`);
        markComponentComplete('posts', tenantId);
        return;
      }

      const postTitles = [
        'Welcome to the New School Year',
        'Important Update on School Policies',
        'Upcoming School Event: Spring Festival',
        'Congratulations to Our Academic Achievement Winners',
        'Parent-Teacher Conference Schedule',
        'New Resources Available in the Library',
        'Sports Day Information and Schedule',
        'Holiday Schedule and Closure Dates',
      ];

      const postTags = [
        'announcements',
        'events',
        'policies',
        'academics',
        'activities',
        'sports',
        'community',
        'resources',
        'important',
        'featured',
        'calendar',
        'schedules',
      ];

      // Seed at least 5 example posts
      for (let i = 0; i < Math.max(5, postTitles.length); i++) {
        const title = i < postTitles.length ? postTitles[i] : `School Announcement ${i + 1}`;
        const randomAuthor = chance.pickone(potentialAuthors);

        // Generate random content with paragraphs
        const paragraphs = chance.integer({ min: 2, max: 5 });
        const contentArray = [];

        for (let p = 0; p < paragraphs; p++) {
          contentArray.push(chance.paragraph({ sentences: chance.integer({ min: 3, max: 8 }) }));
        }

        const content = contentArray.join('\n\n');

        // Select 2-4 random tags
        const tags = chance.pickset(postTags, chance.integer({ min: 2, max: 4 }));

        // Create the post
        await Post.create({
          title,
          content,
          author: randomAuthor.id,
          tags,
          status: PostStatus.PUBLISHED,
          published_at: chance.date({ year: 2025, month: chance.integer({ min: 1, max: 5 }) }),
          pinned: false,
          likedBy: [],
        });
      }

      // Mark posts as complete for this tenant
      markComponentComplete('posts', tenantId);
    } catch (error) {
      logger.error(`[${tenantId}] Error seeding posts:`, error);
      throw error;
    }
  });
};

const seedPosts = async () => {
  await seedTenantPosts('supercourse');
};

export { seedTenantPosts };
export default seedPosts;
