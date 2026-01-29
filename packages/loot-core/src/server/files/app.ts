// @ts-strict-ignore
import * as CRDT from '@actual-app/crdt';

import { captureBreadcrumb, captureException } from '../../platform/exceptions';
import * as asyncStorage from '../../platform/server/asyncStorage';
import * as connection from '../../platform/server/connection';
import * as fs from '../../platform/server/fs';
import { logger } from '../../platform/server/log';
import * as Platform from '../../shared/platform';
import { type File } from '../../types/budget';
import { createApp } from '../app';
import * as cloudStorage from '../cloud-storage';
import * as db from '../db';
import { app as mainApp } from '../main-app';
import { mutator } from '../mutators';
import * as prefs from '../prefs';
import { getServer } from '../server-config';
import * as sheet from '../sheet';
import { clearFullSyncTimeout, initialFullSync, setSyncingMode } from '../sync';
import * as syncMigrations from '../sync/migrate';
import { clearUndo } from '../undo';
import { updateVersion } from '../update';
import {
  idFromFileName,
  uniqueFileName,
  validateFileName,
} from '../util/file-name';

import {
  loadBackup as _loadBackup,
  makeBackup as _makeBackup,
  getAvailableBackups,
  startBackupService,
  stopBackupService,
} from './backups';

const DEMO_FILE_ID = '_demo-file';
const TEST_FILE_ID = '_test-file';

export type FileHandlers = {
  'validate-file-name': typeof handleValidateFileName;
  'unique-file-name': typeof handleUniqueFileName;
  'get-files': typeof getFiles;
  'get-remote-files': typeof getRemoteFiles;
  'reset-file-cache': typeof resetFileCache;
  'upload-file': typeof uploadFile;
  'download-file': typeof downloadFile;
  'sync-file': typeof syncFile;
  'load-file': typeof loadFile;
  'create-demo-file': typeof createDemoFile;
  'close-file': typeof closeFile;
  'delete-file': typeof deleteFile;
  'duplicate-file': typeof duplicateFile;
  'create-file': typeof createFile;
  'import-file': typeof importFile;
  'export-file': typeof exportFile;
  'upload-file-web': typeof uploadFileWeb;
  'backups-get': typeof getBackups;
  'backup-load': typeof loadBackup;
  'backup-make': typeof makeBackup;
  'get-last-opened-backup': typeof getLastOpenedBackup;
};

export const app = createApp<FileHandlers>();
app.method('validate-file-name', handleValidateFileName);
app.method('unique-file-name', handleUniqueFileName);
app.method('get-files', getFiles);
app.method('get-remote-files', getRemoteFiles);
app.method('reset-file-cache', mutator(resetFileCache));
app.method('upload-file', uploadFile);
app.method('download-file', downloadFile);
app.method('sync-file', syncFile);
app.method('load-file', loadFile);
app.method('create-demo-file', createDemoFile);
app.method('close-file', closeFile);
app.method('delete-file', deleteFile);
app.method('duplicate-file', duplicateFile);
app.method('create-file', createFile);
app.method('import-file', importFile);
app.method('export-file', exportFile);
app.method('upload-file-web', uploadFileWeb);
app.method('backups-get', getBackups);
app.method('backup-load', loadBackup);
app.method('backup-make', makeBackup);
app.method('get-last-opened-backup', getLastOpenedBackup);

async function handleValidateFileName({ name }: { name: string }) {
  return validateFileName(name);
}

async function handleUniqueFileName({ name }: { name: string }) {
  return uniqueFileName(name);
}

async function getFiles() {
  const paths = await fs.listDir(fs.getDocumentDir());
  const files: (File | null)[] = await Promise.all(
    paths.map(async name => {
      const prefsPath = fs.join(fs.getDocumentDir(), name, 'metadata.json');
      if (await fs.exists(prefsPath)) {
        let prefs;
        try {
          prefs = JSON.parse(await fs.readFile(prefsPath));
        } catch (e) {
          logger.log('Error parsing metadata:', e.stack);
          return null;
        }

        // We treat the directory name as the canonical id so that if
        // the user moves it around/renames/etc, nothing breaks. The
        // id is stored in prefs just for convenience (and the prefs
        // will always update to the latest given id)
        if (name !== DEMO_FILE_ID) {
          return {
            id: name,
            ...(prefs.cloudFileId ? { cloudFileId: prefs.cloudFileId } : {}),
            ...(prefs.encryptKeyId ? { encryptKeyId: prefs.encryptKeyId } : {}),
            ...(prefs.groupId ? { groupId: prefs.groupId } : {}),
            ...(prefs.owner ? { owner: prefs.owner } : {}),
            name: prefs.fileName || prefs.budgetName || '(no name)',
          } satisfies File;
        }
      }

      return null;
    }),
  );

  return files.filter(Boolean) as File[];
}

async function getRemoteFiles() {
  return cloudStorage.listRemoteFiles();
}

async function resetFileCache() {
  // Recomputing everything will update the cache
  // loadUserBudgets removed in white-label version
  sheet.get().recomputeAll();
  await sheet.waitOnSpreadsheet();
}

async function uploadFile({ id }: { id?: File['id'] } = {}): Promise<{
  error?: { reason: string };
}> {
  if (id) {
    if (prefs.getPrefs()) {
      throw new Error('upload-file: id given but prefs already loaded');
    }

    await prefs.loadPrefs(id);
  }

  try {
    await cloudStorage.upload();
  } catch (e) {
    logger.log(e);
    if (e.type === 'FileUploadError') {
      return { error: e };
    }
    captureException(e);
    return { error: { reason: 'internal' } };
  } finally {
    if (id) {
      prefs.unloadPrefs();
    }
  }

  return {};
}

async function downloadFile({
  cloudFileId,
}: {
  cloudFileId: File['cloudFileId'];
}): Promise<{ id?: File['id']; error?: { reason: string; meta?: unknown } }> {
  let result;
  try {
    result = await cloudStorage.download(cloudFileId);
  } catch (e) {
    if (e.type === 'FileDownloadError') {
      if (e.reason === 'file-exists' && e.meta.id) {
        await prefs.loadPrefs(e.meta.id);
        const prefsData = prefs.getPrefs();
        const name = prefsData.fileName || '';
        prefs.unloadPrefs();

        e.meta = { ...e.meta, name };
      }

      return { error: e };
    } else {
      captureException(e);
      return { error: { reason: 'internal' } };
    }
  }

  const id = result.id;
  await closeFile();
  await loadFile({ id });
  result = await syncFile();

  if (result.error) {
    return result;
  }
  return { id };
}

// open and sync, but don't close
async function syncFile() {
  setSyncingMode('enabled');
  const result = await initialFullSync();

  return result;
}

async function loadFile({ id }: { id: File['id'] }) {
  const currentPrefs = prefs.getPrefs();

  if (currentPrefs) {
    if (currentPrefs.id === id) {
      // If it's already loaded, do nothing
      return {};
    } else {
      // Otherwise, close the currently loaded file
      await closeFile();
    }
  }

  const res = await _loadFile(id);

  return res;
}

async function createDemoFile() {
  // Make sure the read only flag isn't leftover (normally it's
  // reset when signing in, but you don't have to sign in for the
  // demo file)
  await asyncStorage.setItem('readOnly', '');

  return createFile({
    fileName: 'Demo File',
    testMode: true,
    testFileId: DEMO_FILE_ID,
  });
}

async function closeFile() {
  captureBreadcrumb({ message: 'Closing file' });

  // The spreadsheet may be running, wait for it to complete
  await sheet.waitOnSpreadsheet();
  sheet.unloadSpreadsheet();

  clearFullSyncTimeout();
  await mainApp.stopServices();

  await db.closeDatabase();

  try {
    await asyncStorage.setItem('lastFile', '');
  } catch {
    // This might fail if we are shutting down after failing to load a
    // file. We want to unload whatever has already been loaded but
    // be resilient to anything failing
  }

  prefs.unloadPrefs();
  await stopBackupService();
  return 'ok';
}

async function deleteFile({
  id,
  cloudFileId,
}: {
  id?: File['id'];
  cloudFileId?: File['cloudFileId'];
}) {
  // If it's a cloud file, you can delete it from the server by
  // passing its cloud id
  if (cloudFileId) {
    await cloudStorage.removeFile(cloudFileId).catch(() => {
      // Ignore errors
    });
  }

  // If a local file exists, you can delete it by passing its local id
  if (id) {
    // opening and then closing the database is a hack to be able to delete
    // the file if it hasn't been opened yet.  This needs a better
    // way, but works for now.
    try {
      await db.openDatabase(id);
      await db.closeDatabase();
      const fileDir = fs.getFileDir(id);
      await fs.removeDirRecursively(fileDir);
    } catch {
      return 'fail';
    }
  }

  return 'ok';
}

async function duplicateFile({
  id,
  newName,
  cloudSync,
  open,
}: {
  id: File['id'];
  newName: File['name'];
  cloudSync: boolean;
  open: 'none' | 'original' | 'copy';
}): Promise<File['id']> {
  const { valid, message } = await validateFileName(newName);
  if (!valid) throw new Error(message);

  const fileDir = fs.getFileDir(id);

  const newId = await idFromFileName(newName);

  // copy metadata from current file
  // replace id with new file id and fileName with new file name
  const metadataText = await fs.readFile(fs.join(fileDir, 'metadata.json'));
  const metadata = JSON.parse(metadataText);
  metadata.id = newId;
  metadata.fileName = newName;
  // Support legacy budgetName field
  if (metadata.budgetName) {
    delete metadata.budgetName;
  }
  [
    'cloudFileId',
    'groupId',
    'lastUploaded',
    'encryptKeyId',
    'lastSyncedTimestamp',
  ].forEach(item => {
    if (metadata[item]) delete metadata[item];
  });

  try {
    const newFileDir = fs.getFileDir(newId);
    await fs.mkdir(newFileDir);

    // write metadata for new file
    await fs.writeFile(
      fs.join(newFileDir, 'metadata.json'),
      JSON.stringify(metadata),
    );

    await fs.copyFile(
      fs.join(fileDir, 'db.sqlite'),
      fs.join(newFileDir, 'db.sqlite'),
    );
  } catch (error) {
    // Clean up any partially created files
    try {
      const newFileDir = fs.getFileDir(newId);
      if (await fs.exists(newFileDir)) {
        await fs.removeDirRecursively(newFileDir);
      }
    } catch {} // Ignore cleanup errors
    throw new Error(`Failed to duplicate file: ${error.message}`);
  }

  // load in and validate
  const { error } = await _loadFile(newId);
  if (error) {
    logger.log('Error duplicating file: ' + error);
    return error;
  }

  if (cloudSync) {
    try {
      await cloudStorage.upload();
    } catch (error) {
      logger.warn('Failed to sync duplicated file to cloud:', error);
      // Ignore any errors uploading. If they are offline they should
      // still be able to create files.
    }
  }

  await closeFile();
  if (open === 'original') await _loadFile(id);
  if (open === 'copy') await _loadFile(newId);

  return newId;
}

async function createFile({
  fileName,
  avoidUpload,
  testMode,
  testFileId,
}: {
  fileName?: File['name'];
  avoidUpload?: boolean;
  testMode?: boolean;
  testFileId?: File['name'];
} = {}) {
  let id;
  if (testMode) {
    fileName = fileName || 'Test File';
    id = testFileId || TEST_FILE_ID;

    if (await fs.exists(fs.getFileDir(id))) {
      await fs.removeDirRecursively(fs.getFileDir(id));
    }
  } else {
    // Generate file name if not given
    if (!fileName) {
      fileName = await uniqueFileName();
    }

    id = await idFromFileName(fileName);
  }

  const fileDir = fs.getFileDir(id);
  await fs.mkdir(fileDir);

  // Create the initial database
  await fs.copyFile(fs.bundledDatabasePath, fs.join(fileDir, 'db.sqlite'));

  // Create the initial prefs file
  await fs.writeFile(
    fs.join(fileDir, 'metadata.json'),
    JSON.stringify(prefs.getDefaultPrefs(id, fileName)),
  );

  // Load it in
  const { error } = await _loadFile(id);
  if (error) {
    logger.log('Error creating file: ' + error);
    return { error };
  }

  if (!avoidUpload && !testMode) {
    try {
      await cloudStorage.upload();
    } catch {
      // Ignore any errors uploading. If they are offline they should
      // still be able to create files.
    }
  }

  // Test budget creation removed for white-label version

  return {};
}

async function importFile({
  filepath,
}: {
  filepath: string;
}): Promise<{ error?: string }> {
  // Import functionality removed for white-label version
  return { error: 'import-not-supported' };
}

async function exportFile() {
  try {
    return {
      data: await cloudStorage.exportBuffer(),
    };
  } catch (err) {
    err.message = 'Error exporting file: ' + err.message;
    captureException(err);
    return { error: 'internal-error' };
  }
}

function onSheetChange({ names }: { names: string[] }) {
  const nodes = names.map(name => {
    const node = sheet.get()._getNode(name);
    return { name: node.name, value: node.value };
  });
  connection.send('cells-changed', nodes);
}

async function _loadFile(id: File['id']): Promise<{
  error?:
    | 'file-not-found'
    | 'loading-file'
    | 'out-of-sync-migrations'
    | 'out-of-sync-data'
    | 'opening-file';
}> {
  let dir: string;
  try {
    dir = fs.getFileDir(id);
  } catch (e) {
    captureException(
      new Error('`getFileDir` failed in `loadFile`: ' + e.message),
    );
    return { error: 'file-not-found' };
  }

  captureBreadcrumb({ message: 'Loading file ' + dir });

  if (!(await fs.exists(dir))) {
    captureException(new Error('file directory does not exist'));
    return { error: 'file-not-found' };
  }

  try {
    await prefs.loadPrefs(id);
    await db.openDatabase(id);
  } catch (e) {
    captureBreadcrumb({ message: 'Error loading file ' + id });
    captureException(e);
    await closeFile();
    return { error: 'opening-file' };
  }

  // Older versions didn't tag the file with the current user, so do
  // so now
  if (!prefs.getPrefs().userId) {
    const userId = await asyncStorage.getItem('user-token');
    await prefs.savePrefs({ userId });
  }

  try {
    await updateVersion();
  } catch (e) {
    logger.warn('Error updating', e);
    let result;
    if (e.message.includes('out-of-sync-migrations')) {
      result = { error: 'out-of-sync-migrations' };
    } else if (e.message.includes('out-of-sync-data')) {
      result = { error: 'out-of-sync-data' };
    } else {
      captureException(e);
      logger.info('Error updating file ' + id, e);
      logger.log('Error updating file', e);
      result = { error: 'loading-file' };
    }

    await closeFile();
    return result;
  }

  await db.loadClock();

  if (prefs.getPrefs().resetClock) {
    // If we need to generate a fresh clock, we need to generate a new
    // client id. This happens when the database is transferred to a
    // new device.
    //
    // TODO: The client id should be stored elsewhere. It shouldn't
    // work this way, but it's fine for now.
    CRDT.getClock().timestamp.setNode(CRDT.makeClientId());
    await db.runQuery(
      'INSERT OR REPLACE INTO messages_clock (id, clock) VALUES (1, ?)',
      [CRDT.serializeClock(CRDT.getClock())],
    );

    await prefs.savePrefs({ resetClock: false });
  }

  if (!Platform.isBrowser && process.env.NODE_ENV !== 'test') {
    await startBackupService(id);
  }

  try {
    await sheet.loadSpreadsheet(db, onSheetChange);
  } catch (e) {
    captureException(e);
    await closeFile();
    return { error: 'opening-file' };
  }

  // Load all the in-memory state
  await syncMigrations.listen();
  await mainApp.startServices();

  clearUndo();

  // Ensure that syncing is enabled
  if (process.env.NODE_ENV !== 'test') {
    if (id === DEMO_FILE_ID) {
      setSyncingMode('disabled');
    } else {
      if (getServer()) {
        setSyncingMode('enabled');
      } else {
        setSyncingMode('disabled');
      }

      await asyncStorage.setItem('lastFile', id);

      await cloudStorage.possiblyUpload();
    }
  } else {
    // we're in a test - disable the sync
    setSyncingMode('disabled');
  }

  app.events.emit('load-file', { id });

  return {};
}

async function uploadFileWeb({
  filename,
  contents,
}: {
  filename: string;
  contents: ArrayBuffer;
}) {
  if (!Platform.isBrowser) {
    return null;
  }

  await fs.writeFile('/uploads/' + filename, contents);
  return {};
}

async function getBackups({ id }) {
  return getAvailableBackups(id);
}

async function loadBackup({ id, backupId }) {
  await _loadBackup(id, backupId);
}

async function makeBackup({ id }) {
  await _makeBackup(id);
}

async function getLastOpenedBackup() {
  const id = await asyncStorage.getItem('lastFile');
  if (id && id !== '') {
    const fileDir = fs.getFileDir(id);

    // We never want to give back a file that does not exist on the
    // filesystem anymore, so first check that it exists
    if (await fs.exists(fileDir)) {
      return id;
    }
  }
  return null;
}
