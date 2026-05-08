import React from 'react';
import {
  Platform, StyleSheet, View, type StyleProp, type ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../theme';

type Props = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  soft?: boolean;
};

// Themed surface. Glass theme uses a native BlurView so the panel actually frosts;
// other themes are solid panels with a hairline border.
export function Surface({ children, style, radius, soft = false }: Props) {
  const t = useTheme();
  const r = radius ?? t.radius;

  if (t.glass) {
    return (
      <View
        style={[
          {
            borderRadius: r,
            overflow: 'hidden',
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: t.borderColor,
          },
          style,
        ]}
      >
        <BlurView
          intensity={Platform.OS === 'ios' ? 40 : 80}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: t.surface }]}
        />
        <View style={styles.glassHighlight} pointerEvents="none" />
        {children}
      </View>
    );
  }

  return (
    <View
      style={[
        {
          borderRadius: r,
          backgroundColor: soft ? t.surface : t.surfaceSolid,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.borderColor,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  glassHighlight: {
    position: 'absolute',
    top: 0, left: 0, right: 0, height: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
});
