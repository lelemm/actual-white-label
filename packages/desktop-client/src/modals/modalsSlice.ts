import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { send } from 'loot-core/platform/client/fetch';
import { type IntegerAmount } from 'loot-core/shared/util';
import { type File } from 'loot-core/types/file';
import {
  type NewRuleEntity,
  type NewUserEntity,
  type ProductEntity,
  type RuleEntity,
  type UserAccessEntity,
  type UserEntity,
} from 'loot-core/types/models';

import { resetApp, setAppState } from '@desktop-client/app/appSlice';
// import { type SelectLinkedAccountsModalProps } from '@desktop-client/components/modals/SelectLinkedAccountsModal';
import { createAppAsyncThunk } from '@desktop-client/redux';
import { signOut } from '@desktop-client/users/usersSlice';

const sliceName = 'modals';

export type Modal =
  // Budget-specific modals removed in white-label version
  // | {
  //     name: 'import-transactions';
  //     options: {
  //       accountId: string;
  //       filename: string;
  //       categories?: { list: CategoryEntity[]; grouped: CategoryGroupEntity[] };
  //       onImported: (didChange: boolean) => void;
  //     };
  //   }
  // | {
  //     name: 'add-account';
  //     options: {
  //       upgradingAccountId?: string;
  //     };
  //   }
  // | {
  //     name: 'add-local-account';
  //   }
  // | {
  //     name: 'close-account';
  //     options: {
  //       account: AccountEntity;
  //       balance: number;
  //       canDelete: boolean;
  //     };
  //   }
  // | {
  //     name: 'select-linked-accounts';
  //     options: SelectLinkedAccountsModalProps;
  //   }
  // | {
  //     name: 'confirm-category-delete';
  //     options: {
  //       onDelete: (transferCategoryId: CategoryEntity['id']) => void;
  //       category?: CategoryEntity['id'];
  //       group?: CategoryGroupEntity['id'];
  //     };
  //   }
  | {
      name: 'confirm-delete';
      options: {
        message: string;
        onConfirm: () => void;
      };
    }
  | {
      name: 'load-backup';
      options: {
        budgetId?: string; // Legacy name, maps to fileId
        watchUpdates?: boolean;
        backupDisabled?: boolean;
      };
    }
  | {
      name: 'manage-rules';
      options: { payeeId?: string };
    }
  | {
      name: 'edit-rule';
      options: {
        rule: RuleEntity | NewRuleEntity;
        onSave?: (rule: RuleEntity) => void;
      };
    }
  // Budget-specific modals removed in white-label version
  // | {
  //     name: 'merge-unused-payees';
  //     options: {
  //       payeeIds: string[];
  //       targetPayeeId: string;
  //     };
  //   }
  // | {
  //     name: 'gocardless-init';
  //     options: {
  //       onSuccess: () => void;
  //     };
  //   }
  // | {
  //     name: 'simplefin-init';
  //     options: {
  //       onSuccess: () => void;
  //     };
  //   }
  // | {
  //     name: 'pluggyai-init';
  //     options: {
  //       onSuccess: () => void;
  //     };
  //   }
  // | {
  //     name: 'gocardless-external-msg';
  //     options: {
  //       onMoveExternal: (arg: {
  //         institutionId: string;
  //       }) => Promise<
  //         | { error: 'timeout' }
  //         | { error: 'unknown'; message?: string }
  //         | { data: GoCardlessToken }
  //       >;
  //       onClose?: (() => void) | undefined;
  //       onSuccess: (data: GoCardlessToken) => Promise<void>;
  //     };
  //   }
  | {
      name: 'delete-file';
      options: { file: File };
    }
  | {
      name: 'duplicate-file';
      options: {
        /** The budget file to be duplicated */
        file: File;
        /**
         * Indicates whether the duplication is initiated from the budget
         * management page. This may affect the behavior or UI of the
         * duplication process.
         */
        managePage?: boolean;
        /**
         * loadFile indicates whether to open the 'original' file, the
         * new duplicated 'copy' budget, or no budget ('none'). If 'none'
         * duplicate-file stays on the same page.
         */
        loadFile?: 'none' | 'original' | 'copy';
        /**
         * onComplete is called when the DuplicateFileModal is closed.
         * @param event the event object will pass back the status of the
         * duplicate process.
         * 'success' if the budget was duplicated.
         * 'failed' if the budget could not be duplicated.  This will also
         * pass an error on the event object.
         * 'canceled' if the DuplicateFileModal was canceled.
         * @returns
         */
        onComplete?: (event: {
          status: 'success' | 'failed' | 'canceled';
          error?: Error;
        }) => void;
      };
    }
  | {
      name: 'out-of-sync-migrations';
    }
  | {
      name: 'files-settings';
    }
  | {
      name: 'confirm-change-document-dir';
      options: {
        currentBudgetDirectory: string;
        newDirectory: string;
      };
    }
  | {
      name: 'create-encryption-key';
      options: { recreate?: boolean };
    }
  | {
      name: 'fix-encryption-key';
      options: {
        hasExistingKey?: boolean;
        cloudFileId?: string;
        onSuccess?: () => void;
      };
    }
  | {
      name: 'confirm-delete';
      options: {
        message: string;
        onConfirm: () => void;
      };
    }
  | {
      name: 'edit-field';
      options: {
        name: string; // Generic field name (not transaction-specific)
        onSubmit: (
          name: string,
          value: string | number | {
            useRegex: boolean;
            find: string;
            replace: string;
          },
          mode?: 'prepend' | 'append' | 'replace' | 'findAndReplace' | null,
        ) => void;
        onClose?: () => void;
      };
    }
  // Budget-specific modals removed in white-label version - all modals referencing
  // AccountEntity, CategoryEntity, TransactionEntity, ScheduleEntity, NoteEntity, etc.
  // have been removed. Only file/user/rules modals remain.
  | {
      name: 'edit-user';
      options: {
        user: UserEntity | NewUserEntity;
        onSave: (user: UserEntity) => void;
      };
    }
  | {
      name: 'edit-access';
      options: {
        access: UserAccessEntity;
        onSave: (userAccess: UserAccessEntity) => void;
      };
    }
  | {
      name: 'transfer-ownership';
      options: {
        onSave: () => void;
      };
    }
  | {
      name: 'enable-openid';
      options: {
        onSave?: () => void;
      };
    }
  | {
      name: 'enable-password-auth';
      options: {
        onSave?: () => void;
      };
    }
  | {
      name: 'confirm-unlink-account';
      options: {
        accountName: string;
        isViewBankSyncSettings: boolean;
        onUnlink: () => void;
      };
    }
  | {
      name: 'keyboard-shortcuts';
    }
  | {
      name: 'edit-product';
      options: {
        product: ProductEntity;
        onSave?: (product: ProductEntity) => void;
      };
    }
  // More budget-specific modals removed
  // | {
  //     name: 'goal-templates';
  //   }
  // | {
  //     name: 'schedules-upcoming-length';
  //   }
  // | {
  //     name: 'payee-category-learning';
  //   }
  // | {
  //     name: 'category-automations-edit';
  //     options: {
  //       categoryId: CategoryEntity['id'];
  //     };
  //   }
  // | {
  //     name: 'category-automations-unmigrate';
  //     options: {
  //       categoryId: CategoryEntity['id'];
  //       templates: Template[];
  //     };
  //   }
;

// Budget-specific modal removed in white-label version
// type OpenAccountCloseModalPayload = {
//   accountId: AccountEntity['id'];
// };

// export const openAccountCloseModal = createAppAsyncThunk(
//   `${sliceName}/openAccountCloseModal`,
//   async (
//     { accountId }: OpenAccountCloseModalPayload,
//     { dispatch, getState },
//   ) => {
//     const {
//       balance,
//       numTransactions,
//     }: { balance: number; numTransactions: number } = await send(
//       'account-properties',
//       {
//         id: accountId,
//       },
//     );
//     const account = getState().account.accounts.find(
//       acct => acct.id === accountId,
//     );

//     if (!account) {
//       throw new Error(`Account with ID ${accountId} does not exist.`);
//     }

//     dispatch(
//       pushModal({
//         modal: {
//           name: 'close-account',
//           options: {
//             account,
//             balance,
//             canDelete: numTransactions === 0,
//           },
//         },
//       }),
//     );
//   },
// );

type ModalsState = {
  modalStack: Modal[];
  isHidden: boolean;
};

const initialState: ModalsState = {
  modalStack: [],
  isHidden: false,
};

type PushModalPayload = {
  modal: Modal;
};

type ReplaceModalPayload = {
  modal: Modal;
};

type CollapseModalPayload = {
  rootModalName: Modal['name'];
};

const modalsSlice = createSlice({
  name: sliceName,
  initialState,
  reducers: {
    pushModal(state, action: PayloadAction<PushModalPayload>) {
      const modal = action.payload.modal;
      // special case: don't show the keyboard shortcuts modal if there's already a modal open
      if (
        modal.name.endsWith('keyboard-shortcuts') &&
        (state.modalStack.length > 0 ||
          window.document.querySelector(
            'div[data-testid="filters-menu-tooltip"]',
          ) !== null)
      ) {
        return state;
      }
      state.modalStack = [...state.modalStack, modal];
    },
    replaceModal(state, action: PayloadAction<ReplaceModalPayload>) {
      const modal = action.payload.modal;
      state.modalStack = [modal];
    },
    popModal(state) {
      state.modalStack = state.modalStack.slice(0, -1);
    },
    closeModal(state) {
      state.modalStack = [];
    },
    collapseModals(state, action: PayloadAction<CollapseModalPayload>) {
      const idx = state.modalStack.findIndex(
        m => m.name === action.payload.rootModalName,
      );
      state.modalStack =
        idx < 0 ? state.modalStack : state.modalStack.slice(0, idx);
    },
  },
  extraReducers: builder => {
    builder.addCase(setAppState, (state, action) => {
      state.isHidden = action.payload.loadingText !== null;
    });
    builder.addCase(signOut.fulfilled, () => initialState);
    builder.addCase(resetApp, () => initialState);
  },
});

export const { name, reducer, getInitialState } = modalsSlice;

export const actions = {
  ...modalsSlice.actions,
  // openAccountCloseModal, // Budget-specific, removed in white-label version
};

export const { pushModal, closeModal, collapseModals, popModal, replaceModal } =
  actions;
