import React, { useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgExpandArrow } from '@actual-app/components/icons/v0';
import { InitialFocus } from '@actual-app/components/initial-focus';
import { Input } from '@actual-app/components/input';
import { Menu } from '@actual-app/components/menu';
import { Popover } from '@actual-app/components/popover';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

import { isElectron } from 'loot-core/shared/environment';
import * as Platform from 'loot-core/shared/platform';

import { closeFile } from '@desktop-client/files/filesSlice';
import { useContextMenu } from '@desktop-client/hooks/useContextMenu';
import { useMetadataPref } from '@desktop-client/hooks/useMetadataPref';
import { useNavigate } from '@desktop-client/hooks/useNavigate';
import { pushModal } from '@desktop-client/modals/modalsSlice';
import { useDispatch } from '@desktop-client/redux';

type FileNameProps = {
  children?: ReactNode;
};

export function FileName({ children }: FileNameProps) {
  const hasWindowButtons = !Platform.isBrowser && Platform.OS === 'mac';

  return (
    <View
      style={{
        paddingTop: 35,
        height: 30,
        flexDirection: 'row',
        alignItems: 'center',
        margin: '0 8px 23px 20px',
        userSelect: 'none',
        transition: 'padding .4s',
        ...(hasWindowButtons
          ? {
              paddingTop: 20,
              justifyContent: 'flex-start',
            }
          : {}),
      }}
    >
      <EditableFileName />

      <View style={{ flex: 1, flexDirection: 'row' }} />

      {children}
    </View>
  );
}

function EditableFileName() {
  const { t } = useTranslation();
  const [fileName, setFileNamePref] = useMetadataPref('fileName');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [editing, setEditing] = useState(false);
  const { setMenuOpen, menuOpen, handleContextMenu, resetPosition, position } =
    useContextMenu();

  function onMenuSelect(type: string) {
    setMenuOpen(false);

    switch (type) {
      case 'rename':
        setEditing(true);
        break;
      case 'settings':
        navigate('/settings');
        break;
      case 'loadBackup':
        if (isElectron()) {
          dispatch(
            pushModal({
              modal: { name: 'load-backup', options: {} },
            }),
          );
        }
        break;
      case 'close':
        dispatch(closeFile());
        break;
      default:
    }
  }

  const items = [
    { name: 'rename', text: t('Rename file') },
    { name: 'settings', text: t('Settings') },
    isElectron() ? { name: 'loadBackup', text: t('Load Backup…') } : null,
    { name: 'close', text: t('Switch file') },
  ].filter(item => item !== null);

  if (editing) {
    return (
      <InitialFocus>
        <Input
          style={{
            maxWidth: 'calc(100% - 23px)',
            fontSize: 16,
            fontWeight: 500,
          }}
          defaultValue={fileName}
          onEnter={newFileName => {
            if (newFileName.trim() !== '') {
              setFileNamePref(newFileName);
              setEditing(false);
            }
          }}
          onBlur={() => setEditing(false)}
        />
      </InitialFocus>
    );
  }

  return (
    <View onContextMenu={handleContextMenu}>
      <Button
        ref={triggerRef}
        variant="bare"
        style={{
          color: theme.sidebarBudgetName,
          fontSize: 16,
          fontWeight: 500,
          marginLeft: -5,
          flex: '0 auto',
        }}
        onPress={() => {
          resetPosition();
          setMenuOpen(true);
        }}
      >
        <Text style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
          {fileName || t('Unnamed')}
        </Text>
        <SvgExpandArrow
          width={7}
          height={7}
          style={{ flexShrink: 0, marginLeft: 5 }}
        />
      </Button>

      <Popover
        triggerRef={triggerRef}
        placement="bottom start"
        isOpen={menuOpen}
        onOpenChange={() => setMenuOpen(false)}
        style={{ margin: 1 }}
        {...position}
      >
        <Menu onMenuSelect={onMenuSelect} items={items} />
      </Popover>
    </View>
  );
}
