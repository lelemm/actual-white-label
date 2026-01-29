import { v4 as uuid } from 'uuid';

import { type RuleEntity } from 'loot-core/types/models';

export type ActionSplit = {
  id: string;
  actions: RuleEntity['actions'];
};

export function groupActionsBySplitIndex(
  actions: RuleEntity['actions'],
): ActionSplit[] {
  return actions.reduce((acc, action) => {
    // splitIndex removed in white-label version - all actions go to index 0
    const splitIndex = 0;
    acc[splitIndex] = acc[splitIndex] ?? { id: uuid(), actions: [] };
    acc[splitIndex].actions.push(action);
    return acc;
  }, [] as ActionSplit[]);
}
