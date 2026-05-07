import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

interface IconProps {
  color?: string;
  size?: number;
}

export function FilesIcon({ color = 'currentColor', size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path d="M3 5a2 2 0 012-2h3l2 2h5a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" stroke={color} strokeWidth="1.6" />
    </Svg>
  );
}

export function FindIcon({ color = 'currentColor', size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Circle cx="9" cy="9" r="5" stroke={color} strokeWidth="1.6" />
      <Path d="M13 13l3.5 3.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

export function EditIcon({ color = 'currentColor', size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path d="M4 14l1-4 8-8 3 3-8 8-4 1z" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

export function RunIcon({ color = 'currentColor', size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path d="M4 6l3 3-3 3M9 13h6" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function GitIcon({ color = 'currentColor', size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Circle cx="6" cy="5" r="2" stroke={color} strokeWidth="1.6" />
      <Circle cx="6" cy="15" r="2" stroke={color} strokeWidth="1.6" />
      <Circle cx="14" cy="10" r="2" stroke={color} strokeWidth="1.6" />
      <Path d="M6 7v6M8 5h4a2 2 0 012 2v1" stroke={color} strokeWidth="1.6" />
    </Svg>
  );
}

export function FolderIcon({ color = 'currentColor', size = 16 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path d="M2 5a1.5 1.5 0 011.5-1.5h2.8L7.5 5H13a1.5 1.5 0 011.5 1.5v5A1.5 1.5 0 0113 13H3.5A1.5 1.5 0 012 11.5V5z" stroke={color} strokeWidth="1.4" />
    </Svg>
  );
}

export function FileIcon({ color = 'currentColor', size = 14 }: IconProps) {
  return (
    <Svg width={11} height={14} viewBox="0 0 11 14" fill="none">
      <Path d="M1 1h6l3 3v9H1z" stroke={color} strokeWidth="1.2" />
      <Path d="M7 1v3h3" stroke={color} strokeWidth="1.2" />
    </Svg>
  );
}

export function CheckIcon({ color = 'currentColor', size = 14 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <Path d="M3 7l3 3 5-7" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

export function UpArrowIcon({ color = 'currentColor', size = 14 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <Path d="M7 11V3M3 7l4-4 4 4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function PlusIcon({ color = 'currentColor', size = 14 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <Path d="M7 1v12M1 7h12" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

export function MinusIcon({ color = 'currentColor', size = 11 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 11 11" fill="none">
      <Path d="M3 5.5h5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

export function ChevronRightIcon({ color = 'currentColor', size = 9 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 9 9" fill="none">
      <Path d="M2.5 1.5L6 4.5L2.5 7.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

export function BranchIcon({ color = 'currentColor', size = 18 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Circle cx="5" cy="4" r="2" stroke={color} strokeWidth="1.8" />
      <Circle cx="5" cy="14" r="2" stroke={color} strokeWidth="1.8" />
      <Circle cx="13" cy="9" r="2" stroke={color} strokeWidth="1.8" />
      <Path d="M5 6v6M7 4h4a2 2 0 012 2v1" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

export function SignalIcon({ color = 'currentColor' }: IconProps) {
  return (
    <Svg width={16} height={11} viewBox="0 0 16 11" fill={color}>
      <Rect x="0" y="6" width="3" height="5" rx="0.6" />
      <Rect x="4.5" y="4" width="3" height="7" rx="0.6" />
      <Rect x="9" y="2" width="3" height="9" rx="0.6" />
      <Rect x="13" y="0" width="3" height="11" rx="0.6" />
    </Svg>
  );
}

export function BatteryIcon({ color = 'currentColor' }: IconProps) {
  return (
    <Svg width={22} height={11} viewBox="0 0 22 11" fill="none">
      <Rect x="0.5" y="0.5" width="19" height="10" rx="2.5" stroke={color} strokeOpacity="0.7" />
      <Rect x="2" y="2" width="16" height="7" rx="1" fill={color} />
    </Svg>
  );
}
