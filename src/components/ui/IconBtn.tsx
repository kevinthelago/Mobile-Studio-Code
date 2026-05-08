import React from 'react';
import {
  Pressable, StyleSheet, type ViewStyle, type StyleProp,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme';

type Props = {
  children?: React.ReactNode;
  onPress?: () => void;
  primary?: boolean;
  size?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

// Themed icon button. Primary variant uses a Claude-pink → purple gradient
// in the glass theme; other themes use a solid accent fill.
export function IconBtn({
  children, onPress, primary = false, size = 32, disabled, style,
}: Props) {
  const t = useTheme();
  const radius = t.sharp ? 4 : Math.round(size / 2);
  const sizing = { width: size, height: size, borderRadius: radius };

  if (primary && t.glass) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          sizing,
          { opacity: disabled ? 0.4 : pressed ? 0.85 : 1 },
          style,
        ]}
      >
        <LinearGradient
          colors={['#d97757', '#c084fc']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[sizing, styles.center]}
        >
          {children}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        sizing,
        styles.center,
        primary
          ? { backgroundColor: t.accent }
          : {
              backgroundColor: t.glass ? 'rgba(255,255,255,0.10)' : t.surface,
              borderWidth: t.glass ? 0 : StyleSheet.hairlineWidth,
              borderColor: t.borderColor,
            },
        { opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});
