// Lightweight syntax tokenizer. Returns flat token spans with theme palette tags
// matching the CodePalette keys (kw, fn, st, nm, cm, ty, op, pn, pa, id, sp).

export type Token = { t: string; v: string };
export type CodeLine = { n: number; tokens: Token[] };

type Lang =
  | 'js' | 'ts' | 'jsx' | 'tsx'
  | 'py'
  | 'json'
  | 'md'
  | 'sh'
  | 'yaml'
  | 'plain';

export function detectLang(path: string): Lang {
  const lower = path.toLowerCase();
  if (lower.endsWith('.tsx')) return 'tsx';
  if (lower.endsWith('.ts')) return 'ts';
  if (lower.endsWith('.jsx')) return 'jsx';
  if (lower.endsWith('.js') || lower.endsWith('.mjs') || lower.endsWith('.cjs')) return 'js';
  if (lower.endsWith('.py')) return 'py';
  if (lower.endsWith('.json')) return 'json';
  if (lower.endsWith('.md') || lower.endsWith('.markdown')) return 'md';
  if (lower.endsWith('.sh') || lower.endsWith('.bash') || lower.endsWith('.zsh')) return 'sh';
  if (lower.endsWith('.yml') || lower.endsWith('.yaml')) return 'yaml';
  return 'plain';
}

const JS_KEYWORDS = new Set([
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
  'do', 'switch', 'case', 'break', 'continue', 'new', 'class', 'extends',
  'import', 'export', 'from', 'as', 'default', 'async', 'await', 'yield',
  'try', 'catch', 'finally', 'throw', 'typeof', 'instanceof', 'in', 'of',
  'this', 'super', 'static', 'public', 'private', 'protected', 'readonly',
  'true', 'false', 'null', 'undefined', 'void',
]);

const TS_KEYWORDS = new Set([
  ...JS_KEYWORDS,
  'interface', 'type', 'enum', 'implements', 'declare', 'namespace', 'module',
  'keyof', 'infer', 'never', 'unknown', 'any',
]);

const PY_KEYWORDS = new Set([
  'def', 'class', 'return', 'if', 'elif', 'else', 'for', 'while', 'in', 'not',
  'and', 'or', 'is', 'lambda', 'try', 'except', 'finally', 'raise', 'with',
  'as', 'pass', 'break', 'continue', 'import', 'from', 'global', 'nonlocal',
  'yield', 'async', 'await', 'True', 'False', 'None', 'self',
]);

const TS_BUILTINS = new Set([
  'string', 'number', 'boolean', 'object', 'symbol', 'bigint', 'Array',
  'Promise', 'Record', 'Partial', 'Pick', 'Omit', 'Map', 'Set', 'Date',
]);

function keywordsFor(lang: Lang): Set<string> {
  if (lang === 'py') return PY_KEYWORDS;
  if (lang === 'ts' || lang === 'tsx') return TS_KEYWORDS;
  if (lang === 'js' || lang === 'jsx') return JS_KEYWORDS;
  return new Set();
}

function commentPrefixes(lang: Lang): string[] {
  if (lang === 'py' || lang === 'sh' || lang === 'yaml') return ['#'];
  if (lang === 'json' || lang === 'plain' || lang === 'md') return [];
  return ['//'];
}

function hasBlockComment(lang: Lang): boolean {
  return lang === 'js' || lang === 'jsx' || lang === 'ts' || lang === 'tsx';
}

const ID_CHAR = /[A-Za-z0-9_$]/;
const ID_START = /[A-Za-z_$]/;

export function tokenizeLine(line: string, lang: Lang): Token[] {
  if (lang === 'md') {
    if (line.startsWith('#')) return [{ t: 'kw', v: line }];
    if (/^\s*[-*]\s/.test(line)) return [{ t: 'pa', v: line }];
    return [{ t: 'id', v: line }];
  }
  if (lang === 'plain') return [{ t: 'id', v: line }];

  const tokens: Token[] = [];
  const kw = keywordsFor(lang);
  const builtins = lang === 'ts' || lang === 'tsx' ? TS_BUILTINS : new Set<string>();
  const lineComments = commentPrefixes(lang);
  const block = hasBlockComment(lang);

  let i = 0;
  let buf = '';
  let bufKind = '';

  function flush() {
    if (buf) {
      tokens.push({ t: bufKind || 'id', v: buf });
      buf = '';
      bufKind = '';
    }
  }

  function pushToken(t: string, v: string) {
    flush();
    tokens.push({ t, v });
  }

  while (i < line.length) {
    const c = line[i];

    // Line comment
    let comm = false;
    for (const p of lineComments) {
      if (line.startsWith(p, i)) {
        pushToken('cm', line.slice(i));
        return tokens;
      }
    }

    // Block comment start
    if (block && line.startsWith('/*', i)) {
      const end = line.indexOf('*/', i + 2);
      if (end === -1) {
        pushToken('cm', line.slice(i));
        return tokens;
      }
      pushToken('cm', line.slice(i, end + 2));
      i = end + 2;
      continue;
    }

    // String
    if (c === '"' || c === "'" || c === '`') {
      const quote = c;
      let j = i + 1;
      while (j < line.length) {
        if (line[j] === '\\' && j + 1 < line.length) { j += 2; continue; }
        if (line[j] === quote) { j++; break; }
        j++;
      }
      pushToken('st', line.slice(i, j));
      i = j;
      continue;
    }

    // Number
    if (/[0-9]/.test(c) && (i === 0 || !ID_CHAR.test(line[i - 1]))) {
      let j = i;
      while (j < line.length && /[0-9._xXoObB]/.test(line[j])) j++;
      pushToken('nm', line.slice(i, j));
      i = j;
      continue;
    }

    // Whitespace
    if (c === ' ' || c === '\t') {
      let j = i;
      while (j < line.length && (line[j] === ' ' || line[j] === '\t')) j++;
      pushToken('sp', line.slice(i, j));
      i = j;
      continue;
    }

    // Identifier
    if (ID_START.test(c)) {
      let j = i;
      while (j < line.length && ID_CHAR.test(line[j])) j++;
      const word = line.slice(i, j);
      let kind: string;
      if (kw.has(word)) kind = 'kw';
      else if (builtins.has(word)) kind = 'ty';
      else if (line[j] === '(') kind = 'fn';
      else if (/^[A-Z]/.test(word)) kind = 'ty';
      else kind = 'id';
      pushToken(kind, word);
      i = j;
      continue;
    }

    // Operators
    if (/[=+\-*/%<>!&|^~?:]/.test(c)) {
      let j = i;
      while (j < line.length && /[=+\-*/%<>!&|^~?]/.test(line[j])) j++;
      pushToken('op', line.slice(i, j));
      i = j;
      continue;
    }

    // Punctuation: parens, braces, brackets, comma, semicolon, dot
    if (/[(){}\[\],;.]/.test(c)) {
      pushToken('pn', c);
      i++;
      continue;
    }

    // Fallback — single char as identifier
    buf += c;
    bufKind = 'id';
    i++;
  }

  flush();
  return tokens;
}

export function tokenizeFile(content: string, lang: Lang): CodeLine[] {
  const lines = content.split('\n');
  return lines.map((text, idx) => ({
    n: idx + 1,
    tokens: tokenizeLine(text, lang),
  }));
}

// Simple plain-text grep: returns ranges per matching line.
export type GrepMatch = {
  line: number;
  before: string;
  match: string;
  after: string;
};

export function grepInText(
  content: string,
  needle: string,
  caseSensitive: boolean,
): GrepMatch[] {
  if (!needle) return [];
  const out: GrepMatch[] = [];
  const lines = content.split('\n');
  const cmpNeedle = caseSensitive ? needle : needle.toLowerCase();
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const cmpLine = caseSensitive ? line : line.toLowerCase();
    let from = 0;
    while (true) {
      const idx = cmpLine.indexOf(cmpNeedle, from);
      if (idx === -1) break;
      out.push({
        line: i + 1,
        before: line.slice(Math.max(0, idx - 24), idx),
        match: line.slice(idx, idx + needle.length),
        after: line.slice(idx + needle.length, idx + needle.length + 32),
      });
      from = idx + needle.length;
      if (out.length >= 200) return out;
    }
  }
  return out;
}
