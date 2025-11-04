import { Types } from 'mongoose';

export interface ICreator {
  createdBy?: Types.ObjectId;
  setCreator(userId: Types.ObjectId | string): Promise<this>;
}
