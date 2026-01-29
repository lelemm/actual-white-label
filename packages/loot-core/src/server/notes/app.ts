import { createApp } from '../app';
import { mutator } from '../mutators';
import { undoable } from '../undo';
import * as db from '../db';
import { type NoteEntity, type NewNoteEntity } from '../../types/models';

export type NotesHandlers = {
  'notes-get': typeof getNotes;
  'note-get': typeof getNote;
  'note-create': typeof createNote;
  'note-update': typeof updateNote;
  'note-delete': typeof deleteNote;
};

export const app = createApp<NotesHandlers>();

app.method('notes-get', getNotes);
app.method('note-get', getNote);
app.method('note-create', mutator(undoable(createNote)));
app.method('note-update', mutator(undoable(updateNote)));
app.method('note-delete', mutator(undoable(deleteNote)));

async function getNotes(): Promise<NoteEntity[]> {
  return await db.all<NoteEntity>(
    `SELECT * FROM notes WHERE tombstone = 0 ORDER BY created_date DESC, title`,
  );
}

async function getNote(id: string): Promise<NoteEntity | null> {
  return await db.first<NoteEntity>(
    `SELECT * FROM notes WHERE id = ? AND tombstone = 0`,
    [id],
  );
}

async function createNote(note: NewNoteEntity): Promise<string> {
  const now = new Date().toISOString().split('T')[0];
  const id = await db.insertWithUUID('notes', {
    ...note,
    created_date: note.created_date || now,
    updated_date: note.updated_date || now,
  });
  return id;
}

async function updateNote({
  id,
  ...updates
}: Partial<NoteEntity> & { id: string }): Promise<void> {
  const updated_date = new Date().toISOString().split('T')[0];
  await db.update('notes', { id, ...updates, updated_date });
}

async function deleteNote(id: string): Promise<void> {
  await db.update('notes', { id, tombstone: 1 });
}
