import React, { useMemo, useState } from 'react';
import {
  Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../theme';
import { useSession } from '../../lib/session';
import { sortSummaries } from '../../lib/tasks';
import type { TaskSummary } from '../../lib/types';
import { Surface } from './Surface';
import { IconBtn } from './IconBtn';
import { IssueLinkSheet } from './IssueLinkSheet';

type Props = {
  visible: boolean;
  onClose: () => void;
};

// Bottom-sheet-style modal listing every task for the active repo. Tap to
// switch, swipe to archive (long press here for the mobile gesture stand-in),
// or create a new one. The active task is always pinned to the top.
export function TaskSheet({ visible, onClose }: Props) {
  const t = useTheme();
  const {
    activeTask, taskSummaries, createTask, switchTask, archiveTask,
    deleteTaskById, renameTask, chatBusy,
  } = useSession();
  const [showArchived, setShowArchived] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [linkSheet, setLinkSheet] = useState<TaskSummary | null>(null);

  const sorted = useMemo(
    () => sortSummaries(taskSummaries, activeTask?.id ?? null),
    [taskSummaries, activeTask?.id],
  );
  const visibleTasks = sorted.filter((task) => showArchived || !task.archived);
  const archivedCount = sorted.filter((task) => task.archived).length;

  async function handleCreate() {
    const title = newTitle.trim();
    if (!title || creating) return;
    setCreating(true);
    try {
      await createTask(title);
      setNewTitle('');
      onClose();
    } finally {
      setCreating(false);
    }
  }

  async function handlePick(taskId: string) {
    if (chatBusy) {
      Alert.alert('Agent busy', 'Wait or cancel the current run before switching tasks.');
      return;
    }
    if (taskId === activeTask?.id) {
      onClose();
      return;
    }
    await switchTask(taskId);
    onClose();
  }

  async function commitRename() {
    if (!renaming) return;
    const title = renameDraft.trim();
    if (title) await renameTask(renaming, title);
    setRenaming(null);
    setRenameDraft('');
  }

  function confirmDelete(taskId: string, title: string) {
    Alert.alert(
      'Delete task?',
      `"${title}" and its chat history will be deleted. This can't be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => { await deleteTaskById(taskId); },
        },
      ],
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheetWrap} pointerEvents="box-none">
        <Surface style={styles.sheet} radius={28}>
          <View style={styles.handle}>
            <View style={[styles.handleBar, { backgroundColor: t.fgDim }]} />
          </View>

          <View style={styles.header}>
            <Text style={[styles.title, { color: t.fg }]}>Tasks</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={[styles.dismiss, { color: t.fgMuted }]}>Done</Text>
            </Pressable>
          </View>

          <View style={styles.newRow}>
            <Surface style={styles.input} radius={20}>
              <TextInput
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="New task… (e.g. Fix login bug)"
                placeholderTextColor={t.fgDim}
                style={[styles.inputText, { color: t.fg }]}
                returnKeyType="done"
                onSubmitEditing={handleCreate}
              />
            </Surface>
            <IconBtn
              primary
              size={40}
              onPress={handleCreate}
              disabled={!newTitle.trim() || creating}
            >
              <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
                <Path d="M7 1v12M1 7h12" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
              </Svg>
            </IconBtn>
          </View>

          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {visibleTasks.length === 0 && (
              <Text style={[styles.empty, { color: t.fgDim }]}>
                {showArchived ? 'No archived tasks.' : 'No tasks yet — create one above.'}
              </Text>
            )}
            {visibleTasks.map((task) => {
              const isActive = task.id === activeTask?.id;
              const isRenaming = renaming === task.id;
              return (
                <View key={task.id} style={[
                  styles.row,
                  { borderBottomColor: t.borderColor },
                ]}>
                  {isActive && (
                    <View style={[styles.activeBar, { backgroundColor: t.accent }]} />
                  )}
                  <Pressable
                    style={styles.rowMain}
                    onPress={() => isRenaming ? null : handlePick(task.id)}
                    onLongPress={() => {
                      setRenaming(task.id);
                      setRenameDraft(task.title);
                    }}
                  >
                    {isRenaming ? (
                      <TextInput
                        autoFocus
                        value={renameDraft}
                        onChangeText={setRenameDraft}
                        onSubmitEditing={commitRename}
                        onBlur={commitRename}
                        style={[styles.rowTitle, {
                          color: t.fg,
                          paddingVertical: 0,
                        }]}
                      />
                    ) : (
                      <Text
                        style={[styles.rowTitle, {
                          color: task.archived ? t.fgDim : t.fg,
                          fontWeight: isActive ? '600' : '500',
                        }]}
                        numberOfLines={1}
                      >
                        {task.title}
                      </Text>
                    )}
                    <Text style={[styles.rowMeta, { color: t.fgDim, fontFamily: t.fontMono }]}>
                      {task.linkedIssue ? `#${task.linkedIssue.number} · ` : ''}
                      {task.turnCount} turn{task.turnCount === 1 ? '' : 's'}
                      {task.archived ? ' · archived' : ''}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setLinkSheet(task)}
                    hitSlop={6}
                    style={styles.rowAction}
                  >
                    <Text style={[styles.rowActionText, {
                      color: task.linkedIssue ? t.accent : t.fgMuted,
                    }]}>
                      {task.linkedIssue ? `#${task.linkedIssue.number}` : 'Link'}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => archiveTask(task.id, !task.archived)}
                    hitSlop={6}
                    style={styles.rowAction}
                  >
                    <Text style={[styles.rowActionText, { color: t.fgMuted }]}>
                      {task.archived ? 'Unarchive' : 'Archive'}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => confirmDelete(task.id, task.title)}
                    hitSlop={6}
                    style={styles.rowAction}
                  >
                    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
                      <Path
                        d="M3 4h8M5 4V3a1 1 0 011-1h2a1 1 0 011 1v1M4 4l1 8a1 1 0 001 1h2a1 1 0 001-1l1-8"
                        stroke={t.fgMuted}
                        strokeWidth={1.4}
                        strokeLinecap="round"
                      />
                    </Svg>
                  </Pressable>
                </View>
              );
            })}
          </ScrollView>

          {archivedCount > 0 && (
            <Pressable onPress={() => setShowArchived((v) => !v)} hitSlop={6}>
              <Text style={[styles.toggleArchive, { color: t.fgDim }]}>
                {showArchived ? 'Hide archived' : `Show ${archivedCount} archived`}
              </Text>
            </Pressable>
          )}
        </Surface>
      </View>

      <IssueLinkSheet
        visible={!!linkSheet}
        taskId={linkSheet?.id ?? null}
        taskTitle={linkSheet?.title ?? ''}
        currentLink={linkSheet?.linkedIssue ?? null}
        onClose={() => setLinkSheet(null)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheetWrap: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: 8, paddingBottom: 8,
  },
  sheet: { paddingHorizontal: 12, paddingBottom: 16 },
  handle: { alignItems: 'center', paddingTop: 8 },
  handleBar: {
    width: 36, height: 4, borderRadius: 2,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 8, paddingTop: 12, paddingBottom: 6,
  },
  title: { fontSize: 18, fontWeight: '700' },
  dismiss: { fontSize: 14, fontWeight: '500' },
  newRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 4, paddingVertical: 8,
  },
  input: {
    flex: 1, height: 40,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14,
  },
  inputText: { flex: 1, fontSize: 14, paddingVertical: 0 },
  list: { maxHeight: 360 },
  listContent: { paddingVertical: 4 },
  empty: { fontSize: 13, padding: 20, textAlign: 'center' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, position: 'relative',
  },
  activeBar: {
    position: 'absolute', left: 0, top: 4, bottom: 4, width: 3, borderRadius: 2,
  },
  rowMain: { flex: 1, paddingLeft: 6 },
  rowTitle: { fontSize: 14 },
  rowMeta: { fontSize: 11, marginTop: 2 },
  rowAction: { paddingHorizontal: 6, paddingVertical: 4 },
  rowActionText: { fontSize: 11, fontWeight: '500' },
  toggleArchive: {
    textAlign: 'center', fontSize: 12, paddingVertical: 8,
  },
});
