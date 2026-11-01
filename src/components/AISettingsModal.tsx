
import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Bot,
  Zap,
  Globe,
  Radio,
  ShieldCheck,
} from 'lucide-react';

import {
  aiSettingsManager,
  AISettings,
} from '../brain/provider/AISettingsManager';

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

  const [testStatus, setTestStatus] = useState<TestStatus>(null);

  useEffect(() => {
    if (!isOpen) return;

    setSettings(aiSettingsManager.getSettings());
    setTestStatus(null);
  }, [isOpen]);

  if (!isOpen) return null;

  const selectProvider = (provider: AISettings['provider']) => {
    setSettings((previous) => ({
      ...previous,
      provider,
    }));

    setTestStatus(null);
  };

  const handleSave = () => {
    aiSettingsManager.saveSettings({
      provider: settings.provider,

      // API keys must be configured securely on the backend.
      openAiApiKey: '',
      geminiApiKey: '',

      // AI provider selection never grants Android Admin authority.
      adminMode: false,
    });

    onClose();
  };

  const handleTestConnection = async () => {
    setTestStatus({
      testing: true,
      message: 'Testing AI connection...',
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
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();

      setTestStatus({
        testing: false,
        success: true,
        message: `Server responded successfully. Provider: ${
          data.provider || 'Not specified'
        }.`,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';

      setTestStatus({
        testing: false,
        success: false,
        message: `Connection failed: ${message}. Check the backend API configuration.`,
      });
    }
  };

  const providerOptions = [
    {
      id: 'auto' as const,
      title: 'Auto',
      subtitle: 'Backend-এর configured provider নির্বাচন করবে',
      icon: Zap,
      color: 'text-cyan-400',
    },
    {
      id: 'openai' as const,
      title: 'OpenAI',
      subtitle: 'Backend-এ OpenAI API configure থাকতে হবে',
      icon: Bot,
      color: 'text-emerald-400',
    },
    {
      id: 'gemini' as const,
      title: 'Google Gemini',
      subtitle: 'Backend-এ Gemini API configure থাকতে হবে',
      icon: Globe,
      color: 'text-blue-400',
    },
    {
      id: 'free' as const,
      title: 'Free / Local',
      subtitle: 'Backend-এ Free বা Local provider implement থাকতে হবে',
      icon: Sparkles,
      color: 'text-purple-400',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900 border border-cyan-500/50 rounded-3xl p-6 shadow-[0_0_60px_rgba(6,182,212,0.3)] space-y-5">

        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 text-cyan-400 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>

            <div>
              <h3 className="font-bold text-base text-white">
                AI Engine Settings
              </h3>

              <p className="text-xs text-slate-400 font-bengali">
                AI Provider নির্বাচন ও Connection Test
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close AI settings"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-300 block">
            Choose AI Provider
          </label>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {providerOptions.map((option) => {
              const Icon = option.icon;
              const selected = settings.provider === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => selectProvider(option.id)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    selected
                      ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className={`flex items-center gap-1.5 font-bold ${option.color}`}>
                    <Icon className="w-4 h-4" />
                    <span>{option.title}</span>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-1 font-bengali leading-relaxed">
                    {option.subtitle}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            API Key Security
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed font-bengali">
            নিরাপত্তার জন্য এই App থেকে সরাসরি API Key সংরক্ষণ করা হবে না।
            OpenAI বা Gemini Key পরবর্তীতে নিরাপদ Backend Environment
            Secret হিসেবে configure করতে হবে।
          </p>

          <p className="text-[10px] text-amber-300">
            AI Provider নির্বাচন করলেই AI Connection নিশ্চিত হয় না।
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
          <div className="text-xs font-bold text-slate-200">
            Admin & Permission Safety
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed font-bengali">
            AI Settings থেকে Android Device Admin বা Accessibility
            Permission দেওয়া যায় না। গুরুত্বপূর্ণ কাজের আগে User
            Confirmation বাধ্যতামূলক থাকবে।
          </p>

          <div className="flex items-center gap-2 text-xs text-emerald-300">
            <ShieldCheck className="w-4 h-4" />
            Admin Bypass Disabled
          </div>
        </div>

        {testStatus && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
              testStatus.testing
                ? 'bg-blue-950/50 border-blue-800 text-blue-200'
                : testStatus.success
                ? 'bg-emerald-950/50 border-emerald-800 text-emerald-200'
                : 'bg-rose-950/50 border-rose-800 text-rose-200'
            }`}
          >
            {testStatus.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}

            <div className="leading-relaxed text-[11px]">
              {testStatus.message}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testStatus?.testing === true}
            className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-cyan-300 font-bold text-xs border border-slate-700 transition-all flex items-center gap-1.5"
          >
            <Radio className="w-3.5 h-3.5" />
            Test Connection
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-lg transition-all flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            SAVE SETTINGS
          </button>
        </div>
      </div>
    </div>
  );
};
