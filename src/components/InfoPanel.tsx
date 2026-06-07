import { useAppState } from '../context/AppContext';
import { PRESETS } from '../data/presets';
import { VECTORS } from '../data/vectors';

interface Props {
  nodeId: string | null;
  nodeType: 'classif' | 'vector' | null;
  onClose: () => void;
}

export function InfoPanel({ nodeId, nodeType, onClose }: Props) {
  const { rules, deleteRule, riskOverrides } = useAppState();

  if (!nodeId || !nodeType) {
    return <div className="info-panel" style={{ display: 'none' }} />;
  }

  let title = '';
  let badges: React.ReactNode = null;
  let relatedRules = rules;

  if (nodeType === 'classif') {
    const p = PRESETS.find(x => x.id === nodeId);
    if (!p) return null;
    title = p.name;
    const risk = riskOverrides[p.id] || p.risk;
    badges = <span className={`rbadge rb-${risk}`} style={{ fontSize: 9 }}>{risk}</span>;
    relatedRules = rules.filter(r => (r.classifIds || [r.classifId]).includes(nodeId));
  } else {
    const v = VECTORS.find(x => x.id === nodeId);
    if (!v) return null;
    title = `${v.icon} ${v.label}`;
    badges = <span style={{ fontSize: 9, fontFamily: 'var(--font)', color: 'var(--text3)' }}>{v.sub}</span>;
    relatedRules = rules.filter(r => r.vectors.includes(nodeId));
  }

  return (
    <div className="info-panel visible">
      <div className="ip-header">
        <div className="ip-title">{title}</div>
        <div>{badges}</div>
        <button className="ip-close" onClick={onClose}>✕</button>
      </div>
      <div className="ip-rules-list">
        {!relatedRules.length ? (
          <p className="ip-empty">No rules cover this node yet.</p>
        ) : (
          relatedRules.map(r => {
            const cids = r.classifIds || [r.classifId];
            const classifNames = cids.map(id => PRESETS.find(p => p.id === id)?.name || id).join(', ');
            const ec = r.enforcement === 'block' ? 'var(--green)' : r.enforcement === 'monitor' ? 'var(--amber)' : 'var(--accent)';
            const vLabels = r.vectors.map(vid => VECTORS.find(v => v.id === vid)?.short || vid).join(', ');
            return (
              <div key={r.id} className="ip-rule">
                <div className="ip-rule-name">{r.name}</div>
                <span style={{ fontSize: 9, color: 'var(--text3)' }}>{classifNames}</span>
                <span style={{ fontSize: 9, fontFamily: 'var(--font)', color: ec, marginLeft: 4 }}>{r.enforcement}</span>
                <span style={{ fontSize: 9, color: 'var(--text3)', marginLeft: 4 }}>{vLabels}</span>
                <button className="del-btn" onClick={e => { e.stopPropagation(); deleteRule(r.id); }} style={{ marginLeft: 6 }}>✕</button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
