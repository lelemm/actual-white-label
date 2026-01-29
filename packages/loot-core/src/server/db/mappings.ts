// @ts-strict-ignore
import { addSyncListener } from '../sync/index';

import * as db from './index';

// This file keeps all the mappings in memory so we can access it
// synchronously. This is primarily used in the rules system, but
// there may be other uses in the future. You don't need to worry
// about this generally; if you are querying transactions, ids are
// transparently mapped for you. But if you are building something
// that stores ids and later uses them, you need to remember to map
// the ids.
//
// IMPORTANT: `loadMappings` must be called first before other modules
// that listen for sync changes. This must be the first sync listener
// to run in case other listeners use this mapping table; otherwise
// they might see stale mappings.

let allMappings;
let unlistenSync;

export async function loadMappings() {
  // White-label version: Budget-specific mappings removed
  // Mappings are now entity-type agnostic and handled by entity-specific systems
  allMappings = new Map<string, string>();

  if (unlistenSync) {
    unlistenSync();
  }
  unlistenSync = addSyncListener(onApplySync);
}

function onApplySync(oldValues, newValues) {
  // White-label version: Mapping sync removed for budget-specific entities
  // Entity-specific mapping sync should be handled by entity type handlers
}

export function getMappings() {
  return allMappings;
}

export function getMapping(id) {
  return allMappings.get(id) || null;
}
