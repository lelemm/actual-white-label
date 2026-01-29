// @ts-strict-ignore
import { getClock } from '@actual-app/crdt';

import * as connection from '../platform/server/connection';
import { logger } from '../platform/server/log';
import {
  getDownloadError,
  getSyncError,
  getTestKeyError,
} from '../shared/errors';
import { type Handlers } from '../types/handlers';
import { type ServerHandlers } from '../types/server-handlers';

import { aqlQuery } from './aql';
import * as cloudStorage from './cloud-storage';
import { type RemoteFile } from './cloud-storage';
import * as db from './db';
import { APIError } from './errors';
import { runMutator } from './mutators';
import * as prefs from './prefs';
import * as sheet from './sheet';
import { batchMessages, setSyncingMode } from './sync';

let IMPORT_MODE = false;

// The API is different in two ways: we never want undo enabled, and
// we also need to notify the UI manually if stuff has changed (if
// they are connecting to an already running instance, the UI should
// update). The wrapper handles that.
function withMutation<Params extends Array<unknown>, ReturnType>(
  handler: (...args: Params) => Promise<ReturnType>,
) {
  return (...args: Params) => {
    return runMutator(
      async () => {
        const latestTimestamp = getClock().timestamp.toString();
        const result = await handler(...args);

        const rows = await db.all<Pick<db.DbCrdtMessage, 'dataset'>>(
          'SELECT DISTINCT dataset FROM messages_crdt WHERE timestamp > ?',
          [latestTimestamp],
        );

        // Only send the sync event if anybody else is connected
        if (connection.getNumClients() > 1) {
          connection.send('sync-event', {
            type: 'success',
            tables: rows.map(row => row.dataset),
          });
        }

        return result;
      },
      { undoDisabled: true },
    );
  };
}

let handlers = {} as unknown as Handlers;

// Budget-specific validation functions removed for white-label version

function checkFileOpen() {
  if (!(prefs.getPrefs() || {}).id) {
    throw APIError('No file is open');
  }
}

let batchPromise = null;

handlers['api/batch-budget-start'] = async function () {
  if (batchPromise) {
    throw APIError('Cannot start a batch process: batch already started');
  }

  // If we are importing, all we need to do is start a raw database
  // transaction. Updating spreadsheet cells doesn't go through the
  // syncing layer in that case.
  if (IMPORT_MODE) {
    db.asyncTransaction(() => {
      return new Promise((resolve, reject) => {
        batchPromise = { resolve, reject };
      });
    });
  } else {
    batchMessages(() => {
      return new Promise((resolve, reject) => {
        batchPromise = { resolve, reject };
      });
    });
  }
};

handlers['api/batch-budget-end'] = async function () {
  if (!batchPromise) {
    throw APIError('Cannot end a batch process: no batch started');
  }

  batchPromise.resolve();
  batchPromise = null;
};

handlers['api/load-file'] = async function ({ id }) {
  const { id: currentId } = prefs.getPrefs() || {};

  if (currentId !== id) {
    connection.send('start-load');
    const { error } = await handlers['load-file']({ id });

    if (!error) {
      connection.send('finish-load');
    } else {
      connection.send('show-files');

      throw new Error(getSyncError(error, id));
    }
  }
};

handlers['api/download-file'] = async function ({ syncId, password }) {
  const { id: currentId } = prefs.getPrefs() || {};
  if (currentId) {
    await handlers['close-file']();
  }

  const files = await handlers['get-files']();
  const localFile = files.find(b => b.groupId === syncId);
  let remoteFile: RemoteFile;

  // Load a remote file if we could not find the file locally
  if (!localFile) {
    const remoteFiles = await handlers['get-remote-files']();
    if (!remoteFiles) {
      throw new Error('Could not get remote files');
    }
    const file = remoteFiles.find(f => f.groupId === syncId);
    if (!file) {
      throw new Error(
        `File "${syncId}" not found. Check the sync id of your file in the Advanced section of the settings page.`,
      );
    }

    remoteFile = file;
  }

  const activeFile = remoteFile ? remoteFile : localFile;

  // Set the e2e encryption keys
  if (activeFile.encryptKeyId) {
    if (!password) {
      throw new Error(
        `File ${activeFile.name} is encrypted. Please provide a password.`,
      );
    }

    const result = await handlers['key-test']({
      cloudFileId: remoteFile ? remoteFile.fileId : localFile.cloudFileId,
      password,
    });
    if (result.error) {
      throw new Error(getTestKeyError(result.error));
    }
  }

  // Sync the local file
  if (localFile) {
    await handlers['load-file']({ id: localFile.id });
    const result = await handlers['sync-file']();
    if (result.error) {
      throw new Error(getSyncError(result.error, localFile.id));
    }
    return;
  }

  // Download the remote file (no need to perform a sync as the file will already be up-to-date)
  const result = await handlers['download-file']({
    cloudFileId: remoteFile.fileId,
  });
  if (result.error) {
    logger.log('Full error details', result.error);
    throw new Error(getDownloadError(result.error));
  }
  await handlers['load-file']({ id: result.id });
};

handlers['api/get-files'] = async function () {
  const files = await handlers['get-files']();
  const remoteFiles = (await handlers['get-remote-files']()) || [];
  // Return files directly (no model transformation needed in white-label)
  return [
    ...files,
    ...remoteFiles.filter(file => file),
  ];
};

handlers['api/sync'] = async function () {
  const { id } = prefs.getPrefs();
  const result = await handlers['sync-file']();
  if (result.error) {
    throw new Error(getSyncError(result.error, id));
  }
};

// Bank sync removed for white-label version

handlers['api/start-import'] = async function ({ fileName }) {
  // Notify UI to close file
  await handlers['close-file']();

  // Create the file
  await handlers['create-file']({ fileName, avoidUpload: true });

  // Turn syncing off
  setSyncingMode('import');

  connection.send('start-import');
  IMPORT_MODE = true;
};

handlers['api/finish-import'] = async function () {
  checkFileOpen();

  sheet.get().markCacheDirty();

  // We always need to fully reload the app. Importing doesn't touch
  // the spreadsheet, but we can't just recreate the spreadsheet
  // either; there is other internal state that isn't created
  const { id } = prefs.getPrefs();
  await handlers['close-file']();
  await handlers['load-file']({ id });
  await sheet.waitOnSpreadsheet();

  await cloudStorage.upload().catch(() => {
    // Ignore errors
  });

  connection.send('finish-import');
  IMPORT_MODE = false;
};

handlers['api/abort-import'] = async function () {
  if (IMPORT_MODE) {
    checkFileOpen();

    const { id } = prefs.getPrefs();

    await handlers['close-file']();
    await handlers['delete-file']({ id });
    connection.send('show-files');
  }

  IMPORT_MODE = false;
};

handlers['api/query'] = async function ({ query }) {
  checkFileOpen();
  return aqlQuery(query);
};

// Budget handlers removed for white-label version

// Budget, transaction, account, category, payee handlers removed for white-label version

handlers['api/rules-get'] = async function () {
  checkFileOpen();
  return handlers['rules-get']();
};

handlers['api/rule-create'] = withMutation(async function ({ rule }) {
  checkFileOpen();
  const addedRule = await handlers['rule-add'](rule);

  if ('error' in addedRule) {
    throw APIError('Failed creating a new rule', addedRule.error);
  }

  return addedRule;
});

handlers['api/rule-update'] = withMutation(async function ({ rule }) {
  checkFileOpen();
  const updatedRule = await handlers['rule-update'](rule);

  if ('error' in updatedRule) {
    throw APIError('Failed updating the rule', updatedRule.error);
  }

  return updatedRule;
});

handlers['api/rule-delete'] = withMutation(async function (id) {
  checkFileOpen();
  return handlers['rule-delete'](id as string);
});

// Schedule handlers removed for white-label version

handlers['api/get-id-by-name'] = async function ({ type, name }) {
  checkFileOpen();
  // Generic ID lookup - types will be defined by implementing application
  throw APIError(`get-id-by-name not implemented in white-label version. Type: ${type}, Name: ${name}`);
};

handlers['api/get-server-version'] = async function () {
  checkFileOpen();
  return handlers['get-server-version']();
};

export function installAPI(serverHandlers: ServerHandlers) {
  const merged = Object.assign({}, serverHandlers, handlers);
  handlers = merged as Handlers;
  return merged;
}
