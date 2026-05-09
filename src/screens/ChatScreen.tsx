import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { sendMessage, ChatMessage } from '../lib/llm';
import { useTheme } from '../ThemeContext';

export default function ChatScreen() {
  const t = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;

    const next: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setBusy(true);

    try {
      const reply = await sendMessage(next);
      setMessages([...next, { role: 'assistant', content: reply }]);
    } catch (e: any) {
      setMessages([
        ...next,
        { role: 'assistant', content: `⚠️ ${e.message || 'Request failed'}` },
      ]);
    } finally {
      setBusy(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: t.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        onContentSizeChange={() =>
          scrollRef.current?.scrollToEnd({ animated: true })
        }
      >
        {messages.length === 0 && (
          <Text style={[styles.placeholder, { color: t.fgMuted, fontFamily: t.fontUI }]}>
            Chat with your configured AI. Set the provider and model in Settings.
          </Text>
        )}
        {messages.map((m, i) => (
          <View
            key={i}
            style={[
              styles.bubble,
              m.role === 'user'
                ? [styles.userBubble, { backgroundColor: t.accent }]
                : [styles.botBubble, { backgroundColor: t.surface }],
              { borderRadius: t.radius },
            ]}
          >
            <Text
              style={[
                styles.bubbleText,
                m.role === 'user'
                  ? [styles.userText, { color: t.bg }]
                  : [styles.botText, { color: t.fg }],
                { fontFamily: t.fontUI },
              ]}
            >
              {m.content}
            </Text>
          </View>
        ))}
        {busy && (
          <View style={[styles.bubble, styles.botBubble, { backgroundColor: t.surface, borderRadius: t.radius }]}>
            <ActivityIndicator color={t.accent} />
          </View>
        )}
      </ScrollView>

      <View style={[styles.inputRow, { borderTopColor: t.borderColor }]}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Message AI…"
          placeholderTextColor={t.fgDim}
          style={[
            styles.input,
            {
              borderColor: t.borderColor,
              backgroundColor: t.surface,
              color: t.fg,
              borderRadius: t.radius,
              fontFamily: t.fontUI,
            },
          ]}
          multiline
          editable={!busy}
        />
        <Pressable
          style={[
            styles.sendBtn,
            { backgroundColor: t.accent, borderRadius: t.radius },
            (!input.trim() || busy) && styles.sendBtnDisabled,
          ]}
          onPress={send}
          disabled={!input.trim() || busy}
        >
          <Text style={[styles.sendBtnText, { color: t.bg, fontFamily: t.fontUI }]}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 14, paddingBottom: 24 },
  placeholder: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
    lineHeight: 20,
  },
  bubble: {
    padding: 12,
    marginVertical: 5,
    maxWidth: '88%',
  },
  userBubble: { alignSelf: 'flex-end' },
  botBubble: { alignSelf: 'flex-start' },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  userText: {},
  botText: {},
  inputRow: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxHeight: 120,
    fontSize: 15,
  },
  sendBtn: {
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { fontWeight: '600', fontSize: 15 },
});
