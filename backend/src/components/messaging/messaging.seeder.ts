import { logger } from '@utils/logger';
import { markComponentComplete } from '@utils/seedingLogger';
import { requestContextLocalStorage } from '@config/asyncLocalStorage';

// ✅ CRITICAL: Import all models to register them with Mongoose
import Chat from './models/chat.model';
import Message from './models/message.model';
import Attachment from './models/attachment.model';
import ChatNotification from './models/chat-notification.model';
import Reaction from './models/reaction.model';

export const seedTenantMessaging = async (tenantId: string) => {
  await requestContextLocalStorage.run(tenantId, async () => {
    try {
      logger.info(`[${tenantId}] 🔍 Checking messaging collections...`);
      
      // Check if data already exists
      const chatCount = await Chat.countDocuments();
      const messageCount = await Message.countDocuments();
      
      logger.debug(`[${tenantId}] 📊 Messaging data status:`);
      logger.debug(`[${tenantId}]   - Chats: ${chatCount}`);
      logger.debug(`[${tenantId}]   - Messages: ${messageCount}`);
      logger.debug(`[${tenantId}]   - Collection: ${Chat.collection.name}`);
      
      if (chatCount > 0) {
        logger.info(`[${tenantId}] ✅ Messaging data already exists - skipping seeding`);
        markComponentComplete('messaging' as any, tenantId);
        return;
      }
      
      // If you want to seed sample data in the future, add it here:
      // logger.info(`[${tenantId}] 🌱 Creating sample messaging data...`);
      // const sampleChat = await Chat.create({ ... });
      // etc.
      
      logger.info(`[${tenantId}] ✅ Messaging models registered successfully`);
      markComponentComplete('messaging' as any, tenantId);
    } catch (error) {
      logger.error(`[${tenantId}] ❌ Error in messaging seeder:`, error);
      throw error;
    }
  });
};

const seedMessaging = async () => {
  await seedTenantMessaging('supercourse');
  await seedTenantMessaging('piedpiper');
};

export default seedMessaging;