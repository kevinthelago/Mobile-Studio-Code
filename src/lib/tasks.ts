import { Task, TaskIndex, TaskSummary } from './types';
import {
  loadChat, readTask, readTaskIndex, summarizeTask,
  writeTask, writeTaskIndex,
} from './fs';

export const DEFAULT_TASK_TITLE = 'Scratch';

function genTaskId(): string {
  // 8 hex bytes from Math.random — enough collision space for a single
  // user's local task list. We don't need crypto-strength here.
  let s = '';
  for (let i = 0; i < 16; i++) {
    s += Math.floor(Math.random() * 16).toString(16);
  }
  return Date.now().toString(36) + '-' + s;
}

export function makeTask(title: string): Task {
  const now = Date.now();
  return {
    id: genTaskId(),
    title: title.trim() || DEFAULT_TASK_TITLE,
    createdAt: now,
    updatedAt: now,
    archived: false,
    linkedIssue: null,
    turns: [],
    history: [],
  };
}

// Bootstrap the task index for a repo. If the index is missing we either
// migrate an existing legacy chat into a fresh "Scratch" task or create a
// fresh empty one. Returns the active task and the (possibly new) index.
export async function bootstrapTasks(repo: string): Promise<{
  index: TaskIndex;
  active: Task;
}> {
  const existing = await readTaskIndex(repo);
  if (existing && existing.activeTaskId) {
    const active = await readTask(repo, existing.activeTaskId);
    if (active) return { index: existing, active };
  }

  // No usable index — migrate or create.
  let seedTask: Task;
  const legacy = await loadChat(repo);
  if (legacy && (legacy.turns.length > 0 || legacy.history.length > 0)) {
    seedTask = {
      ...makeTask(DEFAULT_TASK_TITLE),
      turns: legacy.turns,
      history: legacy.history,
      updatedAt: legacy.updatedAt || Date.now(),
    };
  } else {
    seedTask = makeTask(DEFAULT_TASK_TITLE);
  }

  await writeTask(repo, seedTask);

  const index: TaskIndex = {
    version: 1,
    tasks: existing?.tasks?.length
      ? existing.tasks.concat(summarizeTask(seedTask))
      : [summarizeTask(seedTask)],
    activeTaskId: seedTask.id,
  };
  await writeTaskIndex(repo, index);

  return { index, active: seedTask };
}

// Atomically update a single task entry in the index without rewriting other
// tasks' summaries. Returns the new index.
export function patchIndexEntry(
  index: TaskIndex,
  task: Task,
): TaskIndex {
  const summary = summarizeTask(task);
  const found = index.tasks.findIndex((t) => t.id === task.id);
  const tasks = found === -1
    ? index.tasks.concat(summary)
    : index.tasks.map((t, i) => (i === found ? summary : t));
  return { ...index, tasks };
}

export function setActive(index: TaskIndex, taskId: string | null): TaskIndex {
  return { ...index, activeTaskId: taskId };
}

export function removeFromIndex(index: TaskIndex, taskId: string): TaskIndex {
  return {
    ...index,
    tasks: index.tasks.filter((t) => t.id !== taskId),
    activeTaskId: index.activeTaskId === taskId ? null : index.activeTaskId,
  };
}

// Sort summaries for the picker: active-not-archived first, then most-recently-updated.
export function sortSummaries(
  summaries: TaskSummary[],
  activeId: string | null,
): TaskSummary[] {
  return [...summaries].sort((a, b) => {
    if (a.archived !== b.archived) return a.archived ? 1 : -1;
    if (a.id === activeId) return -1;
    if (b.id === activeId) return 1;
    return b.updatedAt - a.updatedAt;
  });
}
