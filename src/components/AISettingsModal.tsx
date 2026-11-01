
import React, { useEffect, useState } from 'react';
import {
  X,
  Bot,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Sparkles,
  Loader2,
} from 'lucide-react';

import { aiSettingsManager, AISettings } from '../brain/provider/AISettingsManager';

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TestStatus = {
  testing: boolean;
  message: string;
  success?: boolean;
} | null;

export const AISettingsModal: React.FC<AISettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [settings, setSettings] = useState<AISettings>(
    aiSettingsManager.getSettings()
  );

  const [showKeys, setShowKeys] = useState(false);
  const [testStatus, setTestStatus] = useState<TestStatus>(null);

  useEffect(() => {
    if (!isOpen) return;

    setSettings(aiSettingsManager.getSettings());
    setTestStatus(null);
    setShowKeys(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const updateSetting = (
    key: keyof AISettings,
    value: string
  ) => {
    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }));

    setTestStatus(null);
  };

  const handleSave = () => {
    if (
      settings.provider === 'openai' &&
      !settings.openAiApiKey.trim()
    ) {
      setTestStatus({
        testing: false,
        success: false,
        message: 'OpenAI API Key দিন।',
      });
      return;
    }

    if (
      settings.provider === 'gemini' &&
      !settings.geminiApiKey.trim()
    ) {
      setTestStatus({
        testing: false,
        success: false,
        message: 'Gemini API Key দিন।',
      });
      return;
    }

    if (
      settings.provider === 'auto' &&
      !settings.openAiApiKey.trim() &&
      !settings.geminiApiKey.trim()
    ) {
      setTestStatus({
        testing: false,
        success: false,
        message: 'Auto mode-এর জন্য অন্তত একটি API Key দিন।',
      });
      return;
    }

    aiSettingsManager.saveSettings({
      provider: settings.provider,
      openAiApiKey: settings.openAiApiKey.trim(),
      geminiApiKey: settings.geminiApiKey.trim(),
      model: settings.model,
      adminMode: false,
    });

    onClose();
  };

  const handleTestConnection = async () => {
    if (
      settings.provider === 'openai' &&
      !settings.openAiApiKey.trim()
    ) {
      setTestStatus({
        testing: false,
        success: false,
        message: 'প্রথমে OpenAI API Key দিন।',
      });
      return;
    }

    if (
      settings.provider === 'gemini' &&
      !settings.geminiApiKey.trim()
    ) {
      setTestStatus({
        testing: false,
        success: false,
        message: 'প্রথমে Gemini API Key দিন।',
      });
      return;
    }

    if (
      settings.provider === 'auto' &&
      !settings.openAiApiKey.trim() &&
      !settings.geminiApiKey.trim()
    ) {
      setTestStatus({
        testing: false,
        success: false,
        message: 'Auto mode-এর জন্য অন্তত একটি API Key প্রয়োজন।',
      });
      return;
    }

    setTestStatus({
      testing: true,
      message: 'AI connection পরীক্ষা হচ্ছে...',
    });

    try {
      const response = await fetch('/api/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userQuery: 'Hello NEXORA. Connection test.',
          availableToolsJson: '[]',
          currentContextState: 'Connection test',
          preferredProvider: settings.provider,
          openAiApiKey: settings.openAiApiKey.trim(),
          geminiApiKey: settings.geminiApiKey.trim(),
          model: settings.model,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      const actualProvider = String(data.provider || '');

      const providerConnected =
        settings.provider === 'openai'
          ? actualProvider.toUpperCase().includes('OPENAI')
          : settings.provider === 'gemini'
            ? actualProvider.toUpperCase().includes('GEMINI')
            : settings.provider === 'auto'
              ? actualProvider.toUpperCase().includes('OPENAI') ||
                actualProvider.toUpperCase().includes('GEMINI')
              : actualProvider.includes('FREE');

      setTestStatus({
        testing: false,
        success: providerConnected,
        message: providerConnected
          ? `Connection successful: ${actualProvider}`
          : `Selected AI provider connect হয়নি। Server response: ${actualProvider || 'Unknown'}`,
      });
    } catch (error) {
      setTestStatus({
        testing: false,
        success: false,
        message:
          error instanceof Error
            ? `Connection failed: ${error.message}`
            : 'Connection failed.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl border border-cyan-500/40 bg-slate-900 p-5 space-y-5">

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-cyan-950 flex items-center justify-center">
              <Bot className="w-6 h-6 text-cyan-400" />
            </div>

            <div>
              <h2 className="text-lg font-black text-white">
                NEXORA AI
              </h2>
              <p className="text-xs text-slate-400">
                API Configuration
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300">
            AI Provider
          </label>

          <select
            value={settings.provider}
            onChange={(event) =>
              updateSetting('provider', event.target.value)
            }
            className="w-full rounded-xl bg-slate-950 border border-slate-700 p-3 text-sm text-white outline-none focus:border-cyan-400"
          >
            <option value="auto">Auto Select</option>
            <option value="gemini">Google Gemini</option>
            <option value="openai">OpenAI</option>
            <option value="free">Free AI</option>
          </select>
        </div>

        {(settings.provider === 'gemini' ||
          settings.provider === 'auto') && (
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <KeyRound className="w-4 h-4 text-cyan-400" />
              Gemini API Key
            </label>

            <input
              type={showKeys ? 'text' : 'password'}
              autoComplete="off"
              value={settings.geminiApiKey}
              onChange={(event) =>
                updateSetting('geminiApiKey', event.target.value)
              }
              placeholder="Paste Gemini API Key"
              className="w-full rounded-xl bg-slate-950 border border-slate-700 p-3 pr-12 text-sm text-white outline-none focus:border-cyan-400"
            />
          </div>
        )}

        {(settings.provider === 'openai' ||
          settings.provider === 'auto') && (
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <KeyRound className="w-4 h-4 text-emerald-400" />
              OpenAI API Key
            </label>

            <input
              type={showKeys ? 'text' : 'password'}
              autoComplete="off"
              value={settings.openAiApiKey}
              onChange={(event) =>
                updateSetting('openAiApiKey', event.target.value)
              }
              placeholder="Paste OpenAI API Key"
              className="w-full rounded-xl bg-slate-950 border border-slate-700 p-3 pr-12 text-sm text-white outline-none focus:border-cyan-400"
            />
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowKeys((previous) => !previous)}
          className="text-xs text-cyan-300 flex items-center gap-2"
        >
          {showKeys ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
          {showKeys ? 'Hide API Keys' : 'Show API Keys'}
        </button>

        <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
            <ShieldCheckIcon />
            API Key Security
          </div>

          <p className="text-[11px] leading-relaxed text-slate-400">
            API Key Browser localStorage-এ Save হবে না।
            আপাতত App Session-এর Memory-তে থাকবে।
            App বন্ধ হলে আবার Key দিতে হবে।
          </p>
        </div>

        {testStatus && (
          <div
            className={`rounded-xl border p-3 text-xs flex items-start gap-2 ${
              testStatus.testing
                ? 'border-blue-800 bg-blue-950/40 text-blue-200'
                : testStatus.success
                  ? 'border-emerald-800 bg-emerald-950/40 text-emerald-200'
                  : 'border-rose-800 bg-rose-950/40 text-rose-200'
            }`}
          >
            {testStatus.testing ? (
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            ) : testStatus.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}

            <span>{testStatus.message}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testStatus?.testing === true}
            className="rounded-xl bg-slate-800 border border-slate-700 py-3 text-xs font-bold text-cyan-300 disabled:opacity-50"
          >
            TEST CONNECTION
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 py-3 text-xs font-black text-slate-950 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            SAVE SETTINGS
          </button>
        </div>

        <p className="text-[10px] text-slate-500 text-center">
          <Sparkles className="w-3 h-3 inline mr-1" />
          NEXORA AI Configuration
        </p>
      </div>
    </div>
  );
};

const ShieldCheckIcon: React.FC = () => (
  <CheckCircle2 className="w-4 h-4" />
);
