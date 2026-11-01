
import React, { useState } from 'react';

import {
  getNexoraNativeInfo,
  getNexoraInstalledApps,
  launchNexoraApp,
  getNexoraAccessibilityStatus,
  openNexoraAccessibilitySettings,
  isNexoraNativeAvailable,
  NexoraNativeInfo,
  NexoraInstalledApp,
} from '../native/NexoraNative';

export const NativeBridgeTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [checkingAccessibility, setCheckingAccessibility] = useState(false);
  const [openingAccessibilitySettings, setOpeningAccessibilitySettings] =
    useState(false);

  const [launchingPackage, setLaunchingPackage] = useState('');

  const [info, setInfo] = useState<NexoraNativeInfo | null>(null);
  const [apps, setApps] = useState<NexoraInstalledApp[]>([]);

  const [accessibilityConnected, setAccessibilityConnected] =
    useState<boolean | null>(null);

  const [error, setError] = useState('');
  const [appError, setAppError] = useState('');
  const [accessibilityError, setAccessibilityError] = useState('');

  const [launchMessage, setLaunchMessage] = useState('');
  const [settingsMessage, setSettingsMessage] = useState('');

  const [search, setSearch] = useState('');

  // Test Android Native Bridge
  const testBridge = async () => {
    setLoading(true);
    setError('');
    setInfo(null);

    try {
      if (!isNexoraNativeAvailable()) {
        throw new Error(
          'Android Native environment পাওয়া যায়নি। APK থেকে পরীক্ষা করো।'
        );
      }

      const result = await getNexoraNativeInfo();

      if (!result || !result.success) {
        throw new Error('Native Bridge response পাওয়া যায়নি।');
      }

      setInfo(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unknown error'
      );
    } finally {
      setLoading(false);
    }
  };

  // Check Accessibility Service Connection
  const checkAccessibility = async () => {
    setCheckingAccessibility(true);
    setAccessibilityError('');

    try {
      if (!isNexoraNativeAvailable()) {
        throw new Error(
          'Android APK থেকে Accessibility status পরীক্ষা করো।'
        );
      }

      const result = await getNexoraAccessibilityStatus();

      if (!result || !result.success) {
        throw new Error(
          'Accessibility status পাওয়া যায়নি।'
        );
      }

      setAccessibilityConnected(result.connected);
    } catch (err) {
      setAccessibilityError(
        err instanceof Error
          ? err.message
          : 'Unable to check Accessibility status.'
      );
    } finally {
      setCheckingAccessibility(false);
    }
  };

  // Open Android Accessibility Settings
  const openAccessibilitySettings = async () => {
    setOpeningAccessibilitySettings(true);
    setSettingsMessage('');
    setAccessibilityError('');

    try {
      if (!isNexoraNativeAvailable()) {
        throw new Error(
          'Android APK থেকে এই ফিচারটি ব্যবহার করো।'
        );
      }

      const result = await openNexoraAccessibilitySettings();

      if (!result || !result.success) {
        throw new Error(
          result?.message ||
            'Unable to open Accessibility Settings.'
        );
      }

      setSettingsMessage(
        'Android Accessibility Settings opened. Enable Nexora manually.'
      );
    } catch (err) {
      setAccessibilityError(
        err instanceof Error
          ? err.message
          : 'Unable to open Accessibility Settings.'
      );
    } finally {
      setOpeningAccessibilitySettings(false);
    }
  };

  // Scan Installed Apps
  const scanInstalledApps = async () => {
    setScanning(true);
    setAppError('');
    setApps([]);
    setLaunchMessage('');

    try {
      if (!isNexoraNativeAvailable()) {
        throw new Error(
          'Android APK থেকে Installed Apps Scanner পরীক্ষা করো।'
        );
      }

      const result = await getNexoraInstalledApps();

      if (!result || !result.success) {
        throw new Error(
          result?.message || 'Installed Apps scan failed.'
        );
      }

      setApps(result.apps || []);
    } catch (err) {
      setAppError(
        err instanceof Error ? err.message : 'Unable to scan apps'
      );
    } finally {
      setScanning(false);
    }
  };

  // Launch Selected App
  const openInstalledApp = async (app: NexoraInstalledApp) => {
    setLaunchingPackage(app.packageName);
    setAppError('');
    setLaunchMessage('');

    try {
      if (!isNexoraNativeAvailable()) {
        throw new Error(
          'Android APK থেকে App Launch পরীক্ষা করো।'
        );
      }

      const result = await launchNexoraApp(app.packageName);

      if (!result || !result.success) {
        throw new Error(
          result?.message || 'Unable to launch app.'
        );
      }

      setLaunchMessage(
        `${app.appName} launch requested.`
      );
    } catch (err) {
      setAppError(
        err instanceof Error
          ? err.message
          : 'Unable to launch app.'
      );
    } finally {
      setLaunchingPackage('');
    }
  };

  // Device Information Row
  const DeviceRow = ({
    label,
    value,
  }: {
    label: string;
    value: string | number;
  }) => (
    <div className="flex justify-between gap-3 border-b border-slate-800 py-2 last:border-0">
      <span className="text-slate-400">{label}</span>

      <span className="text-white text-right break-all">
        {value || 'Unknown'}
      </span>
    </div>
  );

  // App Search Filter
  const filteredApps = apps.filter((app) => {
    const query = search.toLowerCase();

    return (
      app.appName.toLowerCase().includes(query) ||
      app.packageName.toLowerCase().includes(query)
    );
  });

  return (
    <div className="w-full rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-4">

      {/* Header */}
      <div>
        <h2 className="text-white font-bold">
          Native Bridge Diagnostics
        </h2>

        <p className="text-xs text-slate-400 mt-1">
          Android Device Information & Installed Applications
        </p>
      </div>

      {/* Native Bridge Test */}
      <button
        type="button"
        onClick={testBridge}
        disabled={loading}
        className="w-full rounded-xl bg-cyan-500 text-slate-950 font-bold py-3 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'TEST NATIVE BRIDGE'}
      </button>

      {/* Device Information */}
      {info && (
        <div className="rounded-xl bg-slate-950 p-3 space-y-1 text-sm">

          <p className="text-emerald-400 font-bold mb-3">
            Native Bridge Connected
          </p>

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

      {error && (
        <p className="text-sm text-red-400 break-words">
          {error}
        </p>
      )}

      {/* Accessibility Service */}
      <div className="border-t border-slate-800 pt-4 space-y-3">

        <div>
          <h3 className="text-white font-bold">
            Accessibility Service
          </h3>

          <p className="text-xs text-slate-400 mt-1">
            Manage and check Nexora Accessibility Service.
          </p>
        </div>

        {/* Enable Accessibility */}
        <button
          type="button"
          onClick={openAccessibilitySettings}
          disabled={openingAccessibilitySettings}
          className="w-full rounded-xl bg-violet-500 text-white font-bold py-3 disabled:opacity-50"
        >
          {openingAccessibilitySettings
            ? 'Opening Settings...'
            : 'ENABLE ACCESSIBILITY'}
        </button>

        {settingsMessage && (
          <p className="text-sm text-emerald-400 break-words">
            {settingsMessage}
          </p>
        )}

        {/* Check Accessibility Status */}
        <button
          type="button"
          onClick={checkAccessibility}
          disabled={checkingAccessibility}
          className="w-full rounded-xl bg-emerald-500 text-slate-950 font-bold py-3 disabled:opacity-50"
        >
          {checkingAccessibility
            ? 'Checking...'
            : 'CHECK ACCESSIBILITY STATUS'}
        </button>

        {accessibilityConnected !== null && (
          <div className="rounded-xl bg-slate-950 border border-slate-800 p-3">

            {accessibilityConnected ? (
              <p className="text-emerald-400 font-bold">
                ● Accessibility Service Connected
              </p>
            ) : (
              <p className="text-amber-400 font-bold">
                ● Accessibility Service Not Connected
              </p>
            )}

            <p className="text-xs text-slate-400 mt-2">
              {accessibilityConnected
                ? 'Nexora Accessibility Service is currently active.'
                : 'Enable Nexora Accessibility Service from Android Settings, then check again.'}
            </p>

          </div>
        )}

        {accessibilityError && (
          <p className="text-sm text-red-400 break-words">
            {accessibilityError}
          </p>
        )}

      </div>

      {/* Installed Applications */}
      <div className="border-t border-slate-800 pt-4 space-y-4">

        <div>
          <h3 className="text-white font-bold">
            Installed Applications
          </h3>

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

        {appError && (
          <p className="text-sm text-red-400 break-words">
            {appError}
          </p>
        )}

        {launchMessage && (
          <p className="text-sm text-emerald-400 break-words">
            {launchMessage}
          </p>
        )}

        {apps.length > 0 && (
          <div className="space-y-3">

            <div className="flex items-center justify-between">
              <p className="text-emerald-400 text-sm font-bold">
                {apps.length} Apps Found
              </p>
            </div>

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
                    <p className="text-white font-semibold truncate">
                      {app.appName}
                    </p>

                    <p className="text-xs text-slate-400 break-all">
                      {app.packageName}
                    </p>
                  </div>

                  <span className="text-xs text-violet-400 font-bold shrink-0">
                    {launchingPackage === app.packageName
                      ? 'Opening...'
                      : 'OPEN →'}
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
