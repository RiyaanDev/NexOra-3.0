
import React, { useState, useEffect, useMemo } from 'react';
import {
  Smartphone,
  Layers,
  Wrench,
  ShieldCheck,
  Sparkles,
  FileCheck2,
  Power,
  Lock,
  Unlock,
  Maximize2,
  Minimize2,
  Bot,
  Key,
  Zap,
} from 'lucide-react';

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
import {
  aiSettingsManager,
  AISettings,
} from './brain/provider/AISettingsManager';
import { ReActPlanner } from './brain/planner/ReActPlanner';
import { TaskOrchestrator } from './core/orchestrator/TaskOrchestrator';
import { VoiceEngine } from './voice/VoiceEngine';

import { TaskState, TaskStepLog } from './types';
import { VirtualDevice } from './simulator/VirtualDevice';

import { ReActConsole } from './components/ReActConsole';
import { AccessibilityInspector } from './components/AccessibilityInspector';
import { SafetyRiskModal } from './components/SafetyRiskModal';
import { ToolManager } from './components/ToolManager';
import { TestRunner } from './components/TestRunner';
import { ActivationModal } from './components/ActivationModal';
import { FloatingOrb } from './components/FloatingOrb';
import { InstallApkModal } from './components/InstallApkModal';
import { AISettingsModal } from './components/AISettingsModal';

export const App: React.FC = () => {
  const {
    taskStateManager,
    toolRegistry,
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

    const riskGate = new RiskGateManager(interactiveConfirmation);
    riskGate.setAdminModeAuthorized(false);

    const provider = new GeminiAIProvider('gemini-3.8-flash');
    const planner = new ReActPlanner(provider);

    const orch = new TaskOrchestrator(
      stateManager,
      planner,
      registry,
      riskGate
    );

    const voice = new VoiceEngine(stateManager);

    return {
      taskStateManager: stateManager,
      toolRegistry: registry,
      riskGateManager: riskGate,
      orchestrator: orch,
      voiceEngine: voice,
    };
  }, []);

  // Application UI states
  const [isActivated, setIsActivated] = useState(false);
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [showInstallApkModal, setShowInstallApkModal] = useState(false);
  const [showAISettingsModal, setShowAISettingsModal] = useState(false);

  const [isAppWindowClosed, setIsAppWindowClosed] = useState(false);
  const [isDeviceLocked, setIsDeviceLocked] = useState(false);

  const [activeTab, setActiveTab] = useState<
    'workspace' | 'tree' | 'tools' | 'tests'
  >('workspace');

  const [currentState, setCurrentState] = useState<TaskState>(
    TaskState.IDLE
  );

  const [stepLogs, setStepLogs] = useState<TaskStepLog[]>([]);

  const [aiSettings, setAiSettings] = useState<AISettings>(
    aiSettingsManager.getSettings()
  );

  // Subscribe to application events and clean up listeners.
  useEffect(() => {
    const unsubState = taskStateManager.onStateChange((state) => {
      setCurrentState(state);
    });

    const unsubLogs = orchestrator.onStepLogs((logs) => {
      setStepLogs(logs);
    });

    const unsubSettings = aiSettingsManager.subscribe((settings) => {
      setAiSettings(settings);
      riskGateManager.setAdminModeAuthorized(false);
    });

    return () => {
      unsubState();
      unsubLogs();
      unsubSettings();
      voiceEngine.destroy();
    };
  }, [
    taskStateManager,
    orchestrator,
    riskGateManager,
    voiceEngine,
  ]);

  // Start a UI session only.
  // This does not grant Android permissions or activate Admin Mode.
  const handleActivationComplete = () => {
    setIsActivated(true);
    setShowActivationModal(false);
    setIsAppWindowClosed(false);

    riskGateManager.setAdminModeAuthorized(false);

    aiSettingsManager.saveSettings({
      adminMode: false,
    });

    voiceEngine.speak(
      'নেক্সোরা সেশন শুরু হয়েছে। নিরাপত্তা অনুমতি আলাদাভাবে নিয়ন্ত্রণ করা হবে।'
    );
  };

  const handleReopenDashboard = () => {
    setIsAppWindowClosed(false);
  };

  const handleToggleLock = () => {
    setIsDeviceLocked((previous) => !previous);
  };

  const activeProviderLabel = useMemo(() => {
    if (
      aiSettings.provider === 'openai' ||
      (aiSettings.provider === 'auto' && aiSettings.openAiApiKey)
    ) {
      return 'OpenAI GPT-4o-mini';
    }

    if (aiSettings.provider === 'gemini') {
      return 'Google Gemini AI';
    }

    return 'Free AI Neural Reasoner';
  }, [aiSettings]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative overflow-x-hidden">

      {!isActivated ? (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="max-w-md w-full flex flex-col items-center space-y-7 z-10 animate-in fade-in zoom-in-95 duration-300">

            <div className="relative">
              <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-[0_0_60px_rgba(6,182,212,0.6)]">
                <Power className="w-12 h-12 text-slate-950" />
              </div>

              <div className="absolute inset-0 rounded-full border-2 border-cyan-400/40 animate-ping"></div>
            </div>

            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/80 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>NEXORA • AUTONOMOUS AGENT</span>
              </div>

              <h1 className="text-4xl font-extrabold text-white tracking-tight">
                NEXORA
              </h1>

              <p className="text-sm text-slate-300 mt-2 font-bengali">
                You speak. Nexora understands. Nexora acts.
              </p>

              <p className="text-xs text-slate-400 mt-1 font-bengali">
                AI Assistant • Permission-based controls • Safety first
              </p>
            </div>

            <div
              onClick={() => setShowAISettingsModal(true)}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 cursor-pointer transition-all hover:border-cyan-500/50 shadow"
            >
              <Bot className="w-3.5 h-3.5 text-emerald-400" />

              <span>
                AI Engine:{' '}
                <strong className="text-cyan-300">
                  {activeProviderLabel}
                </strong>
              </span>

              <Key className="w-3 h-3 text-slate-500 ml-1" />
            </div>

            <div className="w-full space-y-2.5">
              <button
                onClick={() => setShowActivationModal(true)}
                className="w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-sm tracking-wider shadow-[0_0_40px_rgba(6,182,212,0.6)] transition-all hover:scale-105 flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Zap className="w-5 h-5 text-slate-950" />
                <span>START NEXORA (সেশন শুরু করুন)</span>
              </button>

              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  onClick={() => setShowAISettingsModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5 text-cyan-400" />
                  <span>AI Settings</span>
                </button>

                <button
                  onClick={() => setShowActivationModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Permissions</span>
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowInstallApkModal(true)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <span>মোবাইলে ম্যানুয়াল টেস্ট / Install APK</span>
            </button>

            <div className="text-[11px] text-slate-500 font-mono">
              Status:{' '}
              <span className="text-cyan-400">
                STANDBY (Ready to start)
              </span>
            </div>
          </div>

          <div className="hidden">
            <VirtualDevice
              isLocked={isDeviceLocked}
              onToggleLock={handleToggleLock}
            />
          </div>

          <ActivationModal
            isOpen={showActivationModal}
            onActivate={handleActivationComplete}
            onClose={() => setShowActivationModal(false)}
          />

          <AISettingsModal
            isOpen={showAISettingsModal}
            onClose={() => setShowAISettingsModal(false)}
          />

          <InstallApkModal
            isOpen={showInstallApkModal}
            onClose={() => setShowInstallApkModal(false)}
          />
        </div>
      ) : (
        <>
          <header className="bg-slate-900/90 border-b border-slate-800/80 sticky top-0 z-30 backdrop-blur-md px-4 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-black text-slate-950 shadow-lg shadow-cyan-500/20 text-lg">
                N
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-base tracking-tight text-white">
                    NEXORA
                  </h1>

                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/60 uppercase">
                    Session Active
                  </span>

                  <button
                    onClick={() => setShowAISettingsModal(true)}
                    className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/60 flex items-center gap-1 hover:bg-cyan-900 transition-colors cursor-pointer"
                  >
                    <Bot className="w-3 h-3 text-cyan-400" />
                    <span>{activeProviderLabel}</span>
                  </button>
                </div>

                <p className="text-xs text-slate-400 font-sans">
                  NEXORA session • Permission-based controls
                </p>
              </div>
            </div>

            {!isAppWindowClosed && (
              <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 p-1 rounded-xl text-xs">

                <button
                  onClick={() => setActiveTab('workspace')}
                  className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all ${
                    activeTab === 'workspace'
                      ? 'bg-cyan-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  Target Device
                </button>

                <button
                  onClick={() => setActiveTab('tree')}
                  className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all ${
                    activeTab === 'tree'
                      ? 'bg-cyan-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Accessibility Tree
                </button>

                <button
                  onClick={() => setActiveTab('tools')}
                  className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all ${
                    activeTab === 'tools'
                      ? 'bg-cyan-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  Tools & Safety
                </button>

                <button
                  onClick={() => setActiveTab('tests')}
                  className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all ${
                    activeTab === 'tests'
                      ? 'bg-cyan-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  Unit Tests
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAISettingsModal(true)}
                title="Configure AI Engine"
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>AI Setup</span>
              </button>

              <button
                onClick={() => setShowInstallApkModal(true)}
                title="Download or Install APK on Android Phone"
                className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Test APK</span>
              </button>

              <button
                onClick={handleToggleLock}
                title={isDeviceLocked ? 'Unlock device screen' : 'Simulate screen lock'}
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isDeviceLocked
                    ? 'bg-amber-950 text-amber-300 border-amber-600/80 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {isDeviceLocked ? (
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Unlock className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>
                  {isDeviceLocked ? 'Screen Locked' : 'Screen Unlocked'}
                </span>
              </button>

              <button
                onClick={() => setIsAppWindowClosed(!isAppWindowClosed)}
                title={isAppWindowClosed ? 'Show Developer Workspace' : 'Minimize Window'}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                {isAppWindowClosed ? (
                  <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                ) : (
                  <Minimize2 className="w-3.5 h-3.5 text-cyan-400" />
                )}
                <span>
                  {isAppWindowClosed ? 'Open Dashboard' : 'Minimize Window'}
                </span>
              </button>
            </div>
          </header>

          <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 pb-24">
            {isAppWindowClosed ? (
              <div className="max-w-2xl mx-auto flex flex-col items-center space-y-4">

                <div className="w-full flex items-center justify-between text-xs text-slate-400 px-1">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    NEXORA session active ({activeProviderLabel})
                  </span>

                  <button
                    onClick={handleReopenDashboard}
                    className="text-cyan-400 hover:text-cyan-300 underline font-medium cursor-pointer"
                  >
                    Open Developer Console & Logs
                  </button>
                </div>

                <div className="w-full h-[620px]">
                  <VirtualDevice
                    isLocked={isDeviceLocked}
                    onToggleLock={handleToggleLock}
                  />
                </div>
              </div>
            ) : (
              <>
                {activeTab === 'workspace' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                    <div className="lg:col-span-7 flex flex-col space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-cyan-400" />
                            Target Device Screen (Interactive)
                          </h2>

                          <p className="text-xs text-slate-400">
                            Virtual Device Simulator
                          </p>
                        </div>
                      </div>

                      <div className="h-[580px]">
                        <VirtualDevice
                          isLocked={isDeviceLocked}
                          onToggleLock={handleToggleLock}
                        />
                      </div>
                    </div>

                    <div className="lg:col-span-5 h-[580px] flex flex-col">
                      <ReActConsole
                        currentState={currentState}
                        stepLogs={stepLogs}
                        onClearLogs={() => setStepLogs([])}
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'tree' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    <div className="lg:col-span-6 h-[600px]">
                      <VirtualDevice
                        isLocked={isDeviceLocked}
                        onToggleLock={handleToggleLock}
                      />
                    </div>

                    <div className="lg:col-span-6 h-[600px]">
                      <AccessibilityInspector />
                    </div>
                  </div>
                )}

                {activeTab === 'tools' && (
                  <div className="max-w-4xl mx-auto">
                    <ToolManager
                      toolRegistry={toolRegistry}
                      riskGateManager={riskGateManager}
                    />
                  </div>
                )}

                {activeTab === 'tests' && (
                  <div className="max-w-3xl mx-auto">
                    <TestRunner />
                  </div>
                )}
              </>
            )}
          </main>

          <SafetyRiskModal riskGateManager={riskGateManager} />
        </>
      )}

      {/* Floating voice controls are available only after session activation. */}
      {isActivated && (
        <FloatingOrb
          voiceEngine={voiceEngine}
          taskStateManager={taskStateManager}
          onOpenDashboard={handleReopenDashboard}
          isDeviceLocked={isDeviceLocked}
          onToggleDeviceLock={handleToggleLock}
        />
      )}

      <AISettingsModal
        isOpen={showAISettingsModal}
        onClose={() => setShowAISettingsModal(false)}
      />

      <InstallApkModal
        isOpen={showInstallApkModal}
        onClose={() => setShowInstallApkModal(false)}
      />
    </div>
  );
};
