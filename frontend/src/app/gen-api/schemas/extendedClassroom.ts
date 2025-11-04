import { Classroom } from './classroom';
import { ClassroomType } from './classroomType';

export interface ExtendedClassroom extends Omit<Classroom, 'customer' | 'type'> {
  customer?: {
    id: string;
    name: string;
  } | string;
  type?: ClassroomType | string;
  description?: string;
}
