import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { send } from 'loot-core/platform/client/fetch';
import { type NoteEntity } from 'loot-core/types/models';
import { createAppAsyncThunk } from '@desktop-client/redux';
import { resetApp } from '@desktop-client/app/appSlice';

const sliceName = 'notes';

type NotesState = {
  notes: NoteEntity[];
  isNotesLoading: boolean;
  isNotesLoaded: boolean;
  isNotesDirty: boolean;
};

const initialState: NotesState = {
  notes: [],
  isNotesLoading: false,
  isNotesLoaded: false,
  isNotesDirty: false,
};

const notesSlice = createSlice({
  name: sliceName,
  initialState,
  reducers: {
    markNotesDirty(state) {
      state.isNotesDirty = true;
    },
    setNotes(state, action: PayloadAction<NoteEntity[]>) {
      state.notes = action.payload;
      state.isNotesLoaded = true;
      state.isNotesDirty = false;
    },
  },
  extraReducers: builder => {
    builder.addCase(resetApp, () => initialState);

    builder.addCase(getNotes.fulfilled, (state, action) => {
      state.notes = action.payload;
      state.isNotesLoaded = true;
      state.isNotesDirty = false;
      state.isNotesLoading = false;
    });

    builder.addCase(getNotes.pending, state => {
      state.isNotesLoading = true;
    });

    builder.addCase(getNotes.rejected, state => {
      state.isNotesLoading = false;
    });

    builder.addCase(createNote.fulfilled, (state, action) => {
      state.notes.unshift(action.payload);
      state.isNotesDirty = true;
    });

    builder.addCase(updateNote.fulfilled, (state, action) => {
      const index = state.notes.findIndex(n => n.id === action.payload.id);
      if (index !== -1) {
        state.notes[index] = { ...state.notes[index], ...action.payload };
      }
      state.isNotesDirty = true;
    });

    builder.addCase(deleteNote.fulfilled, (state, action) => {
      state.notes = state.notes.filter(n => n.id !== action.payload);
      state.isNotesDirty = true;
    });
  },
});

export const getNotes = createAppAsyncThunk(
  `${sliceName}/getNotes`,
  async () => {
    const notes: NoteEntity[] = await send('notes-get');
    return notes;
  },
  {
    condition: (_, { getState }) => {
      const { notes } = getState();
      return (
        !notes.isNotesLoading &&
        (notes.isNotesDirty || !notes.isNotesLoaded)
      );
    },
  },
);

export const createNote = createAppAsyncThunk(
  `${sliceName}/createNote`,
  async (note: Omit<NoteEntity, 'id'>) => {
    const id = await send('note-create', note);
    return { ...note, id };
  },
);

export const updateNote = createAppAsyncThunk(
  `${sliceName}/updateNote`,
  async ({ id, ...updates }: Partial<NoteEntity> & { id: string }) => {
    await send('note-update', { id, ...updates });
    return { id, ...updates };
  },
);

export const deleteNote = createAppAsyncThunk(
  `${sliceName}/deleteNote`,
  async (id: string) => {
    await send('note-delete', id);
    return id;
  },
);

export const { name, reducer, getInitialState } = notesSlice;
export const { setNotes, markNotesDirty } = notesSlice.actions;
