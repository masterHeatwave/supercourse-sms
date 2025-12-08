import Bookmark from './bookmark.model';
import { IBookmarkItem } from './bookmark.interface';

export class BookmarkService {
  async getBookmarks(userId: string, appId: string) {
    try {
      const result = await Bookmark.findOne({ userId, appId }, 'items');
      return result?.items || [];
    } catch (error) {
      throw error;
    }
  }

  async updateBookmarks(userId: string, appId: string, items: IBookmarkItem[]) {
    try {
      await Bookmark.findOneAndUpdate({ userId, appId }, { items }, { upsert: true });
    } catch (error) {
      throw error;
    }
  }
}
