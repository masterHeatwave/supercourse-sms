import mongoose, { Schema } from 'mongoose';
import { IBookmark } from './bookmark.interface';

const BookmarkSchema: Schema<IBookmark> = new mongoose.Schema(
  {
    appId: {
      type: Schema.Types.ObjectId,
      // ref: 'Resource', //=>db collection name?
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User', //=>db collection name?
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

const Bookmark = mongoose.model<IBookmark>('Bookmark', BookmarkSchema, 'ebooks_bookmarks');
export default Bookmark;
export { BookmarkSchema };
