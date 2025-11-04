import { logger } from '@utils/logger';
import Chance from 'chance';
import { requestContextLocalStorage } from '@config/asyncLocalStorage';
import Session from './session.model';
import Taxi from '@components/taxi/taxi.model';
import Classroom from '@components/classrooms/classroom.model';
import AcademicPeriod from '@components/academic/academic-periods.model';
import User from '@components/users/user.model';
import { markComponentComplete } from '@utils/seedingLogger';

const chance = new Chance();

const seedTenantSessions = async (tenantId: string) => {
  await requestContextLocalStorage.run(tenantId, async () => {
    try {
      const existingSessions = await Session.countDocuments();
      if (existingSessions > 0) {
        markComponentComplete('sessions', tenantId);
        return;
      }

      const taxis = await Taxi.find().limit(5);
      const classrooms = await Classroom.find().limit(5);
      const academicPeriod = await AcademicPeriod.findOne({ is_active: true });
      const teachers = await User.find({ user_type: 'teacher' }).limit(5);
      const students = await User.find({ user_type: 'student' }).limit(20);

      if (!taxis.length || !classrooms.length || !academicPeriod || !teachers.length || !students.length) {
        logger.warn(
          `[${tenantId}] Skipping session seeding: Required data (taxis, classrooms, academic period, users) not found. Ensure they are seeded for this tenant.`
        );

        markComponentComplete('sessions', tenantId);
        return;
      }

      for (let i = 0; i < 10; i++) {
        const startDate = new Date(chance.date({ year: 2024 }).toString());
        const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours later

        await Session.create({
          start_date: startDate,
          end_date: endDate,
          taxi: chance.pickone(taxis)._id,
          classroom: chance.pickone(classrooms)._id,
          students: chance.pickset(
            students.map((s) => s._id),
            chance.integer({ min: 5, max: 15 })
          ),
          teachers: chance.pickset(
            teachers.map((t) => t._id),
            chance.integer({ min: 1, max: 2 })
          ),
          academic_period: academicPeriod._id,
          is_recurring: chance.bool(),
          mode: chance.pickone(['in_person', 'online', 'hybrid']) as 'in_person' | 'online' | 'hybrid',
        });
      }
      markComponentComplete('sessions', tenantId);
    } catch (error) {
      logger.error(`[${tenantId}] Error seeding sessions:`, error);
      throw error;
    }
  });
};

const seedSessions = async () => {
  await seedTenantSessions('supercourse');
  await seedTenantSessions('piedpiper');
};

export { seedTenantSessions };
export default seedSessions;
