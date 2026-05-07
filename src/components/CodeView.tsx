import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTheme } from '../ThemeContext';
import { SAMPLE_CODE, Token } from '../codeContent';
import { CodePalette } from '../theme';

function renderTokens(tokens: Token[], palette: CodePalette) {
  return tokens.map((tk, i) => {
    const color = (palette as any)[tk.t] ?? palette.id;
    return (
      <Text key={i} style={{ color }}>
        {tk.v}
      </Text>
    );
  });
}

export function CodeView() {
  const t = useTheme();

  return (
    <ScrollView
      style={{ flex: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingVertical: 8 }}>
        {SAMPLE_CODE.map((line) => (
          <View
            key={line.n}
            style={{ flexDirection: 'row', paddingRight: 4 }}
          >
            <Text
              style={{
                width: 36,
                textAlign: 'right',
                paddingRight: 12,
                color: t.fgDim,
                fontFamily: t.fontMono,
                fontSize: 12,
                lineHeight: 20,
              }}
            >
              {line.n}
            </Text>
            <Text
              style={{
                fontFamily: t.fontMono,
                fontSize: 12,
                lineHeight: 20,
                color: t.code.id,
                flexShrink: 1,
              }}
            >
              {renderTokens(line.tokens, t.code)}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
