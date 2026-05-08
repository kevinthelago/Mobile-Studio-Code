import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';

type Props = { size?: number };

// Claude brand-pink → orange gradient circle used in chips, top pills, and
// commit-composer affordances.
export function ClaudeAvatar({ size = 14 }: Props) {
  return (
    <LinearGradient
      colors={['#d97757', '#ffaecf']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ width: size, height: size, borderRadius: size / 2 }}
    />
  );
}
