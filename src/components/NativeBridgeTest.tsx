
import React, { useState } from 'react';

import {
  getNexoraNativeInfo,
  getNexoraInstalledApps,
  launchNexoraApp,
  getNexoraAccessibilityStatus,
  openNexoraAccessibilitySettings,
  getNexoraScreenInfo,
  isNexoraNativeAvailable,
  NexoraNativeInfo,
  NexoraInstalledApp,
  NexoraScreenInfo,
} from '../native/NexoraNative';

export const NativeBridgeTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [checkingAccessibility, setCheckingAccessibility] = useState(false);
  const [openingAccessibilitySettings, setOpeningAccessibilitySettings] = useState(false);
  const [checkingScreen, setCheckingScreen] = useState(false);

  const [launchingPackage, setLaunchingPackage] = useState('');

  const [info, setInfo] = useState<NexoraNativeInfo | null>(null);
  const [apps, setApps] = useState<NexoraInstalledApp[]>([]);
  const [screenInfo, setScreenInfo] = useState<NexoraScreenInfo | null>(null);

  const [accessibilityConnected, setAccessibilityConnected] = useState<boolean | null>(null);

  const [error, setError] = useState('');
  const [appError, setAppError] = useState('');
  const [accessibilityError, setAccessibilityError] = useState('');
  const [screenError, setScreenError] = useState('');

  const [launchMessage, setLaunchMessage] = useState('');
  const [settingsMessage, setSettingsMessage] = useState('');
  const [search, setSearch] = useState('');

  const testBridge = async () => {
    setLoading(true);
    setError('');
    setInfo(null);

    try {
      if (!isNexoraNativeAvailable()) {
        throw new Error('Android Native environment পাওয়া যায়নি। APK থেকে পরীক্ষা করো।');
      }

      const result = await getNexoraNativeInfo();

      if (!result || !result.success) {
        throw new Error('Native Bridge response পাওয়া যায়নি।');
      }

      setInfo(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const checkAccessibility = async () => {
    setCheckingAccessibility(true);
    setAccessibilityError('');

    try {
      if (!isNexoraNativeAvailable()) {
        throw new Error('Android APK থেকে Accessibility status পরীক্ষা করো।');
      }

      const result = await getNexoraAccessibilityStatus();

      if (!result || !result.success) {
        throw new Error('Accessibility status পাওয়া যায়নি।');
      }

      setAccessibilityConnected(result.connected);
    } catch (err) {
      setAccessibilityError(
        err instanceof Error ? err.message : 'Unable to check Accessibility status.'
      );
    } finally {
      setCheckingAccessibility(false);
    }
  };

  const openAccessibilitySettings = async () => {
    setOpeningAccessibilitySettings(true);
    setSettingsMessage('');
    setAccessibilityError('');

    try {
      if (!isNexoraNativeAvailable()) {
        throw new Error('Android APK থেকে এই ফিচারটি ব্যবহার করো।');
      }

      const result = await openNexoraAccessibilitySettings();

      if (!result || !result.success) {
        throw new Error(result?.message || 'Unable to open Accessibility Settings.');
      }

      setSettingsMessage('Android Accessibility Settings opened. Enable Nexora manually.');
    } catch (err) {
      setAccessibilityError(
        err instanceof Error ? err.message : 'Unable to open Accessibility Settings.'
      );
    } finally {
      setOpeningAccessibilitySettings(false);
    }
  };

  const scanInstalledApps = async () => {
    setScanning(true);
    setAppError('');
    setApps([]);
    setLaunchMessage('');

    try {
      if (!isNexoraNativeAvailable()) {
        throw new Error('Android APK থেকে Installed Apps Scanner পরীক্ষা করো।');
      }

      const result = await getNexoraInstalledApps();

      if (!result || !result.success) {
        throw new Error(result?.message || 'Installed Apps scan failed.');
      }

      setApps(result.apps || []);
    } catch (err) {
      setAppError(err instanceof Error ? err.message : 'Unable to scan apps');
    } finally {
      setScanning(false);
    }
  };

  const openInstalledApp = async (app: NexoraInstalledApp) => {
    setLaunchingPackage(app.packageName);
    setAppError('');
    setLaunchMessage('');

    try {
      if (!isNexoraNativeAvailable()) {
        throw new Error('Android APK থেকে App Launch পরীক্ষা করো।');
      }

      const result = await launchNexoraApp(app.packageName);

      if (!result || !result.success) {
        throw new Error(result?.message || 'Unable to launch app.');
      }

      setLaunchMessage(`${app.appName} launch requested.`);
    } catch (err) {
      setAppError(err instanceof Error ? err.message : 'Unable to launch app.');
    } finally {
      setLaunchingPackage('');
    }
  };

  // Read safe screen metadata from Android Accessibility Service.
  const checkScreenMetadata = async () => {
    setCheckingScreen(true);
    setScreenError('');

    try {
      if (!isNexoraNativeAvailable()) {
        throw new Error('এই ফিচারটি Android APK-তে পরীক্ষা করতে হবে।');
      }

      const result = await getNexoraScreenInfo();

      if (!result || !result.success) {
        throw new Error('Screen metadata পাওয়া যায়নি।');
      }

      setScreenInfo(result);
    } catch (err) {
      setScreenError(
        err instanceof Error ? err.message : 'Unable to read screen metadata.'
      );
    } finally {
      setCheckingScreen(false);
    }
  };

  const DeviceRow = ({
    label,
    value,
  }: {
    label: string;
    value: string | number;
  }) => (
    <div className="flex justify-between gap-3 border-b border-slate-800 py-2 last:border-0">
      <span className="text-slate-400">{label}</span>
      <span className="text-white text-right break-all">{value || 'Unknown'}</span>
    </div>
  );

  const filteredApps = apps.filter((app) => {
    const query = search.toLowerCase();

    return (
      app.appName.toLowerCase().includes(query) ||
      app.packageName.toLowerCase().includes(query)
    );
  });

  const eventTypeName = (eventType: number): string => {
    const eventNames: Record<number, string> = {
      1: 'View Clicked',
      2: 'View Long Clicked',
      4: 'View Selected',
      8: 'View Focused',
      16: 'Window State Changed',
      32: 'Notification State Changed',
      64: 'View Hover Enter',
      128: 'View Hover Exit',
      256: 'Touch Exploration Gesture',
      512: 'Window Content Changed',
      4096: 'View Scrolled',
    };

    return eventNames[eventType] || `Event Code: ${eventType}`;
  };

  const formatEventTime = (timestamp: number): string => {
    if (!timestamp || timestamp <= 0) return 'Not available';

    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="w-full rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-4">

      <div>
        <h2 className="text-white font-bold">Native Bridge Diagnostics</h2>
        <p className="text-xs text-slate-400 mt-1">
          Android Device Intelligence & Native Controls
        </p>
      </div>

      {/* Native Bridge */}
      <button
        type="button"
        onClick={testBridge}
        disabled={loading}
        className="w-full rounded-xl bg-cyan-500 text-slate-950 font-bold py-3 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'TEST NATIVE BRIDGE'}
      </button>

      {info && (
        <div className="rounded-xl bg-slate-950 p-3 space-y-1 text-sm">
          <p className="text-emerald-400 font-bold mb-3">Native Bridge Connected</p>
          <DeviceRow label="Platform" value={info.platform} />
          <DeviceRow label="Manufacturer" value={info.manufacturer} />
          <DeviceRow label="Brand" value={info.brand} />
          <DeviceRow label="Model" value={info.model} />
          <DeviceRow label="Device ID" value={info.device} />
          <DeviceRow label="Android Version" value={info.androidVersion} />
          <DeviceRow label="SDK Version" value={info.sdkVersion} />
          <DeviceRow label="Package Name" value={info.packageName} />
        </div>
      )}

      {error && <p className="text-sm text-red-400 break-words">{error}</p>}

      {/* Accessibility */}
      <div className="border-t border-slate-800 pt-4 space-y-3">
        <div>
          <h3 className="text-white font-bold">Accessibility Service</h3>
          <p className="text-xs text-slate-400 mt-1">
            Manage and check Nexora Accessibility Service.
          </p>
        </div>

        <button
          type="button"
          onClick={openAccessibilitySettings}
          disabled={openingAccessibilitySettings}
          className="w-full rounded-xl bg-violet-500 text-white font-bold py-3 disabled:opacity-50"
        >
          {openingAccessibilitySettings ? 'Opening Settings...' : 'ENABLE ACCESSIBILITY'}
        </button>

        {settingsMessage && (
          <p className="text-sm text-emerald-400 break-words">{settingsMessage}</p>
        )}

        <button
          type="button"
          onClick={checkAccessibility}
          disabled={checkingAccessibility}
          className="w-full rounded-xl bg-emerald-500 text-slate-950 font-bold py-3 disabled:opacity-50"
        >
          {checkingAccessibility ? 'Checking...' : 'CHECK ACCESSIBILITY STATUS'}
        </button>

        {accessibilityConnected !== null && (
          <div className="rounded-xl bg-slate-950 border border-slate-800 p-3">
            <p className={accessibilityConnected ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {accessibilityConnected
                ? '● Accessibility Service Connected'
                : '● Accessibility Service Not Connected'}
            </p>
            <p className="text-xs text-slate-400 mt-2">
              {accessibilityConnected
                ? 'Nexora Accessibility Service is currently active.'
                : 'Enable Nexora from Android Accessibility Settings, then check again.'}
            </p>
          </div>
        )}

        {accessibilityError && (
          <p className="text-sm text-red-400 break-words">{accessibilityError}</p>
        )}
      </div>

      {/* Screen Metadata Viewer */}
      <div className="border-t border-slate-800 pt-4 space-y-3">
        <div>
          <h3 className="text-white font-bold">Screen Metadata Viewer</h3>
          <p className="text-xs text-slate-400 mt-1">
            Reads foreground app and screen event metadata only. No screen text is collected.
          </p>
        </div>

        <button
          type="button"
          onClick={checkScreenMetadata}
          disabled={checkingScreen}
          className="w-full rounded-xl bg-cyan-500 text-slate-950 font-bold py-3 disabled:opacity-50"
        >
          {checkingScreen ? 'Reading Screen...' : 'READ CURRENT SCREEN INFO'}
        </button>

        {screenInfo && (
          <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 space-y-1 text-sm">
            <p className={screenInfo.connected ? 'text-emerald-400 font-bold mb-3' : 'text-amber-400 font-bold mb-3'}>
              {screenInfo.connected ? '● Accessibility Connected' : '● Accessibility Not Connected'}
            </p>

            <DeviceRow label="Foreground Package" value={screenInfo.packageName || 'Not available'} />
            <DeviceRow label="Screen / Activity" value={screenInfo.className || 'Not available'} />
            <DeviceRow label="Event" value={eventTypeName(screenInfo.eventType)} />
            <DeviceRow label="Event Time" value={formatEventTime(screenInfo.eventTime)} />

            <p className="text-xs text-slate-500 pt-3">
              Metadata only. Sensitive screen content is not displayed or stored.
            </p>
          </div>
        )}

        {screenError && (
          <p className="text-sm text-red-400 break-words">{screenError}</p>
        )}
      </div>

      {/* Installed Applications */}
      <div className="border-t border-slate-800 pt-4 space-y-4">
        <div>
          <h3 className="text-white font-bold">Installed Applications</h3>
          <p className="text-xs text-slate-400 mt-1">
            Tap an app to open it on your Android device.
          </p>
        </div>

        <button
          type="button"
          onClick={scanInstalledApps}
          disabled={scanning}
          className="w-full rounded-xl bg-violet-500 text-white font-bold py-3 disabled:opacity-50"
        >
          {scanning ? 'Scanning Apps...' : 'SCAN INSTALLED APPS'}
        </button>

        {appError && <p className="text-sm text-red-400 break-words">{appError}</p>}
        {launchMessage && <p className="text-sm text-emerald-400 break-words">{launchMessage}</p>}

        {apps.length > 0 && (
          <div className="space-y-3">
            <p className="text-emerald-400 text-sm font-bold">{apps.length} Apps Found</p>

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search apps..."
              className="w-full rounded-xl bg-slate-950 border border-slate-700 text-white px-4 py-3 outline-none focus:border-violet-500"
            />

            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredApps.map((app) => (
                <button
                  type="button"
                  key={app.packageName}
                  onClick={() => openInstalledApp(app)}
                  disabled={launchingPackage !== ''}
                  className="w-full flex items-center gap-3 text-left rounded-xl bg-slate-950 border border-slate-800 p-3 hover:border-violet-500 disabled:opacity-50"
                >
                  {app.iconBase64 ? (
                    <img
                      src={app.iconBase64}
                      alt={`${app.appName} icon`}
                      className="w-11 h-11 rounded-xl object-contain shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-slate-800 flex items-center justify-center text-white font-bold shrink-0">
                      {app.appName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="text-white font-semibold truncate">{app.appName}</p>
                    <p className="text-xs text-slate-400 break-all">{app.packageName}</p>
                  </div>

                  <span className="text-xs text-violet-400 font-bold shrink-0">
                    {launchingPackage === app.packageName ? 'Opening...' : 'OPEN →'}
                  </span>
                </button>
              ))}

              {filteredApps.length === 0 && (
                <p className="text-center text-sm text-slate-400 py-4">
                  No matching apps found.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
