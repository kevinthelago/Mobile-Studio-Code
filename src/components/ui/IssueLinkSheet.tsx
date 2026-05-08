import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text,
  TextInput, View,
} from 'react-native';
import { useTheme } from '../../theme';
import { useSession } from '../../lib/session';
import {
  createIssue, GithubIssue, listIssues,
} from '../../lib/github';
import { LinkedIssue } from '../../lib/types';
import { Surface } from './Surface';
import { IconBtn } from './IconBtn';

type Props = {
  visible: boolean;
  taskId: string | null;
  taskTitle: string;
  currentLink: LinkedIssue | null;
  onClose: () => void;
};

// Sub-sheet for picking or creating a GitHub issue to link to a task.
// Lists open issues from the active repo; lets the user create a new one
// seeded with the task title; or unlink the current issue.
export function IssueLinkSheet({
  visible, taskId, taskTitle, currentLink, onClose,
}: Props) {
  const t = useTheme();
  const { pat, manifest, linkIssueToTask } = useSession();
  const [issues, setIssues] = useState<GithubIssue[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (!pat || !manifest) return;
    let cancelled = false;
    setLoading(true);
    setError(undefined);
    setIssues(null);
    listIssues(pat, manifest.repo, { state: 'open', perPage: 30 })
      .then((r) => { if (!cancelled) setIssues(r); })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [visible, pat, manifest]);

  // Pre-fill the create form with the task title when opening it.
  useEffect(() => {
    if (showCreate) {
      setNewTitle((existing) => existing || taskTitle);
    }
  }, [showCreate, taskTitle]);

  async function pickIssue(issue: GithubIssue) {
    if (!taskId) return;
    await linkIssueToTask(taskId, {
      number: issue.number,
      title: issue.title,
      url: issue.url,
    });
    onClose();
  }

  async function handleCreate() {
    if (!pat || !manifest || !taskId) return;
    const title = newTitle.trim();
    if (!title) return;
    setCreating(true);
    try {
      const issue = await createIssue(pat, manifest.repo, title, newBody);
      await linkIssueToTask(taskId, {
        number: issue.number,
        title: issue.title,
        url: issue.url,
      });
      setNewTitle('');
      setNewBody('');
      setShowCreate(false);
      onClose();
    } catch (e) {
      Alert.alert('Create failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setCreating(false);
    }
  }

  async function unlink() {
    if (!taskId) return;
    await linkIssueToTask(taskId, null);
    onClose();
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
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: t.fg }]}>
                {showCreate ? 'New issue' : 'Link an issue'}
              </Text>
              <Text style={[styles.subtitle, { color: t.fgMuted }]} numberOfLines={1}>
                {taskTitle}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={[styles.dismiss, { color: t.fgMuted }]}>Done</Text>
            </Pressable>
          </View>

          {currentLink && !showCreate && (
            <View style={[styles.currentLinkRow, { borderColor: t.borderColor }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.currentLinkLabel, { color: t.fgDim }]}>
                  Currently linked
                </Text>
                <Text style={[styles.currentLinkTitle, { color: t.fg }]} numberOfLines={1}>
                  #{currentLink.number} · {currentLink.title}
                </Text>
              </View>
              <Pressable onPress={unlink} hitSlop={6} style={styles.unlinkBtn}>
                <Text style={[styles.unlinkText, { color: '#ff8a8a' }]}>Unlink</Text>
              </Pressable>
            </View>
          )}

          {showCreate ? (
            <View style={styles.createForm}>
              <Text style={[styles.label, { color: t.fgDim }]}>Title</Text>
              <TextInput
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="What needs doing?"
                placeholderTextColor={t.fgDim}
                style={[styles.input, {
                  color: t.fg,
                  borderColor: t.borderColor,
                  backgroundColor: t.glass ? 'rgba(0,0,0,0.25)' : t.surface,
                }]}
              />
              <Text style={[styles.label, { color: t.fgDim, marginTop: 12 }]}>Body</Text>
              <TextInput
                value={newBody}
                onChangeText={setNewBody}
                placeholder="(optional) Description, acceptance criteria, links…"
                placeholderTextColor={t.fgDim}
                multiline
                numberOfLines={5}
                style={[styles.input, styles.bodyInput, {
                  color: t.fg,
                  borderColor: t.borderColor,
                  backgroundColor: t.glass ? 'rgba(0,0,0,0.25)' : t.surface,
                }]}
              />
              <View style={styles.formActions}>
                <Pressable
                  onPress={() => setShowCreate(false)}
                  style={styles.secondaryBtn}
                >
                  <Text style={[styles.secondaryBtnText, { color: t.fgMuted }]}>
                    Back to list
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleCreate}
                  disabled={!newTitle.trim() || creating}
                  style={[styles.primaryBtn, {
                    backgroundColor: t.accent,
                    opacity: !newTitle.trim() || creating ? 0.5 : 1,
                  }]}
                >
                  {creating ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Create & link</Text>
                  )}
                </Pressable>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.listHeader}>
                <Text style={[styles.listLabel, { color: t.fgDim }]}>
                  Open issues
                </Text>
                <Pressable onPress={() => setShowCreate(true)}>
                  <Text style={[styles.newLink, { color: t.accent }]}>
                    + New
                  </Text>
                </Pressable>
              </View>
              <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
                {loading && (
                  <View style={styles.center}>
                    <ActivityIndicator color={t.fgMuted} />
                  </View>
                )}
                {error && (
                  <Text style={[styles.errorText, { color: '#ff8a8a' }]}>{error}</Text>
                )}
                {issues && issues.length === 0 && (
                  <Text style={[styles.empty, { color: t.fgDim }]}>
                    No open issues. Tap "+ New" to create one.
                  </Text>
                )}
                {issues?.map((issue) => {
                  const isLinked = currentLink?.number === issue.number;
                  return (
                    <Pressable
                      key={issue.number}
                      onPress={() => pickIssue(issue)}
                      style={[styles.issueRow, { borderBottomColor: t.borderColor }]}
                    >
                      <View style={styles.issueNumberCol}>
                        <Text style={[styles.issueNumber, {
                          color: isLinked ? t.accent : t.fgMuted,
                          fontFamily: t.fontMono,
                        }]}>
                          #{issue.number}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[styles.issueTitle, {
                            color: t.fg,
                            fontWeight: isLinked ? '600' : '500',
                          }]}
                          numberOfLines={1}
                        >
                          {issue.title}
                        </Text>
                        {issue.labels.length > 0 && (
                          <Text
                            style={[styles.issueLabels, { color: t.fgDim }]}
                            numberOfLines={1}
                          >
                            {issue.labels.join(' · ')}
                          </Text>
                        )}
                      </View>
                      {isLinked && (
                        <View style={[styles.linkedDot, { backgroundColor: t.accent }]} />
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </>
          )}
        </Surface>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheetWrap: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: 8, paddingBottom: 8,
  },
  sheet: { paddingHorizontal: 16, paddingBottom: 18 },
  handle: { alignItems: 'center', paddingTop: 8 },
  handleBar: { width: 36, height: 4, borderRadius: 2 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 8, paddingBottom: 12, gap: 12,
  },
  title: { fontSize: 18, fontWeight: '700' },
  subtitle: { fontSize: 12, marginTop: 2 },
  dismiss: { fontSize: 14, fontWeight: '500' },

  currentLinkRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 12, gap: 8,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth, marginBottom: 10,
  },
  currentLinkLabel: { fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '600' },
  currentLinkTitle: { fontSize: 13, marginTop: 2 },
  unlinkBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  unlinkText: { fontSize: 12, fontWeight: '600' },

  listHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 6,
  },
  listLabel: {
    fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: '600',
  },
  newLink: { fontSize: 13, fontWeight: '600' },
  list: { maxHeight: 360 },
  listContent: { paddingVertical: 4 },
  empty: { fontSize: 13, textAlign: 'center', padding: 20 },
  errorText: { fontSize: 12, padding: 12 },
  center: { padding: 20, alignItems: 'center' },
  issueRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  issueNumberCol: { width: 40 },
  issueNumber: { fontSize: 12 },
  issueTitle: { fontSize: 14 },
  issueLabels: { fontSize: 11, marginTop: 2 },
  linkedDot: { width: 8, height: 8, borderRadius: 4 },

  createForm: { paddingTop: 6 },
  label: {
    fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase',
    fontWeight: '600', marginBottom: 6,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14,
  },
  bodyInput: { minHeight: 100, textAlignVertical: 'top' },
  formActions: {
    flexDirection: 'row', gap: 8, marginTop: 14, alignItems: 'center',
  },
  secondaryBtn: { paddingHorizontal: 12, paddingVertical: 10 },
  secondaryBtnText: { fontSize: 13, fontWeight: '500' },
  primaryBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
