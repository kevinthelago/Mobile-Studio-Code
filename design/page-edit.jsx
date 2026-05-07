// Edit page — refactored from variant-glass to use shared Shell + tokens.

function EditPage() {
  const t = useTheme();
  return (
    <>
      {/* TOP PILL: file path */}
      <TopPill
        left={<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={t.fgMuted} strokeWidth="1.6"><path d="M2 3h3l1 1h6v7H2z"/></svg>}
        center={
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontVariantNumeric: 'tabular-nums', fontFamily: t.fontMono }}>
            <span style={{ color: t.fgDim }}>app</span>
            <span style={{ color: t.fgDim }}>/</span>
            <span style={{ color: t.fgMuted }}>llm</span>
            <span style={{ color: t.fgDim }}>/</span>
            <span style={{ color: t.fg, fontWeight: 600 }}>client.py</span>
            <span style={{ marginLeft: 6, width: 5, height: 5, borderRadius: 3, background: t.accent }} />
          </div>
        }
        right={
          <IconBtn>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M3 7l3 3 5-7"/></svg>
          </IconBtn>
        }
      />

      {/* EDITOR */}
      <div style={{
        position: 'absolute', top: 116, left: 0, right: 0, bottom: 380,
        overflow: 'hidden', padding: '8px 0', zIndex: 4,
      }}>
        <div style={{ fontFamily: t.fontMono, fontSize: 12.5, lineHeight: '20px' }}>
          {SAMPLE_CODE.map((line, i) => (
            <div key={line.n} style={{ display: 'flex', padding: '0 4px 0 0' }}>
              <div style={{
                width: 36, textAlign: 'right', paddingRight: 12,
                color: t.fgDim, fontVariantNumeric: 'tabular-nums', userSelect: 'none', flexShrink: 0,
              }}>{line.n}</div>
              <div style={{ whiteSpace: 'pre', color: t.code.id }}>
                {renderTokens(line.tokens, t.code)}
              </div>
            </div>
          ))}
        </div>
        <div style={{
          position: 'absolute', left: 30, top: 8 + 19 * 20 - 1, width: 4, height: 22,
          background: t.accent, borderRadius: 2,
        }} />
      </div>

      {/* CLAUDE CHIP */}
      <div style={{ position: 'absolute', top: 460, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 24 }}>
        <Surface style={{
          padding: '6px 12px 6px 10px', display: 'flex', alignItems: 'center', gap: 7,
          fontSize: 12, fontWeight: 600, letterSpacing: 0.2, color: t.fg, fontFamily: t.fontUI,
        }} radius={14}>
          <span style={{
            width: 14, height: 14, borderRadius: 7,
            background: 'linear-gradient(135deg, #d97757, #ffaecf)',
          }} />
          Claude · sonnet 4.5
          <span style={{ width: 1, height: 12, background: t.borderColor, margin: '0 2px' }} />
          <span style={{ color: t.fgMuted, fontWeight: 500 }}>2 tools</span>
        </Surface>
      </div>

      {/* TERMINAL CARD */}
      <div style={{ position: 'absolute', left: 12, right: 12, bottom: 88, top: 484, zIndex: 22 }}>
        <Surface style={{
          height: '100%', padding: '20px 18px 12px', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }} radius={28}>
          <div style={{ flex: 1, overflow: 'hidden', fontFamily: t.fontMono, fontSize: 12, lineHeight: 1.55 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <span style={{ color: t.fgDim }}>›</span>
              <span style={{ color: t.fg }}>add streaming to the messages call</span>
            </div>
            <div style={{ color: t.fgMuted, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 5, height: 5, borderRadius: 3, background: t.code.ty }} />
              reading client.py · 28 lines
            </div>
            <div style={{
              background: t.glass ? 'rgba(255,255,255,0.05)' : t.surfaceSolid,
              borderRadius: 10, padding: '8px 10px',
              border: `0.5px solid ${t.borderColor}`, marginBottom: 10,
            }}>
              <div style={{ fontSize: 10.5, color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>edit · client.py</div>
              <div style={{ display: 'flex', gap: 12, fontSize: 11.5 }}>
                <span style={{ color: t.code.ty }}>+4</span>
                <span style={{ color: t.code.pa }}>−1</span>
              </div>
            </div>
            <div style={{
              color: t.fg, fontFamily: t.fontUI, opacity: 0.95,
              fontSize: 13.5, lineHeight: 1.45, letterSpacing: -0.1, textWrap: 'pretty',
            }}>
              Switched to <code style={{ background: t.glass ? 'rgba(255,255,255,0.08)' : t.surfaceSolid, padding: '1px 4px', borderRadius: 4, fontSize: 12, fontFamily: t.fontMono }}>client.messages.stream()</code> and yielded text deltas. It's now an AsyncIterator — you'll need to await it.
            </div>
          </div>
          <div style={{
            marginTop: 10, height: 44, borderRadius: 22, padding: '0 6px 0 16px',
            background: t.glass ? 'rgba(0,0,0,0.25)' : t.bg,
            border: `0.5px solid ${t.borderColor}`,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ color: t.fgDim, fontSize: 13 }}>Ask Claude…</span>
            <div style={{ flex: 1 }} />
            <IconBtn primary>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 11V3M3 7l4-4 4 4"/></svg>
            </IconBtn>
          </div>
        </Surface>
      </div>
    </>
  );
}

window.EditPage = EditPage;
