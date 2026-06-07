import { useState } from 'react';
import { useAppState } from '../context/AppContext';
import { PRESETS } from '../data/presets';
import { VECTORS } from '../data/vectors';
import type { Rule } from '../data/types';

type Enforcement = Rule['enforcement'];

export function RulesTab({ active }: { active: boolean }) {
  const { rules, createRule, deleteRule, selectedNodeId, setSelectedNodeId } = useAppState();
  const [selectedClassifs, setSelectedClassifs] = useState<Set<string>>(new Set());
  const [selectedVectors, setSelectedVectors] = useState<Set<string>>(new Set());
  const [enforcement, setEnforcement] = useState<Enforcement>('block');
  const [desc, setDesc] = useState('');

  const toggleClassif = (id: string) => {
    setSelectedClassifs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleVector = (id: string) => {
    setSelectedVectors(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const namePreview = (() => {
    if (!selectedClassifs.size || !selectedVectors.size) return '—';
    const classifPart = selectedClassifs.size === 1
      ? PRESETS.find(p => p.id === [...selectedClassifs][0])?.name || 'Unknown'
      : 'MultiClassification';
    const vecPart = selectedVectors.size === 1
      ? VECTORS.find(v => v.id === [...selectedVectors][0])?.short || 'Unknown'
      : 'MultiChannel';
    const resp = enforcement === 'block' ? 'Block' : enforcement === 'monitor' ? 'Monitor' : 'Log';
    return `DLP-${vecPart}-${classifPart}-${resp}`;
  })();

  const handleCreate = () => {
    if (!selectedClassifs.size) { alert('Select at least one classification.'); return; }
    if (!selectedVectors.size) { alert('Select at least one vector.'); return; }
    createRule([...selectedClassifs], [...selectedVectors], enforcement, desc.trim());
    setSelectedClassifs(new Set());
    setSelectedVectors(new Set());
    setDesc('');
  };

  const highlightRule = (id: string) => {
    setSelectedNodeId(selectedNodeId === id ? null : id);
  };

  const recentRules = rules.slice(-5).reverse();

  return (
    <div className={`tab-panel${active ? ' active' : ''}`} id="tab-rules">
      <p className="shead">Create rule</p>

      <div className="fg">
        <label className="fl">Classifications <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(select one or more)</span></label>
        <div className="chip-grid">
          {PRESETS.map(p => (
            <div key={p.id} className={`chip${selectedClassifs.has(p.id) ? ' sel' : ''}`} onClick={() => toggleClassif(p.id)}>
              <div className="cdot" />{p.name}
            </div>
          ))}
        </div>
      </div>

      <div className="fg">
        <label className="fl">Response</label>
        <div className="enf-row">
          {(['block', 'monitor', 'log'] as Enforcement[]).map(e => (
            <div key={e} className={`enf-btn${enforcement === e ? ' on-' + e : ''}`} onClick={() => setEnforcement(e)}>
              {e}
            </div>
          ))}
        </div>
      </div>

      <div className="fg">
        <label className="fl">Vectors covered</label>
        <div className="chip-grid">
          {VECTORS.map(v => (
            <div key={v.id} className={`chip${selectedVectors.has(v.id) ? ' sel' : ''}`} onClick={() => toggleVector(v.id)}>
              <div className="cdot" />{v.icon} {v.short}
            </div>
          ))}
        </div>
      </div>

      <div className="fg">
        <label className="fl">Rule name <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(auto-generated)</span></label>
        <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 4, padding: '6px 8px', fontSize: 11, fontFamily: 'var(--font)', color: 'var(--accent)' }}>{namePreview}</div>
      </div>

      <div className="fg">
        <label className="fl">Notes (optional)</label>
        <input className="fi" type="text" placeholder="Tool, policy name, or notes" value={desc} onChange={e => setDesc(e.target.value)} />
      </div>

      <button className="create-btn" onClick={handleCreate}>+ Create Rule</button>

      <div style={{ marginTop: 16 }}>
        <p className="shead">Recent rules <span style={{ color: 'var(--accent)', marginLeft: 3 }}>{rules.length}</span></p>
        {!rules.length ? (
          <p className="rules-empty">No rules yet.</p>
        ) : (
          recentRules.map(r => (
            <div key={r.id} className={`rule-item${selectedNodeId === r.id ? ' hl' : ''}`} onClick={() => highlightRule(r.id)}>
              <div className="ri">
                <div className="rn" title={r.name}>{r.name}</div>
                <div className="rm">
                  {(r.classifIds || [r.classifId]).map(id => PRESETS.find(p => p.id === id)?.name || id).join(', ')} ·{' '}
                  <span className={`rtag rtag-${r.enforcement === 'block' ? 'block' : r.enforcement === 'monitor' ? 'monitor' : 'alert'}`}>{r.enforcement}</span>
                </div>
                <div className="rtags">
                  {r.vectors.map(vid => (
                    <span key={vid} className="rtag">{VECTORS.find(v => v.id === vid)?.short || vid}</span>
                  ))}
                  {r.desc && <span className="rtag" style={{ color: 'var(--text3)', fontStyle: 'italic' }}>{r.desc}</span>}
                </div>
              </div>
              <button className="del-btn" onClick={e => { e.stopPropagation(); deleteRule(r.id); }} title="Delete">✕</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
