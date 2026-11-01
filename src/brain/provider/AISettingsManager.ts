export type AIProviderChoice = 'auto' | 'openai' | 'gemini' | 'free';

export interface AISettings {
  provider: AIProviderChoice;
  openAiApiKey: string;
  geminiApiKey: string;
  model: string;
  adminMode: boolean;
}

const STORAGE_KEY = 'nexora_ai_settings_v2';

const DEFAULT_SETTINGS: AISettings = {
  provider: 'auto',
  openAiApiKey: '',
  geminiApiKey: '',
  model: 'gpt-4o-mini',
  adminMode: false,
};

class AISettingsManagerService {
  private settings: AISettings;
  private listeners: ((settings: AISettings) => void)[] = [];

  constructor() {
    this.settings = this.loadSettings();
  }

  private loadSettings(): AISettings {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch {}
    return { ...DEFAULT_SETTINGS };
  }

  getSettings(): AISettings {
    return { ...this.settings };
  }

  saveSettings(newSettings: Partial<AISettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
      } catch {}
    }
    this.listeners.forEach((fn) => fn(this.settings));
  }

  subscribe(fn: (settings: AISettings) => void): () => void {
    this.listeners.push(fn);
    fn(this.settings);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }
}

export const aiSettingsManager = new AISettingsManagerService();
