import type { AdminHandlers } from '../server/admin/app';
import type { AuthHandlers } from '../server/auth/app';
import type { EncryptionHandlers } from '../server/encryption/app';
import type { FileHandlers } from '../server/files/app';
import type { PreferencesHandlers } from '../server/preferences/app';
import type { RulesHandlers } from '../server/rules/app';
import type { SpreadsheetHandlers } from '../server/spreadsheet/app';
import type { SyncHandlers } from '../server/sync/app';

import type { ServerHandlers } from './server-handlers';

// White-label version: Only core handlers are included
// Budget-specific handlers (accounts, budget, categories, payees, transactions, etc.) removed
// ApiHandlers and ToolsHandlers removed for white-label version
export type Handlers = {} & ServerHandlers &
  PreferencesHandlers &
  RulesHandlers &
  AdminHandlers &
  SpreadsheetHandlers &
  SyncHandlers &
  FileHandlers &
  EncryptionHandlers &
  AuthHandlers;

export type HandlerFunctions = Handlers[keyof Handlers];
