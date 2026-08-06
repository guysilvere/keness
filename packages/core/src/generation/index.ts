import type { ElementType, KenessElement } from '../types.js';
import { buildPrompt } from './prompts.js';
import { getApiKey } from './keychain.js';
import { generateWithAnthropic } from './connectors/anthropic.js';
import { generateWithOpenAICompat } from './connectors/openai-compat.js';
import type { GenerationOptions, GenerationResult, Provider } from './types.js';

export * from './types.js';
export * from './keychain.js';

const PROVIDER_PRIORITY: Provider[] = ['anthropic', 'openai', 'google', 'custom'];

function resolveProvider(requested?: Provider): { provider: Provider; apiKey: string } {
  if (requested) {
    const apiKey = getApiKey(requested);
    if (!apiKey) throw new Error(`No API key found for provider "${requested}". Run: keness auth set ${requested}`);
    return { provider: requested, apiKey };
  }

  for (const p of PROVIDER_PRIORITY) {
    const apiKey = getApiKey(p);
    if (apiKey) return { provider: p, apiKey };
  }
  throw new Error(
    'No API key configured. Run: keness auth set anthropic  (or openai / google / custom)',
  );
}

async function callProvider(prompt: string, provider: Provider, apiKey: string): Promise<GenerationResult> {
  if (provider === 'anthropic') {
    return generateWithAnthropic(prompt, { apiKey });
  }
  return generateWithOpenAICompat(prompt, provider as 'openai' | 'google' | 'custom', { apiKey });
}

export async function generate(
  type: ElementType,
  description: string,
  options?: GenerationOptions,
): Promise<GenerationResult> {
  const prompt = buildPrompt(type, description);

  if (options?.dryRun) {
    return { content: '', provider: 'anthropic', model: 'dry-run', promptUsed: prompt };
  }

  const { provider, apiKey } = resolveProvider(options?.provider);
  return callProvider(prompt, provider, apiKey);
}

/**
 * Rewrite element content to be optimized for a specific target tool.
 * Used by `push --ai-adapt` and `sync --ai-adapt`.
 */
export async function adaptContent(
  element: KenessElement,
  targetAppName: string,
  options?: Pick<GenerationOptions, 'provider'>,
): Promise<GenerationResult> {
  const prompt = `You are an expert at writing AI coding assistant instructions.

The following is a ${element.type} called "${element.name}".
Rewrite it to be optimally formatted and phrased for use in ${targetAppName}.

<original_content>
${element.content}
</original_content>

Requirements:
- Keep the same intent and core instructions
- Adapt tone, formatting, and phrasing to ${targetAppName}'s conventions
- Do not add or remove significant functionality
- Output ONLY the rewritten content, no preamble or explanation

`;

  const { provider, apiKey } = resolveProvider(options?.provider);
  return callProvider(prompt, provider, apiKey);
}
