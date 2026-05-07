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
import { sendMessage, ChatMessage } from '../lib/anthropic';

export default function ChatScreen() {
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
      style={styles.container}
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
          <Text style={styles.placeholder}>
            Say hi to Claude. Your message goes directly to api.anthropic.com
            using the key you saved in Settings.
          </Text>
        )}
        {messages.map((m, i) => (
          <View
            key={i}
            style={[
              styles.bubble,
              m.role === 'user' ? styles.userBubble : styles.botBubble,
            ]}
          >
            <Text
              style={[
                styles.bubbleText,
                m.role === 'user' ? styles.userText : styles.botText,
              ]}
            >
              {m.content}
            </Text>
          </View>
        ))}
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
          placeholder="Message Claude..."
          placeholderTextColor="#888"
          style={styles.input}
          multiline
          editable={!busy}
        />
        <Pressable
          style={[
            styles.sendBtn,
            (!input.trim() || busy) && styles.sendBtnDisabled,
          ]}
          onPress={send}
          disabled={!input.trim() || busy}
        >
          <Text style={styles.sendBtnText}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { flex: 1 },
  scrollContent: { padding: 14, paddingBottom: 24 },
  placeholder: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
  },
  bubble: {
    padding: 12,
    borderRadius: 14,
    marginVertical: 5,
    maxWidth: '88%',
  },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#1f6feb' },
  botBubble: { alignSelf: 'flex-start', backgroundColor: '#eef0f3' },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  userText: { color: '#fff' },
  botText: { color: '#111' },
  inputRow: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ccc',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxHeight: 120,
    fontSize: 15,
  },
  sendBtn: {
    backgroundColor: '#1f6feb',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 18,
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
