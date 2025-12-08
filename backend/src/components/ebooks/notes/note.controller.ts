import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '@middleware/async';
import { NoteService } from './note.service';
import { getNotesSchema, createNoteSchema, updateNoteSchema, deleteNoteSchema } from './note-validate.schema';
import { ZodError } from 'zod';
import mongoose from 'mongoose';

export class NoteController {
  private noteService: NoteService;

  constructor() {
    this.noteService = new NoteService();
  }

  getNotes = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { userId, appId } = getNotesSchema.parse({ userId: req.user._id.toString(), appId: req.params.appId });
      const result = await this.noteService.getNotes(userId, appId);
      return res.status(200).json(result);
    } catch (error) {
      const statusCode =
        error instanceof ZodError ||
        error instanceof mongoose.Error.ValidationError ||
        error?.constructor?.name === 'DocumentNotFoundError'
          ? 400
          : 500;
      return res.status(statusCode).json({
        statusCode,
        message: statusCode === 400 ? 'Not found error' : 'Internal server error',
        error: error?.constructor?.name || '',
      });
    }
  });

  createNote = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { userId, appId, data } = createNoteSchema.parse({
        userId: req.user._id.toString(),
        appId: req.params.appId,
        data: req.body,
      });
      const newNote = await this.noteService.createNote(userId, appId, data);
      return res.status(200).json(newNote);
    } catch (error) {
      const statusCode =
        error instanceof ZodError ||
        error instanceof mongoose.Error.ValidationError ||
        error?.constructor?.name === 'DocumentNotFoundError'
          ? 400
          : 500;
      return res.status(statusCode).json({
        statusCode,
        message: statusCode === 400 ? 'Not found error' : 'Internal server error',
        error: error?.constructor?.name || '',
      });
    }
  });

  updateNote = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { noteId, fieldsToUpdate } = updateNoteSchema.parse({
        noteId: req.params.noteId,
        fieldsToUpdate: req.body,
      });
      const updatedNote = await this.noteService.updateNote(noteId, fieldsToUpdate);
      return res.status(200).json(updatedNote);
    } catch (error) {
      const statusCode =
        error instanceof ZodError ||
        error instanceof mongoose.Error.ValidationError ||
        error?.constructor?.name === 'DocumentNotFoundError'
          ? 400
          : 500;
      return res.status(statusCode).json({
        statusCode,
        message: statusCode === 400 ? 'Not found error' : 'Internal server error',
        error: error?.constructor?.name || '',
      });
    }
  });

  deleteNote = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const noteId = deleteNoteSchema.parse(req.params.noteId);
      await this.noteService.deleteNote(noteId);
      return res.status(204).end();
    } catch (error) {
      const statusCode =
        error instanceof ZodError ||
        error instanceof mongoose.Error.ValidationError ||
        error?.constructor?.name === 'DocumentNotFoundError'
          ? 400
          : 500;
      return res.status(statusCode).json({
        statusCode,
        message: statusCode === 400 ? 'Not found error' : 'Internal server error',
        error: error?.constructor?.name || '',
      });
    }
  });
}
