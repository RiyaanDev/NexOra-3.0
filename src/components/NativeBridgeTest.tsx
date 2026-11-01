
import React, { useState } from 'react';

import {
  getNexoraNativeInfo,
  getNexoraInstalledApps,
  isNexoraNativeAvailable,
  NexoraNativeInfo,
  NexoraInstalledApp,
} from '../native/NexoraNative';

export const NativeBridgeTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);

  const [info, setInfo] = useState<NexoraNativeInfo | null>(null);
  const [apps, setApps] = useState<NexoraInstalledApp[]>([]);

  const [error, setError] = useState('');
  const [appError, setAppError] = useState('');
  const [search, setSearch] = useState('');

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

  const scanInstalledApps = async () => {
    setScanning(true);
    setAppError('');
    setApps([]);

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

  const filteredApps = apps.filter((app) => {
    const query = search.toLowerCase();

    return (
      app.appName.toLowerCase().includes(query) ||
      app.packageName.toLowerCase().includes(query)
    );
  });

  return (
    <div className="w-full rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-4">

      <div>
        <h2 className="text-white font-bold">
          Native Bridge Diagnostics
        </h2>

        <p className="text-xs text-slate-400 mt-1">
          Android Device Information & Installed Applications
        </p>
      </div>

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

      <div className="border-t border-slate-800 pt-4 space-y-4">

        <div>
          <h3 className="text-white font-bold">
            Installed Applications
          </h3>

          <p className="text-xs text-slate-400 mt-1">
            Scan launchable Android apps with their original icons.
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
                <div
                  key={app.packageName}
                  className="flex items-center gap-3 rounded-xl bg-slate-950 border border-slate-800 p-3"
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

                </div>
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
