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
```

## Step-by-Step Guide

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

**File**: `packages/loot-core/src/server/main.ts` or a dedicated initialization file

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
      age: {
        type: 'number',
        displayName: 'Age',
      },
      active: {
        type: 'boolean',
        displayName: 'Active',
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

**Field Type Mapping:**

- `'string'` - Text fields (supports: is, isNot, contains, matches, oneOf, notOneOf, doesNotContain)
- `'number'` - Numeric fields (supports: is, isapprox, isbetween, gt, gte, lt, lte)
- `'boolean'` - Boolean fields (supports: is)
- `'date'` - Date fields (supports: is, isapprox, gt, gte, lt, lte)
- `'id'` - ID/reference fields (supports: is, contains, matches, oneOf, isNot, doesNotContain, notOneOf)

**Example: Appointment Entity Type**

```typescript
entityTypeRegistry.register({
  id: 'appointment',
  displayName: 'Appointment',
  defaultFields: {
    date: true,   // Appointment date
    notes: true,  // Appointment notes/description
    amount: false,
  },
  fields: {
    patientId: {
      type: 'id',
      required: true,
      displayName: 'Patient',
    },
    duration: {
      type: 'number',
      displayName: 'Duration (minutes)',
    },
    confirmed: {
      type: 'boolean',
      displayName: 'Confirmed',
    },
    status: {
      type: 'string',
      displayName: 'Status',
    },
  },
});
```

**When to Register:**

- Register entity types during application initialization (before rules are used)
- Typically in `packages/loot-core/src/server/main.ts` or a dedicated initialization module
- Can be called from the client-side initialization as well if needed

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
    await send('patient-update', id, updates);
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

### 7. UI Components

**File**: `packages/desktop-client/src/components/patients/PatientList.tsx`

Create UI components using your Redux slice.

```typescript
import { useSelector, useDispatch } from '@desktop-client/redux';
import { getPatients, deletePatient } from '@desktop-client/patients/patientsSlice';
import { useEffect } from 'react';

export function PatientList() {
  const dispatch = useDispatch();
  const { patients, isPatientsLoading } = useSelector(state => state.patients);

  useEffect(() => {
    dispatch(getPatients());
  }, [dispatch]);

  if (isPatientsLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Patients</h1>
      {patients.map(patient => (
        <div key={patient.id}>
          <h2>{patient.name}</h2>
          <p>{patient.email}</p>
          <button onClick={() => dispatch(deletePatient(patient.id))}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
```

**File**: `packages/desktop-client/src/components/FinancesApp.tsx`

Add routing:

```typescript
import { PatientList } from './patients/PatientList';

// In Routes:
<Route path="/patients" element={<PatientList />} />
```

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
- [ ] **Routing**: Added routes in `desktop-client/src/components/FinancesApp.tsx`
- [ ] **Type Checking**: Run `yarn typecheck` to verify types
- [ ] **Testing**: Add tests for server handlers and Redux slice
- [ ] **Rules Support**: Verify rules can be created for this entity type

## CRDT Sync Integration

The white-label core uses CRDT (Conflict-free Replicated Data Types) for synchronization. When you use `db.insert()`, `db.update()`, or `db.delete()` through the mutator system, changes are automatically:

1. Recorded in `messages_crdt` table
2. Synced to other devices/clients
3. Applied via the sync system

**Important**: Always use `mutator()` wrapper for write operations to ensure proper CRDT sync.

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

## Example: Full Entity Flow

For a complete working example, see how `rules` entity is implemented:

- **Database**: `migrations/init.sql` (rules table)
- **AQL Schema**: `server/aql/schema/index.ts` (rules definition)
- **Types**: `types/models/rule.ts`
- **Server**: `server/rules/app.ts`
- **Redux**: Components use `send('rules-get')` directly (no slice, but could be added)
- **UI**: `components/rules/ManageRules.tsx`, `components/rules/RuleEditor.tsx`

This provides a reference implementation for creating new entities in the white-label system.

## Additional Resources

- **Rules Entity System**: See `RULES_ENTITY_SYSTEM.md` for details on the generic rules system
- **Entity Type Registry**: See `types/rules-entity.ts` for the registry API
- **Example Registration**: See `types/rules-entity-example.ts` for example entity type registrations
