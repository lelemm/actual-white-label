# Creating New Entities in White-Label

This guide explains how to add a new entity type to the white-label application. An "entity" is a domain object that needs to be stored, synced, and managed (e.g., `patients`, `appointments`, `inventory_items`, etc.). This guide covers the complete flow from database to UI, including integration with the rules system.

## Overview: Entity Creation Flow

```
1. Database Schema (migrations/init.sql)
   ↓
2. AQL Schema Definition (server/aql/schema/index.ts)
   ↓
3. Type Definitions (types/models/entity-name.ts)
   ↓
4. Entity Type Registration (for rules system)
   ↓
5. Server Handlers (server/entity-name/app.ts)
   ↓
6. Redux Slice (desktop-client/src/entity-name/entityNameSlice.ts)
   ↓
7. UI Components (desktop-client/src/components/entity-name/)
   ↓
8. Sidebar Integration
   ↓
9. Routing Configuration
```

## Choosing Your UI Pattern

Before implementing the UI, decide which pattern fits your entity:

### Path A: In-Place Table Editor (like Notes)

**Use this when:**
- Users need to quickly edit multiple records
- Data is tabular (rows and columns)
- Fields are simple (text, numbers, constrained values)
- Bulk editing is common
- Keyboard navigation improves productivity

**Features:**
- Full table with inline editing
- Uses `Table`, `Row`, `Cell`, `CustomCell`, `Input`
- Keyboard navigation via `useTableNavigator`
- Autocomplete support for constrained fields
- Sticky headers with proper styling

**Example:** Notes entity (`packages/desktop-client/src/components/notes/NotesTable.tsx`)

### Path B: Simple Page View (like Products)

**Use this when:**
- Records have complex structures
- Detail views are important
- Modals/forms are preferred for editing
- Visual hierarchy matters more than speed
- Cards or lists better represent the data

**Features:**
- Card/list-based layout
- No inline editing (use modals or detail pages)
- Simpler state management
- Better for complex entities or detail-heavy views

**Example:** Products entity (`packages/desktop-client/src/components/products/ProductsList.tsx`)

---

## Common Setup Steps (Both Paths)

These steps apply regardless of which UI pattern you choose:

### 1. Database Schema (Migration)

**File**: `packages/loot-core/migrations/init.sql`

Add your table definition to the initial schema. The white-label version uses a single `init.sql` file (no incremental migrations).

```sql
-- Example: Creating a "patients" entity
CREATE TABLE patients
  (id TEXT PRIMARY KEY,
   name TEXT NOT NULL,
   email TEXT,
   phone TEXT,
   created_date TEXT,
   tombstone INTEGER DEFAULT 0);
```

**Key Points:**

- Always include `id TEXT PRIMARY KEY` (UUIDs are used)
- Always include `tombstone INTEGER DEFAULT 0` for soft deletes
- Use `TEXT` for strings, `INTEGER` for numbers/booleans, `REAL` for floats
- Use `NOT NULL` for required fields
- Consider indexes for frequently queried fields

### 2. AQL Schema Definition

**File**: `packages/loot-core/src/server/aql/schema/index.ts`

Add your entity to the AQL schema. This defines the query API and type system.

```typescript
export const schema = {
  // ... existing entities

  patients: {
    id: f('id'),
    name: f('string', { required: true }),
    email: f('string'),
    phone: f('string'),
    created_date: f('date'),
    tombstone: f('boolean'),
  },
};
```

**Field Types:**

- `f('id')` - UUID identifier
- `f('string')` - Text field
- `f('integer')` - Number field
- `f('boolean')` - Boolean field
- `f('date')` - Date field
- `f('json')` - JSON blob
- `f('float')` - Floating point number

**Options:**

- `{ required: true }` - Field is required
- `{ ref: 'other_entity' }` - Foreign key reference
- `{ default: value }` - Default value

### 3. Type Definitions

**File**: `packages/loot-core/src/types/models/patient.ts`

Create TypeScript types for your entity. The entity should implement the `RuleTarget` interface if you want rules to work with it.

```typescript
import { type RuleTarget } from '../rules-entity';

export type NewPatientEntity = {
  name: string;
  email?: string;
  phone?: string;
  created_date?: string;
  tombstone?: boolean;
};

export type PatientEntity = {
  id: string;
} & NewPatientEntity;

// Implement RuleTarget interface for rules support
export function patientToRuleTarget(patient: PatientEntity): RuleTarget {
  return {
    id: patient.id,
    date: patient.created_date,
    notes: patient.name, // or any text field
    // Add any other fields that should be available in rules
    ...patient,
  };
}
```

**File**: `packages/loot-core/src/types/models/index.ts`

Export your new type:

```typescript
export * from './patient';
```

### 4. Entity Type Registration (for Rules System)

**File**: `packages/loot-core/src/server/entity-types.ts` or `packages/loot-core/src/server/main.ts`

Register your entity type with the rules system so that rules can operate on entities of this type.

```typescript
import { entityTypeRegistry } from '../types/rules-entity';

// Register entity types at application startup
export function registerEntityTypes() {
  // Example: Register "patients" entity type
  entityTypeRegistry.register({
    id: 'patient',
    displayName: 'Patient',
    defaultFields: {
      date: true,  // Use created_date as date field
      notes: true, // Use name or description as notes field
      amount: false, // No amount field for patients
    },
    fields: {
      name: {
        type: 'string',
        required: true,
        displayName: 'Name',
      },
      email: {
        type: 'string',
        displayName: 'Email',
      },
      phone: {
        type: 'string',
        displayName: 'Phone',
      },
    },
  });

  // Register other entity types...
}

// Call this during application initialization
registerEntityTypes();
```

**Key Points:**

- **`id`**: Unique identifier for the entity type (e.g., `'patient'`, `'appointment'`)
- **`displayName`**: Human-readable name shown in the UI
- **`defaultFields`**: Enable standard fields (`date`, `notes`, `amount`) if your entity has them
- **`fields`**: Define all fields that should be available in rules
- **Field Types**: Use `'string'`, `'number'`, `'boolean'`, `'date'`, or `'id'`
- **`required`**: Mark required fields
- **`displayName`**: Human-readable field name for the UI

### 5. Server Handlers

**File**: `packages/loot-core/src/server/patients/app.ts`

Create server-side handlers for CRUD operations.

```typescript
import { createApp } from '../app';
import { mutator } from '../mutators';
import { undoable } from '../undo';
import * as db from '../db';
import { type PatientEntity, type NewPatientEntity } from '../../types/models';

export type PatientsHandlers = {
  'patients-get': typeof getPatients;
  'patient-get': typeof getPatient;
  'patient-create': typeof createPatient;
  'patient-update': typeof updatePatient;
  'patient-delete': typeof deletePatient;
};

export const app = createApp<PatientsHandlers>();

app.method('patients-get', getPatients);
app.method('patient-get', getPatient);
app.method('patient-create', mutator(undoable(createPatient)));
app.method('patient-update', mutator(undoable(updatePatient)));
app.method('patient-delete', mutator(undoable(deletePatient)));

async function getPatients(): Promise<PatientEntity[]> {
  return await db.all<PatientEntity>(
    `SELECT * FROM patients WHERE tombstone = 0 ORDER BY name`,
  );
}

async function getPatient(id: string): Promise<PatientEntity | null> {
  return await db.first<PatientEntity>(
    `SELECT * FROM patients WHERE id = ? AND tombstone = 0`,
    [id],
  );
}

async function createPatient(patient: NewPatientEntity): Promise<string> {
  const id = await db.insertWithUUID('patients', {
    ...patient,
    created_date:
      patient.created_date || new Date().toISOString().split('T')[0],
  });
  return id;
}

async function updatePatient(
  id: string,
  updates: Partial<PatientEntity>,
): Promise<void> {
  await db.update('patients', { id }, updates);
}

async function deletePatient(id: string): Promise<void> {
  await db.update('patients', { id }, { tombstone: 1 });
}
```

**Key Points:**

- Use `mutator()` wrapper for write operations (ensures proper sync)
- Use `undoable()` wrapper for undo/redo support
- Always filter by `tombstone = 0` for reads
- Use `insertWithUUID()` for creating new records
- Use `db.update()` for updates (handles CRDT sync automatically)
- **Update payload shape**: client should send a single object `{ id, ...updates }`
  and the server update handler should accept a single object parameter
  (do not pass `id` and `updates` as two separate arguments)

**File**: `packages/loot-core/src/server/main.ts`

Register your app:

```typescript
import { app as patientsApp } from './patients/app';

// In the app.combine() call:
app.combine(
  // ... other apps
  patientsApp,
  // ...
);
```

### 6. Redux Slice

**File**: `packages/desktop-client/src/patients/patientsSlice.ts`

Create a Redux slice for client-side state management.

```typescript
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { send } from 'loot-core/platform/client/fetch';
import { type PatientEntity } from 'loot-core/types/models';
import { createAppAsyncThunk } from '@desktop-client/redux';
import { resetApp } from '@desktop-client/app/appSlice';

const sliceName = 'patients';

type PatientsState = {
  patients: PatientEntity[];
  isPatientsLoading: boolean;
  isPatientsLoaded: boolean;
  isPatientsDirty: boolean;
};

const initialState: PatientsState = {
  patients: [],
  isPatientsLoading: false,
  isPatientsLoaded: false,
  isPatientsDirty: false,
};

const patientsSlice = createSlice({
  name: sliceName,
  initialState,
  reducers: {
    markPatientsDirty(state) {
      state.isPatientsDirty = true;
    },
    setPatients(state, action: PayloadAction<PatientEntity[]>) {
      state.patients = action.payload;
      state.isPatientsLoaded = true;
      state.isPatientsDirty = false;
    },
  },
  extraReducers: builder => {
    builder.addCase(resetApp, () => initialState);

    builder.addCase(getPatients.fulfilled, (state, action) => {
      state.patients = action.payload;
      state.isPatientsLoaded = true;
      state.isPatientsDirty = false;
      state.isPatientsLoading = false;
    });

    builder.addCase(getPatients.pending, state => {
      state.isPatientsLoading = true;
    });

    builder.addCase(getPatients.rejected, state => {
      state.isPatientsLoading = false;
    });

    // Similar for create, update, delete...
  },
});

export const getPatients = createAppAsyncThunk(
  `${sliceName}/getPatients`,
  async () => {
    const patients: PatientEntity[] = await send('patients-get');
    return patients;
  },
  {
    condition: (_, { getState }) => {
      const { patients } = getState();
      return (
        !patients.isPatientsLoading &&
        (patients.isPatientsDirty || !patients.isPatientsLoaded)
      );
    },
  },
);

export const createPatient = createAppAsyncThunk(
  `${sliceName}/createPatient`,
  async (patient: Omit<PatientEntity, 'id'>) => {
    const id = await send('patient-create', patient);
    return { ...patient, id };
  },
);

export const updatePatient = createAppAsyncThunk(
  `${sliceName}/updatePatient`,
  async ({ id, ...updates }: Partial<PatientEntity> & { id: string }) => {
    await send('patient-update', { id, ...updates });
    return { id, ...updates };
  },
);

export const deletePatient = createAppAsyncThunk(
  `${sliceName}/deletePatient`,
  async (id: string) => {
    await send('patient-delete', id);
    return id;
  },
);

export const { name, reducer, getInitialState } = patientsSlice;
export const { setPatients, markPatientsDirty } = patientsSlice.actions;
```

**File**: `packages/desktop-client/src/redux/store.ts`

Register your slice:

```typescript
import {
  name as patientsSliceName,
  reducer as patientsSliceReducer,
} from '@desktop-client/patients/patientsSlice';

const rootReducer = combineReducers({
  // ... other slices
  [patientsSliceName]: patientsSliceReducer,
  // ...
});
```

### 7. Sidebar Integration

**For main sidebar items** (like Notes):

**File**: `packages/desktop-client/src/components/sidebar/Sidebar.tsx`

```typescript
import { Item } from './Item';
import { SvgYourIcon } from '@actual-app/components/icons/v1';

// In the View containing PrimaryButtons:
<Item
  title={t('Your Entity')}
  Icon={SvgYourIcon}
  to="/your-entity"
/>
<PrimaryButtons />
```

**For "More" menu items** (like Products):

**File**: `packages/desktop-client/src/components/sidebar/PrimaryButtons.tsx`

```typescript
import { SecondaryItem } from './SecondaryItem';
import { SvgYourIcon } from '@actual-app/components/icons/v1';

// Inside the isOpen conditional:
<SecondaryItem
  title={t('Your Entity')}
  Icon={SvgYourIcon}
  to="/your-entity"
  indent={15}
/>
```

### 8. Routing Configuration

**File**: `packages/desktop-client/src/components/FinancesApp.tsx`

Add your route:

```typescript
import { YourEntityComponent } from './your-entity/YourEntityComponent';

// In Routes:
<Route path="/your-entity" element={<YourEntityComponent />} />
```

---

## Path A: In-Place Table Editor Implementation

This path creates a table-based UI with inline editing, similar to the Notes entity.

### Page Header Pattern

Create a consistent page header with title, icon, and actions:

```typescript
<View
  style={{
    padding: '20px 20px 16px 20px',
    borderBottom: '1px solid ' + theme.tableBorder,
    backgroundColor: theme.pageBackground,
  }}
>
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    }}
  >
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <SvgYourIcon width={24} height={24} />
      <Text style={{ fontSize: 28, fontWeight: 600 }}>
        <Trans>Your Entity</Trans>
      </Text>
    </View>
    <Button onPress={handleCreate}>
      <SvgAdd width={16} height={16} />
      <Text style={{ marginLeft: 5 }}>
        <Trans>Add Item</Trans>
      </Text>
    </Button>
  </View>
  {itemsCount > 0 && (
    <Text style={{ fontSize: 14, color: theme.pageTextLight, marginLeft: 34 }}>
      <Trans>{itemsCount} {itemsCount === 1 ? 'item' : 'items'}</Trans>
    </Text>
  )}
</View>
```

### Table Header Implementation

Use the `TableHeader` component for proper styling:

```typescript
import { TableHeader } from '@desktop-client/components/table';

<Table
  headers={
    <TableHeader>
      <Cell name="field1" width={200}>
        <Trans>Field 1</Trans>
      </Cell>
      <Cell name="field2" width="flex">
        <Trans>Field 2</Trans>
      </Cell>
      <Cell name="delete" width={80} plain />
    </TableHeader>
  }
  // ... rest of table props
/>
```

**Key Points:**
- `TableHeader` provides consistent styling (font weight 500, proper z-index, borders)
- Use `Cell` components for each column
- Set `plain` prop for action columns (like delete)

### Table Setup with Navigator

```typescript
import {
  Table,
  Row,
  InputCell,
  AutocompleteCell,
  DeleteCell,
  useTableNavigator,
} from '@desktop-client/components/table';

export function YourEntityTable() {
  const dispatch = useDispatch();
  const { items, isItemsLoading } = useSelector(state => state.yourEntity);
  const tableRef = useRef<TableHandleRef>(null);

  // Set up navigator with field names
  const navigator = useTableNavigator(items || [], () => [
    'field1',
    'field2',
    'field3',
  ]);

  // ... handlers

  return (
    <Table
      ref={tableRef}
      items={items || []}
      navigator={navigator}
      style={{ flex: 1 }}
      headers={/* ... */}
      renderItem={({ item, editing, focusedField, onEdit }) => (
        <Row key={item.id} id={item.id}>
          {/* Cells here */}
        </Row>
      )}
    />
  );
}
```

### Text Input Cells

For simple text fields, use `InputCell` directly:

```typescript
<InputCell
  name="field1"
  width={200}
  value={item.field1}
  exposed={editing && focusedField === 'field1'}
  onExpose={() => onEdit(item.id, 'field1')}
  onUpdate={value => handleUpdate(item.id, 'field1', value)}
/>
```

**Key Points:**
- `InputCell` is a complete editable cell component
- `exposed` controls whether the cell is in edit mode
- `onExpose` is called when the user clicks to edit
- `onUpdate` is called with the new value when editing is complete (blur or Enter/Tab)

### Autocomplete Cells

For constrained value fields (status, priority, category):

```typescript
import { AutocompleteCell } from '@desktop-client/components/table';

const statusOptions = [
  { id: 'draft', name: 'Draft' },
  { id: 'active', name: 'Active' },
  { id: 'archived', name: 'Archived' },
];

<AutocompleteCell
  name="status"
  width={120}
  value={item.status || 'active'}
  options={statusOptions}
  exposed={editing && focusedField === 'status'}
  onExpose={() => onEdit(item.id, 'status')}
  onUpdate={value => handleUpdate(item.id, 'status', value)}
/>
```

**See**: `CREATING_AUTOCOMPLETE.md` for detailed autocomplete documentation.

### Delete Cell

```typescript
<DeleteCell
  name="delete"
  onDelete={() => handleDelete(item.id)}
  width={80}
/>
```

### Empty State

```typescript
renderEmpty={
  <View
    style={{
      padding: 60,
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <SvgYourIcon
      width={48}
      height={48}
      style={{ marginBottom: 16, opacity: 0.3 }}
    />
    <Text
      style={{
        color: theme.pageTextLight,
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 8,
      }}
    >
      <Trans>No items yet</Trans>
    </Text>
    <Text style={{ color: theme.pageTextLight, fontSize: 14, textAlign: 'center' }}>
      <Trans>Click "Add Item" to create one.</Trans>
    </Text>
  </View>
}
```

### Complete Example: Notes Entity

See `packages/desktop-client/src/components/notes/NotesTable.tsx` for a complete reference implementation with:
- Page header with count
- TableHeader component
- Text input cells
- Autocomplete cells for Priority and Status
- Delete cells
- Empty state

---

## Path B: Simple Page View Implementation

This path creates a card/list-based UI without inline editing, similar to the Products entity.

### Page Header Pattern

Same header pattern as Path A:

```typescript
<View
  style={{
    padding: '20px 20px 16px 20px',
    borderBottom: '1px solid ' + theme.tableBorder,
    backgroundColor: theme.pageBackground,
  }}
>
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    }}
  >
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <SvgYourIcon width={24} height={24} />
      <Text style={{ fontSize: 28, fontWeight: 600 }}>
        <Trans>Your Entity</Trans>
      </Text>
    </View>
    <Button onPress={handleCreate}>
      <SvgAdd width={16} height={16} />
      <Text style={{ marginLeft: 5 }}>
        <Trans>Add Item</Trans>
      </Text>
    </Button>
  </View>
  {itemsCount > 0 && (
    <Text style={{ fontSize: 14, color: theme.pageTextLight, marginLeft: 34 }}>
      <Trans>{itemsCount} {itemsCount === 1 ? 'item' : 'items'}</Trans>
    </Text>
  )}
</View>
```

### List/Card Layout

```typescript
<View
  style={{
    border: '1px solid ' + theme.tableBorder,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: theme.tableBackground,
  }}
>
  {items.map((item, index) => (
    <View
      key={item.id}
      style={{
        padding: 15,
        borderBottom:
          index < items.length - 1
            ? '1px solid ' + theme.tableBorder
            : 'none',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.tableRowBackground,
        ':hover': {
          backgroundColor: theme.tableRowBackgroundHover,
        },
        transition: 'background-color 0.15s',
      }}
    >
      <View style={{ flex: 1 }}>
        {/* Item content */}
      </View>
      <Button
        variant="bare"
        onPress={() => handleDelete(item.id)}
        style={{ color: theme.errorText }}
      >
        <Trans>Delete</Trans>
      </Button>
    </View>
  ))}
</View>
```

### Empty State

```typescript
{items.length === 0 ? (
  <View
    style={{
      padding: 60,
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <SvgYourIcon
      width={48}
      height={48}
      style={{ marginBottom: 16, opacity: 0.3 }}
    />
    <Text
      style={{
        color: theme.pageTextLight,
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 8,
      }}
    >
      <Trans>No items yet</Trans>
    </Text>
    <Text style={{ color: theme.pageTextLight, fontSize: 14, textAlign: 'center' }}>
      <Trans>Click "Add Item" to create one.</Trans>
    </Text>
  </View>
) : (
  /* List content */
)}
```

### Complete Example: Products Entity

See `packages/desktop-client/src/components/products/ProductsList.tsx` for a complete reference implementation with:
- Page header with count
- Card-based list layout
- Hover states
- Empty state
- Edit button with modal
- Delete functionality

---

## Adding Edit Modals to Entity Pages

When you need a modal dialog for editing entities (common for Path B), follow this pattern:

### 1. Define the Modal Type

**File**: `packages/desktop-client/src/modals/modalsSlice.ts`

First, import your entity type and add a new modal definition to the `Modal` type union:

```typescript
import {
  // ... other imports
  type ProductEntity,
} from 'loot-core/types/models';

export type Modal =
  // ... other modal types
  | {
      name: 'edit-product';
      options: {
        product: ProductEntity;
        onSave?: (product: ProductEntity) => void;
      };
    }
  // ... other modal types
;
```

**Key Points:**
- The `name` should be unique and descriptive (e.g., `'edit-product'`, `'edit-patient'`)
- The `options` object contains data passed to the modal
- Include an optional `onSave` callback for post-save actions

### 2. Create the Modal Component

**File**: `packages/desktop-client/src/components/modals/EditProductModal.tsx`

```typescript
import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { Input } from '@actual-app/components/input';
import { SpaceBetween } from '@actual-app/components/space-between';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

import { type ProductEntity } from 'loot-core/types/models';

import {
  Modal,
  ModalCloseButton,
  ModalHeader,
} from '@desktop-client/components/common/Modal';
import {
  FormField,
  FormLabel,
} from '@desktop-client/components/forms';
import {
  popModal,
  type Modal as ModalType,
} from '@desktop-client/modals/modalsSlice';
import { updateProduct } from '@desktop-client/products/productsSlice';
import { useDispatch } from '@desktop-client/redux';

// Extract props type from the modal definition
type EditProductModalProps = Extract<
  ModalType,
  { name: 'edit-product' }
>['options'];

export function EditProductModal({
  product: defaultProduct,
  onSave: originalOnSave,
}: EditProductModalProps) {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  // Local state for form fields
  const [name, setName] = useState(defaultProduct.name);
  const [description, setDescription] = useState(defaultProduct.description || '');
  const [error, setError] = useState('');

  const handleSave = async () => {
    // Validation
    if (!name.trim()) {
      setError(t('Name is required.'));
      return;
    }

    const updatedProduct: ProductEntity = {
      ...defaultProduct,
      name: name.trim(),
      description: description.trim(),
    };

    // Dispatch the update action
    await dispatch(updateProduct(updatedProduct));
    
    // Call the optional onSave callback
    originalOnSave?.(updatedProduct);
    
    // Close the modal
    dispatch(popModal());
  };

  return (
    <Modal name="edit-product">
      {({ state: { close } }) => (
        <>
          <ModalHeader
            title={t('Edit Product')}
            rightContent={<ModalCloseButton onPress={close} />}
          />
          <View style={{ padding: '0 10px' }}>
            {/* Form fields */}
            <SpaceBetween style={{ marginTop: 10 }}>
              <FormField style={{ flex: 1 }}>
                <FormLabel title={t('Name')} htmlFor="product-name-field" />
                <Input
                  id="product-name-field"
                  value={name}
                  onChangeValue={setName}
                  style={{ borderColor: theme.buttonMenuBorder }}
                />
              </FormField>
            </SpaceBetween>

            {/* Action buttons */}
            <SpaceBetween
              gap={10}
              style={{
                marginTop: 20,
                marginBottom: 10,
                justifyContent: 'flex-end',
              }}
            >
              {error && <Text style={{ color: theme.errorText }}>{error}</Text>}
              <Button variant="bare" onPress={close}>
                <Trans>Cancel</Trans>
              </Button>
              <Button variant="primary" onPress={handleSave}>
                <Trans>Save</Trans>
              </Button>
            </SpaceBetween>
          </View>
        </>
      )}
    </Modal>
  );
}
```

**Key Points:**
- Use `Extract<ModalType, { name: 'edit-product' }>['options']` to get type-safe props
- The `Modal` component receives a render function with `state: { close }`
- Use `popModal()` to close the modal programmatically
- Use `close` from the render function for the Cancel button

### 3. Register the Modal in Modals.tsx

**File**: `packages/desktop-client/src/components/Modals.tsx`

Import and add the modal to the switch statement:

```typescript
import { EditProductModal } from './modals/EditProductModal';

// In the switch statement:
case 'edit-product':
  return <EditProductModal key={key} {...modal.options} />;
```

### 4. Add the Edit Button to Your List Component

**File**: `packages/desktop-client/src/components/products/ProductsList.tsx`

Import `pushModal` and create a handler:

```typescript
import { pushModal } from '@desktop-client/modals/modalsSlice';
import { type ProductEntity } from 'loot-core/types/models';

export function ProductsList() {
  const dispatch = useDispatch();

  // Handler to open the edit modal
  const handleEdit = (product: ProductEntity) => {
    dispatch(
      pushModal({
        modal: {
          name: 'edit-product',
          options: {
            product,
            // Optional: callback after save
            onSave: (updatedProduct) => {
              console.log('Product saved:', updatedProduct);
            },
          },
        },
      }),
    );
  };

  return (
    // ... in your item render
    <Button variant="bare" onPress={() => handleEdit(product)}>
      <Trans>Edit</Trans>
    </Button>
  );
}
```

### Modal Pattern Summary

The modal system follows this flow:

```
1. Button Click
   ↓
2. dispatch(pushModal({ modal: { name, options } }))
   ↓
3. modalsSlice adds modal to modalStack
   ↓
4. Modals.tsx renders modal based on name
   ↓
5. User interacts with modal form
   ↓
6. Save: dispatch(updateEntity) + dispatch(popModal())
   Cancel: close() from modal state
   ↓
7. Modal removed from stack, UI updates
```

### Reference Files

- **Modal Type Definitions**: `packages/desktop-client/src/modals/modalsSlice.ts`
- **Modal Registry**: `packages/desktop-client/src/components/Modals.tsx`
- **Base Modal Component**: `packages/desktop-client/src/components/common/Modal.tsx`
- **Example Edit Modal**: `packages/desktop-client/src/components/modals/EditProductModal.tsx`
- **Example with Modal Button**: `packages/desktop-client/src/components/products/ProductsList.tsx`

---

## Complete Example Checklist

When creating a new entity, ensure you've covered:

- [ ] **Database**: Added table to `migrations/init.sql`
- [ ] **AQL Schema**: Added entity definition to `server/aql/schema/index.ts`
- [ ] **Types**: Created `types/models/entity-name.ts` and exported in `types/models/index.ts`
- [ ] **Entity Type Registration**: Registered entity type with `entityTypeRegistry` for rules support
- [ ] **Server Handlers**: Created `server/entity-name/app.ts` with CRUD operations
- [ ] **Server Registration**: Added app to `server/main.ts` combine call
- [ ] **Redux Slice**: Created `desktop-client/src/entity-name/entityNameSlice.ts`
- [ ] **Redux Registration**: Added slice to `desktop-client/src/redux/store.ts`
- [ ] **UI Components**: Created components in `desktop-client/src/components/entity-name/`
- [ ] **Page Header**: Implemented consistent header pattern
- [ ] **Sidebar Integration**: Added to sidebar (main or More menu)
- [ ] **Routing**: Added routes in `desktop-client/src/components/FinancesApp.tsx`
- [ ] **Empty State**: Implemented empty state with icon and message
- [ ] **Edit Modal** (if using Path B): Added modal type, created modal component, registered in Modals.tsx
- [ ] **Sync Event Reload**: Reload slice in `sync-events.ts` when table changes
- [ ] **Type Checking**: Run `yarn typecheck` to verify types
- [ ] **Testing**: Add tests for server handlers and Redux slice
- [ ] **Rules Support**: Verify rules can be created for this entity type

## CRDT Sync Integration

The white-label core uses CRDT (Conflict-free Replicated Data Types) for synchronization. When you use `db.insert()`, `db.update()`, or `db.delete()` through the mutator system, changes are automatically:

1. Recorded in `messages_crdt` table
2. Synced to other devices/clients
3. Applied via the sync system

**Important**: Always use `mutator()` wrapper for write operations to ensure proper CRDT sync.

### Sync Event Reloads (Client)

When a sync event is applied, the client must reload any Redux slices backed by the tables included in that event. For new entities, add a reload to the sync event handler so changes survive reloads and remote updates:

- **File**: `packages/desktop-client/src/sync-events.ts`
- **Pattern**:

```typescript
if (tables.includes('your_entity_table')) {
  store.dispatch(getYourEntities());
}
```

This ensures entity data is re-fetched when sync changes are applied (local or remote).

## Rules System Integration

Once you've registered your entity type, users can create rules that operate on entities of that type:

1. **Entity Type Selection**: When creating a rule, users select your entity type from a dropdown
2. **Dynamic Fields**: Only fields you've defined for the entity type are available in conditions/actions
3. **Field Validation**: Operations are validated against field types (e.g., numeric operations only on number fields)
4. **Rule Execution**: Rules can filter and modify entities based on the defined conditions and actions

**Example Rule for Patients:**

```typescript
{
  entityType: 'patient',
  conditions: [
    { field: 'age', op: 'gt', value: 18 },
    { field: 'active', op: 'is', value: true },
  ],
  actions: [
    { field: 'notes', op: 'set', value: 'Adult patient' },
  ],
}
```

## Best Practices

1. **Soft Deletes**: Always use `tombstone` field instead of hard deletes
2. **UUIDs**: Use `insertWithUUID()` for generating IDs
3. **Mutators**: Wrap all write operations with `mutator()`
4. **Undo/Redo**: Wrap mutations with `undoable()` for undo support
5. **Loading States**: Track loading/loaded/dirty states in Redux
6. **Type Safety**: Use TypeScript types throughout the stack
7. **Error Handling**: Handle errors in async thunks and display notifications
8. **Optimistic Updates**: Consider optimistic updates for better UX
9. **Entity Type Registration**: Register entity types early in application initialization
10. **Field Definitions**: Define all fields that should be available in rules, even if they're not in the UI yet
11. **Page Headers**: Use consistent header pattern for all entity pages
12. **Empty States**: Always provide helpful empty states with icons and clear messaging

## Additional Resources

- **Rules Entity System**: See `RULES_ENTITY_SYSTEM.md` for details on the generic rules system
- **Entity Type Registry**: See `types/rules-entity.ts` for the registry API
- **Example Registration**: See `types/rules-entity-example.ts` for example entity type registrations
- **Autocomplete Guide**: See `CREATING_AUTOCOMPLETE.md` for adding autocomplete fields
- **Reference Implementations**: 
  - Notes (Path A - Table Editor): `packages/desktop-client/src/components/notes/NotesTable.tsx`
  - Products (Path B - Simple Page with Edit Modal): `packages/desktop-client/src/components/products/ProductsList.tsx`
  - Edit Modal: `packages/desktop-client/src/components/modals/EditProductModal.tsx`
