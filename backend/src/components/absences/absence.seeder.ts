import { logger } from '@utils/logger';
import Chance from 'chance';
import { requestContextLocalStorage } from '@config/asyncLocalStorage';
import Absence from './absence.model';
import { AbsenceStatus } from './absence.interface';
import Taxi from '@components/taxi/taxi.model';
import Session from '@components/sessions/session.model';
import User from '@components/users/user.model';
import AcademicPeriod from '@components/academic/academic-periods.model';
import { markComponentComplete } from '@utils/seedingLogger';

const chance = new Chance();

// Function to get a random date within the last 30 days
const getRandomRecentDate = () => {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  return new Date(thirtyDaysAgo.getTime() + Math.random() * (today.getTime() - thirtyDaysAgo.getTime()));
};

// Common absence reasons
const absenceReasons = [
  'Illness',
  'Family emergency',
  'Doctor appointment',
  'Transportation issue',
  'Weather conditions',
  'Personal reasons',
  'Travel',
  'Religious observance',
  'Sports event',
  'Overslept',
];

const seedTenantAbsences = async (tenantId: string) => {
  await requestContextLocalStorage.run(tenantId, async () => {
    try {
      const existingAbsences = await Absence.countDocuments();
      if (existingAbsences > 0) {
        markComponentComplete('absences', tenantId);
        return;
      }

      // Check if we have the necessary data to create absences
      const taxisCount = await Taxi.countDocuments();
      const sessionsCount = await Session.countDocuments();
      const studentsCount = await User.countDocuments({ user_type: 'student' });
      const academicPeriodsCount = await AcademicPeriod.countDocuments();

      if (taxisCount === 0 || sessionsCount === 0 || studentsCount === 0 || academicPeriodsCount === 0) {
        logger.warn(
          `[${tenantId}] Skipping absences seeding: Required data not found. Make sure taxis, sessions, students, and academic periods are seeded.`
        );
        markComponentComplete('absences', tenantId);
        return;
      }

      // Get all taxis
      const taxis = await Taxi.find();

      // For each taxi, create absences for some of its students
      for (const taxi of taxis) {
        // Get sessions for this taxi
        const sessions = await Session.find({ taxi: taxi._id });
        if (sessions.length === 0) continue;

        // Get students for this taxi
        const students = await User.find({
          _id: { $in: taxi.users },
          user_type: 'student',
        });
        if (students.length === 0) continue;

        // Get current academic period
        const academicPeriod = await AcademicPeriod.findOne().sort({ createdAt: -1 });
        if (!academicPeriod) continue;

        // Create 1-3 absences for each student
        for (const student of students) {
          const absencesCount = chance.integer({ min: 1, max: 3 });

          for (let i = 0; i < absencesCount; i++) {
            const randomSession = chance.pickone(sessions);
            const randomDate = getRandomRecentDate();
            const randomReason = chance.pickone(absenceReasons);
            const randomStatus = chance.pickone([
              AbsenceStatus.UNEXCUSED,
              AbsenceStatus.EXCUSED,
              AbsenceStatus.JUSTIFIED,
            ]);

            await Absence.create({
              session: randomSession._id,
              student: student._id,
              date: randomDate,
              reason: randomReason,
              status: randomStatus,
              taxi: taxi._id,
              academic_period: academicPeriod._id,
              notified_parent: chance.bool({ likelihood: 30 }),
              notification_date: chance.bool({ likelihood: 20 }) ? new Date() : undefined,
              note: chance.bool({ likelihood: 40 })
                ? chance.sentence({ words: chance.integer({ min: 5, max: 15 }) })
                : undefined,
            });
          }
        }
      }

      logger.info(`[${tenantId}] Absences seeded successfully`);
      markComponentComplete('absences', tenantId);
    } catch (error) {
      logger.error(`[${tenantId}] Error seeding absences:`, error);
      throw error;
    }
  });
};

const seedAbsences = async () => {
  await seedTenantAbsences('supercourse');
  await seedTenantAbsences('piedpiper');
};

export { seedTenantAbsences };
export default seedAbsences;
