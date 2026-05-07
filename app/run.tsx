// Run tab — Claude conversation terminal / transcript
import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, SafeAreaView,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { theme } from '../src/theme';

const C = theme.code;

const TERMINAL_LOG = [
  { kind: 'system', text: 'claude --model sonnet-4.5 · workspace: llm-cli' },
  { kind: 'user', text: 'add streaming to the messages call' },
  { kind: 'thinking', text: 'reading client.py · 28 lines' },
  { kind: 'tool', name: 'edit', target: 'client.py', adds: 4, dels: 1 },
  { kind: 'reply', text: "Switched to client.messages.stream() and yielded text deltas. It's now an AsyncIterator — you'll need to await it." },
  { kind: 'user', text: 'run the tests' },
  { kind: 'tool', name: 'shell', cmd: 'pytest tests/ -q', exit: 0 },
  { kind: 'output', text: '....F\n5 passed, 1 failed in 0.42s' },
  { kind: 'reply', text: 'One failure in test_client_init — the mock still uses the sync class. Want me to update it?' },
];

const SUGGESTIONS = ['Yes, fix it', 'Show diff', 'Skip'];

export default function RunScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Top pill */}
        <View style={styles.topPill}>
          <View style={styles.claudeAvatar} />
          <View style={{ flex: 1 }}>
            <Text style={styles.pillTitle}>Claude</Text>
            <Text style={styles.pillSub}>sonnet 4.5 · 8 turns · 2 tool calls</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn}>
            <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
              <Path d="M7 1v3M7 10v3M1 7h3M10 7h3M3 3l2 2M9 9l2 2M3 11l2-2M9 5l2-2"
                stroke={theme.fg} strokeWidth={1.6} strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>
        </View>

        {/* Transcript */}
        <ScrollView style={styles.transcript} showsVerticalScrollIndicator={false}>
          {TERMINAL_LOG.map((b, i) => {
            if (b.kind === 'system') return (
              <Text key={i} style={styles.systemLine}>· {b.text}</Text>
            );
            if (b.kind === 'user') return (
              <View key={i} style={styles.userRow}>
                <Text style={styles.promptArrow}>›</Text>
                <Text style={styles.userText}>{b.text}</Text>
              </View>
            );
            if (b.kind === 'thinking') return (
              <View key={i} style={styles.thinkingRow}>
                <View style={styles.thinkingDot} />
                <Text style={styles.thinkingText}>{b.text}</Text>
              </View>
            );
            if (b.kind === 'tool') return (
              <View key={i} style={styles.toolCard}>
                <Text style={styles.toolTitle}>
                  {b.name}{b.target ? ` · ${b.target}` : ''}{b.cmd ? ` · ${b.cmd}` : ''}
                </Text>
                {b.adds !== undefined && (
                  <View style={styles.toolDiff}>
                    <Text style={styles.diffAdd}>+{b.adds}</Text>
                    <Text style={styles.diffDel}>−{b.dels}</Text>
                  </View>
                )}
                {b.exit !== undefined && (
                  <Text style={[styles.exitCode, { color: b.exit === 0 ? C.ty : C.pa }]}>
                    exit {b.exit}
                  </Text>
                )}
              </View>
            );
            if (b.kind === 'output') return (
              <View key={i} style={styles.outputBlock}>
                <Text style={styles.outputText}>{b.text}</Text>
              </View>
            );
            if (b.kind === 'reply') return (
              <Text key={i} style={styles.replyText}>{b.text}</Text>
            );
            return null;
          })}
        </ScrollView>

        {/* Suggestion chips */}
        <View style={styles.suggestions}>
          {SUGGESTIONS.map((s, i) => (
            <TouchableOpacity key={s} style={[styles.suggChip, i === 0 && styles.suggChipPrimary]}>
              <Text style={[styles.suggText, i === 0 && styles.suggTextPrimary]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.attachBtn}>
            <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
              <Path d="M7 1v12M1 7h12" stroke={theme.fg} strokeWidth={1.6} strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>
          <TextInput
            placeholder="Ask Claude…"
            placeholderTextColor={theme.fgDim}
            style={styles.inputText}
          />
          <TouchableOpacity style={styles.sendBtn}>
            <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
              <Path d="M7 11V3M3 7l4-4 4 4" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  container: { flex: 1, backgroundColor: theme.bg, paddingBottom: 96 },
  topPill: {
    marginHorizontal: 16, marginTop: 12, height: 56,
    backgroundColor: theme.surface, borderRadius: 28,
    borderWidth: 0.5, borderColor: theme.borderColor,
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10,
  },
  claudeAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#d97757',
  },
  pillTitle: { fontSize: 14, fontWeight: '600', color: theme.fg },
  pillSub: { fontSize: 11, color: theme.fgMuted, fontFamily: 'monospace' },
  iconBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center', justifyContent: 'center',
  },
  transcript: {
    flex: 1, paddingHorizontal: 18, paddingTop: 12,
  },
  systemLine: { color: theme.fgDim, fontSize: 11, marginBottom: 14, fontFamily: 'monospace' },
  userRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  promptArrow: { color: theme.accent, fontSize: 14, fontFamily: 'monospace' },
  userText: { color: theme.fg, fontFamily: 'monospace', fontSize: 13, flex: 1 },
  thinkingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  thinkingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.ty },
  thinkingText: { color: theme.fgMuted, fontFamily: 'monospace', fontSize: 12 },
  toolCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 0.5, borderColor: theme.borderColor,
    borderRadius: 10, padding: 10, marginBottom: 8,
  },
  toolTitle: { fontSize: 10.5, color: theme.fgMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, fontFamily: 'monospace' },
  toolDiff: { flexDirection: 'row', gap: 12 },
  diffAdd: { fontSize: 11.5, color: C.ty, fontFamily: 'monospace' },
  diffDel: { fontSize: 11.5, color: C.pa, fontFamily: 'monospace' },
  exitCode: { fontSize: 11.5, fontFamily: 'monospace' },
  outputBlock: {
    borderLeftWidth: 2, borderLeftColor: theme.borderColor,
    paddingLeft: 10, paddingVertical: 6, marginBottom: 10,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  outputText: { color: theme.fgMuted, fontFamily: 'monospace', fontSize: 11.5 },
  replyText: { fontSize: 13.5, color: theme.fg, lineHeight: 20, marginBottom: 14 },
  suggestions: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 16,
    marginBottom: 8,
  },
  suggChip: {
    height: 32, paddingHorizontal: 12, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 0.5, borderColor: theme.borderColor,
    alignItems: 'center', justifyContent: 'center',
  },
  suggChipPrimary: { backgroundColor: theme.accent, borderColor: theme.accent },
  suggText: { fontSize: 12.5, fontWeight: '500', color: theme.fg },
  suggTextPrimary: { color: '#fff' },
  inputBar: {
    marginHorizontal: 12, height: 52,
    backgroundColor: theme.surface, borderRadius: 26,
    borderWidth: 0.5, borderColor: theme.borderColor,
    flexDirection: 'row', alignItems: 'center',
    paddingLeft: 8, paddingRight: 6, gap: 8,
  },
  attachBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  inputText: { flex: 1, color: theme.fg, fontSize: 14 },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: theme.accent,
    alignItems: 'center', justifyContent: 'center',
  },
});
