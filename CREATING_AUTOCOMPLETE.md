# Creating Autocomplete Fields

This guide explains how to add autocomplete functionality to entity fields in the white-label application. Autocomplete is useful for fields with constrained value sets (like status, priority, category) where users should select from predefined options rather than typing free-form text.

## When to Use Autocomplete

Use autocomplete when:

- **Constrained value sets**: The field should only accept specific predefined values (e.g., status: `['draft', 'active', 'archived']`)
- **Frequently reused values**: Users often select from the same set of values
- **Data consistency**: You want to ensure consistent values across records (e.g., avoiding typos like "Active" vs "active")
- **Better UX**: Providing suggestions improves discoverability and reduces typing

**Don't use autocomplete for:**
- Free-form text fields (names, descriptions, notes)
- Numeric fields (use number inputs)
- Fields with thousands of options (use search/filter instead)

## Basic Autocomplete Setup

The white-label application uses the `Autocomplete` component from `@desktop-client/components/autocomplete`. This component is built on Downshift for accessibility and keyboard navigation.

### Options Format

Autocomplete options must follow this structure:

```typescript
type AutocompleteOption = {
  id: string;   // The value stored in the database
  name: string; // The display text shown to users
};

const priorityOptions = [
  { id: 'low', name: 'Low' },
  { id: 'normal', name: 'Normal' },
  { id: 'high', name: 'High' },
  { id: 'urgent', name: 'Urgent' },
];
```

**Key Points:**
- `id` is the actual value stored (should match your database schema)
- `name` is what users see and search for
- Both fields are required

## Using AutocompleteCell in Tables

For inline editing in table cells, use the `AutocompleteCell` component:

```typescript
import { AutocompleteCell } from '@desktop-client/components/table';

// Define your options
const statusOptions = [
  { id: 'draft', name: 'Draft' },
  { id: 'active', name: 'Active' },
  { id: 'archived', name: 'Archived' },
  { id: 'completed', name: 'Completed' },
];

// In your table row:
<AutocompleteCell
  name="status"
  width={120}
  value={note.status || 'active'}  // Current value (option id)
  options={statusOptions}
  exposed={editing && focusedField === 'status'}
  onExpose={() => onEdit(note.id, 'status')}
  onUpdate={value => handleUpdate(note.id, 'status', value)}
/>
```

### AutocompleteCell Props

- `name`: Field name (used for navigation)
- `width`: Column width (number or `'flex'`)
- `value`: Current selected option ID (string or null)
- `options`: Array of `{ id: string, name: string }` options
- `exposed`: Whether the cell is currently being edited
- `onExpose`: Callback when cell should enter edit mode
- `onUpdate`: Callback when value changes (receives option ID or null)

### Integration with Table Navigator

`AutocompleteCell` automatically integrates with `useTableNavigator`:

```typescript
const navigator = useTableNavigator(notes || [], () => [
  'title',
  'content',
  'priority',  // Include autocomplete fields
  'status',    // Include autocomplete fields
]);

// In renderItem:
<AutocompleteCell
  exposed={editing && focusedField === 'priority'}
  onExpose={() => onEdit(note.id, 'priority')}
  // ... other props
/>
```

## Strict vs Non-Strict Mode

The `AutocompleteCell` component uses **strict mode** by default, which means:

- Users can only select from the provided options
- Typing will filter suggestions but won't create new values
- Invalid values are rejected

**Strict mode is recommended** for most use cases to maintain data consistency.

## Standalone Autocomplete Component

For non-table use cases (forms, modals), use the `Autocomplete` component directly:

```typescript
import { Autocomplete, type AutocompleteItem } from '@desktop-client/components/autocomplete';

const suggestions: AutocompleteItem[] = [
  { id: 'option1', name: 'Option 1' },
  { id: 'option2', name: 'Option 2' },
];

<Autocomplete
  type="single"
  value={selectedOption}
  suggestions={suggestions}
  onSelect={(id: string | null) => {
    setSelectedOption(id);
  }}
  strict={true}
  embedded={false}
/>
```

### Common Autocomplete Props

- `type`: `'single'` (default) or `'multi'` for multi-select
- `value`: Currently selected option(s)
- `suggestions`: Array of options
- `onSelect`: Callback when selection changes
- `strict`: Whether to only allow predefined options (default: `false` for standalone)
- `embedded`: Whether autocomplete is embedded in a table (affects styling)
- `focused`: Whether input should be focused
- `clearOnBlur`: Clear input on blur (default: `true`)
- `closeOnBlur`: Close dropdown on blur (default: `true`)
- `closeOnSelect`: Close dropdown on selection (default: `true`)

## Multi-Select Autocomplete

For fields that accept multiple values:

```typescript
<Autocomplete
  type="multi"
  value={selectedOptions}  // Array of option IDs
  suggestions={suggestions}
  onSelect={(ids: string[]) => {
    setSelectedOptions(ids);
  }}
/>
```

Multi-select displays selected items as pills that can be removed individually.

## Custom Rendering

You can customize how options are displayed:

```typescript
<Autocomplete
  suggestions={suggestions}
  renderItems={(items, getItemProps, highlightedIndex) => (
    <div>
      {items.map((item, index) => (
        <div
          key={item.id}
          {...getItemProps({ item })}
          style={{
            padding: 8,
            backgroundColor: highlightedIndex === index ? '#f0f0f0' : 'white',
          }}
        >
          <strong>{item.name}</strong>
          {item.description && <div>{item.description}</div>}
        </div>
      ))}
    </div>
  )}
/>
```

## Example: Priority Field

Here's a complete example for a Priority field in a Notes entity:

```typescript
// 1. Define options
const priorityOptions = [
  { id: 'low', name: 'Low' },
  { id: 'normal', name: 'Normal' },
  { id: 'high', name: 'High' },
  { id: 'urgent', name: 'Urgent' },
];

// 2. Use in table
<AutocompleteCell
  name="priority"
  width={120}
  value={note.priority || 'normal'}
  options={priorityOptions}
  exposed={editing && focusedField === 'priority'}
  onExpose={() => onEdit(note.id, 'priority')}
  onUpdate={value => handleUpdate(note.id, 'priority', value)}
/>

// 3. Handle updates in your handler
const handleUpdate = (id: string, field: keyof NoteEntity, value: unknown) => {
  dispatch(updateNote({ id, [field]: value }));
};
```

## Example: Status Field

```typescript
const statusOptions = [
  { id: 'draft', name: 'Draft' },
  { id: 'active', name: 'Active' },
  { id: 'archived', name: 'Archived' },
  { id: 'completed', name: 'Completed' },
];

<AutocompleteCell
  name="status"
  width={120}
  value={note.status || 'active'}
  options={statusOptions}
  exposed={editing && focusedField === 'status'}
  onExpose={() => onEdit(note.id, 'status')}
  onUpdate={value => handleUpdate(note.id, 'status', value)}
/>
```

## Database Considerations

When storing autocomplete values:

1. **Use the option ID**: Store `'active'` not `'Active'` (the ID, not the name)
2. **Default values**: Provide sensible defaults in your schema or application code
3. **Validation**: Consider adding CHECK constraints or enum types in your database
4. **Migration**: If adding autocomplete to existing fields, migrate existing values to match option IDs

Example migration:

```sql
-- Update existing values to match option IDs
UPDATE notes 
SET status = 'active' 
WHERE status IN ('Active', 'ACTIVE', 'active');
```

## Keyboard Navigation

The autocomplete component supports full keyboard navigation:

- **Arrow Up/Down**: Navigate through suggestions
- **Enter**: Select highlighted suggestion
- **Escape**: Cancel and revert to original value
- **Tab**: Move to next field (saves current value)
- **Typing**: Filter suggestions

## Accessibility

The `Autocomplete` component includes:

- ARIA labels and roles
- Keyboard navigation support
- Screen reader announcements
- Focus management

## Best Practices

1. **Keep option lists manageable**: Limit to 20-30 options for best UX
2. **Use descriptive names**: Option names should be clear and self-explanatory
3. **Provide defaults**: Always have a sensible default value
4. **Sort logically**: Order options by frequency of use or logical grouping
5. **Consistent casing**: Use consistent casing (e.g., all lowercase IDs, Title Case names)
6. **Internationalization**: Use translation keys for option names if your app is multilingual

## Reference Implementation

See the Notes entity implementation for a complete example:

- **File**: `packages/desktop-client/src/components/notes/NotesTable.tsx`
- **Fields**: Priority and Status use `AutocompleteCell`
- **Options**: Defined at component level

This provides a reference for implementing autocomplete fields in your own entities.
