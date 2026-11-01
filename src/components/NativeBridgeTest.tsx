
import React, { useState } from 'react';
import {
  getNexoraNativeInfo,
  isNexoraNativeAvailable,
  NexoraNativeInfo,
} from '../native/NexoraNative';

export const NativeBridgeTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<NexoraNativeInfo | null>(null);
  const [error, setError] = useState('');

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

  return (
    <div className="w-full rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-4">
      <div>
        <h2 className="text-white font-bold">
          Native Bridge Diagnostics
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Android Device Information
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
    </div>
  );
};
