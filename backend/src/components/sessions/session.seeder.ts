import { logger } from '@utils/logger';
import Chance from 'chance';
import { requestContextLocalStorage } from '@config/asyncLocalStorage';
import Session from './session.model';
import SessionRecurring from './session-recurring.model';
import Taxi from '@components/taxi/taxi.model';
import Classroom from '@components/classrooms/classroom.model';
import AcademicPeriod from '@components/academic/academic-periods.model';
import User from '@components/users/user.model';
import { markComponentComplete } from '@utils/seedingLogger';
import { RecurringSessionUtil } from './session-recurring.util';
import { DayOfWeek } from './session.interface';

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

      const daysOfWeek: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

      // Create 10 sessions: 5 non-recurring and 5 recurring
      for (let i = 0; i < 10; i++) {
        const isRecurring = i >= 5; // First 5 are non-recurring, last 5 are recurring
        const taxi = chance.pickone(taxis);
        const classroom = chance.pickone(classrooms);
        const selectedStudents = chance.pickset(
          students.map((s) => s._id),
          chance.integer({ min: 5, max: 15 })
        );
        const selectedTeachers = chance.pickset(
          teachers.map((t) => t._id),
          chance.integer({ min: 1, max: 2 })
        );
        const mode = chance.pickone(['in_person', 'online', 'hybrid']) as 'in_person' | 'online' | 'hybrid';

        if (!isRecurring) {
          // Non-recurring session
          const startDate = new Date(chance.date({ year: 2024 }).toString());
          const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours later

          await Session.create({
            start_date: startDate,
            end_date: endDate,
            taxi: taxi._id,
            classroom: classroom._id,
            students: selectedStudents,
            teachers: selectedTeachers,
            academic_period: academicPeriod._id,
            is_recurring: false,
            mode,
          });
        } else {
          // Recurring session
          const day = chance.pickone(daysOfWeek);
          const startTime = chance.pickone(['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']);
          const duration = chance.pickone([1, 1.5, 2, 2.5, 3]);
          const frequency = chance.pickone([1, 2]); // Every week or every 2 weeks

          // Create a date range for the recurring session
          const startDate = new Date(academicPeriod.start_date);
          const endDate = new Date(academicPeriod.end_date);

          try {
            // Validate the recurring session
            const validation = RecurringSessionUtil.validateRecurringSession(
              day,
              startDate,
              endDate,
              frequency,
              startTime,
              duration
            );

            if (validation.isValid) {
              // Create the main recurring session
              const mainSession = await Session.create({
                start_date: startDate,
                end_date: endDate,
                taxi: taxi._id,
                classroom: classroom._id,
                students: selectedStudents,
                teachers: selectedTeachers,
                academic_period: academicPeriod._id,
                is_recurring: true,
                mode,
                day,
                start_time: startTime,
                duration,
                frequency,
              });

              // Generate and create recurring instances
              const instances = RecurringSessionUtil.generateSessionInstances(
                day,
                startDate,
                endDate,
                frequency,
                startTime,
                duration
              );

              const recurringInstances = instances.map((instance) => ({
                parent_session: mainSession._id,
                start_date: instance.start_date,
                end_date: instance.end_date,
                instance_number: instance.instance_number,
                taxi: taxi._id,
                classroom: classroom._id,
                students: selectedStudents,
                teachers: selectedTeachers,
                academic_period: academicPeriod._id,
                mode,
                day,
                start_time: startTime,
                duration,
                frequency,
              }));

              await SessionRecurring.insertMany(recurringInstances);

              logger.info(`[${tenantId}] Created recurring session with ${instances.length} instances on ${day}s`);
            } else {
              logger.warn(`[${tenantId}] Skipping invalid recurring session: ${validation.error}`);
            }
          } catch (error) {
            logger.warn(`[${tenantId}] Error creating recurring session:`, error);
            // Continue with next session
          }
        }
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
};

export { seedTenantSessions };
export default seedSessions;
