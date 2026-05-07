import Anthropic from '@anthropic-ai/sdk';
import { getApiKey } from './storage';

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export const DEFAULT_MODEL = 'claude-sonnet-4-6';

async function getClient(): Promise<Anthropic> {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error('No API key set. Add one in Settings.');
  }
  return new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  });
}

export async function sendMessage(
  history: ChatMessage[],
  model: string = DEFAULT_MODEL,
): Promise<string> {
  const client = await getClient();
  const response = await client.messages.create({
    model,
    max_tokens: 2048,
    messages: history,
  });

  return response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n');
}
