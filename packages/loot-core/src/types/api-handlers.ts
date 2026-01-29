// @ts-strict-ignore

import type { APIFileEntity } from '../server/api-models';
import { type FileHandlers } from '../server/files/app';
import type { QueryState } from '../shared/query';

import type {
  NewRuleEntity,
  RuleEntity,
} from './models';

// White-label version: All budget-specific handlers removed
// (transactions, accounts, categories, payees, schedules, budget operations)
export type ApiHandlers = {
  'api/load-file': (
    ...args: Parameters<FileHandlers['load-file']>
  ) => Promise<void>;

  'api/download-file': (arg: {
    syncId: string;
    password?: string;
  }) => Promise<void>;

  'api/get-files': () => Promise<APIFileEntity[]>;

  'api/query': (arg: { query: QueryState }) => Promise<unknown>;

  'api/rules-get': () => Promise<RuleEntity[]>;

  'api/rule-create': (arg: { rule: NewRuleEntity }) => Promise<RuleEntity>;

  'api/rule-update': (arg: { rule: RuleEntity }) => Promise<RuleEntity>;

  'api/rule-delete': (id: RuleEntity['id']) => Promise<boolean>;

  'api/get-id-by-name': (arg: {
    type: string;
    name: string;
  }) => Promise<string>;

  'api/get-server-version': () => Promise<
    { error: 'no-server' } | { error: 'network-failure' } | { version: string }
  >;
};
