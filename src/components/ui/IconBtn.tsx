import React from 'react';
import { TouchableOpacity, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface IconBtnProps {
  children: React.ReactNode;
  onPress?: () => void;
  primary?: boolean;
  style?: ViewStyle;
}

export function IconBtn({ children, onPress, primary = false, style }: IconBtnProps) {
  const t = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        {
          width: 32,
          height: 32,
          borderRadius: t.sharp ? 4 : 16,
          borderWidth: primary ? 0 : 1,
          borderColor: t.borderColor,
          backgroundColor: primary ? t.accent : t.surfaceSolid,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        },
        style,
      ]}
    >
      {children}
    </TouchableOpacity>
  );
}
