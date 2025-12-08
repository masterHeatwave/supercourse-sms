import Mood from './mood.model';
import { MoodVideo } from './mood.model';

import { requestContextLocalStorage } from '@config/asyncLocalStorage';

const seedTenantMoods = async (tenantId: string) => {
  await requestContextLocalStorage.run(tenantId, async () => {
    try {
      await Mood.find();
    } catch (error) {
      throw error;
    }
  });
};

const seedTenantMoodVideos = async (tenantId: string) => {
  await requestContextLocalStorage.run(tenantId, async () => {
    try {
      await MoodVideo.find();
    } catch (error) {
      throw error;
    }
  });
};

const seedMoods = async () => {
  await seedTenantMoods('supercourse');
  await seedTenantMoods('piedpiper');
  await seedTenantMoods('lexis-fls');
};

const seedMoodVideos = async () => {
  await seedTenantMoodVideos('supercourse');
  await seedTenantMoodVideos('piedpiper');
  await seedTenantMoodVideos('lexis-fls');
};

export { seedTenantMoods, seedTenantMoodVideos, seedMoodVideos };
export default seedMoods;
