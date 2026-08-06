import type { ElementType } from '../types.js';

export type Provider = 'anthropic' | 'openai' | 'google' | 'custom';

export interface ProviderConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

export interface GenerationOptions {
  provider?: Provider;
  dryRun?: boolean;
  targetApps?: string[];
}

export interface GenerationResult {
  content: string;
  provider: Provider;
  model: string;
  promptUsed?: string;
}

export interface GenerateRequest {
  type: ElementType;
  description: string;
  options?: GenerationOptions;
}

export const PROVIDER_ENV_VARS: Record<Provider, string> = {
  anthropic: 'KENESS_ANTHROPIC_KEY',
  openai:    'KENESS_OPENAI_KEY',
  google:    'KENESS_GOOGLE_KEY',
  custom:    'KENESS_CUSTOM_KEY',
};

export const DEFAULT_MODELS: Record<Provider, string> = {
  anthropic: 'claude-opus-5',
  openai:    'gpt-4o',
  google:    'gemini-2.0-flash',
  custom:    'gpt-4o',
};

export const OPENAI_BASE_URLS: Record<Extract<Provider, 'openai' | 'google'>, string> = {
  openai: 'https://api.openai.com/v1',
  google: 'https://generativelanguage.googleapis.com/v1beta/openai',
};
