import * as SecureStore from 'expo-secure-store';

const KEY = 'anthropic_api_key';

export async function getApiKey(): Promise<string | null> {
  return SecureStore.getItemAsync(KEY);
}

export async function setApiKey(value: string): Promise<void> {
  await SecureStore.setItemAsync(KEY, value);
}

export async function clearApiKey(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY);
}
