import 'zod-openapi/extend';
import { z } from 'zod';
import mongoose from 'mongoose';

export const getNotesSchema = z
  .object({
    userId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid userId' }),
    appId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid appId' }),
  })
  .openapi({
    title: 'QueryEbookNotes',
    description: 'Schema for querying ebook notes',
  });

export const NoteDataSchema = z.object({
  recipients: z.array(z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid userId' })),
  location: z.record(z.any()),
  y: z.number().optional(),
  x: z.number().optional(),
  text: z.string().optional(),
  image: z.string().nullable().optional(),
  audio: z.string().nullable().optional(),
});

export const createNoteSchema = z
  .object({
    userId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid userId' }),
    appId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid appId' }),
    data: NoteDataSchema,
  })
  .openapi({
    title: 'CreateEbookNote',
    description: 'Schema for creating a new ebook note',
  });

export const NoteRequestUpdateSchema = z.object({
  recipients: z
    .array(z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid userId' }))
    .optional(),
  y: z.number().optional(),
  x: z.number().optional(),
  text: z.string().optional(),
  image: z.string().nullable().optional(),
  audio: z.string().nullable().optional(),
});

export const updateNoteSchema = z
  .object({
    noteId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid noteId' }),
    fieldsToUpdate: NoteRequestUpdateSchema,
  })
  .openapi({
    title: 'UpdateEbookNote',
    description: 'Schema for updating an ebook note',
  });

export const deleteNoteSchema = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid noteId' })
  .openapi({
    title: 'DeleteEbookNote',
    description: 'Schema for deleting an ebook note',
  });

export const NoteResponseSchema = z
  .object({
    _id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid ObjectId' }),
    appId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid appId' }),
    owner: z.object({
      _id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid userId' }),
      firstname: z.string(),
      lastname: z.string(),
    }),
    data: z.object({
      recipients: z.array(
        z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid userId' })
      ),
      location: z.record(z.any()),
      y: z.number(),
      x: z.number(),
      text: z.string(),
      image: z.string().nullable(),
      audio: z.string().nullable(),
    }),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi({
    title: 'EbookNotesResponseSchema',
    description: 'Ebook Note Response Schema',
  });

export const NoteSchema = z
  .object({
    _id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid ObjectId' }),
    appId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid appId' }),
    owner: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid userId' }),
    data: NoteDataSchema,
  })
  .openapi({
    title: 'EbookNotes',
    description: 'Ebook Note model',
  });
