import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface SurfaceProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  radius?: number;
}

export function Surface({ children, style, radius }: SurfaceProps) {
  const t = useTheme();
  const r = radius ?? t.radius;

  return (
    <View
      style={[
        {
          borderRadius: r,
          backgroundColor: t.surfaceSolid,
          borderWidth: 1,
          borderColor: t.borderColor,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
