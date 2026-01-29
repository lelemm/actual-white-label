import React, { type ReactNode } from 'react';
import { Provider } from 'react-redux';

import { combineReducers, configureStore } from '@reduxjs/toolkit';

import { type store as realStore } from './store';

// Budget-specific slices removed in white-label version
import {
  name as appSliceName,
  reducer as appSliceReducer,
} from '@desktop-client/app/appSlice';
import {
  name as filesSliceName,
  reducer as filesSliceReducer,
} from '@desktop-client/files/filesSlice';
import {
  name as modalsSliceName,
  reducer as modalsSliceReducer,
} from '@desktop-client/modals/modalsSlice';
import {
  name as notificationsSliceName,
  reducer as notificationsSliceReducer,
} from '@desktop-client/notifications/notificationsSlice';
import {
  name as prefsSliceName,
  reducer as prefsSliceReducer,
} from '@desktop-client/prefs/prefsSlice';
import {
  name as usersSliceName,
  reducer as usersSliceReducer,
} from '@desktop-client/users/usersSlice';

const appReducer = combineReducers({
  [appSliceName]: appSliceReducer,
  [filesSliceName]: filesSliceReducer,
  [modalsSliceName]: modalsSliceReducer,
  [notificationsSliceName]: notificationsSliceReducer,
  [prefsSliceName]: prefsSliceReducer,
  [usersSliceName]: usersSliceReducer,
});

export let mockStore: typeof realStore = configureStore({
  reducer: appReducer,
});

export function resetMockStore() {
  mockStore = configureStore({
    reducer: appReducer,
  });
}

export function TestProvider({ children }: { children: ReactNode }) {
  return <Provider store={mockStore}>{children}</Provider>;
}
