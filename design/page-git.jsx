// Git page — branch info, status (staged + unstaged), commit input.

const GIT_STATUS = {
  branch: 'feat/streaming',
  upstream: 'origin/feat/streaming',
  ahead: 2,
  behind: 0,
  staged: [
    { path: 'app/llm/client.py', state: 'M', adds: 4, dels: 1 },
  ],
  unstaged: [
    { path: 'app/llm/cli.py', state: 'M', adds: 12, dels: 3 },
    { path: 'tests/test_client.py', state: 'M', adds: 6, dels: 0 },
    { path: 'docs/streaming.md', state: 'A', adds: 28, dels: 0 },
  ],
};

function GitPage() {
  const t = useTheme();
  const [tab, setTab] = React.useState('changes');

  const FileRow = ({ f, staged }) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
      borderBottom: `0.5px solid ${t.borderColor}`,
    }}>
      <span style={{
        width: 18, height: 18, borderRadius: 5, fontSize: 10, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: f.state === 'A' ? 'rgba(126,226,196,0.2)' : 'rgba(255,212,121,0.2)',
        color: f.state === 'A' ? t.code.ty : t.code.nm,
      }}>{f.state}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: t.fg, fontFamily: t.fontMono, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.path}</div>
      </div>
      <div style={{ display: 'flex', gap: 8, fontSize: 11, fontFamily: t.fontMono, fontVariantNumeric: 'tabular-nums' }}>
        <span style={{ color: t.code.ty }}>+{f.adds}</span>
        <span style={{ color: t.code.pa }}>−{f.dels}</span>
      </div>
      <button style={{
        width: 26, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
        background: t.glass ? 'rgba(255,255,255,0.10)' : t.surface,
        color: t.fg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {staged ? (
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M3 5.5h5"/></svg>
        ) : (
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M5.5 2v7M2 5.5h7"/></svg>
        )}
      </button>
    </div>
  );

  return (
    <>
      {/* Header — branch */}
      <div style={{ position: 'absolute', top: 60, left: 24, right: 24, zIndex: 5 }}>
        <div style={{ fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: t.fgDim, fontWeight: 600 }}>Branch</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={t.accent} strokeWidth="1.8"><circle cx="5" cy="4" r="2"/><circle cx="5" cy="14" r="2"/><circle cx="13" cy="9" r="2"/><path d="M5 6v6M7 4h4a2 2 0 012 2v1"/></svg>
          <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.4, color: t.fg, fontFamily: t.fontMono }}>{GIT_STATUS.branch}</span>
        </div>
        <div style={{ fontSize: 12, color: t.fgMuted, marginTop: 4, display: 'flex', gap: 12, fontFamily: t.fontMono }}>
          <span>↑ {GIT_STATUS.ahead}</span>
          <span>↓ {GIT_STATUS.behind}</span>
          <span>{GIT_STATUS.upstream}</span>
        </div>
      </div>

      {/* Action chips */}
      <div style={{ position: 'absolute', top: 144, left: 16, right: 16, display: 'flex', gap: 8, zIndex: 5 }}>
        {[
          { icon: '↓', label: 'Pull' },
          { icon: '↑', label: 'Push' },
          { icon: '⤴', label: 'Sync' },
        ].map((a) => (
          <Surface key={a.label} style={{
            flex: 1, height: 56, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 2, cursor: 'pointer',
          }} radius={14}>
            <span style={{ fontSize: 18, color: t.fg, lineHeight: 1 }}>{a.icon}</span>
            <span style={{ fontSize: 11, color: t.fgMuted, fontWeight: 500 }}>{a.label}</span>
          </Surface>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ position: 'absolute', top: 218, left: 16, right: 16, height: 36, zIndex: 5,
        display: 'flex', gap: 4, padding: 4,
        ...(t.glass
          ? { background: 'rgba(255,255,255,0.06)', borderRadius: 12, border: '0.5px solid rgba(255,255,255,0.10)' }
          : { background: t.surface, borderRadius: 10, border: t.border }) }}>
        {[
          { id: 'changes', label: 'Changes', count: 4 },
          { id: 'history', label: 'History', count: null },
          { id: 'stash', label: 'Stash', count: 1 },
        ].map((tb) => {
          const active = tb.id === tab;
          return (
            <button key={tb.id} onClick={() => setTab(tb.id)} style={{
              flex: 1, height: '100%', border: 'none', cursor: 'pointer',
              background: active ? (t.glass ? 'rgba(255,255,255,0.16)' : t.bg) : 'transparent',
              borderRadius: 8,
              color: active ? t.fg : t.fgMuted,
              fontSize: 12.5, fontWeight: 500, fontFamily: t.fontUI,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              {tb.label}
              {tb.count != null && <span style={{ fontSize: 10.5, color: active ? t.fgMuted : t.fgDim, fontVariantNumeric: 'tabular-nums' }}>{tb.count}</span>}
            </button>
          );
        })}
      </div>

      {/* Changes list */}
      <div style={{ position: 'absolute', top: 268, left: 12, right: 12, bottom: 200, overflow: 'hidden', zIndex: 5 }}>
        <Surface style={{ height: '100%', overflow: 'hidden' }}>
          <div style={{ padding: '8px 14px 4px', fontSize: 10.5, letterSpacing: 1.2, textTransform: 'uppercase', color: t.fgDim, fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
            <span>Staged</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{GIT_STATUS.staged.length}</span>
          </div>
          {GIT_STATUS.staged.map((f, i) => <FileRow key={i} f={f} staged />)}
          <div style={{ padding: '12px 14px 4px', fontSize: 10.5, letterSpacing: 1.2, textTransform: 'uppercase', color: t.fgDim, fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
            <span>Unstaged</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{GIT_STATUS.unstaged.length}</span>
          </div>
          {GIT_STATUS.unstaged.map((f, i) => <FileRow key={i} f={f} />)}
        </Surface>
      </div>

      {/* Commit composer */}
      <div style={{ position: 'absolute', left: 12, right: 12, bottom: 96, zIndex: 5 }}>
        <Surface style={{ padding: 12 }} radius={20}>
          <input placeholder="Commit message…" style={{
            width: '100%', border: 'none', outline: 'none', background: 'transparent',
            color: t.fg, fontSize: 13.5, fontFamily: t.fontUI, padding: '4px 4px 8px',
            boxSizing: 'border-box',
          }} />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', borderTop: `0.5px solid ${t.borderColor}`, paddingTop: 10 }}>
            <button style={{
              fontSize: 11.5, color: t.fgMuted, background: 'transparent', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: t.fontUI,
            }}>
              <span style={{ width: 14, height: 14, borderRadius: 7, background: 'linear-gradient(135deg,#d97757,#ffaecf)', display: 'inline-block' }} />
              Draft with Claude
            </button>
            <div style={{ flex: 1 }} />
            <button style={{
              padding: '7px 14px', borderRadius: 14, border: 'none', cursor: 'pointer',
              background: t.accent, color: '#fff', fontSize: 12.5, fontWeight: 600, fontFamily: t.fontUI,
            }}>Commit · 1 file</button>
          </div>
        </Surface>
      </div>
    </>
  );
}

window.GitPage = GitPage;
