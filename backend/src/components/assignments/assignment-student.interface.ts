import { Document, Schema } from 'mongoose';

import { IAcademicYear } from '@components/academic/academic-years.interface';
import { IAcademicPeriod } from '@components/academic/academic-periods.interface';
import { IAcademicSubperiod } from '@components/academic/academic-subperiods.interface';
import { ICustomer } from '@components/customers/customer.interface';
import { ITaxi } from '@components/taxi/taxi.interface';
import { IUser } from '@components/users/user.interface';

export interface IAssignmentTask {
  resourceType: 'ebook' | 'custom-activity' | 'open-task';

  ebookID?: Schema.Types.ObjectId; // | IMaterial
  ebookActivityID?: Schema.Types.ObjectId; // | IEbookActivity

  customActivityID?: Schema.Types.ObjectId; // | ICustomActivity

  openTaskType?: 'speaking' | 'writing';
  openTaskTitle?: string;
  openTaskInstructions?: string;

  assignedAs: 'exercise' | 'exam';

  instructions?: string;

  attempts: number;
  duration: number;
  score: number;

  taskStatus: 'new' | 'in-progress' | 'completed';

  taskInspected: boolean;

  answersRevealed: boolean;

  incompleteWarnings: number;

  submittedAt: Date;

  answers?: any;
}

export interface IAssignmentAcademicTimeframe {
  academicYear: Schema.Types.ObjectId | IAcademicYear;
  academicPeriod: Schema.Types.ObjectId | IAcademicPeriod;
  academicTerm: Schema.Types.ObjectId | IAcademicSubperiod;
}

export interface IAssignmentForStudent extends Document {
  schoolID: Schema.Types.ObjectId | ICustomer;
  branchID: Schema.Types.ObjectId | ICustomer;

  staffID: Schema.Types.ObjectId | IUser;
  staffRole: 'admin' | 'manager' | 'teacher';
  staffAssignmentID: Schema.Types.ObjectId;

  classID?: Schema.Types.ObjectId | ITaxi;
  studentID?: Schema.Types.ObjectId | IUser;

  title: string;
  startDate: Date;
  endDate: Date;
  description?: string;

  tasks?: IAssignmentTask[];

  assignmentStatus: 'new' | 'in-progress' | 'completed';

  assignmentInspected: boolean;

  academicTimeframe: IAssignmentAcademicTimeframe;

  isDrafted: boolean;
  draftDate?: Date;
  isDeletedForMe: boolean;
  deleteDateForMe?: Date;
  isDeletedForEveryone: boolean;
  deleteDateForEveryone?: Date;
  isPermanentlyDeleted: boolean;
}

//* eBook
export interface IAssignmentTaskFieldsToUpdate {
  attempts: number;
  taskStatus: 'new' | 'in-progress' | 'completed';
  incompleteWarnings: number;
  duration: number;
  answers: any;
  score?: number;
  submittedAt?: number;
}
//* eBook
