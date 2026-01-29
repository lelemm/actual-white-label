import { type RuleConditionEntity } from 'loot-core/types/models';

type UpdateFilterAction =
  | { type: 'set-op'; op: RuleConditionEntity['op'] }
  | { type: 'set-field'; field: string }
  | { type: 'set-value'; value: unknown };

export function updateFilterReducer(
  state: RuleConditionEntity,
  action: UpdateFilterAction,
): RuleConditionEntity {
  switch (action.type) {
    case 'set-op': {
      const { op } = action;
      const isArrayOp = op === 'oneOf' || op === 'notOneOf';
      const wasArrayOp =
        state.op === 'oneOf' || state.op === 'notOneOf';

      let value: unknown = state.value;

      if (isArrayOp && !wasArrayOp) {
        // Convert single value to array
        value = state.value === null ? [] : [state.value];
      } else if (!isArrayOp && wasArrayOp) {
        // Convert array to single value
        if (Array.isArray(state.value)) {
          value = state.value.length > 0 ? state.value[0] : null;
        } else {
          value = state.value;
        }
      }

      return {
        ...state,
        op,
        value,
      };
    }
    case 'set-field':
      return {
        ...state,
        field: action.field,
      };
    case 'set-value':
      return {
        ...state,
        value: action.value,
      };
    default:
      return state;
  }
}
