import mongoose, { Schema } from 'mongoose';
import { INote } from './note.interface';
import User from '../../users/user.model';

const NoteSchema: Schema<INote> = new mongoose.Schema(
  {
    appId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: User,
      required: true,
    },
    data: {
      recipients: [
        {
          type: Schema.Types.ObjectId,
          ref: User,
          required: true,
        },
      ],
      location: {
        type: Schema.Types.Mixed,
        required: true,
      },
      y: {
        type: Number,
        default: 0,
      },
      x: {
        type: Number,
        default: 0,
      },
      text: {
        type: String,
        default: '',
      },
      image: {
        type: String,
        default: null,
      },
      audio: {
        type: String,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

const Note = mongoose.model<INote>('Ebook-Note', NoteSchema);
export default Note;
export { NoteSchema };
