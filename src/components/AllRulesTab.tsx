import { useState } from 'react';
import { useAppState } from '../context/AppContext';
import { PRESETS } from '../data/presets';
import { VECTORS } from '../data/vectors';

export function AllRulesTab({ active }: { active: boolean }) {
  const { rules, deleteRule, selectedNodeId, setSelectedNodeId } = useAppState();
  const [classifFilter, setClassifFilter] = useState('');
  const [enfFilter, setEnfFilter] = useState('');

  let filtered = rules.filter(r => {
    const cids = r.classifIds || [r.classifId];
    const classifMatch = !classifFilter || cids.includes(classifFilter);
    return classifMatch && (!enfFilter || r.enforcement === enfFilter);
  });

  const highlightRule = (id: string) => {
    setSelectedNodeId(selectedNodeId === id ? null : id);
  };

  return (
    <div className={`tab-panel${active ? ' active' : ''}`} id="tab-all-rules">
      <p className="shead">All rules <span style={{ color: 'var(--accent)', marginLeft: 3 }}>{rules.length}</span></p>
      <p style={{ fontSize: 10, color: 'var(--text2)', marginBottom: 10, lineHeight: 1.6 }}>
        Click a rule to highlight it on the map. Select and delete with the ✕ button.
      </p>
      <div style={{ marginBottom: 8, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        <select className="fsel" value={classifFilter} onChange={e => setClassifFilter(e.target.value)} style={{ flex: 1, fontSize: 10, padding: '4px 6px' }}>
          <option value="">All classifications</option>
          {PRESETS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className="fsel" value={enfFilter} onChange={e => setEnfFilter(e.target.value)} style={{ flex: 1, fontSize: 10, padding: '4px 6px' }}>
          <option value="">All responses</option>
          <option value="block">Block</option>
          <option value="monitor">Monitor</option>
          <option value="log">Log</option>
        </select>
      </div>
      {!filtered.length ? (
        <p className="rules-empty">No rules match filter.</p>
      ) : (
        filtered.map(r => {
          const cids = r.classifIds || [r.classifId];
          const presetNames = cids.map(id => PRESETS.find(p => p.id === id)?.name || id).join(', ');
          const vecs = r.vectors.map(vid => VECTORS.find(v => v.id === vid)?.short || vid);
          const ecls = `rtag rtag-${r.enforcement === 'block' ? 'block' : r.enforcement === 'monitor' ? 'monitor' : 'alert'}`;
          return (
            <div key={r.id} className={`rule-item${selectedNodeId === r.id ? ' hl' : ''}`} onClick={() => highlightRule(r.id)}>
              <div className="ri">
                <div className="rn" title={r.name}>{r.name}</div>
                <div className="rm">{presetNames} · <span className={ecls}>{r.enforcement}</span></div>
                <div className="rtags">
                  {vecs.map(l => <span key={l} className="rtag">{l}</span>)}
                  {r.desc && <span className="rtag" style={{ color: 'var(--text3)', fontStyle: 'italic' }}>{r.desc}</span>}
                </div>
              </div>
              <button className="del-btn" onClick={e => { e.stopPropagation(); deleteRule(r.id); }} title="Delete">✕</button>
            </div>
          );
        })
      )}
    </div>
  );
}
