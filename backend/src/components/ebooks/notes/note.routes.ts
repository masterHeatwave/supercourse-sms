import express from 'express';
import { NoteController } from './note.controller';
import { authorize } from '@middleware/authorize';
import { Role } from '@middleware/constants/role';

const router = express.Router();
const noteController = new NoteController();

//Returns an array with all user's notes for the specified appId
router.get('/:appId', authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER, Role.STUDENT]), noteController.getNotes);

//Store a new note object in mongoDB
router.post('/:appId', authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER, Role.STUDENT]), noteController.createNote);

//Update a note object in mongoDB
router.put('/:noteId', authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER, Role.STUDENT]), noteController.updateNote);

//Delete a note object in mongoDB
router.delete('/:noteId', authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER, Role.STUDENT]), noteController.deleteNote);

export default router;
