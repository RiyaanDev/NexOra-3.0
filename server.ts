
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(cors());
app.use(express.json());

// API: ReAct Planning Endpoint
app.post('/api/plan', async (req, res) => {
  try {
    const {
      systemPrompt,
      userQuery,
      availableToolsJson,
      currentContextState,
      openAiApiKey,
      geminiApiKey,
      openRouterApiKey,
      preferredProvider,
      model,
    } = req.body;

    // 1. OpenRouter Provider
    const openRouterKey =
      openRouterApiKey || process.env.OPENROUTER_API_KEY;

    if (preferredProvider === 'openrouter') {
      if (!openRouterKey) {
        return res.status(400).json({
          error: 'OPENROUTER_API_KEY_MISSING',
          message: 'OpenRouter API Key is required.',
        });
      }

      try {
        const openRouterResponse = await fetch(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${openRouterKey}`,
              'X-Title': 'NEXORA AI Assistant',
            },
            body: JSON.stringify({
              model: model || 'openai/gpt-4o-mini',
              temperature: 0.2,
              messages: [
                {
                  role: 'system',
                  content:
                    systemPrompt ||
                    'You are NEXORA, a helpful AI assistant. Respond in Bengali or English. Return valid JSON only.',
                },
                {
                  role: 'user',
                  content: `Context:
${currentContextState || ''}

Available Tools:
${availableToolsJson || '[]'}

User Request:
${userQuery || ''}

Return ONLY valid JSON:
{"reasoning":"...","selectedTool":null,"toolParameters":{},"isTaskComplete":true,"finalResponseToUser":"..."}`,
                },
              ],
            }),
          }
        );

        if (!openRouterResponse.ok) {
          const errorText = await openRouterResponse.text();

          console.error(
            'OpenRouter API error:',
            openRouterResponse.status,
            errorText
          );

          return res.status(502).json({
            error: 'OPENROUTER_API_ERROR',
            message:
              'OpenRouter request failed. Check API key, account credits and model ID.',
          });
        }

        const result = await openRouterResponse.json();

        const rawContent =
          result.choices?.[0]?.message?.content || '';

        if (!rawContent) {
          return res.status(502).json({
            error: 'OPENROUTER_EMPTY_RESPONSE',
            message: 'OpenRouter returned an empty response.',
          });
        }

        const cleaned = rawContent
          .replace(/```json/gi, '')
          .replace(/```/g, '')
          .trim();

        const parsed = JSON.parse(cleaned);

        return res.json({
          provider: 'OPENROUTER',
          reasoning:
            parsed.reasoning || 'Evaluated via OpenRouter',
          selectedTool: parsed.selectedTool || null,
          toolParameters: parsed.toolParameters || {},
          isTaskComplete: Boolean(parsed.isTaskComplete),
          finalResponseToUser:
            parsed.finalResponseToUser || null,
        });
      } catch (openRouterError: any) {
        console.error(
          'OpenRouter request failed:',
          openRouterError?.message
        );

        return res.status(502).json({
          error: 'OPENROUTER_REQUEST_FAILED',
          message: 'Could not process OpenRouter response.',
        });
      }
    }

    // 2. OpenAI Provider
    const openAiKey =
      openAiApiKey || process.env.OPENAI_API_KEY;

    const shouldTryOpenAI =
      (preferredProvider === 'openai' ||
        !preferredProvider ||
        preferredProvider === 'auto') &&
      Boolean(openAiKey);

    if (shouldTryOpenAI) {
      try {
        const openaiResponse = await fetch(
          'https://api.openai.com/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${openAiKey}`,
            },
            body: JSON.stringify({
              model: model || 'gpt-4o-mini',
              temperature: 0.2,
              messages: [
                {
                  role: 'system',
                  content:
                    systemPrompt ||
                    'You are NEXORA, an autonomous voice-controlled AI action agent. Respond in the user\'s language (Bengali or English). Always provide a helpful conversational response and choose an appropriate tool if an action is needed.',
                },
                {
                  role: 'user',
                  content: `Context:\n${currentContextState || ''}\n\nTools:\n${availableToolsJson || '[]'}\n\nUser Goal / Message: ${userQuery || ''}\n\nRespond ONLY with valid raw JSON: {"reasoning": "...", "selectedTool": "...", "toolParameters": {}, "isTaskComplete": false, "finalResponseToUser": "..."}`,
                },
              ],
            }),
          }
        );

        if (openaiResponse.ok) {
          const data = await openaiResponse.json();
          const rawContent =
            data.choices?.[0]?.message?.content || '{}';

          const cleaned = rawContent
            .replace(/```json/gi, '')
            .replace(/```/g, '')
            .trim();

          const parsed = JSON.parse(cleaned);

          return res.json({
            provider: 'OPENAI_GPT_4O_MINI',
            reasoning:
              parsed.reasoning ||
              'Evaluated via OpenAI GPT-4o-mini',
            selectedTool: parsed.selectedTool || null,
            toolParameters: parsed.toolParameters || {},
            isTaskComplete: Boolean(parsed.isTaskComplete),
            finalResponseToUser:
              parsed.finalResponseToUser || null,
          });
        }

        console.warn(
          'OpenAI returned HTTP error:',
          openaiResponse.status
        );
      } catch (openAiErr: any) {
        console.warn(
          'OpenAI request failed:',
          openAiErr?.message
        );
      }
    }

    // 3. Gemini Provider
    const apiKey =
      geminiApiKey || process.env.GEMINI_API_KEY;

    const shouldTryGemini =
      (preferredProvider === 'gemini' ||
        !preferredProvider ||
        preferredProvider === 'auto') &&
      Boolean(apiKey);

    if (shouldTryGemini) {
      try {
        const ai = new GoogleGenAI({ apiKey });

        const prompt = `
${systemPrompt || 'You are NEXORA, a voice-controlled accessibility agent.'}

Available Tools:
${availableToolsJson || '[]'}

Current UI Context:
${currentContextState || ''}

User Goal / Message: ${userQuery || ''}

Respond ONLY in valid raw JSON with this exact schema:
{
  "reasoning": "step by step explanation of what you see and what to do next",
  "selectedTool": "tool_name_or_null",
  "toolParameters": {},
  "isTaskComplete": false,
  "finalResponseToUser": "Bengali or English response to user if speaking or completing"
}
Do NOT wrap in markdown code fences. Return valid JSON only.
`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });

        const text = response.text || '';

        const cleaned = text
          .trim()
          .replace(/^```json/i, '')
          .replace(/^```/i, '')
          .replace(/```$/i, '')
          .trim();

        const parsed = JSON.parse(cleaned);

        return res.json({
          provider: 'GEMINI_SERVER_API',
          reasoning:
            parsed.reasoning ||
            'Step evaluated by Gemini',
          selectedTool: parsed.selectedTool || null,
          toolParameters: parsed.toolParameters || {},
          isTaskComplete: Boolean(parsed.isTaskComplete),
          finalResponseToUser:
            parsed.finalResponseToUser || null,
        });
      } catch (geminiError: any) {
        console.warn(
          'Gemini API request failed:',
          geminiError?.message
        );
      }
    }

    // 4. Free Local Fallback
    const fallbackPlan = generateLocalPlan(
      userQuery,
      currentContextState,
      availableToolsJson
    );

    return res.json({
      provider: 'FREE_AUTONOMOUS_NEURAL_REASONER',
      ...fallbackPlan,
    });
  } catch (err: any) {
    console.error('Plan generation failed:', err);

    return res.status(500).json({
      error: 'Plan generation failed',
      reasoning: `Server error: ${err?.message}`,
      selectedTool: null,
      toolParameters: {},
      isTaskComplete: true,
      finalResponseToUser:
        'AI service-e somossa hocche. Please try again.',
    });
  }
});

function generateLocalPlan(
  query: string = '',
  contextState: string = '',
  toolsJson: string = ''
) {
  const q = query.toLowerCase();
  const lowerContext = contextState.toLowerCase();

  // 0. Conversational Responses
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
        'আমি অনেক ভালো আছি! নেক্সোরা সার্বক্ষণিক প্রস্তুত। আপনি কী করতে চান বলুন?',
    };
  }

  if (
    q.includes('who are you') ||
    q.includes('তুমি কে') ||
    q.includes('tumi ke') ||
    q.includes('what is nexora')
  ) {
    return {
      reasoning: 'User asked about Nexora identity.',
      selectedTool: null,
      toolParameters: {},
      isTaskComplete: true,
      finalResponseToUser:
        'আমি নেক্সোরা (NEXORA) — আপনার AI assistant।',
    };
  }

  if (
    q.includes('কি করতে পারো') ||
    q.includes('what can you do') ||
    q.includes('help') ||
    q.includes('সাহায্য')
  ) {
    return {
      reasoning: 'User requested capability overview.',
      selectedTool: null,
      toolParameters: {},
      isTaskComplete: true,
      finalResponseToUser:
        'আমি AI assistant হিসেবে আপনার নির্দেশ বুঝে সাহায্য করতে পারি। বাস্তব Android control-এর জন্য প্রয়োজনীয় native permissions ও features চালু থাকতে হবে।',
    };
  }

  if (
    q.includes('ধন্যবাদ') ||
    q.includes('thank you') ||
    q.includes('thanks') ||
    q.includes('shukriya')
  ) {
    return {
      reasoning: 'User expressed gratitude.',
      selectedTool: null,
      toolParameters: {},
      isTaskComplete: true,
      finalResponseToUser:
        'আপনাকে অনেক ধন্যবাদ! আমি সাহায্য করতে প্রস্তুত।',
    };
  }

  // 1. Call Actions
  if (
    q.includes('answer call') ||
    q.includes('call dhoro') ||
    q.includes('কল ধরো') ||
    q.includes('রিসিভ করো') ||
    q.includes('receive call') ||
    q.includes('ফোন তোলো') ||
    q.includes('accept call')
  ) {
    return {
      reasoning: 'User requested answering an incoming call.',
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
    q.includes('reject call') ||
    q.includes('ফোন কাটো') ||
    q.includes('cut phone') ||
    q.includes('disconnect')
  ) {
    return {
      reasoning: 'User requested ending a call.',
      selectedTool: 'cut_call',
      toolParameters: {},
      isTaskComplete: true,
      finalResponseToUser:
        'কল শেষ করার অনুরোধটি গ্রহণ করা হয়েছে।',
    };
  }

  if (
    q.includes('call') ||
    q.includes('ফোন দাও') ||
    q.includes('ডায়াল')
  ) {
    const contactMatch = query.match(
      /(?:call|phone)\s+([a-zA-Z0-9\s]+)/i
    );

    const target =
      contactMatch && contactMatch[1]
        ? contactMatch[1].trim()
        : '';

    return {
      reasoning: `Calling action requested for ${target || 'unknown contact'}.`,
      selectedTool: 'make_call',
      toolParameters: {
        contactName: target,
      },
      isTaskComplete: false,
      finalResponseToUser:
        'কল করার আগে contact নিশ্চিত করতে হবে।',
    };
  }

  // 2. Search Actions
  if (
    q.includes('search') ||
    q.includes('খোঁজ') ||
    q.includes('khujo') ||
    q.includes('google')
  ) {
    const term = query
      .replace(
        /(?:search for|search|খোঁজ|khujo|google|please)/gi,
        ''
      )
      .trim();

    return {
      reasoning: `Search requested for "${term}".`,
      selectedTool: 'search_query',
      toolParameters: {
        query: term || query,
      },
      isTaskComplete: false,
      finalResponseToUser:
        'সার্চের অনুরোধটি গ্রহণ করা হয়েছে।',
    };
  }

  // 3. Create Actions
  if (
    q.includes('create') ||
    q.includes('add note') ||
    q.includes('নতুন নোট') ||
    q.includes('not likho') ||
    q.includes('make note')
  ) {
    const noteMatch = query.match(
      /(?:note|নোট|create|add)\s+["']?([^"']+)["']?/i
    );

    const noteText =
      noteMatch && noteMatch[1]
        ? noteMatch[1].trim()
        : query;

    return {
      reasoning: `Creating note: "${noteText}".`,
      selectedTool: 'create_item',
      toolParameters: {
        type: 'note',
        content: noteText,
      },
      isTaskComplete: false,
      finalResponseToUser:
        'নোট তৈরির অনুরোধটি গ্রহণ করা হয়েছে।',
    };
  }

  // 4. Modify Actions
  if (
    q.includes('modify') ||
    q.includes('change') ||
    q.includes('update') ||
    q.includes('বদলাও') ||
    q.includes('edit')
  ) {
    return {
      reasoning: 'Modify action requested.',
      selectedTool: 'modify_item',
      toolParameters: {
        target: '',
        newValue: '',
      },
      isTaskComplete: false,
      finalResponseToUser:
        'কোন item পরিবর্তন করতে হবে তা জানতে চাই।',
    };
  }

  // 5. Delete Actions
  if (
    q.includes('delete') ||
    q.includes('remove') ||
    q.includes('মুছে ফেলো') ||
    q.includes('kete felo')
  ) {
    return {
      reasoning: 'Delete action requested.',
      selectedTool: 'delete_item',
      toolParameters: {
        target: '',
      },
      isTaskComplete: false,
      finalResponseToUser:
        'কোন item মুছতে হবে তা নিশ্চিত করতে হবে।',
    };
  }

  // 6. Arrange Actions
  if (
    q.includes('arrange') ||
    q.includes('sort') ||
    q.includes('manage') ||
    q.includes('সাজাও') ||
    q.includes('organize')
  ) {
    return {
      reasoning: 'Arrange action requested.',
      selectedTool: 'arrange_items',
      toolParameters: {
        sortBy: 'priority',
      },
      isTaskComplete: false,
      finalResponseToUser:
        'Arrange করার অনুরোধটি গ্রহণ করা হয়েছে।',
    };
  }

  // 7. App Switching
  if (
    q.includes('whatsapp') ||
    q.includes('হোয়াটসঅ্যাপ')
  ) {
    if (
      !lowerContext.includes('whatsapp') &&
      !lowerContext.includes('recent conversations')
    ) {
      return {
        reasoning: 'WhatsApp opening requested.',
        selectedTool: 'open_app',
        toolParameters: {
          packageName: 'com.whatsapp',
        },
        isTaskComplete: false,
        finalResponseToUser:
          'WhatsApp খোলার অনুরোধটি গ্রহণ করা হয়েছে।',
      };
    }
  }

  if (
    q.includes('setting') ||
    q.includes('সেটিংস')
  ) {
    if (
      !lowerContext.includes('settings') &&
      !lowerContext.includes('wi-fi')
    ) {
      return {
        reasoning: 'Settings opening requested.',
        selectedTool: 'open_app',
        toolParameters: {
          packageName: 'com.android.settings',
        },
        isTaskComplete: false,
        finalResponseToUser:
          'Settings খোলার অনুরোধটি গ্রহণ করা হয়েছে।',
      };
    }
  }

  if (
    q.includes('contact') ||
    q.includes('যোগাযোগ') ||
    q.includes('ফোন')
  ) {
    if (!lowerContext.includes('contacts')) {
      return {
        reasoning: 'Contacts opening requested.',
        selectedTool: 'open_app',
        toolParameters: {
          packageName: 'com.google.android.contacts',
        },
        isTaskComplete: false,
        finalResponseToUser:
          'Contacts খোলার অনুরোধটি গ্রহণ করা হয়েছে।',
      };
    }
  }

  if (
    q.includes('note') ||
    q.includes('নোট')
  ) {
    if (!lowerContext.includes('notes')) {
      return {
        reasoning: 'Notes opening requested.',
        selectedTool: 'open_app',
        toolParameters: {
          packageName: 'com.nexora.notes',
        },
        isTaskComplete: false,
        finalResponseToUser:
          'Notes খোলার অনুরোধটি গ্রহণ করা হয়েছে।',
      };
    }
  }

  // 8. Typing Text
  if (
    q.includes('type') ||
    q.includes('likho') ||
    q.includes('লিখো') ||
    q.includes('send') ||
    q.includes('খোঁজ')
  ) {
    const match = query.match(
      /(?:type|likho|লিখো|text)\s+["']?([^"']+)["']?/i
    );

    const textToType =
      match && match[1] ? match[1].trim() : '';

    if (textToType) {
      return {
        reasoning: 'Typing action requested.',
        selectedTool: 'type_text',
        toolParameters: {
          text: textToType,
          fieldLabel: 'Input',
        },
        isTaskComplete: false,
        finalResponseToUser:
          'Text লেখার অনুরোধটি গ্রহণ করা হয়েছে।',
      };
    }
  }

  // 9. Click Element
  const screenLines = contextState.split('\n');

  for (const line of screenLines) {
    if (
      line.includes('[clickable]') ||
      line.includes('[text]')
    ) {
      const label = line
        .replace(/.*\[(clickable|text)\]\s*/i, '')
        .trim();

      if (
        label &&
        label.length > 1 &&
        q.includes(label.toLowerCase())
      ) {
        return {
          reasoning: `Matched screen target "${label}".`,
          selectedTool: 'click_element',
          toolParameters: {
            targetText: label,
          },
          isTaskComplete: false,
          finalResponseToUser:
            `"${label}" নির্বাচন করার অনুরোধটি গ্রহণ করা হয়েছে।`,
        };
      }
    }
  }

  // 10. Scroll
  if (
    q.includes('scroll down') ||
    q.includes('niche namo') ||
    q.includes('নিচে') ||
    q.includes('scroll')
  ) {
    return {
      reasoning: 'Scroll down requested.',
      selectedTool: 'scroll_screen',
      toolParameters: {
        direction: 'FORWARD',
      },
      isTaskComplete: false,
      finalResponseToUser:
        'Scroll করার অনুরোধটি গ্রহণ করা হয়েছে।',
    };
  }

  if (
    q.includes('scroll up') ||
    q.includes('upore utho') ||
    q.includes('উপরে')
  ) {
    return {
      reasoning: 'Scroll up requested.',
      selectedTool: 'scroll_screen',
      toolParameters: {
        direction: 'BACKWARD',
      },
      isTaskComplete: false,
      finalResponseToUser:
        'উপরে scroll করার অনুরোধটি গ্রহণ করা হয়েছে।',
    };
  }

  // Default response
  return {
    reasoning: 'No matching local action was found.',
    selectedTool: null,
    toolParameters: {},
    isTaskComplete: true,
    finalResponseToUser:
      'আমি আপনার নির্দেশটি বুঝেছি। আরও একটু বিস্তারিত বলবেন?',
  };
}

async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } =
      await import('vite');

    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port,
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');

    app.use(express.static(distPath));

    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(
      `NEXORA server running at http://0.0.0.0:${port}`
    );
  });
}

startServer();
