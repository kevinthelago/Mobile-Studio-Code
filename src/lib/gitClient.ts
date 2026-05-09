/**
 * Git operations via the GitHub REST API.
 *
 * We can't shell out from Expo managed workflow, so we talk directly to
 * GitHub's API for the operations the Run/Git tabs need:
 *   • getStatus()   — compare local HEAD ref to remote
 *   • push()        — trigger a workflow_dispatch or just report the ref
 *
 * For a real "push", we use the Git Data API:
 *   1. Get the current commit tree from remote
 *   2. Create blobs for each changed file
 *   3. Create a new tree
 *   4. Create a commit
 *   5. Update the branch ref
 *
 * Settings are stored alongside LLM settings in SecureStore.
 */

import * as SecureStore from 'expo-secure-store';
import { pushError } from './errorBus';
import * as FileSystem from 'expo-file-system';

// ── Settings ──────────────────────────────────────────────────────────────────

const KEY_GIT_SETTINGS = 'git_settings';

export interface GitSettings {
  owner: string;       // e.g. "acme"
  repo: string;        // e.g. "mobile-studio-code"
  branch: string;      // e.g. "main"
  token: string;       // GitHub PAT with repo scope
}

export const DEFAULT_GIT_SETTINGS: GitSettings = {
  owner: '',
  repo: '',
  branch: 'main',
  token: '',
};

export async function getGitSettings(): Promise<GitSettings> {
  try {
    const raw = await SecureStore.getItemAsync(KEY_GIT_SETTINGS);
    if (!raw) return { ...DEFAULT_GIT_SETTINGS };
    return { ...DEFAULT_GIT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_GIT_SETTINGS };
  }
}

export async function saveGitSettings(s: GitSettings): Promise<void> {
  await SecureStore.setItemAsync(KEY_GIT_SETTINGS, JSON.stringify(s));
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function ghFetch(
  path: string,
  settings: GitSettings,
  options: RequestInit = {},
): Promise<any> {
  const url = `https://api.github.com${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${settings.token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub ${res.status}: ${body}`);
  }
  return res.json();
}

// ── Status ────────────────────────────────────────────────────────────────────

export interface GitStatus {
  branch: string;
  remoteUrl: string;
  aheadBy: number;
  behindBy: number;
  lastCommitSha: string;
  lastCommitMessage: string;
}

export async function getRemoteStatus(): Promise<GitStatus> {
  const s = await getGitSettings();
  if (!s.owner || !s.repo || !s.token) {
    throw new Error('Git not configured. Add owner/repo/token in Settings → Git.');
  }

  const branch = await ghFetch(
    `/repos/${s.owner}/${s.repo}/branches/${s.branch}`,
    s,
  );

  return {
    branch: s.branch,
    remoteUrl: `https://github.com/${s.owner}/${s.repo}`,
    aheadBy: 0,   // we don't have a local index to diff against
    behindBy: 0,
    lastCommitSha: branch.commit.sha.slice(0, 7),
    lastCommitMessage: branch.commit.commit.message,
  };
}

// ── Push (Git Data API) ───────────────────────────────────────────────────────

export interface PushResult {
  sha: string;
  url: string;
}

/**
 * Push a set of file changes to GitHub.
 *
 * @param files  Array of { path, content } — paths relative to repo root.
 * @param message  Commit message.
 */
export async function pushFiles(
  files: Array<{ path: string; content: string }>,
  message: string,
): Promise<PushResult> {
  const s = await getGitSettings();
  if (!s.owner || !s.repo || !s.token) {
    const err = 'Git not configured. Add owner/repo/token in Settings → Git.';
    pushError('git', err);
    throw new Error(err);
  }
  if (files.length === 0) {
    throw new Error('No files provided for push.');
  }

  try {
    // 1. Get current HEAD sha
    const refData = await ghFetch(
      `/repos/${s.owner}/${s.repo}/git/ref/heads/${s.branch}`,
      s,
    );
    const headSha: string = refData.object.sha;

    // 2. Get current tree sha
    const commitData = await ghFetch(
      `/repos/${s.owner}/${s.repo}/git/commits/${headSha}`,
      s,
    );
    const baseTreeSha: string = commitData.tree.sha;

    // 3. Create blobs
    const treeItems = await Promise.all(
      files.map(async (f) => {
        const blob = await ghFetch(
          `/repos/${s.owner}/${s.repo}/git/blobs`,
          s,
          {
            method: 'POST',
            body: JSON.stringify({ content: f.content, encoding: 'utf-8' }),
          },
        );
        return {
          path: f.path,
          mode: '100644',
          type: 'blob',
          sha: blob.sha,
        };
      }),
    );

    // 4. Create new tree
    const newTree = await ghFetch(
      `/repos/${s.owner}/${s.repo}/git/trees`,
      s,
      {
        method: 'POST',
        body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems }),
      },
    );

    // 5. Create commit
    const newCommit = await ghFetch(
      `/repos/${s.owner}/${s.repo}/git/commits`,
      s,
      {
        method: 'POST',
        body: JSON.stringify({
          message,
          tree: newTree.sha,
          parents: [headSha],
        }),
      },
    );

    // 6. Update branch ref
    await ghFetch(
      `/repos/${s.owner}/${s.repo}/git/refs/heads/${s.branch}`,
      s,
      {
        method: 'PATCH',
        body: JSON.stringify({ sha: newCommit.sha, force: false }),
      },
    );

    return {
      sha: newCommit.sha.slice(0, 7),
      url: `https://github.com/${s.owner}/${s.repo}/commit/${newCommit.sha}`,
    };
  } catch (err: any) {
    pushError('git', err.message ?? 'Push failed', { detail: String(err) });
    throw err;
  }
}

// ── Read local file for push ──────────────────────────────────────────────────

/**
 * Read a file from the Expo document directory to include in a push.
 * Falls back to returning the provided fallback content directly.
 */
export async function readLocalFile(
  relativePath: string,
  fallbackContent: string,
): Promise<string> {
  try {
    const uri = FileSystem.documentDirectory + relativePath;
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) {
      return await FileSystem.readAsStringAsync(uri);
    }
  } catch {
    // ignore — use fallback
  }
  return fallbackContent;
}
