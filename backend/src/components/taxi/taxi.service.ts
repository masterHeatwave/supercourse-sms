import { ErrorResponse } from '@utils/errorResponse';
import { StatusCodes } from 'http-status-codes';
import Taxi from './taxi.model';
import { ITaxi, ITaxiCreateDTO, ITaxiForMessaging, ITaxiUpdateDTO } from './taxi.interface';
import AcademicYear from '@components/academic/academic-years.model';
import AcademicPeriod from '@components/academic/academic-periods.model';
import AcademicSubperiod from '@components/academic/academic-subperiods.model';
import User from '@components/users/user.model';
import Session from '@components/sessions/session.model';
import SessionRecurring from '@components/sessions/session-recurring.model';
import Classroom from '@components/classrooms/classroom.model';
import Absence from '@components/absences/absence.model';
import { Types } from 'mongoose';

export class TaxiService {
  async getAllTaxis(
    filters: {
      academic_year?: string;
      academic_period?: string;
      branch?: string;
      subject?: string;
      level?: string;
      code?: string;
      search?: string;
      archived?: string;
      userId?: string;
    } = {}
  ) {
    // Build base query without population to avoid tenant filtering issues
    let query = Taxi.find().sort({ name: 1 });

    if (filters.academic_year) {
      query = query.where('academic_year', filters.academic_year);
    }

    if (filters.academic_period) {
      query = query.where('academic_period', filters.academic_period);
    }

    if (filters.branch) {
      query = query.where('branch', filters.branch);
    }

    if (filters.subject) {
      query = query.where('subject', filters.subject);
    }

    if (filters.level) {
      query = query.where('level', filters.level);
    }

    if (filters.code) {
      query = query.where('code', filters.code);
    }

    // Handle archived filter: only filter if explicitly provided
    if (filters.archived !== undefined) {
      const isArchived = filters.archived === 'true';
      query = query.where('archived', isArchived);
    }
    // If archived filter is not provided, return all taxis (archived and non-archived)

    if (filters.search) {
      query = query.where({
        $or: [
          { name: { $regex: filters.search, $options: 'i' } },
          { code: { $regex: filters.search, $options: 'i' } },
          { branch: { $regex: filters.search, $options: 'i' } },
          { subject: { $regex: filters.search, $options: 'i' } },
        ],
      });
    }

    if (filters.userId) {
      query = query.where('students', filters.userId);
    }

    const taxis = await query.exec();
    const enrichedTaxis = await Promise.all(
      taxis.map(async (taxi) => {
        const taxiObj = taxi.toObject();
        let academic_year = null;
        if (taxiObj.academic_year) {
          try {
            academic_year = await AcademicYear.findById(taxiObj.academic_year).select('name year').lean();
          } catch (error) {
            console.error(`Error fetching academic year for ${taxiObj.name}:`, error);
          }
        }

        // Manually fetch academic period (bypass tenant filtering)
        let academic_period = null;
        if (taxiObj.academic_period) {
          try {
            academic_period = await AcademicPeriod.findById(taxiObj.academic_period).select('name').lean();
          } catch (error) {
            console.error(`Error fetching academic period for ${taxiObj.name}:`, error);
          }
        }

        // Manually fetch academic subperiods (bypass tenant filtering)
        let academic_subperiods: any[] = [];
        if (taxiObj.academic_subperiods && taxiObj.academic_subperiods.length > 0) {
          try {
            academic_subperiods = await AcademicSubperiod.find({ _id: { $in: taxiObj.academic_subperiods } })
              .select('name start_date end_date')
              .lean();
          } catch (error) {
            console.error(`Error fetching academic subperiods for ${taxiObj.name}:`, error);
          }
        }

        // Manually fetch users (bypass tenant filtering)
        let users: any[] = [];
        if (taxiObj.users && taxiObj.users.length > 0) {
          try {
            users = await User.find({ _id: { $in: taxiObj.users } })
              .select('firstname lastname email phone user_type code birthday')
              .lean();
          } catch (error) {
            console.error(`Error fetching users for ${taxiObj.name}:`, error);
          }
        }

        // Manually fetch sessions (bypass tenant filtering)
        let sessions: any[] = [];
        try {
          // Fetch all main sessions
          const mainSessions = await Session.find({ taxi: taxiObj._id })
            .select(
              'start_date end_date classroom teachers students mode day duration start_time frequency instance_number parent_session'
            )
            .lean();

          // Fetch all recurring session instances
          const recurringSessions = await SessionRecurring.find({
            taxi: taxiObj._id,
          })
            .select(
              'start_date end_date classroom teachers students mode day duration start_time frequency instance_number parent_session'
            )
            .lean();

          // Combine both collections
          sessions = [...mainSessions, ...recurringSessions];

          // Manually populate classroom for each session
          for (const session of sessions) {
            if (session.classroom) {
              try {
                const classroom = await Classroom.findById(session.classroom).select('name location').lean();
                session.classroom = classroom;
              } catch (error) {
                console.error('Error fetching classroom:', error);
              }
            }

            // Manually populate teachers and students for each session
            if (session.teachers && session.teachers.length > 0) {
              try {
                const teachers = await User.find({ _id: { $in: session.teachers } })
                  .select('firstname lastname')
                  .lean();
                session.teachers = teachers;
              } catch (error) {
                console.error('Error fetching session teachers:', error);
              }
            }

            if (session.students && session.students.length > 0) {
              try {
                const students = await User.find({ _id: { $in: session.students } })
                  .select('firstname lastname')
                  .lean();
                session.students = students;
              } catch (error) {
                console.error('Error fetching session students:', error);
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching sessions for ${taxiObj.name}:`, error);
        }

        // Calculate session statistics
        const sessionStats = this.calculateSessionStats(sessions);

        // Separate teachers and students from users array
        const teachers: any[] = users.filter((user: any) => user.user_type === 'teacher');
        const students: any[] = users.filter((user: any) => user.user_type === 'student');

        const result = {
          ...taxiObj,
          academic_year,
          academic_period,
          academic_subperiods,
          users,
          sessions,
          sessionStats,
          teachers,
          students,
          teacherCount: teachers.length,
          studentCount: students.length,
        };

        return result;
      })
    );

    return enrichedTaxis;
  }

  private calculateSessionStats(sessions: any[]) {
    if (!sessions || sessions.length === 0) {
      return {
        sessionsPerWeek: 0,
        totalDurationMinutes: 0,
        totalDurationFormatted: '0h 0m',
        days: [],
        daysFormatted: 'No sessions',
      };
    }

    // Separate parent sessions (main/recurring) from instance sessions
    const parentSessions = sessions.filter((s) => !s.parent_session);
    const instanceSessions = sessions.filter((s) => s.parent_session);

    // Calculate total duration in minutes and unique days based on ONLY parent sessions
    // Parent sessions represent the actual weekly commitment (recurring patterns)
    let totalMinutes = 0;
    const uniqueDays = new Set<string>();

    parentSessions.forEach((session) => {
      // For recurring sessions, use duration field if available
      if (session.duration && typeof session.duration === 'number') {
        // Duration is in hours, convert to minutes
        const sessionMinutes = session.duration * 60;
        totalMinutes += sessionMinutes;
      } else if (session.start_date && session.end_date) {
        // Fallback to date difference for non-recurring sessions
        const start = new Date(session.start_date);
        const end = new Date(session.end_date);
        const diffMs = end.getTime() - start.getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        totalMinutes += diffMinutes;
      }

      // Get day of week from day field or start_date
      if (session.day) {
        // Use the day field directly for recurring sessions
        const dayMap: { [key: string]: string } = {
          monday: 'Mon',
          tuesday: 'Tue',
          wednesday: 'Wed',
          thursday: 'Thu',
          friday: 'Fri',
          saturday: 'Sat',
          sunday: 'Sun',
        };
        uniqueDays.add(dayMap[session.day] || session.day);
      } else if (session.start_date) {
        // Fallback to start_date for non-recurring sessions
        const start = new Date(session.start_date);
        const dayName = start.toLocaleDateString('en-US', { weekday: 'short' });
        uniqueDays.add(dayName);
      }
    });

    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    const totalDurationFormatted = totalHours > 0 ? `${totalHours}h ${remainingMinutes}m` : `${remainingMinutes}m`;

    const days = Array.from(uniqueDays);
    const daysFormatted = days.length > 0 ? days.join(', ') : 'No sessions';

    // Calculate sessions per week based on ONLY parent sessions
    // Parent sessions represent the recurring pattern (e.g., "every Monday at 4pm")
    // We count unique parent sessions to get the number of sessions per week
    const sessionsPerWeek = parentSessions.length;

    return {
      sessionsPerWeek: sessionsPerWeek,
      totalDurationMinutes: totalMinutes,
      totalDurationFormatted: totalDurationFormatted,
      days: days,
      daysFormatted: daysFormatted,
    };
  }

  async getTaxiById(id: string) {
    const taxi = await Taxi.findById(id);

    if (!taxi) {
      throw new ErrorResponse('Taxi not found', StatusCodes.NOT_FOUND);
    }

    const taxiObj = taxi.toObject();
    let academic_year = null;
    if (taxiObj.academic_year) {
      try {
        academic_year = await AcademicYear.findById(taxiObj.academic_year).select('name year').lean();
      } catch (error) {
        console.error(`Error fetching academic year for ${taxiObj.name}:`, error);
      }
    }

    // Manually fetch academic period (bypass tenant filtering)
    let academic_period = null;
    if (taxiObj.academic_period) {
      try {
        academic_period = await AcademicPeriod.findById(taxiObj.academic_period).select('name').lean();
      } catch (error) {
        console.error(`Error fetching academic period for ${taxiObj.name}:`, error);
      }
    }

    // Manually fetch academic subperiods (bypass tenant filtering)
    let academic_subperiods: any[] = [];
    if (taxiObj.academic_subperiods && taxiObj.academic_subperiods.length > 0) {
      try {
        academic_subperiods = await AcademicSubperiod.find({ _id: { $in: taxiObj.academic_subperiods } })
          .select('name start_date end_date')
          .lean();
      } catch (error) {
        console.error(`Error fetching academic subperiods for ${taxiObj.name}:`, error);
      }
    }

    // Manually fetch users (bypass tenant filtering)
    let users: any[] = [];
    if (taxiObj.users && taxiObj.users.length > 0) {
      try {
        users = await User.find({ _id: { $in: taxiObj.users } })
          .select('firstname lastname email phone user_type code birthday')
          .lean();
      } catch (error) {
        console.error(`Error fetching users for ${taxiObj.name}:`, error);
      }
    }

    // Manually fetch sessions (bypass tenant filtering)
    let sessions: any[] = [];
    try {
      // Fetch all main sessions
      const mainSessions = await Session.find({ taxi: taxiObj._id })
        .select(
          'start_date end_date classroom teachers students mode day duration start_time frequency instance_number parent_session'
        )
        .lean();

      // Fetch all recurring session instances
      const recurringSessions = await SessionRecurring.find({ taxi: taxiObj._id })
        .select(
          'start_date end_date classroom teachers students mode day duration start_time frequency instance_number parent_session'
        )
        .lean();

      // Combine both collections
      sessions = [...mainSessions, ...recurringSessions];

      // Manually populate classroom for each session
      for (const session of sessions) {
        if (session.classroom) {
          try {
            const classroom = await Classroom.findById(session.classroom).select('name location').lean();
            session.classroom = classroom;
          } catch (error) {
            console.error('Error fetching classroom:', error);
          }
        }

        // Manually populate teachers and students for each session
        if (session.teachers && session.teachers.length > 0) {
          try {
            const teachers = await User.find({ _id: { $in: session.teachers } })
              .select('firstname lastname')
              .lean();
            session.teachers = teachers;
          } catch (error) {
            console.error('Error fetching session teachers:', error);
          }
        }

        if (session.students && session.students.length > 0) {
          try {
            const students = await User.find({ _id: { $in: session.students } })
              .select('firstname lastname')
              .lean();
            session.students = students;
          } catch (error) {
            console.error('Error fetching session students:', error);
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching sessions for ${taxiObj.name}:`, error);
    }

    // Calculate session statistics
    const sessionStats = this.calculateSessionStats(sessions);

    // Separate teachers and students from users array
    const teachers: any[] = users.filter((user: any) => user.user_type === 'teacher');
    const students: any[] = users.filter((user: any) => user.user_type === 'student');

    const result = {
      ...taxiObj,
      academic_year,
      academic_period,
      academic_subperiods,
      users,
      sessions,
      sessionStats,
      teachers,
      students,
      teacherCount: teachers.length,
      studentCount: students.length,
    };

    return result;
  }

  async createTaxi(taxiData: ITaxiCreateDTO) {
    const academicYear = await AcademicYear.findById(taxiData.academic_year);
    if (!academicYear) {
      console.error('Academic year not found:', taxiData.academic_year);
      throw new ErrorResponse('Academic year not found', StatusCodes.NOT_FOUND);
    }

    const academicPeriod = await AcademicPeriod.findById(taxiData.academic_period);
    if (!academicPeriod) {
      console.error('Academic period not found:', taxiData.academic_period);
      throw new ErrorResponse('Academic period not found', StatusCodes.NOT_FOUND);
    }

    if (taxiData.users && taxiData.users.length > 0) {
      const foundUsers = await User.find({ _id: { $in: taxiData.users } });
      if (foundUsers.length !== taxiData.users.length) {
        console.error('User count mismatch. Expected:', taxiData.users.length, 'Found:', foundUsers.length);
        throw new ErrorResponse('One or more users not found', StatusCodes.NOT_FOUND);
      }
    }

    const taxi: ITaxi = await Taxi.create(taxiData);

    // Update users' taxis arrays if users were provided
    if (taxiData.users && taxiData.users.length > 0) {
      await User.updateMany({ _id: { $in: taxiData.users } }, { $addToSet: { taxis: taxi._id } });
    }

    // ✅ Create group chat for this class

    try {

      const classChat = await this.createClassGroupChat(taxi, taxiData.users || []);

      if (classChat) {

        console.log('✅ Group chat created successfully for class:', {
          chatId: classChat._id,
          className: taxi.name,
          participantCount: (taxiData.users || []).length
        });

      }

    } catch (error) {

      // IMPORTANT: Log but don't throw - taxi creation succeeded
      console.error('⚠️ Warning: Group chat creation failed (non-critical):', error);
      // Could send notification to admin about failed chat creation

    }

    const populatedTaxi = await this.getTaxiById(taxi.id);
    return populatedTaxi;
  }

  private async createClassGroupChat(taxi: any, userIds: string[]): Promise<any> {

    try {

      // Remove duplicates

      const participants = Array.from(new Set(userIds));

      // Validation: Need at least 2 participants

      if (participants.length < 2) {

        console.warn(

          `⚠️ Class "${taxi.name}" has ${participants.length} participants. ` +

          `Skipping chat creation (minimum 2 required).`

        );

        return null;

      }



      // Convert participant strings to ObjectId

      const participantObjectIds = participants.map(

        id => new Types.ObjectId(id)

      );


      // Import Chat model

      const Chat = require('../messaging/models/chat.model').default;


      // Prepare chat data

      const chatData: any = {

        participants: participantObjectIds,

        type: 'group', // This is always a group chat

        name: this.formatChatName(taxi), // e.g., "Biology 101 - Advanced"

        taxiId: taxi._id, // Link to this taxi

        sessions: [], // Will be populated as sessions are created

        classMetadata: {

          subject: taxi.subject || '',

          level: taxi.level || '',

          branch: taxi.branch || '',

        },

        lastMessageContent: this.getWelcomeMessage(taxi),

        lastMessagedAt: new Date(),

        unreadCount: new Map(),



        // Global settings (not per-user)

        isStarred: false,

        isPinned: true, // Automatically pin class chats

        isMuted: false,

        isArchived: false,

      };



      // Initialize unread count for all participants

      participantObjectIds.forEach(participantId => {

        chatData.unreadCount.set(participantId.toString(), 0);

      });



      // Create the chat

      const classChat = await Chat.create(chatData);



      console.log('✅ Class group chat created:', {

        chatId: classChat._id,

        name: classChat.name,

        participants: classChat.participants.length,

        taxiId: classChat.taxiId,

      });



      return classChat;

    } catch (error: any) {

      console.error('❌ Error in createClassGroupChat:', {

        error: error.message,

        taxiName: taxi.name,

        stack: error.stack,

      });

      throw error;

    }

  }



  private formatChatName(taxi: any): string {

    let name = taxi.name || 'Class';



    if (taxi.level) {

      name += ` - ${taxi.level}`;

    }



    if (taxi.subject) {

      name += ` (${taxi.subject})`;

    }



    return name;

  }



  private getWelcomeMessage(taxi: any): string {

    return `Welcome to ${taxi.name}! 📚 This is the class group chat. `;

  }

  async updateTaxi(id: string, taxiData: ITaxiUpdateDTO) {
    const taxiDoc = await Taxi.findById(id);

    if (!taxiDoc) {
      throw new ErrorResponse('Taxi not found', StatusCodes.NOT_FOUND);
    }

    if (taxiData.academic_year) {
      const academicYear = await AcademicYear.findById(taxiData.academic_year);
      if (!academicYear) {
        throw new ErrorResponse('Academic year not found', StatusCodes.NOT_FOUND);
      }
    }

    if (taxiData.academic_period) {
      const academicPeriod = await AcademicPeriod.findById(taxiData.academic_period);
      if (!academicPeriod) {
        throw new ErrorResponse('Academic period not found', StatusCodes.NOT_FOUND);
      }
    }

    if (taxiData.users && taxiData.users.length > 0) {
      const userCount = await User.countDocuments({
        _id: { $in: taxiData.users },
      });

      if (userCount !== taxiData.users.length) {
        throw new ErrorResponse('One or more users not found', StatusCodes.NOT_FOUND);
      }
    }

    // Handle user changes if users array is provided
    if (taxiData.users !== undefined) {
      const oldUserIds = taxiDoc.users.map((userId: any) => userId.toString());
      const newUserIds = taxiData.users;

      // Remove taxi from users who are no longer in the taxi
      const usersToRemove = oldUserIds.filter((userId: string) => !newUserIds.includes(userId));
      if (usersToRemove.length > 0) {
        await User.updateMany({ _id: { $in: usersToRemove } }, { $pull: { taxis: id } });
      }

      // Add taxi to new users
      const usersToAdd = newUserIds.filter((userId: string) => !oldUserIds.includes(userId));
      if (usersToAdd.length > 0) {
        await User.updateMany({ _id: { $in: usersToAdd } }, { $addToSet: { taxis: id } });
      }
    }

    await Taxi.findByIdAndUpdate(id, taxiData, {
      new: true,
      runValidators: true,
    });

    return await this.getTaxiById(id);
  }

  async deleteTaxi(id: string) {
    const taxi = await Taxi.findById(id);

    if (!taxi) {
      throw new ErrorResponse('Taxi not found', StatusCodes.NOT_FOUND);
    }

    // Soft delete: Set archived to true instead of deleting the record
    taxi.archived = true;
    await taxi.save();

    // Note: We keep users associated with the taxi for historical records
    // If you need to remove the taxi from users' arrays, uncomment below:
    // if (taxi.users && taxi.users.length > 0) {
    //   await User.updateMany({ _id: { $in: taxi.users } }, { $pull: { taxis: id } });
    // }

    return await this.getTaxiById(id);
  }

  async addUser(taxiId: string, userId: string) {
    const taxi = await Taxi.findById(taxiId);
    if (!taxi) {
      throw new ErrorResponse('Taxi not found', StatusCodes.NOT_FOUND);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ErrorResponse('User not found', StatusCodes.NOT_FOUND);
    }

    const userExists = taxi.users.some((existingUserId: any) => existingUserId.toString() === userId);
    if (userExists) {
      throw new ErrorResponse('User is already in this taxi', StatusCodes.BAD_REQUEST);
    }

    // Add user to taxi
    taxi.users.push(userId as any);
    await taxi.save();

    // Add taxi to user's taxis array using MongoDB update
    await User.findByIdAndUpdate(userId, {
      $addToSet: { taxis: taxiId },
    });

    return await this.getTaxiById(taxiId);
  }

  async removeUser(taxiId: string, userId: string) {
    const taxi = await Taxi.findById(taxiId);
    if (!taxi) {
      throw new ErrorResponse('Taxi not found', StatusCodes.NOT_FOUND);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ErrorResponse('User not found', StatusCodes.NOT_FOUND);
    }

    // Check if user is in the taxi (adjust type check as needed)
    const userExists = taxi.users.some((existingUserId: any) => existingUserId.toString() === userId);
    if (!userExists) {
      throw new ErrorResponse('User is not in this taxi', StatusCodes.BAD_REQUEST);
    }

    // Remove user from taxi
    taxi.users = taxi.users.filter((existingUserId: any) => existingUserId.toString() !== userId);
    await taxi.save();

    // Remove taxi from user's taxis array using MongoDB update
    await User.findByIdAndUpdate(userId, {
      $pull: { taxis: taxiId },
    });

    return await this.getTaxiById(taxiId);
  }

  async getTaxisByUserId(userId: string) {
    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      throw new ErrorResponse('User not found', StatusCodes.NOT_FOUND);
    }

    // Find all taxis where the user is a member (including archived taxis)
    const taxis = await Taxi.find({ users: userId }).sort({ name: 1 });

    // Enrich each taxi with the same data structure as getAllTaxis
    const enrichedTaxis = await Promise.all(
      taxis.map(async (taxi) => {
        const taxiObj = taxi.toObject();
        let academic_year = null;
        if (taxiObj.academic_year) {
          try {
            academic_year = await AcademicYear.findById(taxiObj.academic_year).select('name year').lean();
          } catch (error) {
            console.error(`Error fetching academic year for ${taxiObj.name}:`, error);
          }
        }

        // Manually fetch academic period (bypass tenant filtering)
        let academic_period = null;
        if (taxiObj.academic_period) {
          try {
            academic_period = await AcademicPeriod.findById(taxiObj.academic_period).select('name').lean();
          } catch (error) {
            console.error(`Error fetching academic period for ${taxiObj.name}:`, error);
          }
        }

        // Manually fetch academic subperiods (bypass tenant filtering)
        let academic_subperiods: any[] = [];
        if (taxiObj.academic_subperiods && taxiObj.academic_subperiods.length > 0) {
          try {
            academic_subperiods = await AcademicSubperiod.find({ _id: { $in: taxiObj.academic_subperiods } })
              .select('name start_date end_date')
              .lean();
          } catch (error) {
            console.error(`Error fetching academic subperiods for ${taxiObj.name}:`, error);
          }
        }

        // Manually fetch users (bypass tenant filtering)
        let users: any[] = [];
        if (taxiObj.users && taxiObj.users.length > 0) {
          try {
            users = await User.find({ _id: { $in: taxiObj.users } })
              .select('firstname lastname email phone user_type code birthday')
              .lean();
          } catch (error) {
            console.error(`Error fetching users for ${taxiObj.name}:`, error);
          }
        }

        // Manually fetch sessions (bypass tenant filtering)
        let sessions: any[] = [];
        try {
          // Fetch all main sessions
          const mainSessions = await Session.find({ taxi: taxiObj._id })
            .select(
              'start_date end_date classroom teachers students mode day duration start_time frequency instance_number parent_session'
            )
            .lean();

          // Fetch all recurring session instances
          const recurringSessions = await SessionRecurring.find({
            taxi: taxiObj._id,
          })
            .select(
              'start_date end_date classroom teachers students mode day duration start_time frequency instance_number parent_session'
            )
            .lean();

          // Combine both collections
          sessions = [...mainSessions, ...recurringSessions];

          // Manually populate classroom for each session
          for (const session of sessions) {
            if (session.classroom) {
              try {
                const classroom = await Classroom.findById(session.classroom).select('name location').lean();
                session.classroom = classroom;
              } catch (error) {
                console.error('Error fetching classroom:', error);
              }
            }

            // Manually populate teachers and students for each session
            if (session.teachers && session.teachers.length > 0) {
              try {
                const teachers = await User.find({ _id: { $in: session.teachers } })
                  .select('firstname lastname')
                  .lean();
                session.teachers = teachers;
              } catch (error) {
                console.error('Error fetching session teachers:', error);
              }
            }

            if (session.students && session.students.length > 0) {
              try {
                const students = await User.find({ _id: { $in: session.students } })
                  .select('firstname lastname')
                  .lean();
                session.students = students;
              } catch (error) {
                console.error('Error fetching session students:', error);
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching sessions for ${taxiObj.name}:`, error);
        }

        // Calculate session statistics
        const sessionStats = this.calculateSessionStats(sessions);

        // Separate teachers and students from users array
        const teachers: any[] = users.filter((user: any) => user.user_type === 'teacher');
        const students: any[] = users.filter((user: any) => user.user_type === 'student');

        const result = {
          ...taxiObj,
          academic_year,
          academic_period,
          academic_subperiods,
          users,
          sessions,
          sessionStats,
          teachers,
          students,
          teacherCount: teachers.length,
          studentCount: students.length,
        };

        return result;
      })
    );

    return enrichedTaxis;
  }

  async getTaxiSessions(taxiId: string) {
    // Validate taxi exists
    const taxi = await Taxi.findById(taxiId).lean();
    if (!taxi) {
      throw new ErrorResponse('Taxi not found', StatusCodes.NOT_FOUND);
    }

    // Fetch only parent sessions (sessions without a parent_session field or where it's null)
    const sessions = await Session.find({
      taxi: taxiId,
      $or: [{ parent_session: { $exists: false } }, { parent_session: null }],
    })
      .select(
        'start_date end_date classroom teachers students mode day duration start_time frequency instance_number parent_session'
      )
      .lean();

    // Manually populate classroom for each session
    for (const session of sessions) {
      if (session.classroom) {
        try {
          const classroom = await Classroom.findById(session.classroom).select('name location').lean();
          session.classroom = classroom;
        } catch (error) {
          console.error('Error fetching classroom:', error);
        }
      }

      // Manually populate teachers and students for each session
      if (session.teachers && session.teachers.length > 0) {
        try {
          const teachers = await User.find({ _id: { $in: session.teachers } })
            .select('firstname lastname')
            .lean();
          session.teachers = teachers;
        } catch (error) {
          console.error('Error fetching session teachers:', error);
        }
      }

      if (session.students && session.students.length > 0) {
        try {
          const students = await User.find({ _id: { $in: session.students } })
            .select('firstname lastname')
            .lean();
          session.students = students;
        } catch (error) {
          console.error('Error fetching session students:', error);
        }
      }
    }

    return {
      taxi: { id: taxiId, name: (taxi as any).name },
      sessions,
      count: sessions.length,
    };
  }

  async getTaxiAttendance(taxiId: string, maxDates: number = 10) {
    // Validate taxi exists
    const taxi = await Taxi.findById(taxiId).lean();
    if (!taxi) {
      throw new ErrorResponse('Taxi not found', StatusCodes.NOT_FOUND);
    }

    // Fetch students of this taxi with code, email and name
    const students = await User.find({ _id: { $in: (taxi as any).users } })
      .select('firstname lastname code user_type email birthday')
      .lean();
    const studentUsers = students.filter((u: any) => u.user_type === 'student');

    // Fetch sessions for this taxi and determine recent session dates
    const mainSessions = await Session.find({ taxi: taxiId }).select('start_date').sort({ start_date: -1 }).lean();
    const recurringSessions = await SessionRecurring.find({ taxi: taxiId })
      .select('start_date')
      .sort({ start_date: -1 })
      .lean();
    const sessions = [...mainSessions, ...recurringSessions];

    const toISODate = (d: Date | string) => {
      const date = new Date(d);
      const y = date.getFullYear();
      const m = `${date.getMonth() + 1}`.padStart(2, '0');
      const day = `${date.getDate()}`.padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const sessionDates = Array.from(new Set(sessions.map((s: any) => toISODate(s.start_date)))).slice(
      0,
      Math.max(1, Math.min(60, maxDates))
    );

    // Fetch absences for this taxi within the date set window
    // To keep query efficient, compute date bounds from selected dates
    let dateFilter: any = {};
    if (sessionDates.length > 0) {
      const minDate = new Date(sessionDates[sessionDates.length - 1]);
      const maxDate = new Date(sessionDates[0]);
      maxDate.setDate(maxDate.getDate() + 1);
      dateFilter = { $gte: minDate, $lt: maxDate };
    }

    const absences = await Absence.find({ taxi: taxiId, ...(sessionDates.length ? { date: dateFilter } : {}) })
      .select('student date')
      .lean();

    const absenceSet = new Set(absences.map((a: any) => `${a.student.toString()}|${toISODate(a.date)}`));

    const rows = studentUsers.map((u: any) => {
      const row: any = {
        id: u._id.toString(),
        code: u.code || '—',
        name: `${u.firstname || ''} ${u.lastname || ''}`.trim(),
      };
      for (const d of sessionDates) {
        const key = `${u._id.toString()}|${d}`;
        row[d] = absenceSet.has(key) ? false : true;
      }
      return row;
    });

    return {
      rows,
      dates: sessionDates,
      taxi: { id: taxiId, name: (taxi as any).name },
    };
  }

  async getAllTaxisWithUsers(): Promise<any[]> {
    try {
      const taxis = await Taxi.aggregate([
        {
          $lookup: {
            from: 'supercourse_users',
            localField: 'users',
            foreignField: '_id',
            as: 'usersDetails',
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            subject: 1,
            level: 1,
            cefr_level: 1,
            color: 1,
            branch: 1,
            academic_year: 1,
            academic_period: 1,
            academic_subperiods: 1,
            scap_products: 1,
            createdAt: 1,
            updatedAt: 1,
            // Populate user details with user_type for filtering
            users: {
              $map: {
                input: '$usersDetails',
                as: 'user',
                in: {
                  _id: '$$user._id',
                  user: '$$user._id', // For compatibility with old frontend
                  username: '$$user.username',
                  email: '$$user.email',
                  firstname: '$$user.firstname',
                  lastname: '$$user.lastname',
                  user_type: '$$user.user_type', // ✅ Critical: Include user_type for filtering
                  isOnline: '$$user.isOnline',
                  avatar: '$$user.avatar',
                },
              },
            },
            // ✅ NEW: Separate teachers and students for easier frontend use
            teachers: {
              $filter: {
                input: {
                  $map: {
                    input: '$usersDetails',
                    as: 'user',
                    in: {
                      _id: '$$user._id',
                      user: '$$user._id',
                      username: '$$user.username',
                      email: '$$user.email',
                      firstname: '$$user.firstname',
                      lastname: '$$user.lastname',
                      user_type: '$$user.user_type',
                      isOnline: '$$user.isOnline',
                      avatar: '$$user.avatar',
                    },
                  },
                },
                as: 'u',
                cond: { $eq: ['$$u.user_type', 'teacher'] },
              },
            },
            students: {
              $filter: {
                input: {
                  $map: {
                    input: '$usersDetails',
                    as: 'user',
                    in: {
                      _id: '$$user._id',
                      user: '$$user._id',
                      username: '$$user.username',
                      email: '$$user.email',
                      firstname: '$$user.firstname',
                      lastname: '$$user.lastname',
                      user_type: '$$user.user_type',
                      isOnline: '$$user.isOnline',
                      avatar: '$$user.avatar',
                    },
                  },
                },
                as: 'u',
                cond: { $eq: ['$$u.user_type', 'student'] },
              },
            },
          },
        },
        {
          $sort: { name: 1 },
        },
      ]);

      return taxis;
    } catch (error: any) {
      console.error('❌ Error fetching taxis with users:', error);
      throw new ErrorResponse(`Failed to fetch classes: ${error.message}`, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get single taxi/class by ID with populated users
   */
  async getTaxiByIdWithUsers(taxiId: string): Promise<any> {
    try {
      const taxis = await Taxi.aggregate([
        { $match: { _id: new Types.ObjectId(taxiId) } },
        {
          $lookup: {
            from: 'supercourse_users',
            localField: 'users',
            foreignField: '_id',
            as: 'usersDetails',
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            subject: 1,
            level: 1,
            cefr_level: 1,
            color: 1,
            branch: 1,
            academic_year: 1,
            academic_period: 1,
            academic_subperiods: 1,
            scap_products: 1,
            createdAt: 1,
            updatedAt: 1,
            users: {
              $map: {
                input: '$usersDetails',
                as: 'user',
                in: {
                  _id: '$$user._id',
                  user: '$$user._id',
                  username: '$$user.username',
                  email: '$$user.email',
                  firstname: '$$user.firstname',
                  lastname: '$$user.lastname',
                  user_type: '$$user.user_type',
                  isOnline: '$$user.isOnline',
                  avatar: '$$user.avatar',
                },
              },
            },
            teachers: {
              $filter: {
                input: {
                  $map: {
                    input: '$usersDetails',
                    as: 'user',
                    in: {
                      _id: '$$user._id',
                      user: '$$user._id',
                      username: '$$user.username',
                      email: '$$user.email',
                      firstname: '$$user.firstname',
                      lastname: '$$user.lastname',
                      user_type: '$$user.user_type',
                      isOnline: '$$user.isOnline',
                      avatar: '$$user.avatar',
                    },
                  },
                },
                as: 'u',
                cond: { $eq: ['$$u.user_type', 'teacher'] },
              },
            },
            students: {
              $filter: {
                input: {
                  $map: {
                    input: '$usersDetails',
                    as: 'user',
                    in: {
                      _id: '$$user._id',
                      user: '$$user._id',
                      username: '$$user.username',
                      email: '$$user.email',
                      firstname: '$$user.firstname',
                      lastname: '$$user.lastname',
                      user_type: '$$user.user_type',
                      isOnline: '$$user.isOnline',
                      avatar: '$$user.avatar',
                    },
                  },
                },
                as: 'u',
                cond: { $eq: ['$$u.user_type', 'student'] },
              },
            },
          },
        },
      ]);

      if (!taxis || taxis.length === 0) {
        throw new ErrorResponse('Class not found', StatusCodes.NOT_FOUND);
      }

      return taxis[0];
    } catch (error: any) {
      console.error('❌ Error fetching taxi by ID:', error);
      throw error;
    }
  }

  /**
   * ✅ GET TAXIS FOR MESSAGING - OPTIMIZED FOR TREE NODE STRUCTURE
   *
   * This endpoint is specifically designed for the new-chat-dialog component.
   * Returns classes with students and teachers separated for easy TreeNode building.
   *
   * Frontend Usage: new-chat-dialog.component.ts -> buildRecipientTree()
   * Route: GET /v1/taxis/messaging
   */
  async getTaxisForMessaging(): Promise<ITaxiForMessaging[]> {
    try {
      console.log('📚 Fetching taxis for messaging...');

      const taxis = await Taxi.aggregate([
        {
          $lookup: {
            from: 'supercourse_users',
            localField: 'users',
            foreignField: '_id',
            as: 'usersDetails',
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            subject: 1,
            level: 1,
            // ✅ Filter and map students with all required fields
            students: {
              $filter: {
                input: {
                  $map: {
                    input: '$usersDetails',
                    as: 'user',
                    in: {
                      _id: '$$user._id',
                      user: { $toString: '$$user._id' }, // ✅ String ID for matching
                      username: '$$user.username',
                      userType: '$$user.user_type', // ✅ Renamed to match frontend
                      email: '$$user.email',
                      firstname: '$$user.firstname',
                      lastname: '$$user.lastname',
                      isOnline: { $ifNull: ['$$user.isOnline', false] },
                    },
                  },
                },
                as: 'u',
                // ✅ Case-insensitive comparison
                cond: {
                  $eq: [{ $toLower: '$$u.userType' }, 'student'],
                },
              },
            },
            // ✅ Filter and map teachers with all required fields
            teachers: {
              $filter: {
                input: {
                  $map: {
                    input: '$usersDetails',
                    as: 'user',
                    in: {
                      _id: '$$user._id',
                      user: { $toString: '$$user._id' }, // ✅ String ID for matching
                      username: '$$user.username',
                      userType: '$$user.user_type', // ✅ Renamed to match frontend
                      email: '$$user.email',
                      firstname: '$$user.firstname',
                      lastname: '$$user.lastname',
                      isOnline: { $ifNull: ['$$user.isOnline', false] },
                    },
                  },
                },
                as: 'u',
                // ✅ Case-insensitive comparison
                cond: {
                  $eq: [{ $toLower: '$$u.userType' }, 'teacher'],
                },
              },
            },
          },
        },
        {
          $sort: { name: 1 },
        },
      ]);

      console.log(`✅ Found ${taxis.length} taxis for messaging`);

      // Log first taxi for debugging
      if (taxis.length > 0) {
        console.log(`📊 Sample taxi "${taxis[0].name}":`, {
          students: taxis[0].students?.length || 0,
          teachers: taxis[0].teachers?.length || 0,
        });
      }

      return taxis as ITaxiForMessaging[];
    } catch (error: any) {
      console.error('❌ Error fetching taxis for messaging:', error);
      throw new ErrorResponse(
        `Failed to fetch classes for messaging: ${error.message}`,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getTaxisByParentEmail(parentEmail: string, queryParams: any = {}) {
    // Find students with this parent's email in contacts
    const students = await User.find({
      user_type: 'student',
      'contacts.email': parentEmail,
      is_active: true,
    }).select('_id');

    const studentIds = students.map((s) => s._id);

    if (studentIds.length === 0) {
      return [];
    }

    // Find taxis that these students are enrolled in
    const taxis = await Taxi.find({
      students: { $in: studentIds },
      ...(queryParams.branch ? { branch: queryParams.branch } : {}),
      ...(queryParams.archived !== undefined ? { archived: queryParams.archived === 'true' } : { archived: false }),
    }).populate([
      { path: 'branch', model: 'Customer', select: 'name slug' },
      { path: 'academic_year', model: 'AcademicYear', select: 'name year' },
      { path: 'academic_period', model: 'AcademicPeriod', select: 'name' },
      { path: 'students', model: 'User', select: 'firstname lastname email' },
    ]);

    return taxis;
  }
}
