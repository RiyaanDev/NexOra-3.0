
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

  return (
    <div className="w-full rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-4">
      <div>
        <h2 className="text-white font-bold">
          Native Bridge Diagnostics
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Android Native connection test
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
        <div className="rounded-xl bg-slate-950 p-3 space-y-2 text-sm">
          <p className="text-emerald-400 font-bold">
            Native Bridge Connected
          </p>
          <p className="text-slate-300">
            Platform: {info.platform}
          </p>
          <p className="text-slate-300">
            Android Version: {info.androidVersion}
          </p>
          <p className="text-slate-300">
            SDK Version: {info.sdkVersion}
          </p>
          <p className="text-slate-300 break-all">
            Package: {info.packageName}
          </p>
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
