
export type AIProviderChoice =
  | 'auto'
  | 'openai'
  | 'gemini'
  | 'openrouter'
  | 'free';

export interface AISettings {
  provider: AIProviderChoice;
  openAiApiKey: string;
  geminiApiKey: string;
  openRouterApiKey: string;
  model: string;
  adminMode: boolean;
}

const STORAGE_KEY = 'nexora_ai_settings_v3';

const DEFAULT_SETTINGS: AISettings = {
  provider: 'auto',
  openAiApiKey: '',
  geminiApiKey: '',
  openRouterApiKey: '',
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
    if (typeof window === 'undefined') {
      return { ...DEFAULT_SETTINGS };
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);

      if (stored) {
        const parsed = JSON.parse(stored);

        return {
          ...DEFAULT_SETTINGS,
          provider: parsed.provider || 'auto',
          model: parsed.model || DEFAULT_SETTINGS.model,
          adminMode: false,
          openAiApiKey: '',
          geminiApiKey: '',
          openRouterApiKey: '',
        };
      }
    } catch (error) {
      console.error('Failed to load AI settings:', error);
    }

    return { ...DEFAULT_SETTINGS };
  }

  getSettings(): AISettings {
    return { ...this.settings };
  }

  saveSettings(newSettings: Partial<AISettings>): void {
    this.settings = {
      ...this.settings,
      ...newSettings,
      adminMode: false,
    };

    if (typeof window !== 'undefined') {
      try {
        const safeSettings = {
          provider: this.settings.provider,
          model: this.settings.model,
          adminMode: false,
        };

        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(safeSettings)
        );
      } catch (error) {
        console.error('Failed to save AI settings:', error);
      }
    }

    this.listeners.forEach((listener) => {
      try {
        listener({ ...this.settings });
      } catch (error) {
        console.error('AI settings listener error:', error);
      }
    });
  }

  clearApiKeys(): void {
    this.saveSettings({
      openAiApiKey: '',
      geminiApiKey: '',
      openRouterApiKey: '',
    });
  }

  subscribe(fn: (settings: AISettings) => void): () => void {
    this.listeners.push(fn);

    try {
      fn({ ...this.settings });
    } catch (error) {
      console.error('AI settings subscriber error:', error);
    }

    return () => {
      this.listeners = this.listeners.filter(
        (listener) => listener !== fn
      );
    };
  }
}

export const aiSettingsManager = new AISettingsManagerService();
