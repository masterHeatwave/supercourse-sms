import { ErrorResponse } from '@utils/errorResponse';
import { StatusCodes } from 'http-status-codes';
import SessionSchema from './session.model';
import SessionRecurring from './session-recurring.model';
import {
  ISessionCreateDTO,
  ISessionUpdateDTO,
  IBulkSessionCreateDTO,
  IBulkSessionUpdateDTO,
  IOverlapValidationResult,
  IOverlapConflict,
  DayOfWeek,
} from './session.interface';
import { ISessionRecurringCreateDTO } from './session-recurring.interface';
import { RecurringSessionUtil } from './session-recurring.util';
import TaxiSchema from '@components/taxi/taxi.model';
import ClassroomSchema from '@components/classrooms/classroom.model';
import AcademicPeriodSchema from '@components/academic/academic-periods.model';
import AcademicSubperiodSchema from '@components/academic/academic-subperiods.model';
import UserSchema from '@components/users/user.model';
import Taxi from '@components/taxi/taxi.model';
import Classroom from '@components/classrooms/classroom.model';
import AcademicPeriod from '@components/academic/academic-periods.model';
import AcademicSubperiod from '@components/academic/academic-subperiods.model';
import User from '@components/users/user.model';
import Absence from '@components/absences/absence.model';
import { IAdvancedResultsOptions } from '@plugins/advancedResults.interface';
import jwt from 'jsonwebtoken';
import { config } from '@config/config';
import { IUser } from '@components/users/user.interface';
import { Types } from 'mongoose';

export class SessionService {
  // Helper method to determine if a session should be recurring
  private determineIsRecurring(sessionData: ISessionCreateDTO): boolean {
    return (
      sessionData.is_recurring === true ||
      (sessionData.is_recurring !== false &&
        !!(sessionData.day && sessionData.frequency && sessionData.start_time && sessionData.duration))
    );
  }

  // Validate overlaps for sessions (including recurring instances)
  private async validateOverlaps(
    sessionsToCheck: Array<{
      start_date: Date;
      end_date: Date;
      taxi: string;
      classroom?: string; // Optional - can be used with any mode
      students?: string[];
      teachers?: string[];
    }>,
    allowOverlap = false,
    excludeSessionIds: string[] = [],
    excludeRecurringIds: string[] = []
  ): Promise<IOverlapValidationResult> {
    const conflicts: IOverlapConflict[] = [];
    const warnings: string[] = [];

    // Check overlaps within the same request (between new sessions)
    for (let i = 0; i < sessionsToCheck.length; i++) {
      for (let j = i + 1; j < sessionsToCheck.length; j++) {
        const session1 = sessionsToCheck[i];
        const session2 = sessionsToCheck[j];

        if (this.sessionsOverlap(session1, session2)) {
          const overlapConflict = this.createOverlapConflict(session1, session2, i, j);
          if (allowOverlap) {
            warnings.push(`Potential overlap at ${overlapConflict.conflictTime.start.toISOString()}`);
          } else {
            conflicts.push(overlapConflict);
          }
        }
      }
    }

    // Check overlaps with existing sessions in database (both main sessions and recurring instances)
    for (let i = 0; i < sessionsToCheck.length; i++) {
      const session = sessionsToCheck[i];
      const existingConflicts = await this.checkDatabaseOverlaps(session, excludeSessionIds, excludeRecurringIds);

      if (allowOverlap) {
        warnings.push(...existingConflicts.map((c) => c.message));
      } else {
        conflicts.push(...existingConflicts.map((c) => ({ ...c, sessionIndex: i })));
      }
    }

    return {
      hasOverlap: conflicts.length > 0,
      conflicts,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  // Check if two sessions overlap
  private sessionsOverlap(
    session1: {
      start_date: Date;
      end_date: Date;
      taxi: string;
      classroom?: string;
      students?: string[];
      teachers?: string[];
    },
    session2: {
      start_date: Date;
      end_date: Date;
      taxi: string;
      classroom?: string;
      students?: string[];
      teachers?: string[];
    }
  ): boolean {
    const start1 = session1.start_date.getTime();
    const end1 = session1.end_date.getTime();
    const start2 = session2.start_date.getTime();
    const end2 = session2.end_date.getTime();

    // Overlaps if: start1 < end2 && end1 > start2
    const hasTimeOverlap = start1 < end2 && end1 > start2;

    if (!hasTimeOverlap) return false;

    // Check for shared resources
    const sharedTaxi = session1.taxi === session2.taxi;
    // Only consider classroom overlap if BOTH sessions have a classroom assigned
    const sharedClassroom = session1.classroom && session2.classroom && session1.classroom === session2.classroom;
    const sharedStudents = this.hasSharedArray(session1.students, session2.students);
    const sharedTeachers = this.hasSharedArray(session1.teachers, session2.teachers);

    return (sharedTaxi && sharedClassroom) || sharedStudents || sharedTeachers;
  }

  // Check for shared elements in arrays
  private hasSharedArray(arr1: string[] | undefined, arr2: string[] | undefined): boolean {
    if (!arr1 || !arr2 || arr1.length === 0 || arr2.length === 0) return false;
    return arr1.some((item) => arr2.includes(item));
  }

  // Create overlap conflict object
  private createOverlapConflict(
    session1: {
      start_date: Date;
      end_date: Date;
      taxi: string;
      classroom?: string;
      students?: string[];
      teachers?: string[];
    },
    session2: {
      start_date: Date;
      end_date: Date;
      taxi: string;
      classroom?: string;
      students?: string[];
      teachers?: string[];
    },
    index1: number,
    index2: number
  ): IOverlapConflict {
    const overlapStart = new Date(Math.max(session1.start_date.getTime(), session2.start_date.getTime()));
    const overlapEnd = new Date(Math.min(session1.end_date.getTime(), session2.end_date.getTime()));

    let conflictType: 'taxi' | 'classroom' | 'students' | 'teachers' = 'taxi';
    let overlappingResource = session1.taxi;

    if (session1.taxi === session2.taxi && session1.classroom === session2.classroom) {
      conflictType = 'taxi';
      overlappingResource = session1.taxi;
    } else if (session1.classroom && session1.classroom === session2.classroom) {
      conflictType = 'classroom';
      overlappingResource = session1.classroom;
    } else if (this.hasSharedArray(session1.students, session2.students)) {
      conflictType = 'students';
      overlappingResource = session1.students?.[0] || 'shared students';
    } else if (this.hasSharedArray(session1.teachers, session2.teachers)) {
      conflictType = 'teachers';
      overlappingResource = session1.teachers?.[0] || 'shared teachers';
    }

    return {
      sessionIndex: index1,
      conflictType,
      overlappingResource,
      conflictTime: { start: overlapStart, end: overlapEnd },
      message: `Sessions overlap in request at instances ${index1 + 1} and ${index2 + 1} (${conflictType}: ${overlappingResource})`,
    };
  }

  // Check database for overlapping sessions (both main sessions and recurring instances)
  private async checkDatabaseOverlaps(
    session: {
      start_date: Date;
      end_date: Date;
      taxi: string;
      classroom?: string;
      students?: string[];
      teachers?: string[];
    },
    excludeSessionIds: string[] = [],
    excludeRecurringIds: string[] = []
  ): Promise<IOverlapConflict[]> {
    const conflicts: IOverlapConflict[] = [];

    // Build OR conditions for overlap detection
    // Only check classroom overlap if the session actually has a classroom assigned
    const orConditions: any[] = [
      { taxi: session.taxi, students: { $in: session.students || [] } },
      { students: { $in: session.students || [] } },
      { teachers: { $in: session.teachers || [] } },
    ];

    // Only check classroom overlap if this session has a classroom assigned
    if (session.classroom) {
      orConditions.push({ taxi: session.taxi, classroom: session.classroom });
      orConditions.push({ classroom: session.classroom, teachers: { $in: session.teachers || [] } });
    }

    const baseQuery: any = {
      $and: [
        { $or: orConditions },
        {
          start_date: { $lt: session.end_date },
          end_date: { $gt: session.start_date },
        },
      ],
    };

    // Check main sessions (non-recurring)
    const mainSessionQuery = { ...baseQuery, is_recurring: false };
    if (excludeSessionIds.length > 0) {
      mainSessionQuery._id = { $nin: excludeSessionIds };
    }

    const existingSessions = await SessionSchema.find(mainSessionQuery);

    for (const existing of existingSessions) {
      const overlapStart = new Date(Math.max(session.start_date.getTime(), existing.start_date.getTime()));
      const overlapEnd = new Date(Math.min(session.end_date.getTime(), existing.end_date.getTime()));

      let conflictType: 'taxi' | 'classroom' | 'students' | 'teachers' = 'taxi';
      let resourceId = session.taxi;

      // Determine the type of conflict
      const existingTaxi = existing.taxi.toString();
      const existingClassroom = existing.classroom?.toString();

      // Check if both have the same classroom assigned (both must have a classroom)
      if (session.classroom && existingClassroom && existingClassroom === session.classroom) {
        conflictType = 'classroom';
        resourceId = session.classroom;
      } else if (existingTaxi === session.taxi) {
        // Only check taxi conflict if they don't share classroom
        conflictType = 'taxi';
        resourceId = session.taxi;
      }

      conflicts.push({
        existingSessionId: existing._id.toString(),
        conflictType,
        overlappingResource: resourceId,
        conflictTime: { start: overlapStart, end: overlapEnd },
        message: `Session overlaps with existing session in ${conflictType}: ${resourceId}`,
      });
    }

    // Check recurring session instances
    // Build OR conditions for overlap detection (same logic as above)
    const recurringOrConditions: any[] = [
      { taxi: session.taxi, students: { $in: session.students || [] } },
      { students: { $in: session.students || [] } },
      { teachers: { $in: session.teachers || [] } },
    ];

    // Only check classroom overlap if this session has a classroom assigned
    if (session.classroom) {
      recurringOrConditions.push({ taxi: session.taxi, classroom: session.classroom });
      recurringOrConditions.push({ classroom: session.classroom, teachers: { $in: session.teachers || [] } });
    }

    const recurringQuery: any = {
      $and: [
        { $or: recurringOrConditions },
        {
          start_date: { $lt: session.end_date },
          end_date: { $gt: session.start_date },
        },
      ],
    };

    if (excludeRecurringIds.length > 0) {
      recurringQuery._id = { $nin: excludeRecurringIds };
    }

    const existingRecurringSessions = await SessionRecurring.find(recurringQuery);

    for (const existing of existingRecurringSessions) {
      const overlapStart = new Date(Math.max(session.start_date.getTime(), existing.start_date.getTime()));
      const overlapEnd = new Date(Math.min(session.end_date.getTime(), existing.end_date.getTime()));

      let conflictType: 'taxi' | 'classroom' | 'students' | 'teachers' = 'taxi';
      let resourceId = session.taxi;

      // Determine the type of conflict
      const existingTaxi = existing.taxi.toString();
      const existingClassroom = existing.classroom?.toString();

      // Check if both have the same classroom assigned (both must have a classroom)
      if (session.classroom && existingClassroom && existingClassroom === session.classroom) {
        conflictType = 'classroom';
        resourceId = session.classroom;
      } else if (existingTaxi === session.taxi) {
        // Only check taxi conflict if they don't share classroom
        conflictType = 'taxi';
        resourceId = session.taxi;
      }

      conflicts.push({
        existingSessionId: existing._id.toString(),
        conflictType,
        overlappingResource: resourceId,
        conflictTime: { start: overlapStart, end: overlapEnd },
        message: `Session overlaps with existing recurring session instance in ${conflictType}: ${resourceId}`,
      });
    }

    return conflicts;
  }

  async getAllSessions(
    filters: IAdvancedResultsOptions & {
      taxi?: string;
      classroom?: string;
      academic_period?: string;
      academic_subperiod?: string;
      teacher?: string;
      student?: string;
      teacherId?: string; // New parameter for teacher scoping
      studentId?: string; // New parameter for student scoping
      from_date?: string;
      to_date?: string;
      is_recurring?: string;
      mode?: 'in_person' | 'online' | 'hybrid';
      branch?: string;
      include_instances?: string; // 'true' to include recurring instances, 'only' for only instances
    } = {}
  ) {
    const overrides: Record<string, unknown> = {};

    if (filters.taxi) {
      overrides.taxi = filters.taxi;
    }
    if (filters.classroom) {
      overrides.classroom = filters.classroom;
    }
    if (filters.academic_period) {
      overrides.academic_period = filters.academic_period;
    }
    if (filters.academic_subperiod) {
      overrides.academic_subperiod = filters.academic_subperiod;
    }
    if (filters.teacher) {
      overrides.teachers = filters.teacher;
    }
    if (filters.student) {
      overrides.students = filters.student;
    }
    if (filters.teacherId) {
      overrides.teachers = filters.teacherId;
    }
    if (filters.studentId) {
      overrides.students = filters.studentId;
    }

    if (filters.from_date) {
      const fromDate = new Date(filters.from_date);
      if (!isNaN(fromDate.getTime())) {
        overrides.start_date = { ...(overrides.start_date as any), $gte: fromDate };
      }
    }

    if (filters.to_date) {
      const toDate = new Date(filters.to_date);
      if (!isNaN(toDate.getTime())) {
        overrides.end_date = { ...(overrides.end_date as any), $lte: toDate };
      }
    }

    if (filters.is_recurring === 'true') {
      overrides.is_recurring = true;
    } else if (filters.is_recurring === 'false') {
      overrides.is_recurring = false;
    }

    if (filters.mode) {
      overrides.mode = filters.mode;
    }

    // Handle branch filter - filter sessions by taxi's branch
    if (filters.branch && filters.branch.trim() !== '') {
      try {
        // Find taxis that belong to the specified branch
        const taxisInBranch = await Taxi.find({ branch: filters.branch }).select('_id');
        const taxiIds = taxisInBranch.map((taxi) => taxi._id);

        if (taxiIds.length === 0) {
          // If no taxis found in the branch, return empty results
          overrides.taxi = { $in: [] };
        } else {
          // Filter sessions to only include those with taxis in the specified branch
          overrides.taxi = { $in: taxiIds };
        }
      } catch (error) {
        console.error('Error filtering by branch:', error);
        // If there's an error, don't apply the branch filter
      }
    }

    const includeInstances = filters.include_instances ?? 'only'; // Default to only recurring instances

    // Case 1: Only recurring instances (default behavior)
    if (includeInstances === 'only') {
      return await SessionRecurring.advancedResults({
        page: filters.page,
        limit: filters.limit,
        sort: filters.sort ?? 'start_date',
        select: filters.select,
        populate: [
          { path: 'parent_session', model: SessionSchema },
          { path: 'taxi', model: Taxi },
          { path: 'classroom', model: Classroom },
          { path: 'academic_period', model: AcademicPeriod },
          { path: 'academic_subperiod', model: AcademicSubperiod },
          { path: 'students', model: User },
          { path: 'teachers', model: User },
          {
            path: 'absences',
            model: Absence,
            populate: { path: 'student', model: User },
          },
        ],
        overrides,
      });
    }

    // Case 2: Both main sessions and recurring instances (merged)
    if (includeInstances === 'true') {
      // Get main sessions
      const mainSessions = await SessionSchema.advancedResults({
        page: filters.page,
        limit: filters.limit,
        sort: filters.sort ?? 'start_date',
        select: filters.select,
        populate: [
          { path: 'taxi', model: Taxi },
          { path: 'classroom', model: Classroom },
          { path: 'academic_period', model: AcademicPeriod },
          { path: 'academic_subperiod', model: AcademicSubperiod },
          { path: 'students', model: User },
          { path: 'teachers', model: User },
          {
            path: 'absences',
            model: Absence,
            populate: { path: 'student', model: User },
          },
        ],
        overrides,
      });

      // Get recurring instances
      const recurringInstances = await SessionRecurring.advancedResults({
        page: filters.page,
        limit: filters.limit,
        sort: filters.sort ?? 'start_date',
        select: filters.select,
        populate: [
          { path: 'parent_session', model: SessionSchema },
          { path: 'taxi', model: Taxi },
          { path: 'classroom', model: Classroom },
          { path: 'academic_period', model: AcademicPeriod },
          { path: 'academic_subperiod', model: AcademicSubperiod },
          { path: 'students', model: User },
          { path: 'teachers', model: User },
          {
            path: 'absences',
            model: Absence,
            populate: { path: 'student', model: User },
          },
        ],
        overrides,
      });

      // Merge results
      return {
        ...mainSessions,
        results: [...(mainSessions.results || []), ...(recurringInstances.results || [])],
        totalResults: (mainSessions.totalResults || 0) + (recurringInstances.totalResults || 0),
      };
    }

    // Case 3: Default - only main sessions
    return await SessionSchema.advancedResults({
      page: filters.page,
      limit: filters.limit,
      sort: filters.sort ?? 'start_date',
      select: filters.select,
      populate: [
        { path: 'taxi', model: Taxi },
        { path: 'classroom', model: Classroom },
        { path: 'academic_period', model: AcademicPeriod },
        { path: 'academic_subperiod', model: AcademicSubperiod },
        { path: 'students', model: User },
        { path: 'teachers', model: User },
        {
          path: 'absences',
          model: Absence,
          populate: { path: 'student', model: User },
        },
      ],
      overrides,
    });
  }

  async getSessionById(id: string, includeInstances: boolean = false) {
    // Try to find in main Session collection first
    let session = await SessionSchema.findById(id)
      .populate({
        path: 'taxi',
        select: 'name color branch subject level',
        model: Taxi,
      })
      .populate({
        path: 'classroom',
        select: 'name location capacity',
        model: Classroom,
      })
      .populate({
        path: 'academic_period',
        select: 'name start_date end_date',
        model: AcademicPeriod,
      })
      .populate({
        path: 'academic_subperiod',
        select: 'name start_date end_date',
        model: AcademicSubperiod,
      })
      .populate({
        path: 'students',
        select: 'name email phone firstname lastname',
        model: User,
      })
      .populate({
        path: 'teachers',
        select: 'name email phone firstname lastname position',
        model: User,
      })
      .populate({
        path: 'absences',
        model: Absence,
        select: 'student date status reason justification_document note notified_parent',
        populate: {
          path: 'student',
          select: 'name firstname lastname email phone',
          model: User,
        },
      });

    // If not found in main collection, try SessionRecurring collection
    if (!session) {
      const recurringSession = await SessionRecurring.findById(id)
        .populate({
          path: 'parent_session',
          model: SessionSchema,
        })
        .populate({
          path: 'taxi',
          select: 'name color branch subject level',
          model: Taxi,
        })
        .populate({
          path: 'classroom',
          select: 'name location capacity',
          model: Classroom,
        })
        .populate({
          path: 'academic_period',
          select: 'name start_date end_date',
          model: AcademicPeriod,
        })
        .populate({
          path: 'academic_subperiod',
          select: 'name start_date end_date',
          model: AcademicSubperiod,
        })
        .populate({
          path: 'students',
          select: 'name email phone firstname lastname',
          model: User,
        })
        .populate({
          path: 'teachers',
          select: 'name email phone firstname lastname position',
          model: User,
        })
        .populate({
          path: 'absences',
          model: Absence,
          select: 'student date status reason justification_document note notified_parent',
          populate: {
            path: 'student',
            select: 'name firstname lastname email phone',
            model: User,
          },
        });

      if (!recurringSession) {
        throw new ErrorResponse('Session not found', StatusCodes.NOT_FOUND);
      }

      return recurringSession;
    }

    // If it's a recurring session and includeInstances is true, fetch all instances
    if (session.is_recurring && includeInstances) {
      const instances = await SessionRecurring.find({ parent_session: id })
        .populate({
          path: 'taxi',
          select: 'name color branch subject level',
          model: Taxi,
        })
        .populate({
          path: 'classroom',
          select: 'name location capacity',
          model: Classroom,
        })
        .populate({
          path: 'academic_period',
          select: 'name start_date end_date',
          model: AcademicPeriod,
        })
        .populate({
          path: 'academic_subperiod',
          select: 'name start_date end_date',
          model: AcademicSubperiod,
        })
        .populate({
          path: 'students',
          select: 'name email phone firstname lastname',
          model: User,
        })
        .populate({
          path: 'teachers',
          select: 'name email phone firstname lastname position',
          model: User,
        })
        .populate({
          path: 'absences',
          model: Absence,
          select: 'student date status reason justification_document note notified_parent',
          populate: {
            path: 'student',
            select: 'name firstname lastname email phone',
            model: User,
          },
        })
        .sort('start_date');

      return {
        ...session.toJSON(),
        instances,
        totalInstances: instances.length,
      };
    }

    return session;
  }

  async createSession(sessionData: ISessionCreateDTO, allowOverlap = false) {
    await this.validateSessionReferences(sessionData);

    // Filter out empty optional fields
    const cleanSessionData = { ...sessionData };
    if (cleanSessionData.academic_subperiod && cleanSessionData.academic_subperiod.trim() === '') {
      delete cleanSessionData.academic_subperiod;
    }
    // Remove empty classroom field
    if (cleanSessionData.classroom && cleanSessionData.classroom.trim() === '') {
      delete cleanSessionData.classroom;
    }

    // Determine if recurring
    const isRecurring = this.determineIsRecurring(cleanSessionData);

    // Set is_recurring explicitly
    cleanSessionData.is_recurring = isRecurring;

    // For non-recurring sessions, validate and create single session
    if (!isRecurring) {
      // If start_time and duration provided, compute end_date
      if (cleanSessionData.start_time && cleanSessionData.duration) {
        const [hours, minutes] = cleanSessionData.start_time.split(':').map(Number);
        const startDate = new Date(cleanSessionData.start_date);
        startDate.setHours(hours, minutes, 0, 0);

        const endDate = new Date(startDate);
        endDate.setTime(endDate.getTime() + cleanSessionData.duration * 60 * 60 * 1000);

        cleanSessionData.start_date = startDate;
        cleanSessionData.end_date = endDate;
      }

      // Validate duration
      const durationMs = cleanSessionData.end_date.getTime() - cleanSessionData.start_date.getTime();
      const durationHours = durationMs / (1000 * 60 * 60);
      if (durationHours < 0.5) {
        throw new ErrorResponse('Duration must be at least 0.5 hours', StatusCodes.BAD_REQUEST);
      }

      // Validate overlaps for the single session
      const overlapValidation = await this.validateOverlaps([cleanSessionData], allowOverlap);

      if (overlapValidation.hasOverlap && !allowOverlap) {
        const errorMessage = overlapValidation.conflicts.map((c) => c.message).join('; ');
        throw new ErrorResponse(`Session overlaps detected: ${errorMessage}`, StatusCodes.BAD_REQUEST);
      }

      // Create the session
      const session = await SessionSchema.create(cleanSessionData);
      const populatedSession = await this.getSessionById(session._id);

      return {
        session: populatedSession,
        isRecurring: false,
        warnings: overlapValidation.warnings,
      };
    }

    // For recurring sessions
    if (
      !cleanSessionData.day ||
      !cleanSessionData.frequency ||
      !cleanSessionData.start_time ||
      !cleanSessionData.duration
    ) {
      throw new ErrorResponse(
        'Day, frequency, start_time, and duration are required for recurring sessions',
        StatusCodes.BAD_REQUEST
      );
    }

    // Validate recurring session
    const validation = RecurringSessionUtil.validateRecurringSession(
      cleanSessionData.day,
      cleanSessionData.start_date,
      cleanSessionData.end_date,
      cleanSessionData.frequency,
      cleanSessionData.start_time,
      cleanSessionData.duration
    );

    if (!validation.isValid) {
      throw new ErrorResponse(validation.error!, StatusCodes.BAD_REQUEST);
    }

    // Generate recurring session instances
    const instances = RecurringSessionUtil.generateSessionInstances(
      cleanSessionData.day,
      cleanSessionData.start_date,
      cleanSessionData.end_date,
      cleanSessionData.frequency,
      cleanSessionData.start_time,
      cleanSessionData.duration
    );

    // Prepare instances for overlap validation
    const instancesToValidate = instances.map((instance) => ({
      start_date: instance.start_date,
      end_date: instance.end_date,
      taxi: cleanSessionData.taxi,
      classroom: cleanSessionData.classroom,
      students: cleanSessionData.students,
      teachers: cleanSessionData.teachers,
    }));

    // Validate overlaps for all instances
    const overlapValidation = await this.validateOverlaps(instancesToValidate, allowOverlap);

    if (overlapValidation.hasOverlap && !allowOverlap) {
      const errorMessage = overlapValidation.conflicts.map((c) => c.message).join('; ');
      throw new ErrorResponse(`Session overlaps detected: ${errorMessage}`, StatusCodes.BAD_REQUEST);
    }

    // Create the main recurring session (with the original date range)
    const mainSession = await SessionSchema.create(cleanSessionData);

    // Create recurring session instances in SessionRecurring collection
    const recurringInstances: ISessionRecurringCreateDTO[] = instances.map((instance) => ({
      parent_session: mainSession._id.toString(),
      start_date: instance.start_date,
      end_date: instance.end_date,
      instance_number: instance.instance_number,
      taxi: cleanSessionData.taxi,
      classroom: cleanSessionData.classroom,
      students: cleanSessionData.students || [],
      teachers: cleanSessionData.teachers || [],
      academic_period: cleanSessionData.academic_period,
      academic_subperiod: cleanSessionData.academic_subperiod,
      room: cleanSessionData.room,
      color: cleanSessionData.color,
      notes: cleanSessionData.notes,
      invite_participants: cleanSessionData.invite_participants,
      mode: cleanSessionData.mode,
      day: cleanSessionData.day,
      start_time: cleanSessionData.start_time,
      duration: cleanSessionData.duration,
      frequency: cleanSessionData.frequency,
    }));

    await SessionRecurring.insertMany(recurringInstances);

    const populatedSession = await this.getSessionById(mainSession._id, true);

    return {
      session: populatedSession,
      isRecurring: true,
      totalInstances: instances.length,
      warnings: overlapValidation.warnings,
    };
  }

  async createBulkSessions(bulkData: IBulkSessionCreateDTO) {
    const { sessions, allowOverlap = false } = bulkData;

    // Validate all session references first
    for (const sessionData of sessions) {
      await this.validateSessionReferences(sessionData);
    }

    const results = [];
    let totalCreated = 0;
    let totalInstances = 0;

    for (const sessionData of sessions) {
      try {
        const result = await this.createSession(sessionData, allowOverlap);
        results.push({
          success: true,
          session: result.session,
          isRecurring: result.isRecurring,
          totalInstances: result.totalInstances,
        });
        totalCreated++;
        if (result.isRecurring && result.totalInstances) {
          totalInstances += result.totalInstances;
        }
      } catch (error: any) {
        results.push({
          success: false,
          error: error.message,
        });
      }
    }

    return {
      results,
      totalCreated,
      totalInstances,
    };
  }

  async updateBulkSessions(bulkData: IBulkSessionUpdateDTO) {
    const { sessions, allowOverlap = false } = bulkData;

    const results = [];

    for (const sessionUpdate of sessions) {
      try {
        const updatedSession = await this.updateSession(sessionUpdate.id, sessionUpdate, allowOverlap);
        results.push({
          id: sessionUpdate.id,
          success: true,
          session: updatedSession,
        });
      } catch (error: any) {
        results.push({
          id: sessionUpdate.id,
          success: false,
          error: error.message,
        });
      }
    }

    return {
      results,
      totalProcessed: sessions.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    };
  }

  async updateSession(id: string, sessionData: ISessionUpdateDTO, allowOverlap = false) {
    let session = await SessionSchema.findById(id);

    // If not found in main collection, check if it's a recurring instance
    if (!session) {
      const recurringInstance = await SessionRecurring.findById(id);

      if (!recurringInstance) {
        throw new ErrorResponse('Session not found', StatusCodes.NOT_FOUND);
      }

      // Update only this recurring instance
      const updatedInstance = await SessionRecurring.findByIdAndUpdate(id, sessionData, {
        new: true,
        runValidators: true,
      });

      return await this.getSessionById(id);
    }

    // Filter out empty optional fields
    const cleanSessionData = { ...sessionData };
    if (cleanSessionData.academic_subperiod && cleanSessionData.academic_subperiod.trim() === '') {
      delete cleanSessionData.academic_subperiod;
    }
    // Remove empty classroom field
    if (cleanSessionData.classroom && cleanSessionData.classroom.trim() === '') {
      delete cleanSessionData.classroom;
    }

    // Validate references if they're being updated
    if (
      cleanSessionData.taxi ||
      cleanSessionData.classroom ||
      cleanSessionData.academic_period ||
      cleanSessionData.academic_subperiod
    ) {
      // Classroom is always optional - validate only if provided
      await this.validateSessionReferences({
        taxi: cleanSessionData.taxi || session.taxi.toString(),
        classroom: cleanSessionData.classroom || session.classroom?.toString(),
        academic_period: cleanSessionData.academic_period || session.academic_period.toString(),
        academic_subperiod: cleanSessionData.academic_subperiod || session.academic_subperiod?.toString(),
        students: cleanSessionData.students || [],
        teachers: cleanSessionData.teachers || [],
        mode: cleanSessionData.mode || session.mode,
      });
    }

    const wasRecurring = session.is_recurring;

    // Determine if the updated session should be recurring
    const mergedData = { ...session.toObject(), ...cleanSessionData };
    const willBeRecurring =
      cleanSessionData.is_recurring === true ||
      (cleanSessionData.is_recurring !== false &&
        !!(mergedData.day && mergedData.frequency && mergedData.start_time && mergedData.duration));

    // Case 1: Non-recurring to non-recurring (simple update)
    if (!wasRecurring && !willBeRecurring) {
      const overlapValidation = await this.validateOverlaps([{ ...mergedData }], allowOverlap, [id]);

      if (overlapValidation.hasOverlap && !allowOverlap) {
        const errorMessage = overlapValidation.conflicts.map((c) => c.message).join('; ');
        throw new ErrorResponse(`Session overlaps detected: ${errorMessage}`, StatusCodes.BAD_REQUEST);
      }

      session = await SessionSchema.findByIdAndUpdate(id, cleanSessionData, {
        new: true,
        runValidators: true,
      });

      return await this.getSessionById(id);
    }

    // Case 2: Non-recurring to recurring
    if (!wasRecurring && willBeRecurring) {
      if (!mergedData.day || !mergedData.frequency || !mergedData.start_time || !mergedData.duration) {
        throw new ErrorResponse(
          'Day, frequency, start_time, and duration are required for recurring sessions',
          StatusCodes.BAD_REQUEST
        );
      }

      // Validate recurring session
      const validation = RecurringSessionUtil.validateRecurringSession(
        mergedData.day,
        mergedData.start_date,
        mergedData.end_date,
        mergedData.frequency,
        mergedData.start_time,
        mergedData.duration
      );

      if (!validation.isValid) {
        throw new ErrorResponse(validation.error!, StatusCodes.BAD_REQUEST);
      }

      // Generate instances
      const instances = RecurringSessionUtil.generateSessionInstances(
        mergedData.day,
        mergedData.start_date,
        mergedData.end_date,
        mergedData.frequency,
        mergedData.start_time,
        mergedData.duration
      );

      const instancesToValidate = instances.map((instance) => ({
        start_date: instance.start_date,
        end_date: instance.end_date,
        taxi: mergedData.taxi,
        classroom: mergedData.classroom,
        students: mergedData.students,
        teachers: mergedData.teachers,
      }));

      const overlapValidation = await this.validateOverlaps(instancesToValidate, allowOverlap, [id]);

      if (overlapValidation.hasOverlap && !allowOverlap) {
        const errorMessage = overlapValidation.conflicts.map((c) => c.message).join('; ');
        throw new ErrorResponse(`Session overlaps detected: ${errorMessage}`, StatusCodes.BAD_REQUEST);
      }

      // Update main session to recurring
      cleanSessionData.is_recurring = true;
      session = await SessionSchema.findByIdAndUpdate(id, cleanSessionData, {
        new: true,
        runValidators: true,
      });

      // Create recurring instances
      const recurringInstances: ISessionRecurringCreateDTO[] = instances.map((instance) => ({
        parent_session: id,
        start_date: instance.start_date,
        end_date: instance.end_date,
        instance_number: instance.instance_number,
        taxi: mergedData.taxi,
        classroom: mergedData.classroom,
        students: mergedData.students || [],
        teachers: mergedData.teachers || [],
        academic_period: mergedData.academic_period,
        academic_subperiod: mergedData.academic_subperiod,
        room: mergedData.room,
        color: mergedData.color,
        notes: mergedData.notes,
        invite_participants: mergedData.invite_participants,
        mode: mergedData.mode,
        day: mergedData.day,
        start_time: mergedData.start_time,
        duration: mergedData.duration,
        frequency: mergedData.frequency,
      }));

      await SessionRecurring.insertMany(recurringInstances);

      return await this.getSessionById(id, true);
    }

    // Case 3: Recurring to non-recurring
    if (wasRecurring && !willBeRecurring) {
      // Delete all recurring instances
      await SessionRecurring.deleteMany({ parent_session: id });

      // Update main session
      cleanSessionData.is_recurring = false;
      // Clear recurring fields
      cleanSessionData.day = undefined;
      cleanSessionData.frequency = undefined;
      cleanSessionData.start_time = undefined;
      cleanSessionData.duration = undefined;

      const overlapValidation = await this.validateOverlaps([{ ...mergedData, ...cleanSessionData }], allowOverlap, [
        id,
      ]);

      if (overlapValidation.hasOverlap && !allowOverlap) {
        const errorMessage = overlapValidation.conflicts.map((c) => c.message).join('; ');
        throw new ErrorResponse(`Session overlaps detected: ${errorMessage}`, StatusCodes.BAD_REQUEST);
      }

      session = await SessionSchema.findByIdAndUpdate(id, cleanSessionData, {
        new: true,
        runValidators: true,
      });

      return await this.getSessionById(id);
    }

    // Case 4: Recurring to recurring (update and regenerate instances)
    if (wasRecurring && willBeRecurring) {
      if (!mergedData.day || !mergedData.frequency || !mergedData.start_time || !mergedData.duration) {
        throw new ErrorResponse(
          'Day, frequency, start_time, and duration are required for recurring sessions',
          StatusCodes.BAD_REQUEST
        );
      }

      // Validate recurring session
      const validation = RecurringSessionUtil.validateRecurringSession(
        mergedData.day,
        mergedData.start_date,
        mergedData.end_date,
        mergedData.frequency,
        mergedData.start_time,
        mergedData.duration
      );

      if (!validation.isValid) {
        throw new ErrorResponse(validation.error!, StatusCodes.BAD_REQUEST);
      }

      // Generate new instances
      const instances = RecurringSessionUtil.generateSessionInstances(
        mergedData.day,
        mergedData.start_date,
        mergedData.end_date,
        mergedData.frequency,
        mergedData.start_time,
        mergedData.duration
      );

      const instancesToValidate = instances.map((instance) => ({
        start_date: instance.start_date,
        end_date: instance.end_date,
        taxi: mergedData.taxi,
        classroom: mergedData.classroom,
        students: mergedData.students,
        teachers: mergedData.teachers,
      }));

      // Get existing recurring instance IDs to exclude from validation
      const existingInstances = await SessionRecurring.find({ parent_session: id }).select('_id');
      const existingInstanceIds = existingInstances.map((inst) => inst._id.toString());

      const overlapValidation = await this.validateOverlaps(
        instancesToValidate,
        allowOverlap,
        [id],
        existingInstanceIds
      );

      if (overlapValidation.hasOverlap && !allowOverlap) {
        const errorMessage = overlapValidation.conflicts.map((c) => c.message).join('; ');
        throw new ErrorResponse(`Session overlaps detected: ${errorMessage}`, StatusCodes.BAD_REQUEST);
      }

      // Delete old recurring instances
      await SessionRecurring.deleteMany({ parent_session: id });

      // Update main session
      session = await SessionSchema.findByIdAndUpdate(id, cleanSessionData, {
        new: true,
        runValidators: true,
      });

      // Create new recurring instances
      const recurringInstances: ISessionRecurringCreateDTO[] = instances.map((instance) => ({
        parent_session: id,
        start_date: instance.start_date,
        end_date: instance.end_date,
        instance_number: instance.instance_number,
        taxi: mergedData.taxi,
        classroom: mergedData.classroom,
        students: mergedData.students || [],
        teachers: mergedData.teachers || [],
        academic_period: mergedData.academic_period,
        academic_subperiod: mergedData.academic_subperiod,
        room: mergedData.room,
        color: mergedData.color,
        notes: mergedData.notes,
        invite_participants: mergedData.invite_participants,
        mode: mergedData.mode,
        day: mergedData.day,
        start_time: mergedData.start_time,
        duration: mergedData.duration,
        frequency: mergedData.frequency,
      }));

      await SessionRecurring.insertMany(recurringInstances);

      return await this.getSessionById(id, true);
    }

    return await this.getSessionById(id);
  }

  async deleteSession(id: string) {
    const session = await SessionSchema.findById(id);

    // If not found in main collection, check if it's a recurring instance
    if (!session) {
      const recurringInstance = await SessionRecurring.findById(id);

      if (!recurringInstance) {
        throw new ErrorResponse('Session not found', StatusCodes.NOT_FOUND);
      }

      // Delete only this recurring instance
      await SessionRecurring.deleteOne({ _id: id });
      return null;
    }

    // If it's a recurring session, delete all its instances first
    if (session.is_recurring) {
      await SessionRecurring.deleteMany({ parent_session: id });
    }

    // Delete the main session
    await SessionSchema.deleteOne({ _id: id });

    return null;
  }

  async addStudent(sessionId: string, studentId: string) {
    let session = await SessionSchema.findById(sessionId);

    // If not in main collection, check recurring instances
    if (!session) {
      const recurringInstance = await SessionRecurring.findById(sessionId);
      if (!recurringInstance) {
        throw new ErrorResponse('Session not found', StatusCodes.NOT_FOUND);
      }

      const student = await UserSchema.findById(studentId);
      if (!student) {
        throw new ErrorResponse('Student not found', StatusCodes.NOT_FOUND);
      }

      if (recurringInstance.students.includes(studentId)) {
        throw new ErrorResponse('Student is already in this session', StatusCodes.BAD_REQUEST);
      }

      await SessionRecurring.findByIdAndUpdate(sessionId, {
        $addToSet: { students: studentId },
      });

      return await this.getSessionById(sessionId);
    }

    const student = await UserSchema.findById(studentId);
    if (!student) {
      throw new ErrorResponse('Student not found', StatusCodes.NOT_FOUND);
    }

    if (session.students.includes(studentId)) {
      throw new ErrorResponse('Student is already in this session', StatusCodes.BAD_REQUEST);
    }

    session.students.push(studentId);
    await session.save();

    // If it's a recurring session, update all instances
    if (session.is_recurring) {
      await SessionRecurring.updateMany({ parent_session: sessionId }, { $addToSet: { students: studentId } });
    }

    return await this.getSessionById(sessionId);
  }

  async removeStudent(sessionId: string, studentId: string) {
    let session = await SessionSchema.findById(sessionId);

    // If not in main collection, check recurring instances
    if (!session) {
      const recurringInstance = await SessionRecurring.findById(sessionId);
      if (!recurringInstance) {
        throw new ErrorResponse('Session not found', StatusCodes.NOT_FOUND);
      }

      if (!recurringInstance.students.includes(studentId)) {
        throw new ErrorResponse('Student is not in this session', StatusCodes.BAD_REQUEST);
      }

      await SessionRecurring.findByIdAndUpdate(sessionId, {
        $pull: { students: studentId },
      });

      return await this.getSessionById(sessionId);
    }

    if (!session.students.includes(studentId)) {
      throw new ErrorResponse('Student is not in this session', StatusCodes.BAD_REQUEST);
    }

    session.students = session.students.filter((student: any) => student.toString() !== studentId);
    await session.save();

    // If it's a recurring session, update all instances
    if (session.is_recurring) {
      await SessionRecurring.updateMany({ parent_session: sessionId }, { $pull: { students: studentId } });
    }

    return await this.getSessionById(sessionId);
  }

  async addTeacher(sessionId: string, teacherId: string) {
    let session = await SessionSchema.findById(sessionId);

    // If not in main collection, check recurring instances
    if (!session) {
      const recurringInstance = await SessionRecurring.findById(sessionId);
      if (!recurringInstance) {
        throw new ErrorResponse('Session not found', StatusCodes.NOT_FOUND);
      }

      const teacher = await UserSchema.findById(teacherId);
      if (!teacher) {
        throw new ErrorResponse('Teacher not found', StatusCodes.NOT_FOUND);
      }

      if (recurringInstance.teachers.includes(teacherId)) {
        throw new ErrorResponse('Teacher is already in this session', StatusCodes.BAD_REQUEST);
      }

      await SessionRecurring.findByIdAndUpdate(sessionId, {
        $addToSet: { teachers: teacherId },
      });

      return await this.getSessionById(sessionId);
    }

    const teacher = await UserSchema.findById(teacherId);
    if (!teacher) {
      throw new ErrorResponse('Teacher not found', StatusCodes.NOT_FOUND);
    }

    if (session.teachers.includes(teacherId)) {
      throw new ErrorResponse('Teacher is already in this session', StatusCodes.BAD_REQUEST);
    }

    session.teachers.push(teacherId);
    await session.save();

    // If it's a recurring session, update all instances
    if (session.is_recurring) {
      await SessionRecurring.updateMany({ parent_session: sessionId }, { $addToSet: { teachers: teacherId } });
    }

    return await this.getSessionById(sessionId);
  }

  async removeTeacher(sessionId: string, teacherId: string) {
    let session = await SessionSchema.findById(sessionId);

    // If not in main collection, check recurring instances
    if (!session) {
      const recurringInstance = await SessionRecurring.findById(sessionId);
      if (!recurringInstance) {
        throw new ErrorResponse('Session not found', StatusCodes.NOT_FOUND);
      }

      if (!recurringInstance.teachers.includes(teacherId)) {
        throw new ErrorResponse('Teacher is not in this session', StatusCodes.BAD_REQUEST);
      }

      await SessionRecurring.findByIdAndUpdate(sessionId, {
        $pull: { teachers: teacherId },
      });

      return await this.getSessionById(sessionId);
    }

    if (!session.teachers.includes(teacherId)) {
      throw new ErrorResponse('Teacher is not in this session', StatusCodes.BAD_REQUEST);
    }

    session.teachers = session.teachers.filter((teacher: any) => teacher.toString() !== teacherId);
    await session.save();

    // If it's a recurring session, update all instances
    if (session.is_recurring) {
      await SessionRecurring.updateMany({ parent_session: sessionId }, { $pull: { teachers: teacherId } });
    }

    return await this.getSessionById(sessionId);
  }

  /**
   * Validate session references (taxi, classroom, academic period, etc.)
   * Classroom is always optional and only validated if provided
   */
  private async validateSessionReferences(sessionData: {
    taxi: string;
    classroom?: string;
    academic_period: string;
    academic_subperiod?: string;
    students?: string[];
    teachers?: string[];
    mode?: string;
  }) {
    const taxi = await TaxiSchema.findById(sessionData.taxi);
    if (!taxi) {
      throw new ErrorResponse('Taxi not found', StatusCodes.NOT_FOUND);
    }

    // Classroom is optional for all modes (online, hybrid, in_person)
    // Only validate classroom if it's provided and not empty
    if (sessionData.classroom && sessionData.classroom.trim() !== '') {
      const classroom = await ClassroomSchema.findById(sessionData.classroom);
      if (!classroom) {
        throw new ErrorResponse('Classroom not found', StatusCodes.NOT_FOUND);
      }
    }

    const academicPeriod = await AcademicPeriodSchema.findById(sessionData.academic_period);
    if (!academicPeriod) {
      throw new ErrorResponse('Academic period not found', StatusCodes.NOT_FOUND);
    }

    if (sessionData.academic_subperiod) {
      const academicSubperiod = await AcademicSubperiodSchema.findById(sessionData.academic_subperiod);
      if (!academicSubperiod) {
        throw new ErrorResponse('Academic subperiod not found', StatusCodes.NOT_FOUND);
      }

      if (academicSubperiod.academic_period.toString() !== sessionData.academic_period) {
        throw new ErrorResponse(
          'Academic subperiod does not belong to the specified academic period',
          StatusCodes.BAD_REQUEST
        );
      }
    }

    if (sessionData.students && sessionData.students.length > 0) {
      const studentCount = await UserSchema.countDocuments({
        _id: { $in: sessionData.students },
      });

      if (studentCount !== sessionData.students.length) {
        throw new ErrorResponse('One or more students not found', StatusCodes.NOT_FOUND);
      }
    }

    if (sessionData.teachers && sessionData.teachers.length > 0) {
      const teacherCount = await UserSchema.countDocuments({
        _id: { $in: sessionData.teachers },
      });

      if (teacherCount !== sessionData.teachers.length) {
        throw new ErrorResponse('One or more teachers not found', StatusCodes.NOT_FOUND);
      }
    }
  }

  async getSessionPreview(
    day: string,
    startDate: Date,
    endDate: Date,
    frequency: number,
    startTime: string,
    duration: number
  ) {
    const validation = RecurringSessionUtil.validateRecurringSession(
      day as any,
      startDate,
      endDate,
      frequency,
      startTime,
      duration
    );

    if (!validation.isValid) {
      throw new ErrorResponse(validation.error!, StatusCodes.BAD_REQUEST);
    }

    const instances = RecurringSessionUtil.generateSessionInstances(
      day as any,
      startDate,
      endDate,
      frequency,
      startTime,
      duration
    );

    // Show first 10 instances for preview
    const previewInstances = instances.slice(0, 10);

    const sessionPreviews = previewInstances.map((instance) => ({
      date: instance.start_date.toISOString().split('T')[0],
      startDate: instance.start_date,
      endDate: instance.end_date,
      dayOfWeek: instance.start_date.toLocaleDateString('en-US', { weekday: 'long' }),
      instanceNumber: instance.instance_number,
    }));

    return {
      preview: sessionPreviews,
      totalSessions: instances.length,
      showing: previewInstances.length,
      summary: {
        day,
        frequency: `${frequency} week${frequency > 1 ? 's' : ''}`,
        duration: `${duration} hour${duration > 1 ? 's' : ''}`,
        startTime,
        dateRange: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0],
        },
      },
    };
  }

  async createOnlineSessionToken(id: string, roomName: string, currentRoleTitle: string): Promise<{ token: string }> {
    const user: IUser | null = await User.findById(id);

    if (!user) {
      throw new ErrorResponse('User not found', StatusCodes.NOT_FOUND);
    }

    console.log(`${config.FILE_PUBLIC_UPLOAD_PATH}/${user.avatar}`);

    const payload = {
      context: {
        user: {
          id: user.id,
          email: user.email,
          avatar: `${config.FILE_PUBLIC_UPLOAD_PATH}/${user.avatar}`,
          role: currentRoleTitle,
          name: `${user.firstname} ${user.lastname}`,
        },
        group: 'sc_vcr_app_id',
      },
      aud: 'sc_vcr_app_id',
      iss: 'sc_vcr_app_id',
      sub: config.OS_JWT_SUB,
      room: '*',
      exp: Math.floor(Date.now() / 1000) + Number(config.OS_JWT_EXPIRE_AT),
    };

    const signedToken = jwt.sign(payload, config.OS_JWT_SECRET);
    return { token: signedToken };
  }

  private async checkClassroomAvailability(
    classroomId: string,
    startDate: Date,
    endDate: Date,
    excludeSessionId?: string
  ) {
    const query: any = {
      classroom: classroomId,
      $or: [
        {
          start_date: { $lte: startDate },
          end_date: { $gte: startDate },
        },
        {
          start_date: { $lte: endDate },
          end_date: { $gte: endDate },
        },
        {
          start_date: { $gte: startDate },
          end_date: { $lte: endDate },
        },
      ],
    };
  }

  async getSessionsByParentEmail(parentEmail: string, queryParams: any = {}) {
    // Find students with this parent's email in contacts
    const students = await UserSchema.find({
      user_type: 'student',
      'contacts.email': parentEmail,
      is_active: true,
    }).select('_id');

    const studentIds = students.map((s) => s._id);

    if (studentIds.length === 0) {
      return [];
    }

    // Find sessions that these students are enrolled in
    const sessions = await SessionSchema.find({
      students: { $in: studentIds },
      ...(queryParams.start_date ? { start_date: { $gte: new Date(queryParams.start_date) } } : {}),
      ...(queryParams.end_date ? { end_date: { $lte: new Date(queryParams.end_date) } } : {}),
      ...(queryParams.taxi ? { taxi: queryParams.taxi } : {}),
      ...(queryParams.classroom ? { classroom: queryParams.classroom } : {}),
    }).populate([
      { path: 'taxi', model: 'Taxi', select: 'name code color subject level' },
      { path: 'classroom', model: 'Classroom', select: 'name location' },
      { path: 'students', model: 'User', select: 'firstname lastname email' },
      { path: 'teachers', model: 'User', select: 'firstname lastname email' },
      { path: 'academic_period', model: 'AcademicPeriod', select: 'name' },
      { path: 'academic_subperiod', model: 'AcademicSubperiod', select: 'name' },
    ]);

    return sessions;
  }

  async linkSessionToClassChat(sessionId: string): Promise<any> {

    try {

      console.log('🔗 Attempting to link session to class chat:', sessionId);

      // Get the session with taxi populated
      const session = await SessionSchema.findById(sessionId)
        .populate('taxi', '_id name subject level branch');

      if (!session) {
        console.warn('⚠️ Session not found:', sessionId);
        throw new ErrorResponse('Session not found', StatusCodes.NOT_FOUND);
      }

      // Get taxi ID

      const taxiId = session.taxi._id;

      // Import Chat model dynamically

      const Chat = require('../messaging/models/chat.model').default;

      // Find the class group chat

      const classChat = await Chat.findOne({
        taxiId: new Types.ObjectId(taxiId),
        type: 'group',
      });

      if (!classChat) {
        console.warn(
          `⚠️ No class group chat found for taxi ${taxiId}. ` + `Session will not be linked.`
        );
        return null;
      }

      console.log('✅ Found class chat:', classChat._id);

      // Check if session already linked

      if (classChat.sessions && classChat.sessions.includes(sessionId)) {
        console.log('ℹ️ Session already linked to chat');
        return classChat;
      }

      // Add session to chat

      if (!classChat.sessions) {
        classChat.sessions = [];
      }

      classChat.sessions.push(new Types.ObjectId(sessionId));

      await classChat.save();

      console.log('✅ Session linked to class chat:', {
        chatId: classChat._id,
        sessionId: sessionId,
        totalSessionsInChat: classChat.sessions.length,
      });

      return classChat;

    } catch (error: any) {

      console.error('❌ Error linking session to class chat:', {
        error: error.message,
        sessionId,
      });

      // Don't throw - session creation should succeed even if linking fails

      return null;

    }
  }
}
