import type { GenerationResult, Provider, ProviderConfig } from '../types.js';
import { DEFAULT_MODELS, OPENAI_BASE_URLS } from '../types.js';

interface OpenAIResponse {
  choices: Array<{ message: { content: string | null } }>;
  model: string;
}

export async function generateWithOpenAICompat(
  prompt: string,
  provider: Extract<Provider, 'openai' | 'google' | 'custom'>,
  config: ProviderConfig,
): Promise<GenerationResult> {
  const model = config.model ?? DEFAULT_MODELS[provider];
  const baseUrl =
    config.baseUrl ??
    (provider === 'openai' || provider === 'google'
      ? OPENAI_BASE_URLS[provider]
      : 'https://api.openai.com/v1');

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`${provider} API error ${response.status}: ${body.slice(0, 200)}`);
  }

  const data = (await response.json()) as OpenAIResponse;
  const content = data.choices[0]?.message.content ?? '';

  return { content, provider, model };
}
