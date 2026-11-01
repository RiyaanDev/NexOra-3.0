
import { AIPlanResponse } from '../../types';
import { AIProvider } from './AIProvider';
import { aiSettingsManager } from './AISettingsManager';

export class GeminiAIProvider implements AIProvider {
  readonly providerId: string;
  private defaultModel: string;

  constructor(defaultModel: string = 'gemini-3.8-flash') {
    this.defaultModel = defaultModel;
    this.providerId = 'UNIVERSAL_AI_SENTINEL';
  }

  async generatePlan(
    systemPrompt: string,
    userQuery: string,
    availableToolsJson: string,
    currentContextState: string
  ): Promise<AIPlanResponse> {
    const settings = aiSettingsManager.getSettings();

    try {
      const response = await fetch('/api/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemPrompt,
          userQuery,
          availableToolsJson,
          currentContextState,

          model: settings.model || this.defaultModel,
          preferredProvider: settings.provider,

          openAiApiKey: settings.openAiApiKey,
          geminiApiKey: settings.geminiApiKey,
          openRouterApiKey: settings.openRouterApiKey,
        }),
      });

      if (!response.ok) {
        console.error(
          'AI backend request failed:',
          response.status
        );

        return this.clientFallbackReasoning(
          userQuery,
          currentContextState
        );
      }

      const data = await response.json();

      return {
        reasoning:
          data.reasoning ||
          `Evaluated by ${data.provider || 'AI Engine'}`,

        selectedTool: data.selectedTool || null,
        toolParameters: data.toolParameters || {},
        isTaskComplete: Boolean(data.isTaskComplete),

        finalResponseToUser:
          data.finalResponseToUser || null,
      };
    } catch (error) {
      console.warn(
        'API call failed, using client fallback:',
        error
      );

      return this.clientFallbackReasoning(
        userQuery,
        currentContextState
      );
    }
  }

  /**
   * Client-side fallback reasoning.
   * This is not a real AI API connection.
   */
  private clientFallbackReasoning(
    query: string = '',
    context: string = ''
  ): AIPlanResponse {
    const q = query.toLowerCase();

    if (
      q.includes('কেমন আছো') ||
      q.includes('kemon acho') ||
      q.includes('how are you')
    ) {
      return {
        reasoning: 'User asked pleasantry greeting.',
        selectedTool: null,
        toolParameters: {},
        isTaskComplete: true,
        finalResponseToUser:
          'আমি ভালো আছি! আপনাকে কীভাবে সাহায্য করতে পারি?',
      };
    }

    if (
      q.includes('who are you') ||
      q.includes('তুমি কে') ||
      q.includes('tumi ke') ||
      q.includes('what is nexora')
    ) {
      return {
        reasoning: 'User asked about NEXORA identity.',
        selectedTool: null,
        toolParameters: {},
        isTaskComplete: true,
        finalResponseToUser:
          'আমি NEXORA। আপনার AI assistant হিসেবে সাহায্য করার জন্য তৈরি।',
      };
    }

    if (
      q.includes('call dhoro') ||
      q.includes('answer call') ||
      q.includes('কল ধরো') ||
      q.includes('ফোন তোলো')
    ) {
      return {
        reasoning: 'Call action requested.',
        selectedTool: 'answer_call',
        toolParameters: {},
        isTaskComplete: true,
        finalResponseToUser:
          'কল ধরার অনুরোধটি গ্রহণ করা হয়েছে।',
      };
    }

    if (
      q.includes('cut call') ||
      q.includes('call kete dao') ||
      q.includes('কল কেটে দাও') ||
      q.includes('ফোন কাটো')
    ) {
      return {
        reasoning: 'End call action requested.',
        selectedTool: 'cut_call',
        toolParameters: {},
        isTaskComplete: true,
        finalResponseToUser:
          'কল শেষ করার অনুরোধটি গ্রহণ করা হয়েছে।',
      };
    }

    if (
      q.includes('call') ||
      q.includes('ফোন দাও')
    ) {
      return {
        reasoning: 'Calling action requested.',
        selectedTool: 'make_call',
        toolParameters: {
          contactName: '',
        },
        isTaskComplete: true,
        finalResponseToUser:
          'কল করার অনুরোধটি গ্রহণ করা হয়েছে।',
      };
    }

    if (
      q.includes('search') ||
      q.includes('খোঁজ') ||
      q.includes('khujo')
    ) {
      const term = query
        .replace(
          /(?:search for|search|খোঁজ|khujo|please)/gi,
          ''
        )
        .trim();

      return {
        reasoning: `Search requested for "${term}".`,
        selectedTool: 'search_query',
        toolParameters: {
          query: term || query,
        },
        isTaskComplete: true,
        finalResponseToUser:
          'সার্চের অনুরোধটি গ্রহণ করা হয়েছে।',
      };
    }

    if (
      q.includes('note') ||
      q.includes('নোট') ||
      q.includes('create')
    ) {
      return {
        reasoning: 'Create note requested.',
        selectedTool: 'create_item',
        toolParameters: {
          type: 'note',
          content: query,
        },
        isTaskComplete: true,
        finalResponseToUser:
          'নোট তৈরির অনুরোধটি গ্রহণ করা হয়েছে।',
      };
    }

    return {
      reasoning: 'Client fallback processed the request.',
      selectedTool: null,
      toolParameters: {},
      isTaskComplete: true,
      finalResponseToUser:
        `আপনার নির্দেশটি গ্রহণ করা হয়েছে: "${query}"`,
    };
  }
}
