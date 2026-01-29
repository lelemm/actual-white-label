// @ts-strict-ignore
// This file will initialize the app if we are in a real browser
// environment (not electron)
import './browser-preload';
import './fonts.scss';
import './i18n';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { type NavigateFunction } from 'react-router';

import { bindActionCreators } from '@reduxjs/toolkit';

import { send } from 'loot-core/platform/client/fetch';
import { q } from 'loot-core/shared/query';

import * as appSlice from './app/appSlice';
import { AuthProvider } from './auth/AuthProvider';
import { App } from './components/App';
import { ServerProvider } from './components/ServerContext';
import * as filesSlice from './files/filesSlice';
import * as modalsSlice from './modals/modalsSlice';
import * as notificationsSlice from './notifications/notificationsSlice';
import * as prefsSlice from './prefs/prefsSlice';
import { aqlQuery } from './queries/aqlQuery';
import { store } from './redux/store';
import { redo, undo } from './undo';
import * as usersSlice from './users/usersSlice';

const boundActions = bindActionCreators(
  {
    ...appSlice.actions,
    ...filesSlice.actions,
    ...modalsSlice.actions,
    ...notificationsSlice.actions,
    ...prefsSlice.actions,
    ...usersSlice.actions,
  },
  store.dispatch,
);

async function appFocused() {
  await send('app-focused');
}

async function uploadFileWeb(filename: string, contents: ArrayBuffer) {
  await send('upload-file-web', {
    filename,
    contents,
  });
}

function inputFocused(e: KeyboardEvent) {
  const target = e.target as HTMLElement | null;
  return (
    target?.tagName === 'INPUT' ||
    target?.tagName === 'TEXTAREA' ||
    target?.isContentEditable === true
  );
}

// Expose this to the main process to menu items can access it
// Note: uploadFile in actions expects UploadFilePayload, but menu items use (filename, contents) signature
// We need to provide both signatures - the menu one and the Redux one
const menuActions = {
  ...boundActions,
  undo,
  redo,
  appFocused,
  uploadFile: uploadFileWeb,
} as typeof boundActions & {
  undo: typeof undo;
  redo: typeof redo;
  appFocused: typeof appFocused;
  uploadFile: typeof uploadFileWeb;
};

window.__actionsForMenu = menuActions;

// Expose send for fun!
window.$send = send;
window.$query = aqlQuery;
window.$q = q;

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <Provider store={store}>
    <ServerProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ServerProvider>
  </Provider>,
);

declare global {
  // oxlint-disable-next-line typescript/consistent-type-definitions
  interface Window {
    __navigate?: NavigateFunction;
    __actionsForMenu: typeof menuActions;

    $send: typeof send;
    $query: typeof aqlQuery;
    $q: typeof q;
  }
}

document.addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey) {
    // Cmd/Ctrl+o
    if (e.key === 'o') {
      e.preventDefault();
      window.__actionsForMenu.closeFile();
    }
    // Cmd/Ctrl+z
    else if (e.key.toLowerCase() === 'z') {
      if (inputFocused(e)) {
        return;
      }
      e.preventDefault();
      if (e.shiftKey) {
        // Redo
        window.__actionsForMenu.redo();
      } else {
        // Undo
        window.__actionsForMenu.undo();
      }
    }
  }
});
