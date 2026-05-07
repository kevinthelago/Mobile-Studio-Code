import React from 'react';
import { TouchableOpacity, ViewStyle } from 'react-native';
import { useTheme } from '../ThemeContext';

interface IconBtnProps {
  children: React.ReactNode;
  onPress?: () => void;
  primary?: boolean;
  style?: ViewStyle;
  size?: number;
}

export default function IconBtn({ children, onPress, primary = false, style = {}, size = 32 }: IconBtnProps) {
  const { theme: t } = useTheme();
  const bg = primary
    ? t.accent
    : t.glass ? 'rgba(255,255,255,0.10)' : t.surfaceSolid;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[{
        width: size,
        height: size,
        borderRadius: t.sharp ? 4 : size / 2,
        backgroundColor: bg,
        borderWidth: primary ? 0 : 0.5,
        borderColor: t.borderColor,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }, style]}
    >
      {children}
    </TouchableOpacity>
  );
}
