import { type UsersWithAccess } from '../server/cloud-storage';

export type FileState =
  | 'local'
  | 'remote'
  | 'synced'
  | 'detached'
  | 'broken'
  | 'unknown';

export type File = {
  id?: string;
  cloudFileId?: string;
  encryptKeyId?: string;
  groupId?: string;
  name: string;
  owner?: string;
  state?: FileState;
  hasKey?: boolean;
  usersWithAccess?: UsersWithAccess[];
};
