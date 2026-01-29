import { type RuleTarget } from '../rules-entity';

export type NewNoteEntity = {
  title: string;
  content?: string;
  priority?: string;
  status?: string;
  created_date?: string;
  updated_date?: string;
  tombstone?: boolean;
};

export type NoteEntity = {
  id: string;
} & NewNoteEntity;

// Implement RuleTarget interface for rules support
export function noteToRuleTarget(note: NoteEntity): RuleTarget {
  return {
    id: note.id,
    date: note.created_date,
    notes: note.content || note.title,
    ...note,
  };
}
