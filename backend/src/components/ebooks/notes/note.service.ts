import Note from './note.model';
import { INoteData, INoteUpdateData } from './note.interface';

export class NoteService {
  async getNotes(userId: string, appId: string) {
    try {
      return await Note.find({ appId, $or: [{ owner: userId }, { 'data.recipients': userId }] }).populate(
        'owner',
        'firstname lastname'
      );
    } catch (error) {
      throw error;
    }
  }

  async createNote(userId: string, appId: string, data: INoteData) {
    try {
      const storedObj = await Note.create({ appId, owner: userId, data });
      return await storedObj.populate('owner', 'firstname lastname');
    } catch (error) {
      throw error;
    }
  }

  async updateNote(noteId: string, fieldsToUpdate: INoteUpdateData) {
    try {
      const data = Object.entries(fieldsToUpdate).reduce(
        (total, [nestedKey, nestedValue]) => ({ ...total, [`data.${nestedKey}`]: nestedValue }),
        {}
      );
      return await Note.findOneAndUpdate({ _id: noteId }, { $set: data }, { new: true, runValidators: true }).populate(
        'owner',
        'firstname lastname'
      );
    } catch (error) {
      throw error;
    }
  }

  async deleteNote(noteId: string) {
    try {
      await Note.findOneAndDelete({ _id: noteId }).orFail();
    } catch (error) {
      throw error;
    }
  }
}
