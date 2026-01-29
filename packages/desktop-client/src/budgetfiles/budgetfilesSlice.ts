import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { t } from 'i18next';

import { send } from 'loot-core/platform/client/fetch';
import { type RemoteFile } from 'loot-core/server/cloud-storage';
import { getDownloadError, getSyncError } from 'loot-core/shared/errors';
import { type File } from 'loot-core/types/budget';
import { type Handlers } from 'loot-core/types/handlers';

import { resetApp, setAppState } from '@desktop-client/app/appSlice';
import { closeModal, pushModal } from '@desktop-client/modals/modalsSlice';
import { loadGlobalPrefs, loadPrefs } from '@desktop-client/prefs/prefsSlice';
import { createAppAsyncThunk } from '@desktop-client/redux';
import { signOut } from '@desktop-client/users/usersSlice';

const sliceName = 'files';

export const loadFiles = createAppAsyncThunk(
  `${sliceName}/loadFiles`,
  async (_, { dispatch }) => {
    const files = await send('get-files');

    await dispatch(setFiles({ files }));
  },
);

export const loadRemoteFiles = createAppAsyncThunk(
  `${sliceName}/loadRemoteFiles`,
  async (_, { dispatch }) => {
    const files = await send('get-remote-files');

    await dispatch(setRemoteFiles({ remoteFiles: files }));
  },
);

export const loadAllFiles = createAppAsyncThunk(
  `${sliceName}/loadAllFiles`,
  async (_, { dispatch, getState }) => {
    const files = await send('get-files');
    const remoteFiles = await send('get-remote-files');

    await dispatch(setAllFiles({ files, remoteFiles }));

    return getState().files.allFiles;
  },
);

type LoadFilePayload = {
  id: string;
  // TODO: Is this still needed?
  options?: Record<string, unknown>;
};

export const loadFile = createAppAsyncThunk(
  `${sliceName}/loadFile`,
  async ({ id, options = {} }: LoadFilePayload, { dispatch }) => {
    await dispatch(setAppState({ loadingText: t('Loading...') }));

    // Loading a file may fail
    const { error } = await send('load-file', { id, ...options });

    if (error) {
      const message = getSyncError(error, id);
      if (error === 'out-of-sync-migrations') {
        await dispatch(
          pushModal({ modal: { name: 'out-of-sync-migrations' } }),
        );
      } else if (error === 'out-of-sync-data') {
        // confirm is not available on iOS
        if (typeof window.confirm !== 'undefined') {
          const showBackups = window.confirm(
            message +
              ' ' +
              t(
                'Make sure the app is up-to-date. Do you want to load a backup?',
              ),
          );

          if (showBackups) {
            await dispatch(
              pushModal({ modal: { name: 'load-backup', options: {} } }),
            );
          }
        } else {
          alert(message + ' ' + t('Make sure the app is up-to-date.'));
        }
      } else {
        alert(message);
      }
    } else {
      await dispatch(closeModal());
      await dispatch(loadPrefs());
    }

    await dispatch(setAppState({ loadingText: null }));
  },
);

export const closeFile = createAppAsyncThunk(
  `${sliceName}/closeFile`,
  async (_, { dispatch, getState }) => {
    const prefs = getState().prefs.local;
    if (prefs && prefs.id) {
      await dispatch(resetApp());
      await dispatch(setAppState({ loadingText: t('Closing...') }));
      await send('close-file');
      await dispatch(setAppState({ loadingText: null }));
      if (localStorage.getItem('SharedArrayBufferOverride')) {
        window.location.reload();
      }
    }
  },
);

export const closeFileUI = createAppAsyncThunk(
  `${sliceName}/closeFileUI`,
  async (_, { dispatch, getState }) => {
    const prefs = getState().prefs.local;
    if (prefs && prefs.id) {
      await dispatch(resetApp());
    }
  },
);

type DeleteFilePayload = {
  id?: string;
  cloudFileId?: string;
};

export const deleteFile = createAppAsyncThunk(
  `${sliceName}/deleteFile`,
  async ({ id, cloudFileId }: DeleteFilePayload, { dispatch }) => {
    await send('delete-file', { id, cloudFileId });
    await dispatch(loadAllFiles());
  },
);

type CreateFilePayload = {
  testMode?: boolean;
  demoMode?: boolean;
};

export const createFile = createAppAsyncThunk(
  `${sliceName}/createFile`,
  async (
    { testMode = false, demoMode = false }: CreateFilePayload,
    { dispatch },
  ) => {
    await dispatch(
      setAppState({
        loadingText:
          testMode || demoMode ? t('Making demo...') : t('Creating file...'),
      }),
    );

    if (demoMode) {
      await send('create-demo-file');
    } else {
      await send('create-file', { testMode });
    }

    await dispatch(closeModal());

    await dispatch(loadAllFiles());
    await dispatch(loadPrefs());

    // Set the loadingText to null after we've loaded the budget prefs
    // so that the existing manager page doesn't flash
    await dispatch(setAppState({ loadingText: null }));
  },
);

type DuplicateFilePayload = {
  id?: string | undefined;
  cloudId?: string | undefined;
  oldName: string;
  newName: string;
  managePage?: boolean;
  loadFile: 'none' | 'original' | 'copy';
  /**
   * cloudSync is used to determine if the duplicate file
   * should be synced to the server
   */
  cloudSync: boolean;
};

export const duplicateFile = createAppAsyncThunk(
  `${sliceName}/duplicateFile`,
  async (
    {
      id,
      oldName,
      newName,
      managePage,
      loadFile = 'none',
      cloudSync,
    }: DuplicateFilePayload,
    { dispatch },
  ) => {
    if (!id) {
      throw new Error('Unable to duplicate a file that is not local.');
    }

    try {
      await dispatch(
        setAppState({
          loadingText: t('Duplicating: {{oldName}} to: {{newName}}', {
            oldName,
            newName,
          }),
        }),
      );

      await send('duplicate-file', {
        id,
        newName,
        cloudSync,
        open: loadFile,
      });

      await dispatch(closeModal());

      if (managePage) {
        await dispatch(loadAllFiles());
      }
    } catch (error) {
      console.error('Error duplicating file:', error);
      throw error instanceof Error
        ? error
        : new Error('Error duplicating file: ' + String(error));
    } finally {
      await dispatch(setAppState({ loadingText: null }));
    }
  },
);

type ImportFilePayload = {
  filepath: string;
};

export const importFile = createAppAsyncThunk(
  `${sliceName}/importFile`,
  async ({ filepath }: ImportFilePayload, { dispatch }) => {
    const result = await send('import-file', { filepath });
    if (result && typeof result === 'object' && 'error' in result && result.error) {
      const error = result.error;
      throw new Error(typeof error === 'string' ? error : (error as { message?: string }).message || 'Import failed');
    }

    await dispatch(closeModal());
    await dispatch(loadPrefs());
  },
);

type UploadFilePayload = {
  id?: string;
};

export const uploadFile = createAppAsyncThunk(
  `${sliceName}/uploadFile`,
  async ({ id }: UploadFilePayload, { dispatch }) => {
    const { error } = await send('upload-file', { id });
    if (error) {
      return { error };
    }

    await dispatch(loadAllFiles());
    return {};
  },
);

type CloseAndLoadFilePayload = {
  fileId: string;
};

export const closeAndLoadFile = createAppAsyncThunk(
  `${sliceName}/closeAndLoadFile`,
  async ({ fileId }: CloseAndLoadFilePayload, { dispatch }) => {
    await dispatch(closeFile());
    await dispatch(loadFile({ id: fileId }));
  },
);

type CloseAndDownloadFilePayload = {
  cloudFileId: string;
};

export const closeAndDownloadFile = createAppAsyncThunk(
  `${sliceName}/closeAndDownloadFile`,
  async ({ cloudFileId }: CloseAndDownloadFilePayload, { dispatch }) => {
    await dispatch(closeFile());
    await dispatch(downloadFile({ cloudFileId, replace: true }));
  },
);

type DownloadFilePayload = {
  cloudFileId: string;
  replace?: boolean;
};

export const downloadFile = createAppAsyncThunk(
  `${sliceName}/downloadFile`,
  async (
    { cloudFileId, replace = false }: DownloadFilePayload,
    { dispatch },
  ): Promise<string | null> => {
    await dispatch(
      setAppState({
        loadingText: t('Downloading...'),
      }),
    );

    const { id, error } = await send('download-file', {
      cloudFileId,
    });

    if (error) {
      if (error.reason === 'decrypt-failure') {
        const opts = {
          hasExistingKey: Boolean(
            error.meta &&
            typeof error.meta === 'object' &&
            'isMissingKey' in error.meta &&
            error.meta.isMissingKey,
          ),
          cloudFileId,
          onSuccess: () => {
            dispatch(downloadFile({ cloudFileId, replace }));
          },
        };

        await dispatch(
          pushModal({ modal: { name: 'fix-encryption-key', options: opts } }),
        );
        await dispatch(setAppState({ loadingText: null }));
      } else if (error.reason === 'file-exists') {
        alert(
          t(
            'A file with id "{{id}}" already exists with the name "{{name}}". ' +
              'This file will be replaced. This probably happened because files were manually ' +
              'moved around outside of Actual.',
            {
              id:
                error.meta &&
                typeof error.meta === 'object' &&
                'id' in error.meta &&
                error.meta.id,
              name:
                error.meta &&
                typeof error.meta === 'object' &&
                'name' in error.meta &&
                error.meta.name,
            },
          ),
        );

        return await dispatch(
          downloadFile({ cloudFileId, replace: true }),
        ).unwrap();
      } else {
        await dispatch(setAppState({ loadingText: null }));
        alert(getDownloadError(error));
      }
      return null;
    } else {
      if (!id) {
        throw new Error('No id returned from download.');
      }
      await Promise.all([
        dispatch(loadGlobalPrefs()),
        dispatch(loadAllFiles()),
        dispatch(loadFile({ id })),
      ]);
      await dispatch(setAppState({ loadingText: null }));
      return id;
    }
  },
);

type LoadBackupPayload = {
  fileId: string;
  backupId: string;
};

// Take in the file id so that backups can be loaded when a file isn't opened
export const loadBackup = createAppAsyncThunk(
  `${sliceName}/loadBackup`,
  async ({ fileId, backupId }: LoadBackupPayload, { dispatch, getState }) => {
    const prefs = getState().prefs.local;
    if (prefs && prefs.id) {
      await dispatch(closeFile());
    }

    await send('backup-load', { id: fileId, backupId });
    await dispatch(loadFile({ id: fileId }));
  },
);

export const makeBackup = createAppAsyncThunk(
  `${sliceName}/makeBackup`,
  async (_, { getState }) => {
    const prefs = getState().prefs.local;
    if (prefs && prefs.id) {
      await send('backup-make', { id: prefs.id });
    }
  },
);

type FilesState = {
  files: File[];
  remoteFiles: RemoteFile[] | null;
  allFiles: File[] | null;
};

const initialState: FilesState = {
  files: [],
  remoteFiles: null,
  allFiles: null,
};

type SetFilesPayload = {
  files: File[];
};

type SetRemoteFilesPayload = {
  remoteFiles: RemoteFile[];
};

type SetAllFilesPayload = {
  files: File[];
  remoteFiles: RemoteFile[];
};

const filesSlice = createSlice({
  name: sliceName,
  initialState,
  reducers: {
    setFiles(state, action: PayloadAction<SetFilesPayload>) {
      state.files = action.payload.files;
      state.allFiles = reconcileFiles(
        action.payload.files,
        state.remoteFiles,
      );
    },
    setRemoteFiles(state, action: PayloadAction<SetRemoteFilesPayload>) {
      state.remoteFiles = action.payload.remoteFiles;
      state.allFiles = reconcileFiles(
        state.files,
        action.payload.remoteFiles,
      );
    },
    setAllFiles(state, action: PayloadAction<SetAllFilesPayload>) {
      state.files = action.payload.files;
      state.remoteFiles = action.payload.remoteFiles;
      state.allFiles = reconcileFiles(
        action.payload.files,
        action.payload.remoteFiles,
      );
    },
  },
  extraReducers: builder => {
    builder.addCase(signOut.fulfilled, state => {
      state.allFiles = null;
    });
    builder.addCase(resetApp, state => state || initialState);
  },
});

export const { name, reducer, getInitialState } = filesSlice;

export const actions = {
  ...filesSlice.actions,
  loadFiles,
  loadRemoteFiles,
  loadAllFiles,
  loadFile,
  closeFile,
  closeFileUI,
  deleteFile,
  createFile,
  duplicateFile,
  importFile,
  uploadFile,
  closeAndLoadFile,
  closeAndDownloadFile,
  downloadFile,
  loadBackup,
  makeBackup,
};

export const { setFiles, setRemoteFiles, setAllFiles } = actions;

function sortFiles(arr: File[]) {
  arr.sort((x, y) => {
    const name1 = x.name.toLowerCase();
    const name2 = y.name.toLowerCase();
    let i = name1 < name2 ? -1 : name1 > name2 ? 1 : 0;
    if (i === 0) {
      const xId = x.state === 'remote' ? x.cloudFileId : x.id;
      const yId = y.state === 'remote' ? y.cloudFileId : y.id;
      i = xId < yId ? -1 : xId > yId ? 1 : 0;
    }
    return i;
  });
  return arr;
}

// States of a file:
// 1. local - Only local (not uploaded/synced)
// 2. remote - Unavailable locally, available to download
// 3. synced - Downloaded & synced
// 4. detached - Downloaded but broken group id (reset sync state)
// 5. broken - user shouldn't have access to this file
// 6. unknown - user is offline so can't determine the status
function reconcileFiles(
  localFiles: File[],
  remoteFiles: RemoteFile[] | null,
): File[] {
  const reconciled = new Set();

  const files = localFiles.map((localFile): File & { deleted: boolean } => {
    const { cloudFileId, groupId } = localFile;
    if (cloudFileId && groupId) {
      // This is the case where for some reason getting the files from
      // the server failed. We don't want to scare the user, just show
      // an unknown state and tell them it'll be OK once they come
      // back online
      if (remoteFiles == null) {
        return {
          ...localFile,
          cloudFileId,
          groupId,
          deleted: false,
          state: 'unknown',
          hasKey: true,
          owner: '',
        };
      }

      const remote = remoteFiles.find(f => localFile.cloudFileId === f.fileId);
      if (remote) {
        // Mark reconciled
        reconciled.add(remote.fileId);

        if (remote.groupId === localFile.groupId) {
          return {
            ...localFile,
            cloudFileId,
            groupId,
            name: remote.name,
            deleted: remote.deleted,
            encryptKeyId: remote.encryptKeyId,
            hasKey: remote.hasKey,
            state: 'synced',
            owner: remote.owner,
            usersWithAccess: remote.usersWithAccess,
          };
        } else {
          return {
            ...localFile,
            cloudFileId,
            groupId,
            name: remote.name,
            deleted: remote.deleted,
            encryptKeyId: remote.encryptKeyId,
            hasKey: remote.hasKey,
            state: 'detached',
            owner: remote.owner,
            usersWithAccess: remote.usersWithAccess,
          };
        }
      } else {
        return {
          ...localFile,
          cloudFileId,
          groupId,
          deleted: false,
          state: 'broken',
          hasKey: true,
          owner: '',
        };
      }
    } else {
      return { ...localFile, deleted: false, state: 'local', hasKey: true };
    }
  });

  const sorted = sortFiles(
    files
      .concat(
        (remoteFiles || [])
          .filter(f => !reconciled.has(f.fileId))
          .map(f => {
            return {
              cloudFileId: f.fileId,
              groupId: f.groupId,
              name: f.name,
              deleted: f.deleted,
              encryptKeyId: f.encryptKeyId,
              hasKey: f.hasKey,
              state: 'remote',
              owner: f.owner,
              usersWithAccess: f.usersWithAccess,
            };
          }),
      )
      .filter(f => !f.deleted),
  );

  // One last pass to list all the broken (unauthorized) files at the
  // bottom
  return sorted
    .filter(f => f.state !== 'broken')
    .concat(sorted.filter(f => f.state === 'broken'));
}
