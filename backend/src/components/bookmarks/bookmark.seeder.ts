import Bookmark from './bookmark.model';
import { requestContextLocalStorage } from '@config/asyncLocalStorage';

const seedTenantEbookBookmarks = async (tenantId: string) => {
  await requestContextLocalStorage.run(tenantId, async () => {
    try {
      await Bookmark.find({});
    } catch (error) {
      throw error;
    }
  });
};

const seedEbookBookmarks = async () => {
  await seedTenantEbookBookmarks('supercourse');
  await seedTenantEbookBookmarks('piedpiper');
};

export { seedTenantEbookBookmarks };
export default seedEbookBookmarks;
