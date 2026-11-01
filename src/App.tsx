
import React, { useEffect, useMemo, useState } from 'react';
import { Bot, Key, Mic, Power, ShieldCheck } from 'lucide-react';

import { TaskStateManager } from './core/state/TaskStateManager';
import { ToolRegistry } from './tools/ToolRegistry';

import { ClickTool } from './tools/system/ClickTool';
import { ScrollTool } from './tools/system/ScrollTool';
import { TypeTextTool } from './tools/system/TypeTextTool';
import { OpenAppTool } from './tools/system/OpenAppTool';

import {
  AnswerCallTool,
  CutCallTool,
  MakeCallTool,
  SearchTool,
  CreateItemTool,
  ModifyItemTool,
  DeleteItemTool,
  ArrangeItemsTool,
} from './tools/system/ExtendedTools';

import {
  SendMessageTool,
  ModifySettingTool,
  ClearAppDataTool,
} from './tools/system/SampleRiskTools';

import { RiskGateManager } from './safety/RiskGateManager';
import { interactiveConfirmation } from './safety/InteractiveConfirmation';

import { GeminiAIProvider } from './brain/provider/GeminiAIProvider';
import { ReActPlanner } from './brain/planner/ReActPlanner';
import { TaskOrchestrator } from './core/orchestrator/TaskOrchestrator';

import {
  aiSettingsManager,
  AISettings,
} from './brain/provider/AISettingsManager';

import { VoiceEngine } from './voice/VoiceEngine';

import { ActivationModal } from './components/ActivationModal';
import { AISettingsModal } from './components/AISettingsModal';
import { FloatingOrb } from './components/FloatingOrb';
import { SafetyRiskModal } from './components/SafetyRiskModal';

export const App: React.FC = () => {
  const {
    taskStateManager,
    riskGateManager,
    orchestrator,
    voiceEngine,
  } = useMemo(() => {
    const stateManager = new TaskStateManager();
    const registry = new ToolRegistry();

    registry.registerTool(new ClickTool());
    registry.registerTool(new ScrollTool());
    registry.registerTool(new TypeTextTool());
    registry.registerTool(new OpenAppTool());

    registry.registerTool(new AnswerCallTool());
    registry.registerTool(new CutCallTool());
    registry.registerTool(new MakeCallTool());
    registry.registerTool(new SearchTool());
    registry.registerTool(new CreateItemTool());
    registry.registerTool(new ModifyItemTool());
    registry.registerTool(new DeleteItemTool());
    registry.registerTool(new ArrangeItemsTool());

    registry.registerTool(new SendMessageTool());
    registry.registerTool(new ModifySettingTool());
    registry.registerTool(new ClearAppDataTool());

    const riskGate = new RiskGateManager(
      interactiveConfirmation
    );

    riskGate.setAdminModeAuthorized(false);

    const provider = new GeminiAIProvider();
    const planner = new ReActPlanner(provider);

    const taskOrchestrator = new TaskOrchestrator(
      stateManager,
      planner,
      registry,
      riskGate
    );

    const voice = new VoiceEngine(stateManager);

    return {
      taskStateManager: stateManager,
      riskGateManager: riskGate,
      orchestrator: taskOrchestrator,
      voiceEngine: voice,
    };
  }, []);

  const [isActivated, setIsActivated] = useState(false);
  const [showActivation, setShowActivation] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);

  const [aiSettings, setAiSettings] = useState<AISettings>(
    aiSettingsManager.getSettings()
  );

  useEffect(() => {
    const unsubscribe = aiSettingsManager.subscribe(
      (settings) => {
        setAiSettings(settings);
        riskGateManager.setAdminModeAuthorized(false);
      }
    );

    return () => {
      unsubscribe();
      orchestrator.destroy();
      voiceEngine.destroy();
    };
  }, [orchestrator, voiceEngine, riskGateManager]);

  const handleActivate = () => {
    setIsActivated(true);
    setShowActivation(false);

    riskGateManager.setAdminModeAuthorized(false);

    aiSettingsManager.saveSettings({
      adminMode: false,
    });

    voiceEngine.speak(
      'নেক্সোরা সেশন শুরু হয়েছে।'
    );
  };

  const providerName =
    aiSettings.provider === 'gemini'
      ? 'Google Gemini'
      : aiSettings.provider === 'openai'
        ? 'OpenAI'
        : aiSettings.provider === 'free'
          ? 'Free AI'
          : 'Automatic AI';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center px-5 py-10">

      <div className="w-full max-w-md flex-1 flex flex-col items-center justify-center gap-8">

        <div className="flex flex-col items-center gap-3">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-cyan-400 via-blue-600 to-indigo-600 flex items-center justify-center shadow-[0_0_50px_rgba(6,182,212,0.35)]">
            <span className="text-5xl font-black text-slate-950">
              N
            </span>
          </div>

          <h1 className="text-3xl font-black tracking-widest">
            NEXORA
          </h1>

          <p className="text-sm text-slate-400">
            Your Personal AI Assistant
          </p>
        </div>

        <div className="w-full rounded-2xl bg-slate-900 border border-slate-800 p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Bot className="w-6 h-6 text-cyan-400 shrink-0" />

            <div className="min-w-0">
              <p className="text-sm font-bold text-white">
                AI Engine
              </p>

              <p className="text-xs text-slate-400 truncate">
                {providerName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAISettings(true)}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-cyan-300 text-xs font-bold flex items-center gap-2"
          >
            <Key className="w-4 h-4" />
            API Settings
          </button>
        </div>

        <div className="w-full text-center space-y-4">

          {!isActivated ? (
            <>
              <div className="flex items-center justify-center gap-2 text-slate-400 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                User-controlled Assistant
              </div>

              <button
                type="button"
                onClick={() => setShowActivation(true)}
                className="w-full py-5 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 text-slate-950 font-black text-lg shadow-[0_0_35px_rgba(6,182,212,0.35)] flex items-center justify-center gap-3"
              >
                <Power className="w-6 h-6" />
                ACTIVATE NEXORA
              </button>

              <p className="text-xs text-slate-500">
                Start your personal AI assistant
              </p>
            </>
          ) : (
            <>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 text-sm font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                NEXORA SESSION ACTIVE
              </div>

              <div className="w-full p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <Bot className="w-10 h-10 mx-auto text-cyan-400" />

                <h2 className="text-lg font-bold">
                  Hello! আমি NEXORA
                </h2>

                <p className="text-sm text-slate-400">
                  তোমার Voice Command-এর জন্য প্রস্তুত।
                </p>

                <p className="text-xs text-amber-300">
                  Background Android Service এখনো যুক্ত হয়নি।
                </p>
              </div>

              <button
                type="button"
                onClick={() => voiceEngine.startListening()}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 font-black flex items-center justify-center gap-3"
              >
                <Mic className="w-6 h-6" />
                START VOICE COMMAND
              </button>

              <button
                type="button"
                onClick={() => {
                  voiceEngine.stopAll();
                  setIsActivated(false);
                }}
                className="text-xs text-slate-500 underline"
              >
                Deactivate NEXORA
              </button>
            </>
          )}
        </div>

        <p className="text-[10px] text-slate-600 text-center">
          NEXORA • Secure • Permission-based • User-controlled
        </p>
      </div>

      <ActivationModal
        isOpen={showActivation}
        onActivate={handleActivate}
        onClose={() => setShowActivation(false)}
      />

      <AISettingsModal
        isOpen={showAISettings}
        onClose={() => setShowAISettings(false)}
      />

      <SafetyRiskModal
        riskGateManager={riskGateManager}
      />

      {isActivated && (
        <FloatingOrb
          voiceEngine={voiceEngine}
          taskStateManager={taskStateManager}
          onOpenDashboard={() => {}}
          isDeviceLocked={false}
          onToggleDeviceLock={() => {}}
        />
      )}
    </div>
  );
};
