/**
 * Migration Script: Fix User-Taxi References
 *
 * This script updates all users' taxis arrays based on existing taxi records.
 * Run this once to fix data that was seeded before the taxi seeder was updated.
 *
 * Usage:
 * npx ts-node -r tsconfig-paths/register src/utils/migrations/fix-user-taxi-references.ts
 */

import mongoose from 'mongoose';
import { config } from '@config/config';
import { requestContextLocalStorage } from '@config/asyncLocalStorage';
import Taxi from '@components/taxi/taxi.model';
import User from '@components/users/user.model';
import { logger } from '@utils/logger';

const TENANTS = ['supercourse']; // Add your tenant IDs here

async function fixUserTaxiReferences() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGO_URI);
    logger.info('Connected to MongoDB');

    for (const tenantId of TENANTS) {
      await requestContextLocalStorage.run(tenantId, async () => {
        logger.info(`[${tenantId}] Starting user-taxi reference fix...`);

        // Get all taxis for this tenant
        const taxis = await Taxi.find({}).select('_id users').lean();
        logger.info(`[${tenantId}] Found ${taxis.length} taxis`);

        let updatedUsers = 0;

        for (const taxi of taxis) {
          if (taxi.users && taxi.users.length > 0) {
            // Update each user to include this taxi in their taxis array
            const result = await User.updateMany({ _id: { $in: taxi.users } }, { $addToSet: { taxis: taxi._id } });

            if (result.modifiedCount > 0) {
              logger.info(`[${tenantId}] Updated ${result.modifiedCount} users for taxi ${taxi._id}`);
              updatedUsers += result.modifiedCount;
            }
          }
        }

        logger.info(`[${tenantId}] Completed! Total users updated: ${updatedUsers}`);
      });
    }

    logger.info('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
fixUserTaxiReferences();
