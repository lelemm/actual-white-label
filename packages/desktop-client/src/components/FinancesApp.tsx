// @ts-strict-ignore
import React, {
  useEffect,
  useEffectEvent,
  useRef,
  type ReactElement,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, Route, Routes, useHref, useLocation } from 'react-router';

import { useResponsive } from '@actual-app/components/hooks/useResponsive';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

import * as undo from 'loot-core/platform/client/undo';

import { UserAccessPage } from './admin/UserAccess/UserAccessPage';
import { CommandBar } from './CommandBar';
import { GlobalKeys } from './GlobalKeys';
import { MobileNavTabs } from './mobile/MobileNavTabs';
import { NotesTable } from './notes/NotesTable';
import { Notifications } from './Notifications';
import { ProductsList } from './products/ProductsList';
import { NarrowAlternate, WideComponent } from './responsive';
import { useMultiuserEnabled } from './ServerContext';
import { Settings } from './settings';
import { FloatableSidebar } from './sidebar';
import { Titlebar } from './Titlebar';

import { getLatestAppVersion, sync } from '@desktop-client/app/appSlice';
import { ProtectedRoute } from '@desktop-client/auth/ProtectedRoute';
import { Permissions } from '@desktop-client/auth/types';
// useAccounts removed for white-label version
import { useGlobalPref } from '@desktop-client/hooks/useGlobalPref';
import { useLocalPref } from '@desktop-client/hooks/useLocalPref';
import { useMetaThemeColor } from '@desktop-client/hooks/useMetaThemeColor';
import { useNavigate } from '@desktop-client/hooks/useNavigate';
import { ScrollProvider } from '@desktop-client/hooks/useScrollListener';
import { addNotification } from '@desktop-client/notifications/notificationsSlice';
import { useDispatch, useSelector } from '@desktop-client/redux';
import { UserDirectoryPage } from './admin/UserDirectory/UserDirectoryPage';

function NarrowNotSupported({
  redirectTo = '/settings',
  children,
}: {
  redirectTo?: string;
  children: ReactElement;
}) {
  const { isNarrowWidth } = useResponsive();
  const navigate = useNavigate();
  useEffect(() => {
    if (isNarrowWidth) {
      navigate(redirectTo);
    }
  }, [isNarrowWidth, navigate, redirectTo]);
  return isNarrowWidth ? null : children;
}

function WideNotSupported({ children, redirectTo = '/settings' }) {
  const { isNarrowWidth } = useResponsive();
  const navigate = useNavigate();
  useEffect(() => {
    if (!isNarrowWidth) {
      navigate(redirectTo);
    }
  }, [isNarrowWidth, navigate, redirectTo]);
  return isNarrowWidth ? children : null;
}

function RouterBehaviors() {
  const location = useLocation();
  const href = useHref(location);
  useEffect(() => {
    undo.setUndoState('url', href);
  }, [href]);

  return null;
}

export function FinancesApp() {
  const { isNarrowWidth } = useResponsive();
  useMetaThemeColor(isNarrowWidth ? theme.mobileViewTheme : null);

  const dispatch = useDispatch();
  const { t } = useTranslation();

  // Accounts removed for white-label version

  const versionInfo = useSelector(state => state.app.versionInfo);
  const [notifyWhenUpdateIsAvailable] = useGlobalPref(
    'notifyWhenUpdateIsAvailable',
  );
  const [lastUsedVersion, setLastUsedVersion] = useLocalPref(
    'flags.updateNotificationShownForVersion',
  );

  const multiuserEnabled = useMultiuserEnabled();

  const init = useEffectEvent(() => {
    // Wait a little bit to make sure the sync button will get the
    // sync start event. This can be improved later.
    setTimeout(async () => {
      await dispatch(sync());
    }, 100);

    async function run() {
      await global.Actual.waitForUpdateReadyForDownload(); // This will only resolve when an update is ready
      dispatch(
        addNotification({
          notification: {
            type: 'message',
            title: t('A new version of Actual is available!'),
            message: t(
              'Click the button below to reload and apply the update.',
            ),
            sticky: true,
            id: 'update-reload-notification',
            button: {
              title: t('Update now'),
              action: async () => {
                await global.Actual.applyAppUpdate();
              },
            },
          },
        }),
      );
    }

    run();
  });

  useEffect(() => init(), []);

  useEffect(() => {
    dispatch(getLatestAppVersion());
  }, [dispatch]);

  useEffect(() => {
    if (notifyWhenUpdateIsAvailable && versionInfo) {
      if (
        versionInfo.isOutdated &&
        lastUsedVersion !== versionInfo.latestVersion
      ) {
        dispatch(
          addNotification({
            notification: {
              type: 'message',
              title: t('A new version of Actual is available!'),
              message:
                (process.env.REACT_APP_IS_PIKAPODS ?? '').toLowerCase() ===
                'true'
                  ? t(
                      'A new version of Actual is available! Your Pikapods instance will be automatically updated in the next few days - no action needed.',
                    )
                  : t(
                      'Version {{latestVersion}} of Actual was recently released.',
                      { latestVersion: versionInfo.latestVersion },
                    ),
              sticky: true,
              id: 'update-notification',
              button: {
                title: t('Open changelog'),
                action: () => {
                  window.open('https://github.com/lelemm/actual-white-label/releases');
                },
              },
              onClose: () => {
                setLastUsedVersion(versionInfo.latestVersion);
              },
            },
          }),
        );
      }
    }
  }, [
    dispatch,
    lastUsedVersion,
    notifyWhenUpdateIsAvailable,
    setLastUsedVersion,
    t,
    versionInfo,
  ]);

  const scrollableRef = useRef<HTMLDivElement>(null);

  return (
    <View style={{ height: '100%' }}>
      <RouterBehaviors />
      <GlobalKeys />
      <CommandBar />
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: theme.pageBackground,
          flex: 1,
        }}
      >
        <FloatableSidebar />

        <View
          style={{
            color: theme.pageText,
            backgroundColor: theme.pageBackground,
            flex: 1,
            overflow: 'hidden',
            width: '100%',
          }}
        >
          <ScrollProvider
            isDisabled={!isNarrowWidth}
            scrollableRef={scrollableRef}
          >
            <View
              ref={scrollableRef}
              style={{
                flex: 1,
                overflow: 'auto',
                position: 'relative',
              }}
            >
              <Titlebar
                style={{
                  WebkitAppRegion: 'drag',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  zIndex: 1000,
                }}
              />
              <Notifications />
              <Routes>
                <Route path="/" element={<Navigate to="/settings" replace />} />

                <Route path="/products" element={<ProductsList />} />
                <Route path="/notes" element={<NotesTable />} />
                <Route
                  path="/rules"
                  element={<NarrowAlternate name="Rules" />}
                />
                <Route
                  path="/rules/:id"
                  element={<NarrowAlternate name="RuleEdit" />}
                />
                <Route path="/settings" element={<Settings />} />
                {multiuserEnabled && (
                  <Route
                    path="/user-directory"
                    element={
                      <ProtectedRoute
                        permission={Permissions.ADMINISTRATOR}
                        element={<UserDirectoryPage />}
                      />
                    }
                  />
                )}
                {multiuserEnabled && (
                  <Route
                    path="/user-access"
                    element={
                      <ProtectedRoute
                        permission={Permissions.ADMINISTRATOR}
                        validateOwner
                        element={<UserAccessPage />}
                      />
                    }
                  />
                )}
                {/* redirect all other traffic to settings */}
                <Route
                  path="/*"
                  element={<Navigate to="/settings" replace />}
                />
              </Routes>
            </View>

            <Routes>
              <Route path="/settings" element={<MobileNavTabs />} />
              <Route path="/products" element={<MobileNavTabs />} />
              <Route path="/notes" element={<MobileNavTabs />} />
              <Route path="/rules" element={<MobileNavTabs />} />
              <Route path="*" element={null} />
            </Routes>
          </ScrollProvider>
        </View>
      </View>
    </View>
  );
}
