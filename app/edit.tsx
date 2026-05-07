// Edit tab — code editor with syntax highlighting + Claude chat panel
import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, SafeAreaView,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { theme } from '../src/theme';

// Token types → colors
const C = theme.code;

const SAMPLE_CODE = [
  { n: 1, tokens: [{ t: 'kw', v: 'import' }, { t: 'sp', v: ' ' }, { t: 'id', v: 'asyncio' }] },
  { n: 2, tokens: [{ t: 'kw', v: 'from' }, { t: 'sp', v: ' ' }, { t: 'id', v: 'anthropic' }, { t: 'sp', v: ' ' }, { t: 'kw', v: 'import' }, { t: 'sp', v: ' ' }, { t: 'id', v: 'AsyncAnthropic' }] },
  { n: 3, tokens: [] },
  { n: 4, tokens: [{ t: 'cm', v: '# stream completions back to the editor' }] },
  { n: 5, tokens: [{ t: 'kw', v: 'async def' }, { t: 'sp', v: ' ' }, { t: 'fn', v: 'stream' }, { t: 'pn', v: '(' }, { t: 'pa', v: 'prompt' }, { t: 'pn', v: ': ' }, { t: 'ty', v: 'str' }, { t: 'pn', v: ') -> ' }, { t: 'ty', v: 'AsyncIterator' }, { t: 'pn', v: '[' }, { t: 'ty', v: 'str' }, { t: 'pn', v: ']:' }] },
  { n: 6, tokens: [{ t: 'sp', v: '    ' }, { t: 'id', v: 'client' }, { t: 'op', v: ' = ' }, { t: 'fn', v: 'AsyncAnthropic' }, { t: 'pn', v: '()' }] },
  { n: 7, tokens: [{ t: 'sp', v: '    ' }, { t: 'kw', v: 'async with' }, { t: 'sp', v: ' ' }, { t: 'id', v: 'client' }, { t: 'op', v: '.' }, { t: 'id', v: 'messages' }, { t: 'op', v: '.' }, { t: 'fn', v: 'stream' }, { t: 'pn', v: '(' }] },
  { n: 8, tokens: [{ t: 'sp', v: '        ' }, { t: 'pa', v: 'model' }, { t: 'op', v: '=' }, { t: 'st', v: '"claude-sonnet-4-5"' }, { t: 'pn', v: ',' }] },
  { n: 9, tokens: [{ t: 'sp', v: '        ' }, { t: 'pa', v: 'max_tokens' }, { t: 'op', v: '=' }, { t: 'nm', v: '1024' }, { t: 'pn', v: ',' }] },
  { n: 10, tokens: [{ t: 'sp', v: '        ' }, { t: 'pa', v: 'messages' }, { t: 'op', v: '=' }, { t: 'pn', v: '[{' }, { t: 'st', v: '"role"' }, { t: 'pn', v: ': ' }, { t: 'st', v: '"user"' }, { t: 'pn', v: ', ' }, { t: 'st', v: '"content"' }, { t: 'pn', v: ': ' }, { t: 'id', v: 'prompt' }, { t: 'pn', v: '}],' }] },
  { n: 11, tokens: [{ t: 'sp', v: '    ' }, { t: 'pn', v: ') ' }, { t: 'kw', v: 'as' }, { t: 'sp', v: ' ' }, { t: 'id', v: 'stream' }, { t: 'pn', v: ':' }] },
  { n: 12, tokens: [{ t: 'sp', v: '        ' }, { t: 'kw', v: 'async for' }, { t: 'sp', v: ' ' }, { t: 'id', v: 'text' }, { t: 'sp', v: ' ' }, { t: 'kw', v: 'in' }, { t: 'sp', v: ' ' }, { t: 'id', v: 'stream' }, { t: 'op', v: '.' }, { t: 'id', v: 'text_stream' }, { t: 'pn', v: ':' }] },
  { n: 13, tokens: [{ t: 'sp', v: '            ' }, { t: 'kw', v: 'yield' }, { t: 'sp', v: ' ' }, { t: 'id', v: 'text' }] },
];

function renderLine(tokens: { t: string; v: string }[]) {
  return tokens.map((tk, i) => {
    const color = (C as any)[tk.t] || C.id;
    return <Text key={i} style={{ color }}>{tk.v}</Text>;
  });
}

export default function EditScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* File path pill */}
        <View style={styles.topPill}>
          <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
            <Path d="M2 3h3l1 1h6v7H2z" stroke={theme.fgMuted} strokeWidth={1.6} />
          </Svg>
          <Text style={styles.pathDim}>app</Text>
          <Text style={styles.pathSep}>/</Text>
          <Text style={styles.pathMuted}>llm</Text>
          <Text style={styles.pathSep}>/</Text>
          <Text style={styles.pathActive}>client.py</Text>
          <View style={styles.dirtyDot} />
        </View>

        {/* Code editor */}
        <ScrollView style={styles.editor} showsVerticalScrollIndicator={false}>
          {SAMPLE_CODE.map((line) => (
            <View key={line.n} style={styles.codeLine}>
              <Text style={styles.lineNum}>{line.n}</Text>
              <Text style={styles.codeText}>
                {renderLine(line.tokens)}
              </Text>
            </View>
          ))}
          {/* cursor */}
          <View style={styles.cursor} />
        </ScrollView>

        {/* Claude chip */}
        <View style={styles.claudeChipWrapper}>
          <View style={styles.claudeChip}>
            <View style={styles.claudeAvatar} />
            <Text style={styles.claudeChipText}>Claude · sonnet 4.5</Text>
            <View style={styles.claudeDivider} />
            <Text style={styles.claudeTools}>2 tools</Text>
          </View>
        </View>

        {/* Claude panel */}
        <View style={styles.claudePanel}>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {/* Prompt row */}
            <View style={styles.promptRow}>
              <Text style={styles.promptArrow}>›</Text>
              <Text style={styles.promptText}>add streaming to the messages call</Text>
            </View>
            {/* Thinking */}
            <View style={styles.thinkingRow}>
              <View style={styles.thinkingDot} />
              <Text style={styles.thinkingText}>reading client.py · 28 lines</Text>
            </View>
            {/* Tool card */}
            <View style={styles.toolCard}>
              <Text style={styles.toolTitle}>EDIT · client.py</Text>
              <View style={styles.toolDiff}>
                <Text style={styles.diffAdd}>+4</Text>
                <Text style={styles.diffDel}>−1</Text>
              </View>
            </View>
            {/* Reply */}
            <Text style={styles.replyText}>
              Switched to{' '}
              <Text style={styles.replyCode}>client.messages.stream()</Text>
              {' '}and yielded text deltas. It's now an AsyncIterator — you'll need to await it.
            </Text>
          </ScrollView>

          {/* Input bar */}
          <View style={styles.inputBar}>
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  container: { flex: 1, backgroundColor: theme.bg },
  topPill: {
    marginHorizontal: 16, marginTop: 12, height: 48,
    backgroundColor: theme.surface, borderRadius: 24,
    borderWidth: 0.5, borderColor: theme.borderColor,
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 4,
  },
  pathDim: { fontSize: 13, color: theme.fgDim, fontFamily: 'monospace' },
  pathSep: { fontSize: 13, color: theme.fgDim, fontFamily: 'monospace' },
  pathMuted: { fontSize: 13, color: theme.fgMuted, fontFamily: 'monospace' },
  pathActive: { fontSize: 13, color: theme.fg, fontWeight: '600', fontFamily: 'monospace', flex: 1 },
  dirtyDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.accent },
  editor: {
    flex: 1, paddingVertical: 8, maxHeight: 260,
  },
  codeLine: {
    flexDirection: 'row', paddingHorizontal: 0,
  },
  lineNum: {
    width: 36, textAlign: 'right', paddingRight: 12,
    color: theme.fgDim, fontSize: 12.5, lineHeight: 20,
    fontFamily: 'monospace',
  },
  codeText: {
    flex: 1, fontSize: 12.5, lineHeight: 20, fontFamily: 'monospace', color: C.id,
  },
  cursor: {
    position: 'absolute',
    left: 30, top: 8 + 19 * 20,
    width: 2, height: 20, backgroundColor: theme.accent, borderRadius: 1,
  },
  claudeChipWrapper: { alignItems: 'center', marginVertical: 8 },
  claudeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: theme.surface, borderRadius: 14,
    borderWidth: 0.5, borderColor: theme.borderColor,
    paddingVertical: 6, paddingHorizontal: 12,
  },
  claudeAvatar: {
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#d97757',
  },
  claudeChipText: { fontSize: 12, fontWeight: '600', color: theme.fg },
  claudeDivider: { width: 1, height: 12, backgroundColor: theme.borderColor },
  claudeTools: { fontSize: 12, color: theme.fgMuted },
  claudePanel: {
    flex: 1, marginHorizontal: 12, marginBottom: 96,
    backgroundColor: theme.surface, borderRadius: 28,
    borderWidth: 0.5, borderColor: theme.borderColor,
    padding: 16,
  },
  promptRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  promptArrow: { color: theme.accent, fontFamily: 'monospace', fontSize: 14 },
  promptText: { color: theme.fg, fontFamily: 'monospace', fontSize: 13, flex: 1 },
  thinkingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  thinkingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.ty },
  thinkingText: { color: theme.fgMuted, fontFamily: 'monospace', fontSize: 12 },
  toolCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 0.5, borderColor: theme.borderColor,
    borderRadius: 10, padding: 10, marginBottom: 10,
  },
  toolTitle: { fontSize: 10.5, color: theme.fgMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  toolDiff: { flexDirection: 'row', gap: 12 },
  diffAdd: { fontSize: 11.5, color: C.ty },
  diffDel: { fontSize: 11.5, color: C.pa },
  replyText: { fontSize: 13.5, color: theme.fg, lineHeight: 20 },
  replyCode: {
    fontFamily: 'monospace', fontSize: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
  },
  inputBar: {
    marginTop: 10, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 0.5, borderColor: theme.borderColor,
    flexDirection: 'row', alignItems: 'center',
    paddingLeft: 16, paddingRight: 6, gap: 8,
  },
  inputText: { flex: 1, color: theme.fg, fontSize: 14 },
  sendBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: theme.accent,
    alignItems: 'center', justifyContent: 'center',
  },
});
