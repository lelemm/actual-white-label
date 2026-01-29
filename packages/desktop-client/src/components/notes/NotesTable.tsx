import { useCallback, useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgAdd } from '@actual-app/components/icons/v1';
import { SvgFilter } from '@actual-app/components/icons/v1';
import { styles } from '@actual-app/components/styles';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import { getNormalisedString } from 'loot-core/shared/normalisation';

import { Search } from '@desktop-client/components/common/Search';
import {
  AutocompleteCell,
  Cell,
  DeleteCell,
  InputCell,
  Row,
  SelectCell,
  Table,
  useTableNavigator,
} from '@desktop-client/components/table';
import {
  SelectedProvider,
  useSelected,
} from '@desktop-client/hooks/useSelected';
import {
  createNote,
  deleteNote,
  getNotes,
  updateNote,
} from '@desktop-client/notes/notesSlice';
import { useDispatch, useSelector } from '@desktop-client/redux';
import { type NoteEntity } from 'loot-core/types/models';

export function NotesTable() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { notes, isNotesLoading } = useSelector(state => state.notes);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    dispatch(getNotes());
  }, [dispatch]);

  const handleCreate = () => {
    dispatch(
      createNote({
        title: 'New Note',
        content: '',
        priority: 'normal',
        status: 'active',
      }),
    );
  };

  const handleDelete = (id: string) => {
    dispatch(deleteNote(id));
  };

  const handleUpdate = useCallback(
    (id: string, field: keyof NoteEntity, value: unknown) => {
      dispatch(updateNote({ id, [field]: value }));
    },
    [dispatch],
  );

  // Filter notes based on search
  const filteredNotes = useMemo(() => {
    if (!notes) return [];
    if (filter === '') return notes;
    
    const normalizedFilter = getNormalisedString(filter);
    return notes.filter(note => 
      getNormalisedString(note.title || '').includes(normalizedFilter) ||
      getNormalisedString(note.content || '').includes(normalizedFilter) ||
      getNormalisedString(note.priority || '').includes(normalizedFilter) ||
      getNormalisedString(note.status || '').includes(normalizedFilter)
    );
  }, [notes, filter]);

  const navigator = useTableNavigator(filteredNotes || [], () => ['select', 'title', 'content', 'priority', 'status']);
  const selectedInst = useSelected('notes-table', filteredNotes, []);

  // Define autocomplete options
  const priorityOptions = [
    { id: 'low', name: 'Low' },
    { id: 'normal', name: 'Normal' },
    { id: 'high', name: 'High' },
    { id: 'urgent', name: 'Urgent' },
  ];

  const statusOptions = [
    { id: 'draft', name: 'Draft' },
    { id: 'active', name: 'Active' },
    { id: 'archived', name: 'Archived' },
    { id: 'completed', name: 'Completed' },
  ];

  if (isNotesLoading) {
    return (
      <View style={{ padding: 20 }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const notesCount = filteredNotes?.length || 0;
  const totalCount = notes?.length || 0;

  return (
    <SelectedProvider instance={selectedInst}>
      <View style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Page Header */}
        <View
          style={{
            padding: '20px 20px 10px 20px',
            backgroundColor: theme.pageBackground,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View>
              <Text
                style={{
                  ...styles.veryLargeText,
                  fontWeight: 500,
                  marginBottom: 5,
                }}
              >
                <Trans>Notes</Trans>
              </Text>
              <Text style={{ color: theme.pageTextPositive, fontSize: 18 }}>
                {notesCount.toLocaleString()}
                {filter && totalCount !== notesCount && (
                  <Text style={{ color: theme.pageTextLight, fontSize: 14 }}>
                    {' '}
                    <Trans>(of {totalCount.toLocaleString()})</Trans>
                  </Text>
                )}
              </Text>
            </View>
          </View>

          {/* Action bar */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 15,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Button variant="bare" onPress={handleCreate}>
                <SvgAdd width={10} height={10} style={{ marginRight: 5 }} />
                <Trans>Add New</Trans>
              </Button>
              <Button variant="bare">
                <SvgFilter width={12} height={12} style={{ marginRight: 5 }} />
                <Trans>Filter</Trans>
              </Button>
              {selectedInst.items.size > 0 && (
                <Button
                  variant="bare"
                  onPress={() => {
                    for (const id of selectedInst.items) {
                      handleDelete(id);
                    }
                    selectedInst.dispatch({ type: 'select-none' });
                  }}
                  style={{ color: theme.errorText }}
                >
                  <Trans>Delete {selectedInst.items.size} selected</Trans>
                </Button>
              )}
            </View>
            <Search
              placeholder={t('Search...')}
              value={filter}
              onChange={setFilter}
            />
          </View>
        </View>

        {/* Table */}
        <View style={{ flex: 1,backgroundColor: theme.tableBackground }}>
          <Table
            items={filteredNotes || []}
            navigator={navigator}
            style={{ flex: 1 }}
            headers={
              <>
                <SelectCell
                  exposed
                  focused={false}
                  selected={selectedInst.items.size > 0}
                  onSelect={() => {
                    if (selectedInst.items.size > 0) {
                      selectedInst.dispatch({ type: 'select-none' });
                    } else {
                      selectedInst.dispatch({ type: 'select-all' });
                    }
                  }}
                />
                <Cell name="title" width={200} plain>
                  <Trans>Title</Trans>
                </Cell>
                <Cell name="content" width="flex" plain>
                  <Trans>Content</Trans>
                </Cell>
                <Cell name="priority" width={120} plain>
                  <Trans>Priority</Trans>
                </Cell>
                <Cell name="status" width={120} plain>
                  <Trans>Status</Trans>
                </Cell>
                <Cell name="delete" width={50} plain />
              </>
            }
            renderItem={({ item: note, editing, focusedField, onEdit }) => (
              <Row key={note.id} id={note.id}>
                <SelectCell
                  exposed
                  focused={false}
                  selected={selectedInst.items.has(note.id)}
                  onSelect={e => {
                    selectedInst.dispatch({
                      type: 'select',
                      id: note.id,
                      isRangeSelect: e.shiftKey,
                    });
                  }}
                />
                <InputCell
                  name="title"
                  width={200}
                  value={note.title}
                  exposed={editing && focusedField === 'title'}
                  onExpose={() => onEdit(note.id, 'title')}
                  onUpdate={value => handleUpdate(note.id, 'title', value)}
                />

                <InputCell
                  name="content"
                  width="flex"
                  value={note.content || ''}
                  exposed={editing && focusedField === 'content'}
                  onExpose={() => onEdit(note.id, 'content')}
                  onUpdate={value => handleUpdate(note.id, 'content', value)}
                />

                <AutocompleteCell
                  name="priority"
                  width={120}
                  value={note.priority || 'normal'}
                  options={priorityOptions}
                  exposed={editing && focusedField === 'priority'}
                  onExpose={() => onEdit(note.id, 'priority')}
                  onUpdate={value => handleUpdate(note.id, 'priority', value)}
                />

                <AutocompleteCell
                  name="status"
                  width={120}
                  value={note.status || 'active'}
                  options={statusOptions}
                  exposed={editing && focusedField === 'status'}
                  onExpose={() => onEdit(note.id, 'status')}
                  onUpdate={value => handleUpdate(note.id, 'status', value)}
                />

                <DeleteCell
                  name="delete"
                  onDelete={() => handleDelete(note.id)}
                  width={50}
                />
              </Row>
            )}
            renderEmpty={
              <View
                style={{
                  padding: 30,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    color: theme.pageTextLight,
                    fontStyle: 'italic',
                  }}
                >
                  {filter ? (
                    <Trans>No notes matching your search</Trans>
                  ) : (
                    <Trans>No notes</Trans>
                  )}
                </Text>
              </View>
            }
          />
        </View>
      </View>
    </SelectedProvider>
  );
}
