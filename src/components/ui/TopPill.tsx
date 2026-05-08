import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Surface } from './Surface';
import { useTheme } from '../../theme';

type Props = {
  left?: React.ReactNode;
  center?: React.ReactNode;
  sub?: string;
  right?: React.ReactNode;
};

// Shared top header pill. Edit + Run pages render this above their content.
export function TopPill({ left, center, sub, right }: Props) {
  const t = useTheme();
  return (
    <View style={styles.wrap}>
      <Surface
        style={styles.surface}
        radius={t.radius}
      >
        {left}
        <View style={styles.centerCol}>
          {typeof center === 'string' ? (
            <Text style={[styles.centerText, { color: t.fg }]} numberOfLines={1}>
              {center}
            </Text>
          ) : (
            center
          )}
          {sub ? (
            <Text
              style={[styles.subText, {
                color: t.fgDim,
                fontFamily: t.fontMono,
              }]}
              numberOfLines={1}
            >
              {sub}
            </Text>
          ) : null}
        </View>
        {right}
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  surface: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
  },
  centerCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  centerText: { fontSize: 13, fontWeight: '600' },
  subText: { fontSize: 10.5, marginTop: 1 },
});
