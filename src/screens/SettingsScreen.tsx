import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { getApiKey, setApiKey, clearApiKey } from '../lib/storage';

export default function SettingsScreen() {
  const [key, setKey] = useState('');
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    getApiKey().then((k) => setHasKey(!!k));
  }, []);

  async function save() {
    const trimmed = key.trim();
    if (!trimmed) {
      Alert.alert('Empty key', 'Please paste your Anthropic API key.');
      return;
    }
    if (!trimmed.startsWith('sk-ant-')) {
      Alert.alert(
        'Doesn’t look right',
        'Anthropic keys start with "sk-ant-". Save anyway?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Save anyway', onPress: () => persist(trimmed) },
        ],
      );
      return;
    }
    persist(trimmed);
  }

  async function persist(value: string) {
    await setApiKey(value);
    setKey('');
    setHasKey(true);
    Alert.alert('Saved', 'API key stored in Keychain.');
  }

  async function clear() {
    Alert.alert('Remove key?', 'This deletes the key from Keychain.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await clearApiKey();
          setHasKey(false);
        },
      },
    ]);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.label}>Anthropic API Key</Text>
      <Text style={styles.status}>
        {hasKey ? '✓ A key is stored in Keychain' : '✗ No key stored'}
      </Text>

      <TextInput
        value={key}
        onChangeText={setKey}
        placeholder="sk-ant-..."
        placeholderTextColor="#888"
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
        style={styles.input}
      />

      <View style={styles.row}>
        <Pressable style={styles.primary} onPress={save}>
          <Text style={styles.primaryText}>Save</Text>
        </Pressable>
        <Pressable style={styles.danger} onPress={clear} disabled={!hasKey}>
          <Text style={styles.dangerText}>Clear</Text>
        </Pressable>
      </View>

      <Text style={styles.note}>
        Stored locally in iOS Keychain via expo-secure-store. Never sent
        anywhere except directly to api.anthropic.com.
      </Text>
      <Text style={styles.note}>
        Get a key at console.anthropic.com → Settings → API Keys.
      </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  label: { fontSize: 18, fontWeight: '600', marginBottom: 6 },
  status: { fontSize: 14, color: '#444', marginBottom: 18 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 14,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    fontSize: 14,
    marginBottom: 14,
  },
  row: { flexDirection: 'row', gap: 10 },
  primary: {
    flex: 1,
    backgroundColor: '#1f6feb',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  danger: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#c33',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  dangerText: { color: '#c33', fontWeight: '600', fontSize: 16 },
  note: { fontSize: 12, color: '#666', marginTop: 16, lineHeight: 18 },
});
