// Terminal/Run page — full-screen Claude conversation, prompt history, tool callouts.

const TERMINAL_LOG = [
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

function TerminalPage() {
  const t = useTheme();
  return (
    <>
      {/* Header */}
      <TopPill
        left={<span style={{ width: 14, height: 14, borderRadius: 7, background: 'linear-gradient(135deg,#d97757,#ffaecf)' }} />}
        center={<div style={{ fontWeight: 600, color: t.fg, fontSize: 14 }}>Claude</div>}
        sub={'sonnet 4.5 · 8 turns · 2 tool calls'}
        right={
          <IconBtn>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M7 1v3M7 10v3M1 7h3M10 7h3M3 3l2 2M9 9l2 2M3 11l2-2M9 5l2-2"/></svg>
          </IconBtn>
        }
      />

      {/* Transcript */}
      <div style={{ position: 'absolute', top: 124, left: 0, right: 0, bottom: 178, overflow: 'hidden', zIndex: 4 }}>
        <div style={{ padding: '12px 18px', fontFamily: t.fontMono, fontSize: 12, lineHeight: 1.55 }}>
          {TERMINAL_LOG.map((b, i) => {
            if (b.kind === 'system') return (
              <div key={i} style={{ color: t.fgDim, marginBottom: 14, fontSize: 11 }}>· {b.text}</div>
            );
            if (b.kind === 'user') return (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <span style={{ color: t.accent }}>›</span>
                <span style={{ color: t.fg }}>{b.text}</span>
              </div>
            );
            if (b.kind === 'thinking') return (
              <div key={i} style={{ color: t.fgMuted, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 5, height: 5, borderRadius: 3, background: t.code.ty }} />
                {b.text}
              </div>
            );
            if (b.kind === 'tool') return (
              <div key={i} style={{
                background: t.glass ? 'rgba(255,255,255,0.05)' : t.surface,
                border: `0.5px solid ${t.borderColor}`,
                borderRadius: 10, padding: '8px 10px', marginBottom: 8,
              }}>
                <div style={{ fontSize: 10.5, color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                  {b.name}{b.target ? ` · ${b.target}` : ''}{b.cmd ? ` · ${b.cmd}` : ''}
                </div>
                {b.adds !== undefined && (
                  <div style={{ display: 'flex', gap: 12, fontSize: 11.5 }}>
                    <span style={{ color: t.code.ty }}>+{b.adds}</span>
                    <span style={{ color: t.code.pa }}>−{b.dels}</span>
                  </div>
                )}
                {b.exit !== undefined && (
                  <div style={{ fontSize: 11.5, color: b.exit === 0 ? t.code.ty : t.code.pa }}>exit {b.exit}</div>
                )}
              </div>
            );
            if (b.kind === 'output') return (
              <div key={i} style={{
                background: t.glass ? 'rgba(0,0,0,0.25)' : t.bg,
                borderLeft: `2px solid ${t.borderColor}`,
                padding: '6px 10px', marginBottom: 10, whiteSpace: 'pre-wrap',
                color: t.fgMuted, fontSize: 11.5,
              }}>{b.text}</div>
            );
            if (b.kind === 'reply') return (
              <div key={i} style={{
                color: t.fg, fontFamily: t.fontUI, opacity: 0.95,
                fontSize: 13.5, lineHeight: 1.45, marginBottom: 14, textWrap: 'pretty',
              }}>{b.text}</div>
            );
            return null;
          })}
        </div>
      </div>

      {/* Suggestion chips above input */}
      <div style={{ position: 'absolute', left: 16, right: 16, bottom: 138, display: 'flex', gap: 8, overflowX: 'auto', zIndex: 5 }}>
        {['Yes, fix it', 'Show diff', 'Skip'].map((s, i) => (
          <button key={s} style={{
            flexShrink: 0, height: 32, padding: '0 12px', borderRadius: 16,
            background: i === 0 ? t.accent : (t.glass ? 'rgba(255,255,255,0.10)' : t.surface),
            border: i === 0 ? 'none' : `0.5px solid ${t.borderColor}`,
            color: i === 0 ? '#fff' : t.fg, cursor: 'pointer',
            fontSize: 12.5, fontWeight: 500, fontFamily: t.fontUI,
          }}>{s}</button>
        ))}
      </div>

      {/* Input */}
      <div style={{ position: 'absolute', left: 12, right: 12, bottom: 96, zIndex: 5 }}>
        <Surface style={{
          height: 52, padding: '0 6px 0 16px', display: 'flex', alignItems: 'center', gap: 10,
        }} radius={26}>
          <IconBtn>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M7 1v12M1 7h12"/></svg>
          </IconBtn>
          <input placeholder="Ask Claude…" style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            color: t.fg, fontSize: 14, fontFamily: t.fontUI,
          }} />
          <IconBtn primary>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 11V3M3 7l4-4 4 4"/></svg>
          </IconBtn>
        </Surface>
      </div>
    </>
  );
}

window.TerminalPage = TerminalPage;
