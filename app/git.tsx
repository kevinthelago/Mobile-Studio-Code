// Git tab — branch info, staged/unstaged changes, commit composer
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, SafeAreaView,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { theme } from '../src/theme';

const C = theme.code;

const GIT_STATUS = {
  branch: 'feat/streaming',
  upstream: 'origin/feat/streaming',
  ahead: 2,
  behind: 0,
  staged: [
    { path: 'app/llm/client.py', state: 'M', adds: 4, dels: 1 },
  ],
  unstaged: [
    { path: 'app/llm/cli.py', state: 'M', adds: 12, dels: 3 },
    { path: 'tests/test_client.py', state: 'M', adds: 6, dels: 0 },
    { path: 'docs/streaming.md', state: 'A', adds: 28, dels: 0 },
  ],
};

const TABS = [
  { id: 'changes', label: 'Changes', count: 4 },
  { id: 'history', label: 'History', count: null },
  { id: 'stash', label: 'Stash', count: 1 },
];

const ACTIONS = [
  { icon: '↓', label: 'Pull' },
  { icon: '↑', label: 'Push' },
  { icon: '↕', label: 'Sync' },
];

type FileEntry = { path: string; state: string; adds: number; dels: number };

function FileRow({ f, staged }: { f: FileEntry; staged?: boolean }) {
  const stateColor = f.state === 'A'
    ? { bg: 'rgba(126,226,196,0.2)', text: C.ty }
    : { bg: 'rgba(255,212,121,0.2)', text: C.nm };

  return (
    <View style={styles.fileRow}>
      <View style={[styles.stateBadge, { backgroundColor: stateColor.bg }]}>
        <Text style={[styles.stateText, { color: stateColor.text }]}>{f.state}</Text>
      </View>
      <Text style={styles.filePath} numberOfLines={1}>{f.path}</Text>
      <View style={styles.diffNums}>
        <Text style={styles.diffAdd}>+{f.adds}</Text>
        <Text style={styles.diffDel}>−{f.dels}</Text>
      </View>
      <TouchableOpacity style={styles.stageBtn}>
        {staged ? (
          <Svg width={11} height={11} viewBox="0 0 11 11" fill="none">
            <Path d="M3 5.5h5" stroke={theme.fg} strokeWidth={1.6} strokeLinecap="round" />
          </Svg>
        ) : (
          <Svg width={11} height={11} viewBox="0 0 11 11" fill="none">
            <Path d="M5.5 2v7M2 5.5h7" stroke={theme.fg} strokeWidth={1.6} strokeLinecap="round" />
          </Svg>
        )}
      </TouchableOpacity>
    </View>
  );
}

export default function GitScreen() {
  const [tab, setTab] = useState('changes');
  const [commitMsg, setCommitMsg] = useState('');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerLabel}>Branch</Text>
          <View style={styles.branchRow}>
            <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
              <Circle cx={5} cy={4} r={2} stroke={theme.accent} strokeWidth={1.8} />
              <Circle cx={5} cy={14} r={2} stroke={theme.accent} strokeWidth={1.8} />
              <Circle cx={13} cy={9} r={2} stroke={theme.accent} strokeWidth={1.8} />
              <Path d="M5 6v6M7 4h4a2 2 0 012 2v1" stroke={theme.accent} strokeWidth={1.8} />
            </Svg>
            <Text style={styles.branchName}>{GIT_STATUS.branch}</Text>
          </View>
          <View style={styles.upstreamRow}>
            <Text style={styles.upstreamText}>↑ {GIT_STATUS.ahead}</Text>
            <Text style={styles.upstreamText}>↓ {GIT_STATUS.behind}</Text>
            <Text style={styles.upstreamText}>{GIT_STATUS.upstream}</Text>
          </View>
        </View>

        {/* Action chips */}
        <View style={styles.actions}>
          {ACTIONS.map((a) => (
            <TouchableOpacity key={a.label} style={styles.actionCard} activeOpacity={0.7}>
              <Text style={styles.actionIcon}>{a.icon}</Text>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          {TABS.map((tb) => {
            const active = tb.id === tab;
            return (
              <TouchableOpacity key={tb.id} style={[styles.tabItem, active && styles.tabItemActive]}
                onPress={() => setTab(tb.id)}>
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tb.label}</Text>
                {tb.count != null && (
                  <Text style={[styles.tabCount, active && styles.tabCountActive]}>{tb.count}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Changes list */}
        <View style={styles.changesCard}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Staged */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>Staged</Text>
              <Text style={styles.sectionCount}>{GIT_STATUS.staged.length}</Text>
            </View>
            {GIT_STATUS.staged.map((f, i) => <FileRow key={i} f={f} staged />)}

            {/* Unstaged */}
            <View style={[styles.sectionHeader, styles.sectionHeaderBorder]}>
              <Text style={styles.sectionLabel}>Unstaged</Text>
              <Text style={styles.sectionCount}>{GIT_STATUS.unstaged.length}</Text>
            </View>
            {GIT_STATUS.unstaged.map((f, i) => <FileRow key={i} f={f} />)}
          </ScrollView>
        </View>

        {/* Commit composer */}
        <View style={styles.commitCard}>
          <TextInput
            value={commitMsg}
            onChangeText={setCommitMsg}
            placeholder="Commit message…"
            placeholderTextColor={theme.fgDim}
            style={styles.commitInput}
            multiline
          />
          <View style={styles.commitActions}>
            <TouchableOpacity style={styles.draftBtn}>
              <View style={styles.claudeAvatar} />
              <Text style={styles.draftText}>Draft with Claude</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.commitBtn}>
              <Text style={styles.commitBtnText}>Commit · 1 file</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  container: { flex: 1, backgroundColor: theme.bg },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 4 },
  headerLabel: { fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: theme.fgDim, fontWeight: '600' },
  branchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  branchName: { fontSize: 22, fontWeight: '700', letterSpacing: -0.4, color: theme.fg, fontFamily: 'monospace' },
  upstreamRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  upstreamText: { fontSize: 12, color: theme.fgMuted, fontFamily: 'monospace' },
  actions: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 12 },
  actionCard: {
    flex: 1, height: 56,
    backgroundColor: theme.surface, borderRadius: 14,
    borderWidth: 0.5, borderColor: theme.borderColor,
    alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  actionIcon: { fontSize: 18, color: theme.fg, lineHeight: 22 },
  actionLabel: { fontSize: 11, color: theme.fgMuted, fontWeight: '500' },
  tabBar: {
    flexDirection: 'row', marginHorizontal: 16, marginTop: 12,
    backgroundColor: theme.surface, borderRadius: 10,
    borderWidth: 0.5, borderColor: theme.borderColor,
    padding: 4, gap: 4,
  },
  tabItem: {
    flex: 1, height: 32, borderRadius: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  tabItemActive: { backgroundColor: 'rgba(255,255,255,0.10)' },
  tabLabel: { fontSize: 12.5, fontWeight: '500', color: theme.fgMuted },
  tabLabelActive: { color: theme.fg },
  tabCount: { fontSize: 10.5, color: theme.fgDim },
  tabCountActive: { color: theme.fgMuted },
  changesCard: {
    flex: 1, marginHorizontal: 12, marginTop: 10,
    backgroundColor: theme.surface, borderRadius: 20,
    borderWidth: 0.5, borderColor: theme.borderColor, overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingTop: 10, paddingBottom: 4,
  },
  sectionHeaderBorder: { borderTopWidth: 0.5, borderTopColor: theme.borderColor, marginTop: 4, paddingTop: 12 },
  sectionLabel: { fontSize: 10.5, letterSpacing: 1.2, textTransform: 'uppercase', color: theme.fgDim, fontWeight: '600' },
  sectionCount: { fontSize: 11, color: theme.fgDim },
  fileRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 11,
    borderBottomWidth: 0.5, borderBottomColor: theme.borderColor,
  },
  stateBadge: {
    width: 18, height: 18, borderRadius: 5,
    alignItems: 'center', justifyContent: 'center',
  },
  stateText: { fontSize: 10, fontWeight: '700', fontFamily: 'monospace' },
  filePath: { flex: 1, fontSize: 13, color: theme.fg, fontFamily: 'monospace' },
  diffNums: { flexDirection: 'row', gap: 8 },
  diffAdd: { fontSize: 11, color: C.ty, fontFamily: 'monospace' },
  diffDel: { fontSize: 11, color: C.pa, fontFamily: 'monospace' },
  stageBtn: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center', justifyContent: 'center',
  },
  commitCard: {
    marginHorizontal: 12, marginTop: 10, marginBottom: 96,
    backgroundColor: theme.surface, borderRadius: 20,
    borderWidth: 0.5, borderColor: theme.borderColor,
    padding: 12,
  },
  commitInput: {
    color: theme.fg, fontSize: 13.5, paddingVertical: 4, paddingHorizontal: 4,
    paddingBottom: 8,
  },
  commitActions: {
    flexDirection: 'row', alignItems: 'center',
    borderTopWidth: 0.5, borderTopColor: theme.borderColor, paddingTop: 10,
  },
  draftBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  claudeAvatar: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#d97757' },
  draftText: { fontSize: 11.5, color: theme.fgMuted },
  commitBtn: {
    paddingVertical: 7, paddingHorizontal: 14, borderRadius: 14,
    backgroundColor: theme.accent,
  },
  commitBtnText: { fontSize: 12.5, fontWeight: '600', color: '#fff' },
});
