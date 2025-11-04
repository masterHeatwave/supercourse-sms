import File from './file.model';
import { IFile, IFileCreateDTO } from './file.interface';

const createFile = async (fileData: IFileCreateDTO): Promise<IFile> => {
  return File.create(fileData);
};

const getFileById = async (id: string): Promise<IFile | null> => {
  return File.findById(id);
};

export default {
  createFile,
  getFileById,
};
