
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json",
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders,
  });
}

function cleanJson(text) {
  if (typeof text !== "string") {
    throw new Error("AI returned an invalid response.");
  }

  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI did not return valid JSON.");
  }

  return JSON.parse(cleaned.slice(start, end + 1));
}

function normalizePlan(parsed, provider) {
  return {
    provider,
    reasoning:
      typeof parsed.reasoning === "string"
        ? parsed.reasoning
        : "Evaluated by NEXORA AI",

    selectedTool:
      typeof parsed.selectedTool === "string"
        ? parsed.selectedTool
        : null,

    toolParameters:
      parsed.toolParameters &&
      typeof parsed.toolParameters === "object" &&
      !Array.isArray(parsed.toolParameters)
        ? parsed.toolParameters
        : {},

    isTaskComplete: Boolean(parsed.isTaskComplete),

    finalResponseToUser:
      typeof parsed.finalResponseToUser === "string"
        ? parsed.finalResponseToUser
        : null,
  };
}

function createPrompt(body) {
  return `
You are NEXORA, an AI assistant.

System Instructions:
${body.systemPrompt || "Help the user in Bengali or English."}

Current Context:
${body.currentContextState || ""}

Available Tools:
${body.availableToolsJson || "[]"}

User Request:
${body.userQuery || ""}

IMPORTANT SAFETY RULES:
- Never claim an Android action was completed unless the tool execution confirms it.
- Do not bypass user confirmation for sensitive actions.
- If an action needs missing information, ask the user.
- Select only tools that appear in Available Tools.
- Never invent tool names.

Return ONLY valid JSON using this structure:
{
  "reasoning": "Short explanation",
  "selectedTool": null,
  "toolParameters": {},
  "isTaskComplete": true,
  "finalResponseToUser": "Response to the user"
}
`;
}

async function callOpenRouter(body, apiKey) {
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "X-Title": "NEXORA AI Assistant",
      },
      body: JSON.stringify({
        model: body.model || "openai/gpt-4o-mini",
        temperature: 0.2,
        response_format: {
          type: "json_object",
        },
        messages: [
          {
            role: "system",
            content: createPrompt(body),
          },
          {
            role: "user",
            content: body.userQuery || "",
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`OpenRouter HTTP ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  return normalizePlan(
    cleanJson(content),
    "OPENROUTER"
  );
}

async function callOpenAI(body, apiKey) {
  const response = await fetch(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: body.model || "gpt-4o-mini",
        temperature: 0.2,
        response_format: {
          type: "json_object",
        },
        messages: [
          {
            role: "system",
            content: createPrompt(body),
          },
          {
            role: "user",
            content: body.userQuery || "",
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`OpenAI HTTP ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  return normalizePlan(
    cleanJson(content),
    "OPENAI"
  );
}

async function callGemini(body, apiKey) {
  const model = body.model || "gemini-2.5-flash";

  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: createPrompt(body),
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini HTTP ${response.status}`);
  }

  const data = await response.json();

  const content =
    data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("") || "";

  return normalizePlan(
    cleanJson(content),
    "GEMINI"
  );
}

function localFallback(query = "") {
  const q = query.toLowerCase();

  let message =
    "আমি আপনার নির্দেশটি বুঝেছি। আরও একটু বিস্তারিত বলবেন?";

  if (
    q.includes("kemon acho") ||
    q.includes("how are you") ||
    q.includes("কেমন আছো")
  ) {
    message = "আমি ভালো আছি! আপনাকে কীভাবে সাহায্য করতে পারি?";
  } else if (
    q.includes("who are you") ||
    q.includes("তুমি কে")
  ) {
    message = "আমি NEXORA, আপনার AI assistant।";
  } else if (
    q.includes("thank you") ||
    q.includes("ধন্যবাদ")
  ) {
    message = "আপনাকে স্বাগতম!";
  }

  return {
    provider: "FREE_LOCAL",
    reasoning: "Local fallback response.",
    selectedTool: null,
    toolParameters: {},
    isTaskComplete: true,
    finalResponseToUser: message,
  };
}

async function handlePlan(request, env) {
  let body;

  try {
    const contentLength = Number(
      request.headers.get("Content-Length") || 0
    );

    if (contentLength > 65536) {
      return jsonResponse(
        { error: "REQUEST_TOO_LARGE" },
        413
      );
    }

    body = await request.json();
  } catch {
    return jsonResponse(
      { error: "INVALID_JSON" },
      400
    );
  }

  const provider = body.preferredProvider || "auto";

  const keys = {
    openrouter:
      body.openRouterApiKey || env.OPENROUTER_API_KEY,

    openai:
      body.openAiApiKey || env.OPENAI_API_KEY,

    gemini:
      body.geminiApiKey || env.GEMINI_API_KEY,
  };

  try {
    if (provider === "openrouter") {
      if (!keys.openrouter) {
        return jsonResponse({
          error: "OPENROUTER_API_KEY_MISSING",
          message: "OpenRouter API Key required.",
        }, 400);
      }

      return jsonResponse(
        await callOpenRouter(body, keys.openrouter)
      );
    }

    if (provider === "openai") {
      if (!keys.openai) {
        return jsonResponse({
          error: "OPENAI_API_KEY_MISSING",
          message: "OpenAI API Key required.",
        }, 400);
      }

      return jsonResponse(
        await callOpenAI(body, keys.openai)
      );
    }

    if (provider === "gemini") {
      if (!keys.gemini) {
        return jsonResponse({
          error: "GEMINI_API_KEY_MISSING",
          message: "Gemini API Key required.",
        }, 400);
      }

      return jsonResponse(
        await callGemini(body, keys.gemini)
      );
    }

    if (provider === "auto") {
      if (keys.openrouter) {
        return jsonResponse(
          await callOpenRouter(body, keys.openrouter)
        );
      }

      if (keys.openai) {
        return jsonResponse(
          await callOpenAI(body, keys.openai)
        );
      }

      if (keys.gemini) {
        return jsonResponse(
          await callGemini(body, keys.gemini)
        );
      }
    }

    return jsonResponse(
      localFallback(body.userQuery || "")
    );
  } catch (error) {
    // Never log API keys or complete request bodies.
    console.error(
      "NEXORA AI request failed:",
      error?.message || "Unknown error"
    );

    return jsonResponse(
      {
        error: "AI_PROVIDER_ERROR",
        message:
          "AI request failed. Check API key, model ID and provider credits.",
      },
      502
    );
  }
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return jsonResponse({
        status: "online",
        service: "NEXORA AI Backend",
        version: "1.0.0",
      });
    }

    if (
      request.method === "POST" &&
      url.pathname === "/api/plan"
    ) {
      return handlePlan(request, env);
    }

    return jsonResponse(
      {
        error: "NOT_FOUND",
        message: "NEXORA API endpoint not found.",
      },
      404
    );
  },
};
