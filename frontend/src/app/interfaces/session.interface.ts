export interface ISessionFormData {
  title: string;
  description?: string;
  class: string;
  teachers: string[];
  students: string[];
  startDate: Date;
  endDate: Date;
  duration: number;
  _id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISession {
  _id: string;
  title: string;
  description?: string;
  class: {
    _id: string;
    name: string;
  };
  teachers: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
  students: Array<{
    _id: string;
    firstname: string;
    lastname: string;
    email: string;
  }>;
  startDate: Date;
  endDate: Date;
  duration: number;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}