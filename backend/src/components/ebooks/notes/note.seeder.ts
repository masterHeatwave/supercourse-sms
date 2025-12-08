import Note from '@components/ebooks/notes/note.model';
import { requestContextLocalStorage } from '@config/asyncLocalStorage';

const seedTenantEbookNotes = async (tenantId: string) => {
  await requestContextLocalStorage.run(tenantId, async () => {
    try {
      await Note.find({});
    } catch (error) {
      throw error;
    }
  });
};

const seedEbookNotes = async () => {
  await seedTenantEbookNotes('supercourse');
  await seedTenantEbookNotes('piedpiper');
};

export { seedTenantEbookNotes };
export default seedEbookNotes;
