// White-label version: Only file-related API models retained
// Budget-specific API models (accounts, categories, payees, schedules) removed

import { type RemoteFile } from './cloud-storage';

// API model for file entities - used for external API communication
// Based on RemoteFile but adapted for API responses
export type APIFileEntity = {
  id?: string;
  cloudFileId: string;
  groupId: string;
  name: string;
  encryptKeyId?: string;
  hasKey: boolean;
  state?: 'remote';
  owner: string;
  usersWithAccess: RemoteFile['usersWithAccess'];
};

export const remoteFileModel = {
  toExternal(file: RemoteFile): APIFileEntity | null {
    if (file.deleted) {
      return null;
    }
    return {
      cloudFileId: file.fileId,
      state: 'remote',
      groupId: file.groupId,
      name: file.name,
      encryptKeyId: file.encryptKeyId,
      hasKey: file.hasKey,
      owner: file.owner,
      usersWithAccess: file.usersWithAccess,
    };
  },

  fromExternal(file: APIFileEntity): RemoteFile {
    return {
      deleted: false,
      fileId: file.cloudFileId,
      groupId: file.groupId,
      name: file.name,
      encryptKeyId: file.encryptKeyId,
      hasKey: file.hasKey,
      owner: file.owner,
      usersWithAccess: file.usersWithAccess,
    };
  },
};
