import mongoose, { Schema } from 'mongoose';
import { IBookmark } from './bookmark.interface';
import User from '../../users/user.model';

const BookmarkSchema: Schema<IBookmark> = new mongoose.Schema(
  {
    appId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: User,
      required: true,
    },
    items: [
      {
        id: { type: Number, required: true },
        label: { type: String, required: true },
        page: { type: String, required: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Bookmark = mongoose.model<IBookmark>('Ebook-Bookmark', BookmarkSchema);
export default Bookmark;
export { BookmarkSchema };
