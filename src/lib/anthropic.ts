import { ChatMessage, ToolDefinition, AnthropicResponse } from './types';

export const ANTHROPIC_MODEL = 'claude-sonnet-4-6';
export const ANTHROPIC_VERIFY_MODEL = 'claude-haiku-4-5-20251001';
export const ANTHROPIC_VERSION = '2023-06-01';

const CACHE_EPHEMERAL = { type: 'ephemeral' } as const;

export async function verifyAnthropicKey(apiKey: string): Promise<void> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: ANTHROPIC_VERIFY_MODEL,
      max_tokens: 1,
      messages: [{ role: 'user', content: 'hi' }],
    }),
  });
  if (res.status === 401) throw new Error('Invalid API key (401).');
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic ${res.status}: ${err.slice(0, 120)}`);
  }
}

// Build a messages payload with a cache breakpoint on the last assistant turn.
// The next request reuses everything up to and including that point as a
// cache hit, so only the user's new message and the model's response are
// billed at full input price.
function withMessageCacheBreakpoint(messages: ChatMessage[]): unknown[] {
  let lastAssistant = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'assistant') { lastAssistant = i; break; }
  }
  return messages.map((m, i) => {
    if (i !== lastAssistant) return m;
    if (typeof m.content === 'string') {
      return {
        role: m.role,
        content: [{ type: 'text', text: m.content, cache_control: CACHE_EPHEMERAL }],
      };
    }
    const blocks = m.content;
    if (blocks.length === 0) return m;
    const last = blocks.length - 1;
    return {
      role: m.role,
      content: blocks.map((b, j) =>
        j === last ? { ...b, cache_control: CACHE_EPHEMERAL } : b,
      ),
    };
  });
}

export async function anthropicChat(
  apiKey: string,
  messages: ChatMessage[],
  tools: ToolDefinition[],
  systemPrompt: string,
): Promise<AnthropicResponse> {
  // Three cache breakpoints: system prompt, last tool def (covers all tools),
  // and last assistant turn in history. After the first call within a 5-minute
  // window, all three prefixes are 90% cheaper on input tokens.
  const systemBlocks = [
    { type: 'text' as const, text: systemPrompt, cache_control: CACHE_EPHEMERAL },
  ];
  const cachedTools = tools.map((tool, i) =>
    i === tools.length - 1 ? { ...tool, cache_control: CACHE_EPHEMERAL } : tool,
  );

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 4096,
      system: systemBlocks,
      tools: cachedTools,
      messages: withMessageCacheBreakpoint(messages),
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic ${res.status}: ${err.slice(0, 200)}`);
  }
  return (await res.json()) as AnthropicResponse;
}

// Lightweight Haiku call for short-form generation (commit messages, summaries).
// Used by both the Git-page Draft button and the agent-loop history compactor.
export async function anthropicComplete(
  apiKey: string,
  systemPrompt: string,
  userMessage: string,
  maxTokens = 200,
): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: ANTHROPIC_VERIFY_MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic ${res.status}: ${err.slice(0, 120)}`);
  }
  const body = (await res.json()) as {
    content: { type: string; text?: string }[];
  };
  return body.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text ?? '')
    .join('')
    .trim();
}

export async function anthropicDraftCommitMessage(
  apiKey: string,
  diffSummary: string,
): Promise<string> {
  const text = await anthropicComplete(
    apiKey,
    'Write a single-line conventional commit message describing the changes. Imperative mood, lowercase type prefix, no trailing period. Output only the message.',
    diffSummary,
    80,
  );
  return text.split('\n')[0];
}
