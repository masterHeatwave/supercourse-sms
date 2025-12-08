import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '@middleware/async';
import { jsonResponse } from '@middleware/json-response';
import { moveToFinalStorage, cleanupTempFiles } from '@middleware/tempStorage';
import usersService from '@components/users/users.service';
import { CustomerService } from '@components/customers/customer.service';
import {
  archiveSchema,
  createSchema,
  createStaffSchema,
  queryAllSchema,
  updateSchema,
  updateStaffSchema,
  makePrimaryContactSchema,
} from '@components/users/users-validate.schemas';
import redisClient from '@config/redis';
import { sendEmailToCreatePassword } from '@utils/sendEmail';
import RoleModel from '@components/roles/role.model';
import User from '@components/users/user.model';
import { Role as RoleEnum } from '@middleware/constants/role';
import { IUser, IUserType, IUserCreateDTO, IStaffCreateDTO } from './user.interface';
import Session from '@components/sessions/session.model';
import Taxi from '@components/taxi/taxi.model';
import { APIResponses } from '../../types';
import { sendNotification } from '@utils/sendNotification';
import { logger } from '@utils/logger';

// Helper function to annotate students with on_live_session flag
const annotateStudentsWithLiveFlag = async (students: any, branch?: string) => {
  try {
    const now = new Date();
    // Build branch-aware sessions filter similar to SessionService.getAllSessions
    const branchFilter = branch?.trim() || '';

    // Resolve taxis for branch (if provided)
    let taxiFilter: any = {};
    if (branchFilter) {
      const taxisInBranch = await Taxi.find({ branch: branchFilter }).select('_id');
      const taxiIds = taxisInBranch.map((t) => t._id);
      taxiFilter = taxiIds.length > 0 ? { taxi: { $in: taxiIds } } : { taxi: { $in: [] } };
    }

    // Reduce scope to current page students for efficiency
    const currentPageStudentIds = Array.isArray(students?.results)
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        students.results.map((s: any) => (s?.id || s?._id)?.toString()).filter(Boolean)
      : [];

    // Query active sessions intersecting now and containing any current page student
    const activeSessions = await Session.find({
      start_date: { $lte: now },
      end_date: { $gte: now },
      ...(currentPageStudentIds.length > 0 ? { students: { $in: currentPageStudentIds } } : {}),
      ...taxiFilter,
    }).select('students');

    const liveStudentIds = new Set<string>();
    for (const session of activeSessions) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (session as any).students?.forEach((sid: any) => liveStudentIds.add(sid.toString()));
    }

    // Annotate current page results only
    // students has shape { results, page, limit, totalResults, totalPages }
    if (Array.isArray(students?.results)) {
      students.results = students.results.map((stu: any) => {
        const id = (stu?.id || stu?._id)?.toString();
        const onLive = id ? liveStudentIds.has(id) : false;
        // Ensure we return a plain object with existing JSON transforms
        const json = typeof stu?.toJSON === 'function' ? stu.toJSON() : stu;
        return { ...json, on_live_session: onLive };
      });
    }
  } catch (e) {
    // Fail-soft: keep original payload if any error occurs
    logger.error('Error annotating students with live flag:', e);
  }

  return students;
};

const queryAll = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const parsedQuery = queryAllSchema.parse(req.query);
  const reqUser = req.user as IUser;
  const users = await usersService.queryAll(parsedQuery, reqUser);

  jsonResponse(res, {
    status: StatusCodes.OK,
    data: users,
    success: true,
  });
});

const querySingle = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const user = await usersService.querySingle(req.params.id);

  if (!user) {
    return jsonResponse(res, {
      status: StatusCodes.NOT_FOUND,
      message: APIResponses.RESOURCE_NOT_FOUND,
      success: false,
    });
  }

  jsonResponse(res, {
    status: StatusCodes.OK,
    data: user,
    success: true,
  });
});

const create = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const parsedBody = createSchema.parse(req.body);
  const userExists = await usersService.isUserDuplicate({
    email: parsedBody.email,
    phone: parsedBody.phone,
    username: parsedBody.username,
  });

  if (userExists) {
    jsonResponse(res, {
      status: StatusCodes.BAD_REQUEST,
      message: APIResponses.USER.USER_EXISTS,
      data: {},
      success: false,
    });
  }

  // Ensure tenant access alignment: if branches provided, mirror them to customers for auth checks
  const mirroredCustomers = Array.isArray(parsedBody.branches) ? [...(parsedBody.branches as unknown as string[])] : [];
  const createData = { ...parsedBody, username: parsedBody.username!, customers: mirroredCustomers };
  const user = await usersService.create(createData as IUserCreateDTO);

  const randomHash = Math.random().toString(36).substring(7);
  await redisClient.set(`reset-password-hash-${randomHash}`, JSON.stringify(user.email));
  if (!parsedBody.customers || parsedBody.customers.length === 0) {
    await sendEmailToCreatePassword(user.email, randomHash);
  }

  // The user's customers and branches are already set during user creation
  // No need to update the customer side since customers don't have a users array

  await sendNotification(`User ${user.username} has been created successfully`, 'system');

  jsonResponse(res, {
    status: StatusCodes.CREATED,
    data: user,
    success: true,
    message: 'User created successfully. Email sent to create password.',
  });
});

const createStaff = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const parsedBody = createStaffSchema.parse(req.body);

  // Check for duplicate email/phone/username
  const userExists = await usersService.isUserDuplicate({
    email: parsedBody.email,
    phone: parsedBody.phone,
    username: parsedBody.username,
  });

  if (userExists) {
    return jsonResponse(res, {
      status: StatusCodes.BAD_REQUEST,
      message: APIResponses.USER.USER_EXISTS,
      success: false,
    });
  }

  // Handle files if present
  const staffData = { ...parsedBody } as IStaffCreateDTO;

  // File model setup already imported at the top of the file (or should be)

  // We're already getting the avatar and documents paths from the frontend
  // No need to create additional records, just use the paths directly

  // Only handle avatar or document uploads if they're not already set
  if (!staffData.avatar && req.files && 'avatar' in req.files) {
    const avatarFile = Array.isArray(req.files.avatar) ? req.files.avatar[0] : req.files.avatar;
    if (avatarFile) {
      // Just use the path directly - we're no longer creating a File record
      staffData.avatar = `media/${avatarFile.name}`;
    }
  }

  // Handle document files if present and not already set
  if ((!staffData.documents || staffData.documents.length === 0) && req.files && 'documents' in req.files) {
    const documentFiles = Array.isArray(req.files.documents) ? req.files.documents : [req.files.documents];
    staffData.documents = documentFiles.map((file) => `media/${file.name}`);
  }

  // Create the staff member
  const staff = await usersService.createStaff(staffData);

  // Check for successful creation and move files from temp to permanent storage
  if (staff && staff.id) {
    try {
      await moveToFinalStorage(req);
    } catch (error) {
      logger.error(`Error moving files from temp to permanent storage: ${error}`);
      // Continue anyway, as the staff record is created
    }
  } else {
    // Cleanup temp files on failure
    try {
      await cleanupTempFiles(req);
    } catch (error) {
      logger.error(`Error cleaning up temp files: ${error}`);
    }
  }

  // Send password creation email
  const randomHash = Math.random().toString(36).substring(7);
  await redisClient.set(`reset-password-hash-${randomHash}`, JSON.stringify(staff.email));
  await sendEmailToCreatePassword(staff.email, randomHash);

  // Send notification
  await sendNotification(`Staff member ${staff.firstname} ${staff.lastname} created successfully`, 'system');

  jsonResponse(res, {
    status: StatusCodes.CREATED,
    data: staff,
    success: true,
    message: 'Staff created successfully. Email sent to create password.',
  });
});

const update = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const parsedBody = updateSchema.parse({ ...req.body, id: req.params.id });

  // Check if user exists (optional, service might handle)
  const existingUser = await usersService.querySingle(parsedBody.id);
  if (!existingUser) {
    return jsonResponse(res, {
      status: StatusCodes.NOT_FOUND,
      message: APIResponses.RESOURCE_NOT_FOUND,
      success: false,
    });
  }

  // Check for duplicate details excluding self
  const checkForUniqueDetails = await usersService.isUserDuplicate({
    email: parsedBody.email,
    phone: parsedBody.phone,
    username: parsedBody.username,
    excludeId: parsedBody.id,
  });
  if (checkForUniqueDetails) {
    return jsonResponse(res, {
      status: StatusCodes.BAD_REQUEST,
      message: APIResponses.USER.USER_EXISTS,
      success: false,
    });
  }

  const user = await usersService.update(parsedBody);

  // TODO: Add history logging
  // const reqUser = req?.user as IUser;
  // await historyService.addHistory(user.id, HistoryContentTypes.USER_UPDATED_BY, reqUser.email);

  jsonResponse(res, {
    status: StatusCodes.OK,
    data: user,
    success: true,
    message: 'User updated successfully.',
  });
});

const updateStaff = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const parsedBody = updateStaffSchema.parse({ ...req.body, id: req.params.id });

  // Check for duplicate details excluding self
  const checkForUniqueDetails = await usersService.isUserDuplicate({
    email: parsedBody.email,
    phone: parsedBody.phone,
    username: parsedBody.username,
    excludeId: parsedBody.id,
  });
  if (checkForUniqueDetails) {
    return jsonResponse(res, {
      status: StatusCodes.BAD_REQUEST,
      message: APIResponses.USER.USER_EXISTS,
      success: false,
    });
  }

  const staff = await usersService.updateStaff(parsedBody);

  if (!staff) {
    return jsonResponse(res, {
      status: StatusCodes.NOT_FOUND,
      message: 'Staff member not found or update failed.',
      success: false,
    });
  }

  // TODO: Add history logging
  // const reqUser = req?.user as IUser;
  // await historyService.addHistory(staff.id, HistoryContentTypes.USER_UPDATED_BY, reqUser.email);

  jsonResponse(res, {
    status: StatusCodes.OK,
    data: staff,
    success: true,
    message: 'Staff member updated successfully.',
  });
});

const getAllStaff = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const parsedQuery = queryAllSchema.parse(req.query);
  const reqUser = req.user as IUser;
  const staffList = await usersService.getAllStaff(parsedQuery, reqUser);

  jsonResponse(res, {
    status: StatusCodes.OK,
    data: staffList,
    success: true,
  });
});

const getStaffById = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const reqUser = req.user as IUser;
  // Check if current user is admin to allow viewing inactive staff
  const isAdmin = reqUser?.roles?.some((role: any) => role.title === 'ADMIN');
  const includeInactive = isAdmin;

  const staff = await usersService.getStaffById(req.params.id, includeInactive);

  if (!staff) {
    return jsonResponse(res, {
      status: StatusCodes.NOT_FOUND,
      message: 'Staff member not found.',
      success: false,
    });
  }

  jsonResponse(res, {
    status: StatusCodes.OK,
    data: staff,
    success: true,
  });
});

const searchStaff = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const parsedQuery = queryAllSchema.parse(req.query);
  const reqUser = req.user as IUser;
  const staffResults = await usersService.searchStaff(parsedQuery, reqUser);

  jsonResponse(res, {
    status: StatusCodes.OK,
    data: staffResults,
    success: true,
  });
});

const archive = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const parsedBody = archiveSchema.parse(req.body);
  const user = await usersService.archive(parsedBody);

  if (!user) {
    return jsonResponse(res, {
      status: StatusCodes.NOT_FOUND,
      message: APIResponses.RESOURCE_NOT_FOUND,
      success: false,
    });
  }

  const message = parsedBody.archived ? APIResponses.USER.USER_ARCHIVED : APIResponses.USER.USER_UNARCHIVED;

  jsonResponse(res, {
    status: StatusCodes.OK,
    data: user,
    message: message,
    success: true,
  });
});

const deleteStaff = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const staffId = req.params.id;
  const user = await usersService.deleteStaff(staffId);

  if (!user) {
    return jsonResponse(res, {
      status: StatusCodes.NOT_FOUND,
      message: 'Staff member not found.',
      success: false,
    });
  }

  jsonResponse(res, {
    status: StatusCodes.OK,
    data: user,
    message: 'Staff member archived successfully.',
    success: true,
  });
});

const makePrimaryContact = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const parsedBody = makePrimaryContactSchema.parse(req.body);
  const customerServiceInstance = new CustomerService();
  const customer = await customerServiceInstance.getCustomerById(parsedBody.customer_id);

  // Update the user to include this customer in their customers array if not already there
  const user = await usersService.querySingle(parsedBody.user_id);
  if (user) {
    const customerIds = user.customers.map((c) => c.toString());
    if (!customerIds.includes(parsedBody.customer_id)) {
      user.customers.push(parsedBody.customer_id as any);
      await user.save();
    }
  }

  jsonResponse(res, {
    status: StatusCodes.OK,
    data: customer,
    message: APIResponses.USER.USER_PRIMARY_CONTACT_SUCCESS,
    success: true,
  });
});

const resendPasswordEmail = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const user = await usersService.querySingle(req.params.id);

  if (!user) {
    jsonResponse(res, {
      status: StatusCodes.NOT_FOUND,
      message: APIResponses.RESOURCE_NOT_FOUND,
      success: false,
    });
    return;
  }

  const randomHash = Math.random().toString(36).substring(7);
  await redisClient.set(`reset-password-hash-${randomHash}`, JSON.stringify(user.email));
  await sendEmailToCreatePassword(user.email, randomHash);

  jsonResponse(res, {
    status: StatusCodes.OK,
    message: APIResponses.USER.PASSWORD_EMAIL_RESENT,
    success: true,
  });
});

const getAllStudents = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const parsedQuery = queryAllSchema.parse(req.query);
  const reqUser = req.user as IUser;

  // Role-based scoping
  let scopedQuery = { ...parsedQuery };

  // Check user role and apply appropriate scoping
  const userRoles = reqUser?.roles?.map((role: any) => role.title) || [];
  const isTeacher = userRoles.includes('TEACHER');
  const isParent = userRoles.includes('PARENT_GUARDIAN') || userRoles.includes('PARENT');

  if (isTeacher && !parsedQuery.branch) {
    // Teachers see students in their default branch or first branch
    const defaultBranch = reqUser.default_branch || (reqUser.branches && reqUser.branches[0]);
    if (defaultBranch) {
      scopedQuery.branch = defaultBranch.toString();
    }
  } else if (isParent) {
    // Parents see only their children - redirect to getChildren endpoint
    return getChildren(req, res, _next);
  }

  const students = await usersService.queryAll(
    {
      ...scopedQuery,
      overrides: {
        user_type: IUserType.STUDENT,
        //is_active: parsedQuery.is_active !== undefined ? parsedQuery.is_active === 'true' : true, // DEFAULT to active
      },
    },
    reqUser
  );

  // Compute on_live_session flag for current page of students
  await annotateStudentsWithLiveFlag(students, parsedQuery.branch);

  jsonResponse(res, {
    status: StatusCodes.OK,
    data: students,
    success: true,
  });
});

const getMyStudents = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const parsedQuery = queryAllSchema.parse(req.query);
  const reqUser = req.user as IUser;

  // Verify user is a teacher
  const userRoles = reqUser?.roles?.map((role: any) => role.title) || [];
  const isTeacher = userRoles.includes('TEACHER');

  if (!isTeacher) {
    return jsonResponse(res, {
      status: StatusCodes.FORBIDDEN,
      message: 'Only teachers can access their students',
      success: false,
    });
  }

  // Get teacher ID
  const teacherId = (reqUser._id as any).toString();

  // Get students for this teacher
  const students = await usersService.getStudentsForTeacher(teacherId, parsedQuery, reqUser);

  // Compute on_live_session flag for current page of students
  await annotateStudentsWithLiveFlag(students, parsedQuery.branch);

  jsonResponse(res, {
    status: StatusCodes.OK,
    data: students,
    success: true,
  });
});

const getTeacherStudents = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const parsedQuery = queryAllSchema.parse(req.query);
  const reqUser = req.user as IUser;
  const teacherId = req.params.teacherId;

  if (!teacherId) {
    return jsonResponse(res, {
      status: StatusCodes.BAD_REQUEST,
      message: 'Teacher ID is required',
      success: false,
    });
  }

  // Check user roles
  const userRoles = reqUser?.roles?.map((role: any) => role.title) || [];
  const isAdmin = userRoles.includes('ADMIN');
  const isManager = userRoles.includes('MANAGER');
  const isTeacher = userRoles.includes('TEACHER');
  const reqUserId = (reqUser._id as any).toString();

  // Teachers can only query their own students
  if (isTeacher && !isAdmin && !isManager && teacherId !== reqUserId) {
    return jsonResponse(res, {
      status: StatusCodes.FORBIDDEN,
      message: 'You can only access your own students',
      success: false,
    });
  }

  // Validate that the teacher exists and is actually a teacher
  const teacher = await User.findById(teacherId).populate('roles');
  if (!teacher) {
    return jsonResponse(res, {
      status: StatusCodes.NOT_FOUND,
      message: 'Teacher not found',
      success: false,
    });
  }

  // Check if the user is actually a teacher (by user_type or role)
  const teacherUserType = teacher.user_type === IUserType.TEACHER;
  const teacherHasTeacherRole = teacher.roles?.some((role: any) => {
    const roleTitle = typeof role === 'object' ? role.title : role;
    return roleTitle === 'TEACHER';
  });

  if (!teacherUserType && !teacherHasTeacherRole) {
    return jsonResponse(res, {
      status: StatusCodes.BAD_REQUEST,
      message: 'The specified user is not a teacher',
      success: false,
    });
  }

  // Get students for this teacher
  const students = await usersService.getStudentsForTeacher(teacherId, parsedQuery, reqUser);

  // Compute on_live_session flag for current page of students
  await annotateStudentsWithLiveFlag(students, parsedQuery.branch);

  jsonResponse(res, {
    status: StatusCodes.OK,
    data: students,
    success: true,
  });
});

const createStudent = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const parsedBody = createSchema.parse(req.body);
  parsedBody.user_type = IUserType.STUDENT;

  // Validate that student email is different from all linked contact emails
  if (parsedBody.contacts && Array.isArray(parsedBody.contacts) && parsedBody.contacts.length > 0) {
    const studentEmail = parsedBody.email?.toLowerCase().trim();
    const contactEmails = parsedBody.contacts
      .map((c: any) => c.email?.toLowerCase().trim())
      .filter((email: string) => email && email.length > 0);

    if (studentEmail && contactEmails.length > 0) {
      const matchingContact = contactEmails.find((email: string) => email === studentEmail);
      if (matchingContact) {
        return jsonResponse(res, {
          status: StatusCodes.BAD_REQUEST,
          message: "The student's email address must be different from all linked contact email addresses.",
          success: false,
        });
      }
    }
  }

  const userExists = await usersService.isUserDuplicate({
    email: parsedBody.email,
    phone: parsedBody.phone,
    username: parsedBody.username,
  });

  if (userExists) {
    return jsonResponse(res, {
      status: StatusCodes.BAD_REQUEST,
      message: APIResponses.USER.USER_EXISTS,
      success: false,
    });
  }

  // Mirror branches into customers for tenant authorization
  const studentMirroredCustomers = Array.isArray(parsedBody.branches)
    ? [...(parsedBody.branches as unknown as string[])]
    : [];
  // Ensure student has STUDENT role assigned
  const studentRole = await RoleModel.findOne({ title: 'STUDENT' });
  const createData = {
    ...parsedBody,
    username: parsedBody.username!,
    customers: studentMirroredCustomers,
    roles: parsedBody.roles && parsedBody.roles.length > 0 ? parsedBody.roles : studentRole ? [studentRole.id] : [],
  };
  const student = await usersService.create(createData as IUserCreateDTO);

  const randomHash = Math.random().toString(36).substring(7);
  await redisClient.set(`reset-password-hash-${randomHash}`, JSON.stringify(student.email));
  await sendEmailToCreatePassword(student.email, randomHash);

  // Contacts are saved only in the student's contacts array, not as separate user documents

  await sendNotification(`Student ${student.firstname} ${student.lastname} created successfully`, 'system');

  jsonResponse(res, {
    status: StatusCodes.CREATED,
    data: student,
    success: true,
    message: 'Student created successfully. Email sent to create password.',
  });
});

const getStudentById = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const reqUser = req.user as IUser;
  // Check if current user is admin to allow viewing inactive students
  const isAdmin = reqUser?.roles?.some((role: any) => role.title === 'ADMIN');
  const includeInactive = isAdmin;

  const student = await usersService.querySingle(req.params.id, IUserType.STUDENT, includeInactive);

  if (!student || student.user_type !== IUserType.STUDENT) {
    return jsonResponse(res, {
      status: StatusCodes.NOT_FOUND,
      message: APIResponses.RESOURCE_NOT_FOUND,
      success: false,
    });
  }

  jsonResponse(res, {
    status: StatusCodes.OK,
    data: student,
    success: true,
  });
});

const updateStudent = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  // Transform populated fields to IDs before validation
  const bodyData = { ...req.body, id: req.params.id };

  // Convert populated customers to string IDs if they're objects
  if (bodyData.customers && Array.isArray(bodyData.customers)) {
    bodyData.customers = bodyData.customers.map((c: any) =>
      typeof c === 'object' && c !== null ? (c._id || c.id)?.toString() : c
    );
  }

  // Convert populated roles to string IDs if they're objects
  if (bodyData.roles && Array.isArray(bodyData.roles)) {
    bodyData.roles = bodyData.roles.map((r: any) =>
      typeof r === 'object' && r !== null ? (r._id || r.id)?.toString() : r
    );
  }

  // Convert populated branches to string IDs if they're objects
  if (bodyData.branches && Array.isArray(bodyData.branches)) {
    bodyData.branches = bodyData.branches.map((b: any) =>
      typeof b === 'object' && b !== null ? (b._id || b.id)?.toString() : b
    );
  }

  // Convert populated default_branch to string ID if it's an object
  if (bodyData.default_branch && typeof bodyData.default_branch === 'object') {
    bodyData.default_branch = (bodyData.default_branch._id || bodyData.default_branch.id)?.toString();
  }

  const parsedBody = updateSchema.parse(bodyData);

  // Debug logging
  logger.info(`Updating student with ID: ${parsedBody.id}`);

  const existingStudent = await usersService.querySingle(parsedBody.id, IUserType.STUDENT, true);

  if (!existingStudent) {
    logger.warn(`Student not found with ID: ${parsedBody.id}`);
    return jsonResponse(res, {
      status: StatusCodes.NOT_FOUND,
      message: APIResponses.RESOURCE_NOT_FOUND,
      success: false,
    });
  }

  if (existingStudent.user_type !== IUserType.STUDENT) {
    logger.warn(`User ${parsedBody.id} is not a student. Type: ${existingStudent.user_type}`);
    return jsonResponse(res, {
      status: StatusCodes.NOT_FOUND,
      message: APIResponses.RESOURCE_NOT_FOUND,
      success: false,
    });
  }

  const checkForUniqueDetails = await usersService.isUserDuplicate({
    email: parsedBody.email,
    phone: parsedBody.phone,
    username: parsedBody.username,
    excludeId: parsedBody.id,
  });
  if (checkForUniqueDetails) {
    return jsonResponse(res, {
      status: StatusCodes.BAD_REQUEST,
      message: APIResponses.USER.USER_EXISTS,
      success: false,
    });
  }

  // Validate that student email is different from all linked contact emails
  if (parsedBody.contacts && Array.isArray(parsedBody.contacts) && parsedBody.contacts.length > 0) {
    // Get student email - use parsedBody.email if provided, otherwise use existing student email
    const studentEmail = (parsedBody.email || existingStudent.email)?.toLowerCase().trim();

    if (studentEmail) {
      const contactEmails = parsedBody.contacts
        .map((c: any) => c.email?.toLowerCase().trim())
        .filter((email: string) => email && email.length > 0);

      if (contactEmails.length > 0) {
        const matchingContact = contactEmails.find((email: string) => email === studentEmail);
        if (matchingContact) {
          return jsonResponse(res, {
            status: StatusCodes.BAD_REQUEST,
            message: "The student's email address must be different from all linked contact email addresses.",
            success: false,
          });
        }
      }
    }
  }

  // Keep customers in sync with branches for authorization checks
  if (Array.isArray(parsedBody.branches)) {
    (parsedBody as any).customers = [...(parsedBody.branches as unknown as string[])];
  }
  const student = await usersService.update(parsedBody);

  // Contacts are saved only in the student's contacts array, not as separate user documents

  jsonResponse(res, {
    status: StatusCodes.OK,
    data: student,
    success: true,
    message: 'Student updated successfully.',
  });
});

const getChildren = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const reqUser = req.user as IUser;
  const parentEmail = reqUser?.email;
  if (!parentEmail) {
    return jsonResponse(res, {
      status: StatusCodes.BAD_REQUEST,
      message: 'Authenticated user has no email',
      success: false,
    });
  }

  const parsedQuery = queryAllSchema.parse(req.query);
  const results = await usersService.queryAll(
    {
      ...parsedQuery,
      overrides: {
        user_type: IUserType.STUDENT,
        'contacts.email': parentEmail,
        is_active: parsedQuery.is_active !== undefined ? parsedQuery.is_active === 'true' : true, // DEFAULT to active
      },
    } as any,
    reqUser
  );

  jsonResponse(res, {
    status: StatusCodes.OK,
    data: results,
    success: true,
  });
});

const deleteStudent = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const deletedStudent = await usersService.deleteStudent(req.params.id);

  if (!deletedStudent) {
    return jsonResponse(res, {
      status: StatusCodes.NOT_FOUND,
      message: APIResponses.RESOURCE_NOT_FOUND,
      success: false,
    });
  }

  jsonResponse(res, {
    status: StatusCodes.NO_CONTENT,
    success: true,
  });
});

export default {
  queryAll,
  querySingle,
  create,
  createStaff,
  update,
  updateStaff,
  archive,
  deleteStaff,
  getAllStaff,
  getStaffById,
  searchStaff,
  makePrimaryContact,
  resendPasswordEmail,
  getAllStudents,
  getMyStudents,
  getTeacherStudents,
  createStudent,
  getStudentById,
  updateStudent,
  deleteStudent,
  getChildren,
};
