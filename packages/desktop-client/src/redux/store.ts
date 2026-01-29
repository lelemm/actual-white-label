import {
  combineReducers,
  configureStore,
  createListenerMiddleware,
  isRejected,
} from '@reduxjs/toolkit';

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
  addNotification,
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

const rootReducer = combineReducers({
  [appSliceName]: appSliceReducer,
  [filesSliceName]: filesSliceReducer,
  [modalsSliceName]: modalsSliceReducer,
  [notificationsSliceName]: notificationsSliceReducer,
  [prefsSliceName]: prefsSliceReducer,
  [usersSliceName]: usersSliceReducer,
});

const notifyOnRejectedActionsMiddleware = createListenerMiddleware();
notifyOnRejectedActionsMiddleware.startListening({
  matcher: isRejected,
  effect: (action, { dispatch }) => {
    console.error(action.error);
    dispatch(
      addNotification({
        notification: {
          id: action.type,
          type: 'error',
          message: action.error.message || 'An unexpected error occurred.',
        },
      }),
    );
  },
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      // TODO: Fix this in a separate PR. Remove non-serializable states in the store.
      serializableCheck: false,
    }).prepend(notifyOnRejectedActionsMiddleware.middleware),
});

export type AppStore = typeof store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type GetRootState = typeof store.getState;
