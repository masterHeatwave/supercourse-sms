import 'zod-openapi/extend';
import { z } from 'zod';
import mongoose from 'mongoose';

export const getBookmarksSchema = z
  .object({
    userId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid userId' }),
    appId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid appId' }),
  })
  .openapi({
    title: 'QueryEbookBookmarks',
    description: 'Schema for querying ebook bookmarks',
  });

export const itemSchema = z.object({
  id: z.number(),
  label: z.string(),
  page: z.string(),
});

export const updateBookmarksSchema = z
  .object({
    userId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid userId' }),
    appId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid appId' }),
    items: z.array(itemSchema),
  })
  .openapi({
    title: 'UpdateEbookBookmarks',
    description: 'Schema for updating ebook bookmarks',
  });

export const BookmarkSchema = z
  .object({
    _id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid ObjectId' }),
    appId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid appId' }),
    userId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid userId' }),
    items: z.array(itemSchema),
  })
  .openapi({
    title: 'EbookBookmarks',
    description: 'Ebook Bookmark model',
  });
