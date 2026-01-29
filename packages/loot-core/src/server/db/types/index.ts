// These are the types that exactly match the database schema.
// The `Entity` types e.g. `TransactionEntity`, `AccountEntity`, etc
// are specific to the AQL query framework and does not necessarily
// match the actual database schema.

type JsonString = string;

// White-label version: Budget-specific types removed
// Removed: DbAccount, DbBank, DbCategory, DbCategoryGroup, DbCategoryMapping,
// DbPayee, DbPayeeMapping, DbSchedule, DbScheduleNextDate, DbTransaction,
// DbReflectBudget, DbZeroBudgetMonth, DbZeroBudget, DbTransactionFilter,
// DbCustomReport, DbDashboardPage, DbDashboard, DbViewTransactionInternal,
// DbViewTransactionInternalAlive, DbViewTransaction, DbViewCategory,
// DbViewCategoryWithGroupHidden, DbViewPayee, DbViewSchedule, DbTag, DbNote

export type DbKvCache = {
  key: string;
  value: string;
};

export type DbKvCacheKey = {
  id: number;
  key: number;
};

export type DbClockMessage = {
  id: string;
  clock: string;
};

export type DbCrdtMessage = {
  id: string;
  timestamp: string;
  dataset: string;
  row: string;
  column: string;
  value: Uint8Array;
};

export type DbRule = {
  id: string;
  stage: string;
  conditions: JsonString;
  actions: JsonString;
  tombstone: 1 | 0;
  conditions_op: string;
};

export type DbPreference = {
  id: string;
  value: string;
};
