// @ts-strict-ignore
import React, { Fragment, useEffect } from 'react';
import { useLocation } from 'react-router';

import { ConfirmDeleteModal } from './modals/ConfirmDeleteModal';
import { CreateEncryptionKeyModal } from './modals/CreateEncryptionKeyModal';
import { EditFieldModal } from './modals/EditFieldModal';
import { EditRuleModal } from './modals/EditRuleModal';
import { EditUserAccess } from './modals/EditAccess';
import { EditUserFinanceApp } from './modals/EditUser';
import { FixEncryptionKeyModal } from './modals/FixEncryptionKeyModal';
import { KeyboardShortcutModal } from './modals/KeyboardShortcutModal';
import { LoadBackupModal } from './modals/LoadBackupModal';
import { ConfirmChangeDocumentDirModal } from './modals/manager/ConfirmChangeDocumentDir';
import { DeleteFileModal } from './modals/manager/DeleteFileModal';
import { DuplicateFileModal } from './modals/manager/DuplicateFileModal';
import { FilesSettingsModal } from './modals/manager/FilesSettingsModal';
import { ImportModal } from './modals/manager/ImportModal';
import { ManageRulesModal } from './modals/ManageRulesModal';
import { OpenIDEnableModal } from './modals/OpenIDEnableModal';
import { OutOfSyncMigrationsModal } from './modals/OutOfSyncMigrationsModal';
import { PasswordEnableModal } from './modals/PasswordEnableModal';
import { TransferOwnership } from './modals/TransferOwnership';

import { useMetadataPref } from '@desktop-client/hooks/useMetadataPref';
import { useModalState } from '@desktop-client/hooks/useModalState';
import { closeModal } from '@desktop-client/modals/modalsSlice';
import { useDispatch } from '@desktop-client/redux';

// White-label version: Budget-specific modals removed

export function Modals() {
  const location = useLocation();
  const dispatch = useDispatch();
  const { modalStack } = useModalState();
  const [fileId] = useMetadataPref('id');

  useEffect(() => {
    if (modalStack.length > 0) {
      dispatch(closeModal());
    }
    // oxlint-disable-next-line react/exhaustive-deps
  }, [dispatch, location]);

  const modals = modalStack
    .map((modal, idx) => {
      const { name } = modal;
      const key = `${name}-${idx}`;
      switch (name) {
        case 'keyboard-shortcuts':
          // don't show the hotkey help modal when a file is not open
          return fileId ? <KeyboardShortcutModal key={key} /> : null;

        case 'confirm-delete':
          return <ConfirmDeleteModal key={key} {...modal.options} />;

        case 'load-backup':
          return (
            <LoadBackupModal
              key={key}
              watchUpdates
              {...modal.options}
              backupDisabled={false}
            />
          );

        case 'manage-rules':
          return <ManageRulesModal key={key} {...modal.options} />;

        case 'edit-rule':
          return <EditRuleModal key={key} {...modal.options} />;

        case 'create-encryption-key':
          return <CreateEncryptionKeyModal key={key} {...modal.options} />;

        case 'fix-encryption-key':
          return <FixEncryptionKeyModal key={key} {...modal.options} />;

        case 'edit-field':
          return <EditFieldModal key={key} {...modal.options} />;

        case 'delete-file':
          return <DeleteFileModal key={key} {...modal.options} />;
        case 'duplicate-file':
          return <DuplicateFileModal key={key} {...modal.options} />;
        case 'files-settings':
          return <FilesSettingsModal key={key} />;
        case 'confirm-change-document-dir':
          return <ConfirmChangeDocumentDirModal key={key} {...modal.options} />;

        case 'out-of-sync-migrations':
          return <OutOfSyncMigrationsModal key={key} />;

        case 'edit-access':
          return <EditUserAccess key={key} {...modal.options} />;

        case 'edit-user':
          return <EditUserFinanceApp key={key} {...modal.options} />;

        case 'transfer-ownership':
          return <TransferOwnership key={key} {...modal.options} />;

        case 'enable-openid':
          return <OpenIDEnableModal key={key} {...modal.options} />;

        case 'enable-password-auth':
          return <PasswordEnableModal key={key} {...modal.options} />;

        default:
          console.warn(`Unknown modal: ${name}`);
          return null;
      }
    })
    .map((modal, idx) => (
      <Fragment key={`${modalStack[idx].name}-${idx}`}>{modal}</Fragment>
    ));

  // fragment needed per TS types
  // oxlint-disable-next-line react/jsx-no-useless-fragment
  return <>{modals}</>;
}
