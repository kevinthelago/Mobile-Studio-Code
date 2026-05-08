import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Surface } from './Surface';
import {
  THEMES, useTheme, useThemeId, useSetThemeId, type Theme, type ThemeId,
} from '../../theme';

// Inline theme picker. 5 swatches showing each theme's bg + accent; tap to apply.
// Used on the Repo screen so the user can switch design language without a separate Settings page.
export function ThemePicker() {
  const t = useTheme();
  const activeId = useThemeId();
  const setThemeId = useSetThemeId();

  return (
    <View>
      <Text style={[styles.label, { color: t.fgDim }]}>Theme</Text>
      <View style={styles.row}>
        {(Object.entries(THEMES) as [ThemeId, Theme][]).map(([id, theme]) => {
          const active = id === activeId;
          return (
            <Pressable
              key={id}
              onPress={() => setThemeId(id)}
              style={styles.cell}
            >
              <Surface
                radius={12}
                style={[
                  styles.swatch,
                  active && {
                    borderColor: t.accent,
                    borderWidth: 1.5,
                  },
                ]}
              >
                <View style={[styles.swatchBg, { backgroundColor: theme.bg }]}>
                  <View style={[styles.dot, { backgroundColor: theme.accent }]} />
                  <View
                    style={[
                      styles.dot,
                      styles.dotSecondary,
                      { backgroundColor: theme.accent2 },
                    ]}
                  />
                </View>
              </Surface>
              <Text
                style={[
                  styles.name,
                  { color: active ? t.fg : t.fgMuted },
                ]}
                numberOfLines={1}
              >
                {theme.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 11, letterSpacing: 1, textTransform: 'uppercase',
    fontWeight: '600', marginBottom: 8,
  },
  row: { flexDirection: 'row', gap: 8 },
  cell: { flex: 1, alignItems: 'center', gap: 6 },
  swatch: {
    width: '100%', aspectRatio: 1,
    overflow: 'hidden',
  },
  swatchBg: {
    flex: 1,
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 4,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotSecondary: { opacity: 0.7 },
  name: {
    fontSize: 10.5, fontWeight: '500', textAlign: 'center',
  },
});
