import * as functions from "firebase-functions";
// Force redeploy for gemini-pro
import * as admin from "firebase-admin";

admin.initializeApp();

interface LLMMessage {
  role: "user" | "assistant" | "system";
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

interface LLMRequest {
  messages: LLMMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  provider?: "gemini" | "openai" | "anthropic";
}

/**
 * Secure LLM proxy endpoint
 * Proxies requests to LLM providers without exposing API keys to the client
 * Updated config check
 */
export const callLLM = functions.https.onCall(async (data: LLMRequest, context) => {
  // Optional: Add authentication check
  // if (!context.auth) {
  //   throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
  // }

  const { messages, model, temperature, maxTokens, provider } = data;

  // Get API key from Firebase config (set via: firebase functions:config:set gemini.key="your-key")
  // This uses the legacy config API which works now, but will need migration by March 2026
  const geminiKey = functions.config().gemini?.key || process.env.GEMINI_API_KEY;
  const openaiKey = functions.config().openai?.key || process.env.OPENAI_API_KEY;
  const anthropicKey = functions.config().anthropic?.key || process.env.ANTHROPIC_API_KEY;

  // Determine which provider to use
  const selectedProvider = provider ||
    (openaiKey ? "openai" : anthropicKey ? "anthropic" : geminiKey ? "gemini" : null);

  if (!selectedProvider) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "No LLM API key configured"
    );
  }

  try {
    let response: any;

    if (selectedProvider === "gemini" && geminiKey) {
      response = await callGeminiAPI(messages, geminiKey, model || "gemini-1.5-flash", temperature, maxTokens);
    } else if (selectedProvider === "openai" && openaiKey) {
      response = await callOpenAIAPI(messages, openaiKey, model || "gpt-4o-mini", temperature, maxTokens);
    } else if (selectedProvider === "anthropic" && anthropicKey) {
      response = await callAnthropicAPI(messages, anthropicKey, model || "claude-3-5-sonnet-20241022", temperature, maxTokens);
    } else {
      throw new functions.https.HttpsError(
        "failed-precondition",
        `API key not found for provider: ${selectedProvider}`
      );
    }

    return response;
  } catch (error: any) {
    console.error("LLM API error:", error);
    throw new functions.https.HttpsError(
      "internal",
      error.message || "Failed to call LLM API"
    );
  }
});

async function callGeminiAPI(
  messages: LLMMessage[],
  apiKey: string,
  model: string,
  temperature?: number,
  maxTokens?: number
) {
  const systemInstruction = messages.find(m => m.role === "system")?.content as string || "";
  const conversationMessages = messages.filter(m => m.role !== "system");

  // Normalize model name - default to gemini-2.5-flash-lite which is confirmed available
  let modelName = model.replace(/^models\//, "");

  // If model is generic or not specified, use the available 2.5 model
  if (!modelName || modelName === "gemini-pro" || modelName === "gemini-1.5-flash" || modelName === "gemini-1.5-pro") {
    modelName = "gemini-2.5-flash-lite";
  }

  // Use v1beta API - required for 2.5 models
  const apiVersion = "v1beta";
  const apiUrl = `https://generativelanguage.googleapis.com/${apiVersion}/models/${modelName}:generateContent?key=${apiKey}`;

  const contents = conversationMessages.map(msg => {
    const parts: any[] = [];

    if (typeof msg.content === "string") {
      parts.push({ text: msg.content });
    } else {
      for (const item of msg.content) {
        if (item.type === "text" && item.text) {
          parts.push({ text: item.text });
        } else if (item.type === "image_url" && item.image_url?.url) {
          const dataUrl = item.image_url.url;
          const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
          if (matches) {
            parts.push({
              inlineData: {
                mimeType: matches[1],
                data: matches[2],
              },
            });
          }
        }
      }
    }

    return {
      role: msg.role === "assistant" ? "model" : "user",
      parts: parts,
    };
  });

  const requestBody: any = {
    contents: contents,
    generationConfig: {
      temperature: temperature || 0.7,
      maxOutputTokens: maxTokens || 2000,
    },
  };

  // v1beta supports systemInstruction directly
  if (systemInstruction) {
    requestBody.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    const errorMessage = errorData.error?.message || "API request failed";
    console.error("Gemini API error:", errorMessage, "Model:", modelName, "API:", apiVersion);
    throw new Error(`Gemini API error: ${errorMessage}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`Gemini API error: ${data.error.message || JSON.stringify(data.error)}`);
  }

  let content = "";
  if (data.candidates && data.candidates.length > 0) {
    const candidate = data.candidates[0];
    if (candidate.content?.parts?.[0]?.text) {
      content = candidate.content.parts[0].text;
    }
  }

  if (!content) {
    throw new Error("Gemini API returned empty response");
  }

  return {
    content,
    usage: data.usageMetadata ? {
      promptTokens: data.usageMetadata.promptTokenCount,
      completionTokens: data.usageMetadata.candidatesTokenCount,
      totalTokens: data.usageMetadata.totalTokenCount,
    } : undefined,
  };
}

async function callOpenAIAPI(
  messages: LLMMessage[],
  apiKey: string,
  model: string,
  temperature?: number,
  maxTokens?: number
) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || "gpt-4o-mini",
      messages: messages.map(msg => ({
        role: msg.role,
        content: typeof msg.content === "string" ? msg.content : msg.content,
      })),
      temperature: temperature || 0.7,
      max_tokens: maxTokens || 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(`OpenAI API error: ${error.error?.message || "API request failed"}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0]?.message?.content || "",
    usage: data.usage ? {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    } : undefined,
  };
}

async function callAnthropicAPI(
  messages: LLMMessage[],
  apiKey: string,
  model: string,
  temperature?: number,
  maxTokens?: number
) {
  const systemMessage = messages.find(m => m.role === "system");
  const conversationMessages = messages.filter(m => m.role !== "system");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: model || "claude-3-5-sonnet-20241022",
      max_tokens: maxTokens || 2000,
      temperature: temperature || 0.7,
      system: systemMessage?.content as string || "",
      messages: conversationMessages.map(msg => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      })),
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(`Anthropic API error: ${error.error?.message || "API request failed"}`);
  }

  const data = await response.json();
  return {
    content: data.content[0]?.text || "",
    usage: data.usage ? {
      promptTokens: data.usage.input_tokens,
      completionTokens: data.usage.output_tokens,
      totalTokens: data.usage.input_tokens + data.usage.output_tokens,
    } : undefined,
  };
}

