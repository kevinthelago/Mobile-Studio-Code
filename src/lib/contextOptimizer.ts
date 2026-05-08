import { ChatMessage, ContentBlock, ToolUseBlock, ToolResultBlock } from './types';
import { anthropicComplete } from './anthropic';

// Rough char→token conversion. 1 token ≈ 4 chars for English code/prose.
const COMPACT_THRESHOLD_CHARS = 60_000;
const COMPACT_KEEP_USER_TURNS = 2;

const STALE_READ_STUB = '[stale: file was re-read or modified later in this conversation; re-read with read_file if you need the current contents]';

export function approxMessagesSize(messages: ChatMessage[]): number {
  return JSON.stringify(messages).length;
}

// Walk messages and replace stale read_file results with a stub. A read_file
// result is "stale" if a later assistant turn issues another tool_use against
// the same path (either read_file again or write_file). Keeps the most recent
// read of each path intact so the agent can still reason about current state.
//
// Pure: returns a new messages array; does not mutate input.
export function evictStaleToolResults(messages: ChatMessage[]): {
  messages: ChatMessage[];
  evicted: number;
} {
  // Build a map of tool_use_id → { path, indexInFlatStream } for every
  // read_file / write_file call, in order of occurrence.
  type Entry = { id: string; name: string; path: string; turnIdx: number };
  const calls: Entry[] = [];

  messages.forEach((msg, turnIdx) => {
    if (msg.role !== 'assistant' || typeof msg.content === 'string') return;
    for (const block of msg.content) {
      if (block.type !== 'tool_use') continue;
      const path = (block.input as { path?: string }).path;
      if (typeof path !== 'string') continue;
      if (block.name === 'read_file' || block.name === 'write_file') {
        calls.push({ id: block.id, name: block.name, path, turnIdx });
      }
    }
  });

  // For each read_file, decide if any LATER call targets the same path.
  // If yes, mark its tool_use_id as stale.
  const staleIds = new Set<string>();
  for (let i = 0; i < calls.length; i++) {
    const c = calls[i];
    if (c.name !== 'read_file') continue;
    for (let j = i + 1; j < calls.length; j++) {
      if (calls[j].path === c.path) {
        staleIds.add(c.id);
        break;
      }
    }
  }

  if (staleIds.size === 0) return { messages, evicted: 0 };

  let evicted = 0;
  const out = messages.map((msg) => {
    if (msg.role !== 'user' || typeof msg.content === 'string') return msg;
    const newContent: ContentBlock[] = msg.content.map((block) => {
      if (block.type !== 'tool_result') return block;
      if (!staleIds.has(block.tool_use_id)) return block;
      if (block.content === STALE_READ_STUB) return block; // already evicted
      evicted++;
      return { ...block, content: STALE_READ_STUB };
    });
    return { ...msg, content: newContent };
  });

  return { messages: out, evicted };
}

// Find the cut index that keeps the last N text-only user messages plus
// everything after them. Returns -1 if no safe cut exists (too few user
// messages, or all user messages are tool_results).
function findCompactionCut(messages: ChatMessage[], keepLast: number): number {
  const userTextIndices: number[] = [];
  messages.forEach((m, i) => {
    if (m.role === 'user' && typeof m.content === 'string') {
      userTextIndices.push(i);
    }
  });
  if (userTextIndices.length <= keepLast) return -1;
  return userTextIndices[userTextIndices.length - keepLast];
}

function summarizableText(messages: ChatMessage[]): string {
  // Compress to a plain transcript for the summarizer. Skip raw tool_use IDs
  // and binary blobs; keep the human-readable signal.
  const lines: string[] = [];
  for (const msg of messages) {
    if (typeof msg.content === 'string') {
      lines.push(`${msg.role.toUpperCase()}: ${msg.content}`);
      continue;
    }
    for (const block of msg.content) {
      if (block.type === 'text') {
        lines.push(`${msg.role.toUpperCase()}: ${block.text}`);
      } else if (block.type === 'tool_use') {
        const u = block as ToolUseBlock;
        const path = (u.input as { path?: string }).path ?? '';
        lines.push(`TOOL_CALL: ${u.name}(${path})`);
      } else if (block.type === 'tool_result') {
        const r = block as ToolResultBlock;
        const head = r.content.slice(0, 400);
        lines.push(`TOOL_RESULT: ${head}${r.content.length > 400 ? '…' : ''}`);
      }
    }
  }
  return lines.join('\n');
}

const COMPACT_SYSTEM = `You are a conversation summarizer for a mobile coding assistant. Summarize the prior conversation between a user and the assistant. Focus on:
- What the user is trying to accomplish (the goal)
- Key decisions made
- Files that were read or modified, and why
- Any open questions or TODOs
Be concise (under 200 words) but preserve enough detail that another assistant could pick up where this left off without re-reading the original turns.`;

// Compact older history into a single synthesized user/assistant pair when the
// conversation exceeds the threshold. Uses Haiku for the summary call.
//
// Returns the (possibly unchanged) messages array, plus a flag indicating
// whether compaction happened so the caller can surface UI feedback.
export async function maybeCompactHistory(
  messages: ChatMessage[],
  apiKey: string,
): Promise<{ messages: ChatMessage[]; compacted: boolean; reason: string }> {
  const size = approxMessagesSize(messages);
  if (size < COMPACT_THRESHOLD_CHARS) {
    return { messages, compacted: false, reason: 'under threshold' };
  }
  const cut = findCompactionCut(messages, COMPACT_KEEP_USER_TURNS);
  if (cut <= 0) {
    return { messages, compacted: false, reason: 'no safe cut point' };
  }

  const prefix = messages.slice(0, cut);
  const tail = messages.slice(cut);
  const transcript = summarizableText(prefix);
  let summary: string;
  try {
    summary = await anthropicComplete(apiKey, COMPACT_SYSTEM, transcript, 400);
  } catch {
    // If the summarizer fails, return the original messages — better to pay
    // for a long turn than to lose context.
    return { messages, compacted: false, reason: 'summarizer failed' };
  }

  const synthUser: ChatMessage = {
    role: 'user',
    content:
      `[Earlier in this task — auto-compacted summary, ${prefix.length} prior turns]:\n\n${summary}`,
  };
  const synthAssistant: ChatMessage = {
    role: 'assistant',
    content: 'Acknowledged. Continuing from the summary above.',
  };

  return {
    messages: [synthUser, synthAssistant, ...tail],
    compacted: true,
    reason: `compacted ${prefix.length} → 2 turns (${size.toLocaleString()} chars)`,
  };
}
