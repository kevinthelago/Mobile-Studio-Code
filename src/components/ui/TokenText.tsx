import React from 'react';
import { Text } from 'react-native';
import { Token } from '../../data/sampleCode';
import { CodePalette } from '../../theme/tokens';

interface TokenTextProps {
  tokens: Token[];
  palette: CodePalette;
}

export function TokenText({ tokens, palette }: TokenTextProps) {
  return (
    <>
      {tokens.map((tk, i) => {
        const color = (palette as any)[tk.t] ?? palette.id;
        return (
          <Text key={i} style={{ color }}>
            {tk.v}
          </Text>
        );
      })}
    </>
  );
}
