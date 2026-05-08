import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';

type OrbDef = { left: number; top: number; size: number; color: string };

const ORBS: OrbDef[] = [
  { left: -80, top: 80, size: 280, color: '#5b3fc8' },
  { left: 220, top: 240, size: 240, color: '#1f6dd9' },
  { left: -40, top: 560, size: 260, color: '#0f5b6b' },
  { left: 180, top: 720, size: 220, color: '#7a2a6a' },
];

// Ambient blurred color orbs. Only renders for themes with `orbs: true` (glass).
// Native RN doesn't support filter:blur, so we approximate with a stack of
// progressively-larger semi-transparent rings around each orb center.
export function Orbs() {
  const t = useTheme();
  if (!t.orbs) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {ORBS.map((o, i) => (
        <SoftOrb key={i} {...o} />
      ))}
    </View>
  );
}

function SoftOrb({ left, top, size, color }: OrbDef) {
  // Stack of rings approximates Gaussian blur. Each ring is slightly bigger
  // and more transparent than the last; combined they give a soft falloff.
  const rings = 5;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: left - size * 0.25,
        top: top - size * 0.25,
        width: size * 1.5,
        height: size * 1.5,
      }}
    >
      {Array.from({ length: rings }).map((_, i) => {
        const expand = i * (size * 0.12);
        const opacity = 0.45 * (1 - i / rings);
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: size * 0.25 - expand / 2,
              top: size * 0.25 - expand / 2,
              width: size + expand,
              height: size + expand,
              borderRadius: (size + expand) / 2,
              backgroundColor: color,
              opacity,
            }}
          />
        );
      })}
    </View>
  );
}
