import { ErrorResponse } from '@utils/errorResponse';
import { StatusCodes } from 'http-status-codes';
import SessionSchema from './session.model';
import {
  ISessionCreateDTO,
  ISessionUpdateDTO,
  IBulkSessionCreateDTO,
  IBulkSessionUpdateDTO,
  IOverlapValidationResult,
  IOverlapConflict,
  DayOfWeek,
} from './session.interface';
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

  // Generate individual sessions for recurring sessions
  private generateSessionsFromRecurring(sessionData: ISessionCreateDTO): ISessionCreateDTO[] {
    if (!this.determineIsRecurring(sessionData)) {
      // Non-recurring session
      let endDate = sessionData.end_date;

      // If start_time and duration provided, compute end_date
      if (sessionData.start_time && sessionData.duration) {
        const [hours, minutes] = sessionData.start_time.split(':').map(Number);
        const startDate = new Date(sessionData.start_date);
        startDate.setHours(hours, minutes, 0, 0);

        endDate = new Date(startDate);
        endDate.setTime(endDate.getTime() + sessionData.duration * 60 * 60 * 1000);

        sessionData.start_date = startDate;
        sessionData.end_date = endDate;
      }

      return [
        {
          ...sessionData,
          is_recurring: false,
        },
      ];
    }

    if (!sessionData.day || !sessionData.frequency || !sessionData.start_time || !sessionData.duration) {
      throw new ErrorResponse(
        'Day, frequency, start_time, and duration are required for recurring sessions',
        StatusCodes.BAD_REQUEST
      );
    }

    // Validate recurring session first
    const validation = RecurringSessionUtil.validateRecurringSession(
      sessionData.day,
      sessionData.start_date,
      sessionData.end_date,
      sessionData.frequency,
      sessionData.start_time,
      sessionData.duration
    );

    if (!validation.isValid) {
      throw new ErrorResponse(validation.error!, StatusCodes.BAD_REQUEST);
    }

    const instances = RecurringSessionUtil.generateSessionInstances(
      sessionData.day,
      sessionData.start_date,
      sessionData.end_date,
      sessionData.frequency,
      sessionData.start_time,
      sessionData.duration
    );

    return instances.map((instance) => ({
      ...sessionData,
      start_date: instance.start_date,
      end_date: instance.end_date,
      is_recurring: false, // Individual sessions are not recurring
      parent_id: sessionData.parent_id || undefined,
    }));
  }

  // Validate overlaps for sessions
  private async validateOverlaps(
    sessionsToCheck: ISessionCreateDTO[],
    allowOverlap = false,
    excludeSessionIds: string[] = []
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

    // Check overlaps with existing sessions in database
    for (let i = 0; i < sessionsToCheck.length; i++) {
      const session = sessionsToCheck[i];
      const existingConflicts = await this.checkDatabaseOverlaps(session, excludeSessionIds);

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
  private sessionsOverlap(session1: ISessionCreateDTO, session2: ISessionCreateDTO): boolean {
    const start1 = session1.start_date.getTime();
    const end1 = session1.end_date.getTime();
    const start2 = session2.start_date.getTime();
    const end2 = session2.end_date.getTime();

    // Overlaps if: start1 < end2 && end1 > start2
    const hasTimeOverlap = start1 < end2 && end1 > start2;

    if (!hasTimeOverlap) return false;

    // Check for shared resources
    const sharedTaxi = session1.taxi === session2.taxi;
    const sharedClassroom = session1.classroom === session2.classroom;
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
    session1: ISessionCreateDTO,
    session2: ISessionCreateDTO,
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
    } else if (session1.classroom === session2.classroom) {
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

  // Check database for overlapping sessions
  private async checkDatabaseOverlaps(
    session: ISessionCreateDTO,
    excludeSessionIds: string[] = []
  ): Promise<IOverlapConflict[]> {
    const conflicts: IOverlapConflict[] = [];

    const query: any = {
      $and: [
        {
          $or: [
            { taxi: session.taxi, classroom: session.classroom },
            { taxi: session.taxi, students: { $in: session.students || [] } },
            { classroom: session.classroom, teachers: { $in: session.teachers || [] } },
            { students: { $in: session.students || [] } },
            { teachers: { $in: session.teachers || [] } },
          ],
        },
        {
          start_date: { $lt: session.end_date },
          end_date: { $gt: session.start_date },
        },
      ],
    };

    if (excludeSessionIds.length > 0) {
      query._id = { $nin: excludeSessionIds };
    }

    const existingSessions = await SessionSchema.find(query);

    for (const existing of existingSessions) {
      const overlapStart = new Date(Math.max(session.start_date.getTime(), existing.start_date.getTime()));
      const overlapEnd = new Date(Math.min(session.end_date.getTime(), existing.end_date.getTime()));

      let conflictType: 'taxi' | 'classroom' | 'students' | 'teachers' = 'taxi';
      let resourceId = session.taxi;

      if (existing.taxi.toString() === session.taxi && existing.classroom.toString() === session.classroom) {
        conflictType = 'taxi';
        resourceId = session.taxi;
      } else if (existing.classroom.toString() === session.classroom) {
        conflictType = 'classroom';
        resourceId = session.classroom;
      }

      conflicts.push({
        existingSessionId: existing._id.toString(),
        conflictType,
        overlappingResource: resourceId,
        conflictTime: { start: overlapStart, end: overlapEnd },
        message: `Session overlaps with existing session in ${conflictType}: ${resourceId}`,
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
      from_date?: string;
      to_date?: string;
      is_recurring?: string;
      mode?: 'in_person' | 'online' | 'hybrid';
      branch?: string;
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
          populate: { path: 'student', model: User },
        },
      ],
      overrides,
    });
  }

  async getSessionById(id: string) {
    const session = await SessionSchema.findById(id)
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
        select: 'student date status reason justification_document note notified_parent',
        populate: {
          path: 'student',
          select: 'name firstname lastname email phone',
          model: User,
        },
      });
    if (!session) {
      throw new ErrorResponse('Session not found', StatusCodes.NOT_FOUND);
    }

    return session;
  }

  async createSession(sessionData: ISessionCreateDTO, allowOverlap = false) {
    await this.validateSessionReferences(sessionData);

    // Filter out empty academic_subperiod
    const cleanSessionData = { ...sessionData };
    if (cleanSessionData.academic_subperiod && cleanSessionData.academic_subperiod.trim() === '') {
      delete cleanSessionData.academic_subperiod;
    }

    // Generate all session instances (handles both recurring and non-recurring)
    const sessionInstances = this.generateSessionsFromRecurring(cleanSessionData);

    // Validate all sessions for overlaps
    const overlapValidation = await this.validateOverlaps(sessionInstances, allowOverlap);

    if (overlapValidation.hasOverlap && !allowOverlap) {
      const errorMessage = overlapValidation.conflicts.map((c) => c.message).join('; ');
      throw new ErrorResponse(`Session overlaps detected: ${errorMessage}`, StatusCodes.BAD_REQUEST);
    }

    // Create all session records
    const createdSessions = [];
    for (const sessionInstance of sessionInstances) {
      // Additional validation for each session
      const durationMs = sessionInstance.end_date.getTime() - sessionInstance.start_date.getTime();
      const durationHours = durationMs / (1000 * 60 * 60);
      if (durationHours < 0.5) {
        throw new ErrorResponse('Duration must be at least 0.5 hours', StatusCodes.BAD_REQUEST);
      }

      const session = await SessionSchema.create(sessionInstance);
      createdSessions.push(session);
    }

    const isRecurring = this.determineIsRecurring(cleanSessionData);

    if (isRecurring) {
      return {
        sessions: createdSessions,
        totalSessions: createdSessions.length,
        isRecurring: true,
        warnings: overlapValidation.warnings,
      };
    } else {
      const session = await this.getSessionById(createdSessions[0]._id);
      return {
        session,
        isRecurring: false,
        warnings: overlapValidation.warnings,
      };
    }
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
          `⚠️ No class group chat found for taxi ${taxiId}. ` +
          `Session will not be linked.`
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

  async createBulkSessions(bulkData: IBulkSessionCreateDTO) {
    const { sessions, allowOverlap = false } = bulkData;

    // Validate all session references first
    for (const sessionData of sessions) {
      await this.validateSessionReferences(sessionData);
    }

    // Generate all session instances from all input sessions
    const allSessionInstances: ISessionCreateDTO[] = [];
    const sessionGroupIndexes: { startIndex: number; count: number; originalIndex: number }[] = [];

    for (let i = 0; i < sessions.length; i++) {
      const cleanSessionData = { ...sessions[i] };
      if (cleanSessionData.academic_subperiod && cleanSessionData.academic_subperiod.trim() === '') {
        delete cleanSessionData.academic_subperiod;
      }

      const instances = this.generateSessionsFromRecurring(cleanSessionData);
      sessionGroupIndexes.push({
        startIndex: allSessionInstances.length,
        count: instances.length,
        originalIndex: i,
      });
      allSessionInstances.push(...instances);
    }

    // Validate overlaps across all sessions
    const overlapValidation = await this.validateOverlaps(allSessionInstances, allowOverlap);

    if (overlapValidation.hasOverlap && !allowOverlap) {
      const errorMessage = overlapValidation.conflicts.map((c) => c.message).join('; ');
      throw new ErrorResponse(`Session overlaps detected: ${errorMessage}`, StatusCodes.BAD_REQUEST);
    }

    // Create all sessions using bulk insert for better performance
    const createdSessions = await SessionSchema.insertMany(allSessionInstances);

    // Group results by original session input
    const results = sessionGroupIndexes.map((group) => {
      const sessionInstances = createdSessions.slice(group.startIndex, group.startIndex + group.count);
      const originalSession = sessions[group.originalIndex];
      const isRecurring = this.determineIsRecurring(originalSession);

      return {
        originalIndex: group.originalIndex,
        sessions: sessionInstances,
        totalSessions: sessionInstances.length,
        isRecurring,
      };
    });

    return {
      results,
      totalCreated: createdSessions.length,
      warnings: overlapValidation.warnings,
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

    if (!session) {
      throw new ErrorResponse('Session not found', StatusCodes.NOT_FOUND);
    }

    // Filter out empty academic_subperiod
    const cleanSessionData = { ...sessionData };
    if (cleanSessionData.academic_subperiod && cleanSessionData.academic_subperiod.trim() === '') {
      delete cleanSessionData.academic_subperiod;
    }

    // Validate references if they're being updated
    if (
      cleanSessionData.taxi ||
      cleanSessionData.classroom ||
      cleanSessionData.academic_period ||
      cleanSessionData.academic_subperiod
    ) {
      await this.validateSessionReferences({
        ...session.toObject(),
        ...cleanSessionData,
        students: cleanSessionData.students || [],
        teachers: cleanSessionData.teachers || [],
      });
    }

    // Handle recurring session updates or transitions
    const wasRecurring = session.is_recurring;
    const willBeRecurring =
      cleanSessionData.is_recurring === true ||
      (cleanSessionData.is_recurring !== false &&
        cleanSessionData.day &&
        cleanSessionData.frequency &&
        cleanSessionData.start_time &&
        cleanSessionData.duration);

    // Check if this will actually generate multiple instances (true recurring session)
    // by testing the generateSessionsFromRecurring method
    const testSessionData = { ...session.toObject(), ...cleanSessionData };
    const testInstances = this.generateSessionsFromRecurring(testSessionData);
    const willGenerateMultipleInstances = testInstances.length > 1;

    if ((wasRecurring && willGenerateMultipleInstances) || willGenerateMultipleInstances) {
      // For recurring sessions or transitions, delete old instances and create new ones
      const sessionsToDelete = await SessionSchema.find({
        $or: [{ parent_id: id }, { _id: id }],
      });

      const sessionIds = sessionsToDelete.map((s) => s._id.toString());

      // Create new session data for regeneration
      const newSessionData: ISessionCreateDTO = {
        ...session.toObject(),
        ...cleanSessionData,
      };

      // Generate new instances
      const newInstances = this.generateSessionsFromRecurring(newSessionData);

      // Validate overlaps (excluding the sessions we're about to delete)
      const overlapValidation = await this.validateOverlaps(newInstances, allowOverlap, sessionIds);

      if (overlapValidation.hasOverlap && !allowOverlap) {
        const errorMessage = overlapValidation.conflicts.map((c) => c.message).join('; ');
        throw new ErrorResponse(`Session overlaps detected: ${errorMessage}`, StatusCodes.BAD_REQUEST);
      }

      // Delete old sessions
      await SessionSchema.deleteMany({ _id: { $in: sessionIds } });

      // Create new sessions
      const createdSessions = await SessionSchema.insertMany(newInstances);

      return {
        sessions: createdSessions,
        totalSessions: createdSessions.length,
        isRecurring: willBeRecurring,
        warnings: overlapValidation.warnings,
      };
    } else {
      // Simple non-recurring update
      const updatedSessionData = { ...session.toObject(), ...cleanSessionData };
      const overlapValidation = await this.validateOverlaps([updatedSessionData], allowOverlap, [id]);

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
  }

  async deleteSession(id: string) {
    const session = await SessionSchema.findById(id);

    if (!session) {
      throw new ErrorResponse('Session not found', StatusCodes.NOT_FOUND);
    }

    // Only delete the specific session and its direct children (if it's a parent)
    // Don't delete siblings (other sessions with the same parent_id)
    const sessionsToDelete = await SessionSchema.find({
      $or: [
        { _id: id }, // The session itself
        { parent_id: id }, // Direct children of this session
      ],
    });

    const sessionIds = sessionsToDelete.map((s) => s._id);
    await SessionSchema.deleteMany({ _id: { $in: sessionIds } });

    return null;
  }

  async addStudent(sessionId: string, studentId: string) {
    const session = await SessionSchema.findById(sessionId);
    if (!session) {
      throw new ErrorResponse('Session not found', StatusCodes.NOT_FOUND);
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

    return await this.getSessionById(sessionId);
  }

  async removeStudent(sessionId: string, studentId: string) {
    const session = await SessionSchema.findById(sessionId);
    if (!session) {
      throw new ErrorResponse('Session not found', StatusCodes.NOT_FOUND);
    }

    if (!session.students.includes(studentId)) {
      throw new ErrorResponse('Student is not in this session', StatusCodes.BAD_REQUEST);
    }

    session.students = session.students.filter((student: any) => student.toString() !== studentId);
    await session.save();

    return await this.getSessionById(sessionId);
  }

  async addTeacher(sessionId: string, teacherId: string) {
    const session = await SessionSchema.findById(sessionId);
    if (!session) {
      throw new ErrorResponse('Session not found', StatusCodes.NOT_FOUND);
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

    return await this.getSessionById(sessionId);
  }

  async removeTeacher(sessionId: string, teacherId: string) {
    const session = await SessionSchema.findById(sessionId);
    if (!session) {
      throw new ErrorResponse('Session not found', StatusCodes.NOT_FOUND);
    }

    if (!session.teachers.includes(teacherId)) {
      throw new ErrorResponse('Teacher is not in this session', StatusCodes.BAD_REQUEST);
    }

    session.teachers = session.teachers.filter((teacher: any) => teacher.toString() !== teacherId);
    await session.save();

    return await this.getSessionById(sessionId);
  }

  private async validateSessionReferences(sessionData: {
    taxi: string;
    classroom: string;
    academic_period: string;
    academic_subperiod?: string;
    students?: string[];
    teachers?: string[];
  }) {
    const taxi = await TaxiSchema.findById(sessionData.taxi);
    if (!taxi) {
      throw new ErrorResponse('Taxi not found', StatusCodes.NOT_FOUND);
    }

    const classroom = await ClassroomSchema.findById(sessionData.classroom);
    if (!classroom) {
      throw new ErrorResponse('Classroom not found', StatusCodes.NOT_FOUND);
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

    if (excludeSessionId) {
      query._id = { $ne: excludeSessionId };
    }

    const conflictingSession = await SessionSchema.findOne(query).populate('classroom', 'name');

    if (conflictingSession) {
      const classroomName = (conflictingSession as any)?.classroom?.name || 'selected classroom';
      throw new ErrorResponse(
        `Classroom '${classroomName}' is not available during the specified time slot`,
        StatusCodes.BAD_REQUEST
      );
    }
  }
}
