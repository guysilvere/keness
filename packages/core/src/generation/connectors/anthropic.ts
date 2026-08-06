import Anthropic from '@anthropic-ai/sdk';
import type { GenerationResult, ProviderConfig } from '../types.js';

export async function generateWithAnthropic(
  prompt: string,
  config: ProviderConfig,
): Promise<GenerationResult> {
  const model = config.model ?? 'claude-opus-5';
  const client = new Anthropic({
    apiKey: config.apiKey,
    ...(config.baseUrl && { baseURL: config.baseUrl }),
  });

  const stream = client.messages.stream({
    model,
    max_tokens: 2048,
    thinking: { type: 'adaptive' },
    messages: [{ role: 'user', content: prompt }],
  });

  const message = await stream.finalMessage();
  const textBlock = message.content.find((b) => b.type === 'text');
  const content = textBlock?.text ?? '';

  return { content, provider: 'anthropic', model };
}
