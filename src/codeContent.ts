export interface Token {
  t: string;
  v: string;
}

export interface CodeLine {
  n: number;
  tokens: Token[];
}

export const SAMPLE_CODE: CodeLine[] = [
  { n: 1, tokens: [
    { t: 'kw', v: 'import' }, { t: 'sp', v: ' ' },
    { t: 'id', v: 'asyncio' },
  ]},
  { n: 2, tokens: [
    { t: 'kw', v: 'from' }, { t: 'sp', v: ' ' },
    { t: 'id', v: 'anthropic' }, { t: 'sp', v: ' ' },
    { t: 'kw', v: 'import' }, { t: 'sp', v: ' ' },
    { t: 'id', v: 'AsyncAnthropic' },
  ]},
  { n: 3, tokens: [] },
  { n: 4, tokens: [
    { t: 'cm', v: '# stream completions back to the editor' },
  ]},
  { n: 5, tokens: [
    { t: 'kw', v: 'async def' }, { t: 'sp', v: ' ' },
    { t: 'fn', v: 'stream' }, { t: 'pn', v: '(' },
    { t: 'pa', v: 'prompt' }, { t: 'pn', v: ': ' },
    { t: 'ty', v: 'str' }, { t: 'pn', v: ') -> ' },
    { t: 'ty', v: 'AsyncIterator' }, { t: 'pn', v: '[' },
    { t: 'ty', v: 'str' }, { t: 'pn', v: ']:' },
  ]},
  { n: 6, tokens: [
    { t: 'sp', v: '    ' },
    { t: 'id', v: 'client' }, { t: 'op', v: ' = ' },
    { t: 'fn', v: 'AsyncAnthropic' }, { t: 'pn', v: '()' },
  ]},
  { n: 7, tokens: [
    { t: 'sp', v: '    ' },
    { t: 'kw', v: 'async with' }, { t: 'sp', v: ' ' },
    { t: 'id', v: 'client' }, { t: 'op', v: '.' },
    { t: 'id', v: 'messages' }, { t: 'op', v: '.' },
    { t: 'fn', v: 'stream' }, { t: 'pn', v: '(' },
  ]},
  { n: 8, tokens: [
    { t: 'sp', v: '        ' },
    { t: 'pa', v: 'model' }, { t: 'op', v: '=' },
    { t: 'st', v: '"claude-sonnet-4-5"' }, { t: 'pn', v: ',' },
  ]},
  { n: 9, tokens: [
    { t: 'sp', v: '        ' },
    { t: 'pa', v: 'max_tokens' }, { t: 'op', v: '=' },
    { t: 'nm', v: '1024' }, { t: 'pn', v: ',' },
  ]},
  { n: 10, tokens: [
    { t: 'sp', v: '        ' },
    { t: 'pa', v: 'messages' }, { t: 'op', v: '=' },
    { t: 'pn', v: '[{' },
    { t: 'st', v: '"role"' }, { t: 'pn', v: ': ' },
    { t: 'st', v: '"user"' }, { t: 'pn', v: ', ' },
    { t: 'st', v: '"content"' }, { t: 'pn', v: ': ' },
    { t: 'id', v: 'prompt' }, { t: 'pn', v: '}],' },
  ]},
  { n: 11, tokens: [
    { t: 'sp', v: '    ' },
    { t: 'pn', v: ') ' }, { t: 'kw', v: 'as' }, { t: 'sp', v: ' ' },
    { t: 'id', v: 'stream' }, { t: 'pn', v: ':' },
  ]},
  { n: 12, tokens: [
    { t: 'sp', v: '        ' },
    { t: 'kw', v: 'async for' }, { t: 'sp', v: ' ' },
    { t: 'id', v: 'text' }, { t: 'sp', v: ' ' },
    { t: 'kw', v: 'in' }, { t: 'sp', v: ' ' },
    { t: 'id', v: 'stream' }, { t: 'op', v: '.' },
    { t: 'id', v: 'text_stream' }, { t: 'pn', v: ':' },
  ]},
  { n: 13, tokens: [
    { t: 'sp', v: '            ' },
    { t: 'kw', v: 'yield' }, { t: 'sp', v: ' ' },
    { t: 'id', v: 'text' },
  ]},
];

export interface TerminalBlock {
  kind: string;
  text?: string;
  name?: string;
  target?: string;
  adds?: number;
  dels?: number;
  cmd?: string;
  exit?: number;
}

export const TERMINAL_LOG: TerminalBlock[] = [
  { kind: 'system', text: 'claude --model sonnet-4.5 · workspace: llm-cli' },
  { kind: 'user', text: 'add streaming to the messages call' },
  { kind: 'thinking', text: 'reading client.py · 28 lines' },
  { kind: 'tool', name: 'edit', target: 'client.py', adds: 4, dels: 1 },
  { kind: 'reply', text: "Switched to client.messages.stream() and yielded text deltas. It's now an AsyncIterator — you'll need to await it." },
  { kind: 'user', text: 'run the tests' },
  { kind: 'tool', name: 'shell', cmd: 'pytest tests/ -q', exit: 0 },
  { kind: 'output', text: '....F\n5 passed, 1 failed in 0.42s' },
  { kind: 'reply', text: 'One failure in test_client_init — the mock still uses the sync class. Want me to update it?' },
];
