import React, { useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Block } from '@actual-app/components/block';
import { Button } from '@actual-app/components/button';
import { styles } from '@actual-app/components/styles';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

import {
  Modal,
  ModalCloseButton,
  ModalHeader,
} from '@desktop-client/components/common/Modal';
import { importFile } from '@desktop-client/files/filesSlice';
import { closeModal } from '@desktop-client/modals/modalsSlice';
import { useDispatch } from '@desktop-client/redux';

export function ImportModal() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsImporting(true);
    setError(null);

    try {
      // Use the file path from the file input
      // For Electron, this will be a full path; for browser, we'll use the file name
      const filepath = file.name;
      await dispatch(importFile({ filepath }));
      dispatch(closeModal());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('An error occurred while importing the file.'),
      );
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  async function handleSelectFile() {
    // Try to use openFileDialog if available (Electron)
    if (window.Actual?.openFileDialog) {
      try {
        setIsImporting(true);
        setError(null);
        const result = await window.Actual.openFileDialog({
          filters: [{ name: 'Actual Files', extensions: ['actual'] }],
        });
        if (result && result.length > 0) {
          await dispatch(importFile({ filepath: result[0] }));
          dispatch(closeModal());
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : t('An error occurred while importing the file.'),
        );
      } finally {
        setIsImporting(false);
      }
    } else {
      // Fallback to file input for browser
      fileInputRef.current?.click();
    }
  }

  return (
    <Modal name="import" containerProps={{ style: { width: 400 } }}>
      {({ state: { close } }) => (
        <>
          <ModalHeader
            title={t('Import File')}
            rightContent={<ModalCloseButton onPress={close} />}
          />
          <View style={{ ...styles.smallText, lineHeight: 1.5 }}>
            {error && (
              <Block style={{ color: theme.errorText, marginBottom: 15 }}>
                {error}
              </Block>
            )}

            <Text style={{ marginBottom: 15 }}>
              <Trans>
                Select a file exported from this application to import it.
              </Trans>
            </Text>

            <input
              ref={fileInputRef}
              type="file"
              accept=".actual"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />

            <Button
              onPress={handleSelectFile}
              isDisabled={isImporting}
              style={{
                padding: 10,
                border: '1px solid ' + theme.tableBorder,
                borderRadius: 6,
                marginBottom: 10,
                display: 'block',
                width: '100%',
              }}
            >
              {isImporting ? (
                <Trans>Importing...</Trans>
              ) : (
                <Trans>Select file...</Trans>
              )}
            </Button>
          </View>
        </>
      )}
    </Modal>
  );
}
