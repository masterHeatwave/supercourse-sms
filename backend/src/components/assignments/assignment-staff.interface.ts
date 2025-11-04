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
  ebookActivityID?: Schema.Types.ObjectId; // | IBookContent

  customActivityID?: Schema.Types.ObjectId; // | ICustomActivity

  openTaskType?: 'speaking' | 'writing';
  openTaskTitle?: string;
  openTaskInstructions?: string;

  assignedAs: 'exercise' | 'exam';

  instructions?: string;
}

export interface IAssignmentAcademicTimeframe {
  academicYear: Schema.Types.ObjectId | IAcademicYear;
  academicPeriod: Schema.Types.ObjectId | IAcademicPeriod;
  academicTerm: Schema.Types.ObjectId | IAcademicSubperiod;
}

export interface IAssignmentForStaff extends Document {
  schoolID: Schema.Types.ObjectId | ICustomer;
  branchID: Schema.Types.ObjectId | ICustomer;

  staffID: Schema.Types.ObjectId | IUser;
  staffRole: 'admin' | 'manager' | 'teacher';

  classID?: Schema.Types.ObjectId | ITaxi;
  studentsIDs?: Schema.Types.ObjectId[] | IUser[];

  title: string;
  startDate: Date;
  endDate: Date;
  description?: string;

  tasks?: IAssignmentTask[];

  academicTimeframe: IAssignmentAcademicTimeframe;

  isDrafted: boolean;
  draftDate?: Date;
  isDeletedForMe: boolean;
  deletedForMeDate?: Date;
  isDeletedForEveryone: boolean;
  deletedForEveryoneDate?: Date;
  isPermanentlyDeleted: boolean;
}
