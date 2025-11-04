import { AssignmentForStudent } from './assignment-student.model';
import { IAssignmentForStudent } from './assignment-student.interface';

export class AssignmentStudentService {
  async getAllAssignments(): Promise<IAssignmentForStudent[]> {
    try {
      return [];
    } catch (error) {
      throw error;
    }
  }

  async getAssignmentByID(id: string): Promise<IAssignmentForStudent | null> {
    try {
      return {} as IAssignmentForStudent;
    } catch (error) {
      throw error;
    }
  }
}
