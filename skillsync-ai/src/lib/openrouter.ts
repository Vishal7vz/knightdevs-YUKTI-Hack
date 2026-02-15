/**
 * OpenRouter API client - LLM access (GPT-4o, Claude, etc.)
 */

const OPENROUTER_BASE = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || "anthropic/claude-3.5-sonnet";

export async function callOpenRouter<T>(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  options?: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
    responseFormat?: { type: "json_object" };
  }
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY or OPENAI_API_KEY is required");
  }

  // Keep under typical OpenRouter credit limits (402 = not enough credits)
  const maxTokens = options?.max_tokens ?? 1024;

  const makeRequest = async (includeResponseFormat: boolean) =>
    fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      },
      body: JSON.stringify({
        model: options?.model || DEFAULT_MODEL,
        messages,
        temperature: options?.temperature ?? 0.2,
        max_tokens: maxTokens,
        ...(includeResponseFormat && options?.responseFormat
          ? { response_format: options.responseFormat }
          : {}),
      }),
    });

  // Some OpenRouter providers reject JSON mode. Retry once without it.
  let res = await makeRequest(Boolean(options?.responseFormat));
  if (!res.ok && options?.responseFormat) {
    const firstError = await res.text();
    const errorLower = firstError.toLowerCase();
    const looksLikeResponseFormatIssue =
      errorLower.includes("response_format") ||
      errorLower.includes("json_object") ||
      errorLower.includes("json mode");

    if (res.status === 400 && looksLikeResponseFormatIssue) {
      res = await makeRequest(false);
    } else {
      if (res.status === 401) {
        throw new Error("Invalid or expired API key. Check OPENROUTER_API_KEY in .env");
      }
      if (res.status === 402) {
        throw new Error(
          "Not enough OpenRouter credits. Add credits at https://openrouter.ai/settings/credits or reduce usage."
        );
      }
      if (res.status === 429) {
        throw new Error("Rate limit exceeded. Please try again in a moment.");
      }
      throw new Error(`AI service error (${res.status}): ${firstError.slice(0, 200)}`);
    }
  }

  if (!res.ok) {
    const err = await res.text();
    if (res.status === 401) {
      throw new Error("Invalid or expired API key. Check OPENROUTER_API_KEY in .env");
    }
    if (res.status === 402) {
      throw new Error(
        "Not enough OpenRouter credits. Add credits at https://openrouter.ai/settings/credits or reduce usage."
      );
    }
    if (res.status === 429) {
      throw new Error("Rate limit exceeded. Please try again in a moment.");
    }
    throw new Error(`AI service error (${res.status}): ${err.slice(0, 200)}`);
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty response from OpenRouter");
  return content;
}
