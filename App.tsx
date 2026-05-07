/**
 * Mobile Studio Code -- bare-bones dev environment in one file.
 *
 * Flow:
 *   1. Setup screen -- paste GitHub PAT + Anthropic key, both verified.
 *   2. Repo screen  -- pick "owner/repo", download files into local FS.
 *   3. Chat screen  -- talk to Claude; Claude has tools that read/write
 *      the local FS. Tap "Push" to commit + push every modified file.
 *
 * Required deps (already in your package.json):
 *   - expo, expo-status-bar, expo-secure-store, expo-file-system
 *   - react, react-native
 *
 * If `expo-file-system` is missing, add it:
 *   npx expo install expo-file-system
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system/legacy';

// ============================================================================
// CONFIG
// ============================================================================

const ANTHROPIC_MODEL = 'claude-sonnet-4-6';
const ANTHROPIC_VERIFY_MODEL = 'claude-haiku-4-5-20251001';
const ANTHROPIC_VERSION = '2023-06-01';

const KEYS = {
  GITHUB_PAT: 'github_pat',
  GITHUB_USER: 'github_user',
  ANTHROPIC_KEY: 'anthropic_api_key',
  REPO: 'repo_full_name',
  BRANCH: 'repo_branch',
} as const;

// Repos go under documentDirectory/repos/<owner>__<repo>/
const REPOS_ROOT = (FileSystem.documentDirectory ?? '') + 'repos/';

// ============================================================================
// TYPES
// ============================================================================

type ChatRole = 'user' | 'assistant';

type TextBlock = { type: 'text'; text: string };
type ToolUseBlock = {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
};
type ToolResultBlock = {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error?: boolean;
};
type ContentBlock = TextBlock | ToolUseBlock | ToolResultBlock;

type ChatMessage = {
  role: ChatRole;
  content: string | ContentBlock[];
};

type FileEntry = {
  sha: string | null; // GitHub blob sha at download (null for new files)
  modified: boolean; // dirty flag since last sync/push
};
type Manifest = {
  repo: string;
  branch: string;
  syncedAt: number;
  files: Record<string, FileEntry>;
};

// ============================================================================
// STORAGE -- Keychain for secrets
// ============================================================================

async function getSecret(key: string): Promise<string | null> {
  return SecureStore.getItemAsync(key);
}
async function setSecret(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value);
}

// ============================================================================
// LOCAL FILE SYSTEM -- sandboxed under documentDirectory/repos/<slug>
// ============================================================================

function repoSlug(fullName: string): string {
  return fullName.replace('/', '__');
}
function repoDir(fullName: string): string {
  return REPOS_ROOT + repoSlug(fullName) + '/';
}
function manifestPath(fullName: string): string {
  return repoDir(fullName) + '.msc-manifest.json';
}

async function ensureDir(path: string): Promise<void> {
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(path, { intermediates: true });
  }
}

async function writeText(absPath: string, content: string): Promise<void> {
  // Ensure parent directory exists
  const lastSlash = absPath.lastIndexOf('/');
  const parent = absPath.slice(0, lastSlash + 1);
  await ensureDir(parent);
  await FileSystem.writeAsStringAsync(absPath, content);
}

async function readText(absPath: string): Promise<string> {
  return FileSystem.readAsStringAsync(absPath);
}

async function listDir(absPath: string): Promise<string[]> {
  const info = await FileSystem.getInfoAsync(absPath);
  if (!info.exists || !info.isDirectory) return [];
  return FileSystem.readDirectoryAsync(absPath);
}

async function readManifest(repo: string): Promise<Manifest | null> {
  const p = manifestPath(repo);
  const info = await FileSystem.getInfoAsync(p);
  if (!info.exists) return null;
  const text = await FileSystem.readAsStringAsync(p);
  return JSON.parse(text) as Manifest;
}

async function writeManifest(m: Manifest): Promise<void> {
  await ensureDir(repoDir(m.repo));
  await FileSystem.writeAsStringAsync(
    manifestPath(m.repo),
    JSON.stringify(m, null, 2),
  );
}

// ============================================================================
// GITHUB API -- verify, list tree, fetch blob, put file
// ============================================================================

type GithubUser = { login: string; scopes: string[] };

async function verifyGithubPat(pat: string): Promise<GithubUser> {
  const res = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${pat}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (res.status === 401) throw new Error('Invalid PAT (401).');
  if (!res.ok) throw new Error(`GitHub returned ${res.status}.`);
  const scopes = (res.headers.get('x-oauth-scopes') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const body = (await res.json()) as { login: string };
  return { login: body.login, scopes };
}

type TreeEntry = {
  path: string;
  mode: string;
  type: 'blob' | 'tree' | 'commit';
  sha: string;
  size?: number;
};

async function getRepoTree(
  pat: string,
  repo: string,
  branch: string,
): Promise<TreeEntry[]> {
  // Get the latest commit on branch -> its tree sha -> tree recursive
  const refRes = await fetch(
    `https://api.github.com/repos/${repo}/git/ref/heads/${branch}`,
    {
      headers: {
        Authorization: `Bearer ${pat}`,
        Accept: 'application/vnd.github+json',
      },
    },
  );
  if (!refRes.ok) throw new Error(`Branch ${branch} not found (${refRes.status}).`);
  const ref = (await refRes.json()) as { object: { sha: string } };

  const commitRes = await fetch(
    `https://api.github.com/repos/${repo}/git/commits/${ref.object.sha}`,
    {
      headers: {
        Authorization: `Bearer ${pat}`,
        Accept: 'application/vnd.github+json',
      },
    },
  );
  if (!commitRes.ok)
    throw new Error(`Commit lookup failed (${commitRes.status}).`);
  const commit = (await commitRes.json()) as { tree: { sha: string } };

  const treeRes = await fetch(
    `https://api.github.com/repos/${repo}/git/trees/${commit.tree.sha}?recursive=1`,
    {
      headers: {
        Authorization: `Bearer ${pat}`,
        Accept: 'application/vnd.github+json',
      },
    },
  );
  if (!treeRes.ok) throw new Error(`Tree fetch failed (${treeRes.status}).`);
  const tree = (await treeRes.json()) as {
    tree: TreeEntry[];
    truncated: boolean;
  };
  if (tree.truncated) {
    // For huge repos we'd need to paginate. Out of scope for bare bones.
    console.warn('Tree truncated; some files not downloaded.');
  }
  return tree.tree.filter((e) => e.type === 'blob');
}

async function fetchBlob(
  pat: string,
  repo: string,
  sha: string,
): Promise<string> {
  const res = await fetch(
    `https://api.github.com/repos/${repo}/git/blobs/${sha}`,
    {
      headers: {
        Authorization: `Bearer ${pat}`,
        Accept: 'application/vnd.github+json',
      },
    },
  );
  if (!res.ok) throw new Error(`Blob fetch ${sha} failed (${res.status}).`);
  const body = (await res.json()) as { content: string; encoding: string };
  if (body.encoding !== 'base64') {
    throw new Error(`Unexpected encoding ${body.encoding}`);
  }
  return atob(body.content.replace(/\n/g, ''));
}

async function putFileContent(
  pat: string,
  repo: string,
  branch: string,
  path: string,
  content: string,
  message: string,
  sha: string | null,
): Promise<{ sha: string }> {
  const body: Record<string, unknown> = {
    message,
    content: btoa(unescape(encodeURIComponent(content))),
    branch,
  };
  if (sha) body.sha = sha;

  const res = await fetch(
    `https://api.github.com/repos/${repo}/contents/${path}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${pat}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PUT ${path} failed (${res.status}): ${err.slice(0, 200)}`);
  }
  const result = (await res.json()) as { content: { sha: string } };
  return { sha: result.content.sha };
}

// ============================================================================
// REPO SYNC -- download tree -> write to local FS -> save manifest
// ============================================================================

async function downloadRepo(
  pat: string,
  repo: string,
  branch: string,
  onProgress?: (current: number, total: number, path: string) => void,
): Promise<Manifest> {
  await ensureDir(repoDir(repo));

  const blobs = await getRepoTree(pat, repo, branch);
  const files: Record<string, FileEntry> = {};

  for (let i = 0; i < blobs.length; i++) {
    const entry = blobs[i];
    onProgress?.(i, blobs.length, entry.path);
    try {
      const content = await fetchBlob(pat, repo, entry.sha);
      await writeText(repoDir(repo) + entry.path, content);
      files[entry.path] = { sha: entry.sha, modified: false };
    } catch (e) {
      // Binary files (images, etc.) can fail to decode as utf-8. Skip them.
      console.warn(`Skipped ${entry.path}:`, e);
    }
  }

  const manifest: Manifest = {
    repo,
    branch,
    syncedAt: Date.now(),
    files,
  };
  await writeManifest(manifest);
  return manifest;
}

async function pushModifiedFiles(
  pat: string,
  manifest: Manifest,
  message: string,
  onProgress?: (current: number, total: number, path: string) => void,
): Promise<{ pushed: number; manifest: Manifest }> {
  const modifiedPaths = Object.entries(manifest.files)
    .filter(([, e]) => e.modified)
    .map(([p]) => p);

  for (let i = 0; i < modifiedPaths.length; i++) {
    const path = modifiedPaths[i];
    onProgress?.(i, modifiedPaths.length, path);
    const entry = manifest.files[path];
    const content = await readText(repoDir(manifest.repo) + path);
    const result = await putFileContent(
      pat,
      manifest.repo,
      manifest.branch,
      path,
      content,
      message,
      entry.sha,
    );
    manifest.files[path] = { sha: result.sha, modified: false };
  }
  await writeManifest(manifest);
  return { pushed: modifiedPaths.length, manifest };
}

// ============================================================================
// ANTHROPIC -- verify + chat with tools
// ============================================================================

async function verifyAnthropicKey(apiKey: string): Promise<void> {
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

type ToolDefinition = {
  name: string;
  description: string;
  input_schema: object;
};

type AnthropicResponse = {
  id: string;
  content: ContentBlock[];
  stop_reason: 'end_turn' | 'tool_use' | 'max_tokens' | 'stop_sequence';
};

async function anthropicChat(
  apiKey: string,
  messages: ChatMessage[],
  tools: ToolDefinition[],
  systemPrompt: string,
): Promise<AnthropicResponse> {
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
      system: systemPrompt,
      tools,
      messages,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic ${res.status}: ${err.slice(0, 200)}`);
  }
  return (await res.json()) as AnthropicResponse;
}

// ============================================================================
// TOOLS -- definitions + implementation
// ============================================================================

const TOOL_DEFS: ToolDefinition[] = [
  {
    name: 'list_directory',
    description:
      'List files and subdirectories at a given path inside the working repo. Path is relative to repo root. Use empty string or "." for repo root.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path relative to repo root (e.g., "src" or "")',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'read_file',
    description:
      'Read the full contents of a text file. Path is relative to repo root.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path relative to repo root (e.g., "App.tsx")',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'write_file',
    description:
      'Create or overwrite a text file. Path is relative to repo root. Use this for both new files and full rewrites.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path relative to repo root' },
        content: { type: 'string', description: 'Full file contents' },
      },
      required: ['path', 'content'],
    },
  },
];

async function runTool(
  toolName: string,
  input: Record<string, unknown>,
  manifest: Manifest,
): Promise<{ result: string; manifestChanged: boolean }> {
  const root = repoDir(manifest.repo);

  switch (toolName) {
    case 'list_directory': {
      const rel = (input.path as string) || '';
      const abs = root + rel;
      const entries = await listDir(abs);
      // Filter out the manifest file from listings of root
      const filtered = entries.filter((e) => e !== '.msc-manifest.json');
      const annotated = await Promise.all(
        filtered.map(async (name) => {
          const info = await FileSystem.getInfoAsync(
            (abs.endsWith('/') ? abs : abs + '/') + name,
          );
          return info.isDirectory ? `${name}/` : name;
        }),
      );
      return {
        result:
          annotated.length === 0
            ? '(empty directory)'
            : annotated.sort().join('\n'),
        manifestChanged: false,
      };
    }
    case 'read_file': {
      const rel = input.path as string;
      try {
        const content = await readText(root + rel);
        return { result: content, manifestChanged: false };
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'read failed';
        throw new Error(`read_file('${rel}'): ${msg}`);
      }
    }
    case 'write_file': {
      const rel = input.path as string;
      const content = input.content as string;
      await writeText(root + rel, content);

      // Update manifest: mark modified, or add as new file
      const existing = manifest.files[rel];
      if (existing) {
        manifest.files[rel] = { ...existing, modified: true };
      } else {
        manifest.files[rel] = { sha: null, modified: true };
      }
      return {
        result: `Wrote ${rel} (${content.length} chars).`,
        manifestChanged: true,
      };
    }
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

// ============================================================================
// AGENT LOOP -- handle tool_use until end_turn
// ============================================================================

const SYSTEM_PROMPT = `You are an AI coding assistant integrated into Mobile Studio Code, a mobile IDE running on iOS. You have tools to read and modify files in the user's local working copy of their git repository. After tool calls, briefly summarize what you did. Be concise; the user is on a phone.`;

type AgentEvent =
  | { kind: 'message'; message: ChatMessage }
  | { kind: 'tool_call'; name: string; input: Record<string, unknown> }
  | { kind: 'tool_result'; name: string; result: string; is_error: boolean };

async function runAgent(
  apiKey: string,
  history: ChatMessage[],
  manifest: Manifest,
  onEvent: (e: AgentEvent) => void,
  onManifestUpdate: (m: Manifest) => void,
): Promise<ChatMessage[]> {
  const messages = [...history];

  for (let iter = 0; iter < 12; iter++) {
    const response = await anthropicChat(apiKey, messages, TOOL_DEFS, SYSTEM_PROMPT);

    // Append assistant message to history
    const assistantMsg: ChatMessage = {
      role: 'assistant',
      content: response.content,
    };
    messages.push(assistantMsg);
    onEvent({ kind: 'message', message: assistantMsg });

    if (response.stop_reason !== 'tool_use') {
      return messages;
    }

    // Run all tool_use blocks; collect results
    const toolResults: ToolResultBlock[] = [];
    let manifestDirty = false;

    for (const block of response.content) {
      if (block.type !== 'tool_use') continue;
      onEvent({ kind: 'tool_call', name: block.name, input: block.input });
      try {
        const { result, manifestChanged } = await runTool(
          block.name,
          block.input,
          manifest,
        );
        if (manifestChanged) manifestDirty = true;
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: result,
        });
        onEvent({
          kind: 'tool_result',
          name: block.name,
          result,
          is_error: false,
        });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'tool error';
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: msg,
          is_error: true,
        });
        onEvent({
          kind: 'tool_result',
          name: block.name,
          result: msg,
          is_error: true,
        });
      }
    }

    if (manifestDirty) {
      await writeManifest(manifest);
      onManifestUpdate({ ...manifest });
    }

    // Append the user-role message containing tool_result blocks
    messages.push({ role: 'user', content: toolResults });
  }

  throw new Error('Agent exceeded max iterations.');
}

// ============================================================================
// SCREENS
// ============================================================================

type Screen = 'setup' | 'repo' | 'chat';

// ----------------------------------------------------------- Setup screen --

function SetupScreen(props: {
  onComplete: () => void;
  initialGhStored: boolean;
  initialAnStored: boolean;
  initialGhUser: string | null;
}) {
  const [ghPat, setGhPat] = useState('');
  const [ghStatus, setGhStatus] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle');
  const [ghMsg, setGhMsg] = useState<string>();
  const [ghStored, setGhStored] = useState(props.initialGhStored);
  const [ghUser, setGhUser] = useState<string | null>(props.initialGhUser);

  const [anKey, setAnKey] = useState('');
  const [anStatus, setAnStatus] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle');
  const [anMsg, setAnMsg] = useState<string>();
  const [anStored, setAnStored] = useState(props.initialAnStored);

  async function saveGh() {
    setGhStatus('testing');
    setGhMsg(undefined);
    try {
      const u = await verifyGithubPat(ghPat.trim());
      await setSecret(KEYS.GITHUB_PAT, ghPat.trim());
      await setSecret(KEYS.GITHUB_USER, u.login);
      setGhStored(true);
      setGhUser(u.login);
      setGhPat('');
      setGhStatus('ok');
      const missing = ['repo'].filter((s) => !u.scopes.includes(s));
      setGhMsg(
        `Signed in as ${u.login}` +
          (missing.length ? ` -- missing scopes: ${missing.join(', ')}` : ''),
      );
    } catch (e) {
      setGhStatus('error');
      setGhMsg(e instanceof Error ? e.message : 'Failed');
    }
  }

  async function saveAn() {
    const k = anKey.trim();
    if (!k.startsWith('sk-ant-')) {
      Alert.alert("Doesn't look right", 'Anthropic keys start with "sk-ant-". Save anyway?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Save anyway', onPress: () => doSaveAn(k) },
      ]);
      return;
    }
    doSaveAn(k);
  }

  async function doSaveAn(k: string) {
    setAnStatus('testing');
    setAnMsg(undefined);
    try {
      await verifyAnthropicKey(k);
      await setSecret(KEYS.ANTHROPIC_KEY, k);
      setAnStored(true);
      setAnKey('');
      setAnStatus('ok');
      setAnMsg('Key verified.');
    } catch (e) {
      setAnStatus('error');
      setAnMsg(e instanceof Error ? e.message : 'Failed');
    }
  }

  const ready = ghStored && anStored;

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <Text style={styles.intro}>
        Two credentials to get started. Both are verified on save and stored only on this device.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>GitHub</Text>
        <Text style={styles.helpText}>
          {ghUser
            ? `Currently: ${ghUser}. Enter a new PAT to replace.`
            : 'PAT with "repo" scope. Create at github.com / Settings / Developer settings / PATs.'}
        </Text>
        <TextInput
          value={ghPat}
          onChangeText={setGhPat}
          placeholder="ghp_... or github_pat_..."
          placeholderTextColor="#999"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />
        <Pressable
          style={[styles.primary, (!ghPat.trim() || ghStatus === 'testing') && styles.disabled]}
          onPress={saveGh}
          disabled={!ghPat.trim() || ghStatus === 'testing'}
        >
          {ghStatus === 'testing' ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Save & Verify</Text>}
        </Pressable>
        {ghMsg && (
          <Text style={[styles.statusMsg, ghStatus === 'error' ? styles.err : styles.ok]}>{ghMsg}</Text>
        )}
        {ghStored && <Text style={styles.savedNote}>[ok] Saved</Text>}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Anthropic</Text>
        <Text style={styles.helpText}>API key from console.anthropic.com / Settings / API Keys.</Text>
        <TextInput
          value={anKey}
          onChangeText={setAnKey}
          placeholder="sk-ant-..."
          placeholderTextColor="#999"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />
        <Pressable
          style={[styles.primary, (!anKey.trim() || anStatus === 'testing') && styles.disabled]}
          onPress={saveAn}
          disabled={!anKey.trim() || anStatus === 'testing'}
        >
          {anStatus === 'testing' ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Save & Verify</Text>}
        </Pressable>
        {anMsg && (
          <Text style={[styles.statusMsg, anStatus === 'error' ? styles.err : styles.ok]}>{anMsg}</Text>
        )}
        {anStored && <Text style={styles.savedNote}>[ok] Saved</Text>}
      </View>

      <Pressable
        style={[styles.continue, !ready && styles.disabled]}
        onPress={props.onComplete}
        disabled={!ready}
      >
        <Text style={styles.continueText}>{ready ? 'Continue' : 'Save both above to continue'}</Text>
      </Pressable>
    </ScrollView>
  );
}

// ----------------------------------------------------------- Repo screen --

function RepoScreen(props: {
  initialRepo: string;
  initialBranch: string;
  pat: string;
  onComplete: (repo: string, branch: string, manifest: Manifest) => void;
  onBack: () => void;
}) {
  const [repo, setRepo] = useState(props.initialRepo);
  const [branch, setBranch] = useState(props.initialBranch || 'main');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string>();
  const [error, setError] = useState<string>();

  async function download() {
    if (!repo.includes('/')) {
      setError('Format: owner/repo (e.g. kevinthelago/Mobile-Studio-Code)');
      return;
    }
    setBusy(true);
    setError(undefined);
    setProgress('Fetching tree...');
    try {
      const manifest = await downloadRepo(props.pat, repo.trim(), branch.trim(), (i, total, path) => {
        setProgress(`(${i + 1}/${total}) ${path}`);
      });
      await setSecret(KEYS.REPO, repo.trim());
      await setSecret(KEYS.BRANCH, branch.trim());
      props.onComplete(repo.trim(), branch.trim(), manifest);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Download failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <Pressable onPress={props.onBack} hitSlop={12} style={styles.backLink}>
        <Text style={styles.headerLink}>Back</Text>
      </Pressable>

      <Text style={styles.intro}>
        Pick a repository to download. Files are saved on this device only. Push later to commit changes back.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Repository</Text>
        <TextInput
          value={repo}
          onChangeText={setRepo}
          placeholder="owner/repo"
          placeholderTextColor="#999"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
          editable={!busy}
        />
        <Text style={[styles.cardTitle, { marginTop: 14, fontSize: 15 }]}>Branch</Text>
        <TextInput
          value={branch}
          onChangeText={setBranch}
          placeholder="main"
          placeholderTextColor="#999"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
          editable={!busy}
        />
        <Pressable
          style={[styles.primary, busy && styles.disabled]}
          onPress={download}
          disabled={busy}
        >
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Download repo</Text>}
        </Pressable>
        {progress && <Text style={[styles.statusMsg, { color: '#666' }]}>{progress}</Text>}
        {error && <Text style={[styles.statusMsg, styles.err]}>{error}</Text>}
      </View>
    </ScrollView>
  );
}

// ----------------------------------------------------------- Chat screen --

type ChatTurn =
  | { kind: 'user'; text: string }
  | { kind: 'assistant'; text: string }
  | { kind: 'tool'; name: string; input: Record<string, unknown>; result?: string; isError?: boolean };

function ChatScreen(props: {
  apiKey: string;
  pat: string;
  manifest: Manifest;
  onManifestUpdate: (m: Manifest) => void;
  onOpenRepo: () => void;
  onReset: () => void;
}) {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [pushing, setPushing] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const manifestRef = useRef(props.manifest);

  useEffect(() => {
    manifestRef.current = props.manifest;
  }, [props.manifest]);

  const modifiedCount = Object.values(props.manifest.files).filter((f) => f.modified).length;

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    setBusy(true);

    const newHistory: ChatMessage[] = [...history, { role: 'user', content: text }];
    setTurns((t) => [...t, { kind: 'user', text }]);
    setHistory(newHistory);

    try {
      const finalHistory = await runAgent(
        props.apiKey,
        newHistory,
        manifestRef.current,
        (e) => {
          if (e.kind === 'message') {
            // assistant message -- extract text blocks
            const content = e.message.content;
            if (typeof content === 'string') {
              setTurns((t) => [...t, { kind: 'assistant', text: content }]);
            } else {
              const text = content
                .filter((b): b is TextBlock => b.type === 'text')
                .map((b) => b.text)
                .join('\n');
              if (text) {
                setTurns((t) => [...t, { kind: 'assistant', text }]);
              }
            }
          } else if (e.kind === 'tool_call') {
            setTurns((t) => [...t, { kind: 'tool', name: e.name, input: e.input }]);
          } else if (e.kind === 'tool_result') {
            setTurns((t) => {
              // attach result to the last tool turn with this name
              const copy = [...t];
              for (let i = copy.length - 1; i >= 0; i--) {
                const turn = copy[i];
                if (turn.kind === 'tool' && turn.name === e.name && turn.result === undefined) {
                  copy[i] = { ...turn, result: e.result, isError: e.is_error };
                  break;
                }
              }
              return copy;
            });
          }
        },
        (m) => {
          manifestRef.current = m;
          props.onManifestUpdate(m);
        },
      );
      setHistory(finalHistory);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed';
      setTurns((t) => [...t, { kind: 'assistant', text: `! ${msg}` }]);
    } finally {
      setBusy(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
    }
  }

  async function push() {
    if (modifiedCount === 0) {
      Alert.alert('Nothing to push', 'No modified files since last sync.');
      return;
    }
    Alert.alert(
      `Push ${modifiedCount} file${modifiedCount === 1 ? '' : 's'}?`,
      `This will commit each modified file to ${props.manifest.repo} on branch ${props.manifest.branch}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Push',
          onPress: async () => {
            setPushing(true);
            try {
              const { pushed, manifest } = await pushModifiedFiles(
                props.pat,
                manifestRef.current,
                'msc: edits from Mobile Studio Code',
              );
              manifestRef.current = manifest;
              props.onManifestUpdate(manifest);
              Alert.alert('Pushed', `${pushed} file${pushed === 1 ? '' : 's'} committed.`);
            } catch (e) {
              Alert.alert('Push failed', e instanceof Error ? e.message : 'Unknown error');
            } finally {
              setPushing(false);
            }
          },
        },
      ],
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.chatHeader}>
        <View style={styles.flex1}>
          <Text style={styles.chatRepo}>{props.manifest.repo}</Text>
          <Text style={styles.chatBranch}>
            {props.manifest.branch} | {Object.keys(props.manifest.files).length} files
            {modifiedCount > 0 ? ` | ${modifiedCount} modified` : ''}
          </Text>
        </View>
        <Pressable onPress={push} disabled={pushing} style={styles.headerBtn} hitSlop={8}>
          {pushing ? (
            <ActivityIndicator />
          ) : (
            <Text style={[styles.headerBtnText, modifiedCount > 0 && { color: '#137333' }]}>
              Push{modifiedCount > 0 ? ` (${modifiedCount})` : ''}
            </Text>
          )}
        </Pressable>
        <Pressable onPress={props.onOpenRepo} style={styles.headerBtn} hitSlop={8}>
          <Text style={styles.headerBtnText}>Repo</Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: 12, paddingBottom: 20 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
      >
        {turns.length === 0 && (
          <Text style={styles.placeholder}>
            Ask Claude about the code, or have it make changes. It can list files, read them, and write to them.
          </Text>
        )}
        {turns.map((t, i) => {
          if (t.kind === 'user') {
            return (
              <View key={i} style={[styles.bubble, styles.userBubble]}>
                <Text style={[styles.bubbleText, styles.userText]}>{t.text}</Text>
              </View>
            );
          }
          if (t.kind === 'assistant') {
            return (
              <View key={i} style={[styles.bubble, styles.botBubble]}>
                <Text style={[styles.bubbleText, styles.botText]}>{t.text}</Text>
              </View>
            );
          }
          // tool
          return (
            <View key={i} style={styles.toolCard}>
              <Text style={styles.toolName}>* {t.name}</Text>
              <Text style={styles.toolInput} numberOfLines={3}>
                {summarizeToolInput(t.name, t.input)}
              </Text>
              {t.result === undefined ? (
                <Text style={styles.toolStatus}>running...</Text>
              ) : (
                <Text style={[styles.toolStatus, t.isError && { color: '#c33' }]}>
                  {t.isError ? '[x] ' : '[ok] '}
                  {truncate(t.result, 200)}
                </Text>
              )}
            </View>
          );
        })}
        {busy && (
          <View style={[styles.bubble, styles.botBubble]}>
            <ActivityIndicator />
          </View>
        )}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask Claude..."
          placeholderTextColor="#888"
          style={styles.chatInput}
          multiline
          editable={!busy}
        />
        <Pressable
          style={[styles.sendBtn, (!input.trim() || busy) && styles.disabled]}
          onPress={send}
          disabled={!input.trim() || busy}
        >
          <Text style={styles.sendBtnText}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function summarizeToolInput(name: string, input: Record<string, unknown>): string {
  if (name === 'list_directory') return `path: "${input.path}"`;
  if (name === 'read_file') return `path: "${input.path}"`;
  if (name === 'write_file') {
    const content = input.content as string;
    return `path: "${input.path}" (${content?.length ?? 0} chars)`;
  }
  return JSON.stringify(input);
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) + '...' : s;
}

// ============================================================================
// APP -- orchestrates screens and shared state
// ============================================================================

export default function App() {
  const [screen, setScreen] = useState<Screen>('setup');
  const [loading, setLoading] = useState(true);

  const [pat, setPat] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [ghUser, setGhUser] = useState<string | null>(null);
  const [repo, setRepo] = useState<string>('');
  const [branch, setBranch] = useState<string>('main');
  const [manifest, setManifest] = useState<Manifest | null>(null);

  // Initial bootstrap
  useEffect(() => {
    (async () => {
      const [p, k, u, r, b] = await Promise.all([
        getSecret(KEYS.GITHUB_PAT),
        getSecret(KEYS.ANTHROPIC_KEY),
        getSecret(KEYS.GITHUB_USER),
        getSecret(KEYS.REPO),
        getSecret(KEYS.BRANCH),
      ]);
      setPat(p);
      setApiKey(k);
      setGhUser(u);
      if (r) setRepo(r);
      if (b) setBranch(b);

      // Decide initial screen
      if (!p || !k) {
        setScreen('setup');
      } else if (r) {
        const m = await readManifest(r);
        if (m) {
          setManifest(m);
          setScreen('chat');
        } else {
          setScreen('repo');
        }
      } else {
        setScreen('repo');
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="auto" />

      <View style={styles.appHeader}>
        <Text style={styles.appHeaderTitle}>Mobile Studio Code</Text>
        <Text style={styles.appHeaderSub}>
          {screen === 'setup'
            ? 'Setup'
            : screen === 'repo'
            ? `Repo | ${ghUser ?? ''}`
            : repo}
        </Text>
      </View>

      {screen === 'setup' && (
        <SetupScreen
          initialGhStored={!!pat}
          initialAnStored={!!apiKey}
          initialGhUser={ghUser}
          onComplete={async () => {
            const [p, k, u] = await Promise.all([
              getSecret(KEYS.GITHUB_PAT),
              getSecret(KEYS.ANTHROPIC_KEY),
              getSecret(KEYS.GITHUB_USER),
            ]);
            setPat(p);
            setApiKey(k);
            setGhUser(u);
            setScreen('repo');
          }}
        />
      )}

      {screen === 'repo' && pat && (
        <RepoScreen
          initialRepo={repo}
          initialBranch={branch}
          pat={pat}
          onComplete={(r, b, m) => {
            setRepo(r);
            setBranch(b);
            setManifest(m);
            setScreen('chat');
          }}
          onBack={() => setScreen(manifest ? 'chat' : 'setup')}
        />
      )}

      {screen === 'chat' && pat && apiKey && manifest && (
        <ChatScreen
          apiKey={apiKey}
          pat={pat}
          manifest={manifest}
          onManifestUpdate={setManifest}
          onOpenRepo={() => setScreen('repo')}
          onReset={() => setScreen('setup')}
        />
      )}
    </SafeAreaView>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f6f7f9',
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight ?? 0 : 0,
  },
  appHeader: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  appHeaderTitle: { fontSize: 18, fontWeight: '700', color: '#111' },
  appHeaderSub: { fontSize: 13, color: '#666', marginTop: 2 },

  scrollContent: { padding: 16, paddingBottom: 40 },
  intro: { fontSize: 14, color: '#555', lineHeight: 20, marginBottom: 14 },
  headerLink: { fontSize: 16, color: '#1f6feb' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
  },
  cardTitle: { fontSize: 17, fontWeight: '600', color: '#111', marginBottom: 6 },
  helpText: { fontSize: 12, color: '#666', lineHeight: 17, marginBottom: 12 },

  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    fontSize: 13,
    color: '#111',
    backgroundColor: '#fafafa',
    marginBottom: 10,
  },

  primary: {
    backgroundColor: '#1f6feb',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
  },
  primaryText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  disabled: { opacity: 0.4 },

  statusMsg: { fontSize: 12, marginTop: 8, lineHeight: 17 },
  ok: { color: '#137333' },
  err: { color: '#c33' },
  savedNote: { fontSize: 12, color: '#137333', marginTop: 6 },

  continue: {
    backgroundColor: '#137333',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  continueText: { color: '#fff', fontWeight: '600', fontSize: 16 },

  // Chat
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  chatRepo: { fontSize: 14, fontWeight: '600', color: '#111' },
  chatBranch: { fontSize: 11, color: '#666', marginTop: 1 },
  headerBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  headerBtnText: { fontSize: 14, color: '#1f6feb', fontWeight: '500' },

  placeholder: { color: '#888', fontSize: 13, textAlign: 'center', marginTop: 30, paddingHorizontal: 24, lineHeight: 19 },
  bubble: { padding: 12, borderRadius: 14, marginVertical: 4, maxWidth: '88%' },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#1f6feb' },
  botBubble: { alignSelf: 'flex-start', backgroundColor: '#eef0f3' },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  userText: { color: '#fff' },
  botText: { color: '#111' },

  toolCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  toolName: { fontSize: 13, fontWeight: '600', color: '#444' },
  toolInput: {
    fontSize: 11,
    color: '#666',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    marginTop: 2,
  },
  toolStatus: {
    fontSize: 12,
    color: '#137333',
    marginTop: 4,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
  },

  inputRow: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ccc',
    alignItems: 'flex-end',
    gap: 8,
    backgroundColor: '#fff',
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
    maxHeight: 120,
    fontSize: 15,
  },
  sendBtn: {
    backgroundColor: '#1f6feb',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 18,
  },
  sendBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },

  // Utility
  flex1: { flex: 1 },
  backLink: { marginBottom: 12 },
});