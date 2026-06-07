import { useAppState } from '../context/AppContext';
import { PRESETS } from '../data/presets';
import { VECTORS } from '../data/vectors';

export function StatsBar() {
  const { rules } = useAppState();

  let strong = 0, partial = 0, gaps = 0;
  const total = PRESETS.length * VECTORS.length;

  PRESETS.forEach(p => VECTORS.forEach(v => {
    const n = rules.filter(r => {
      const covers = r.classifIds ? r.classifIds.includes(p.id) : r.classifId === p.id;
      return covers && r.vectors.includes(v.id);
    }).length;
    if (n >= 2) strong++;
    else if (n === 1) partial++;
    else gaps++;
  }));

  const pct = Math.round(((strong + partial * 0.5) / total) * 100);
  const pctColor = pct >= 80 ? 'var(--green)' : pct >= 40 ? 'var(--amber)' : 'var(--red)';

  return (
    <div className="stats-bar">
      <div className="stat">
        <span className="stat-val sv-blue">{rules.length}</span>
        <span className="stat-lbl">Rules</span>
      </div>
      <div className="stat-div" />
      <div className="stat">
        <span className="stat-val sv-green">{strong}</span>
        <span className="stat-lbl">Covered (2+)</span>
      </div>
      <div className="stat">
        <span className="stat-val sv-amber">{partial}</span>
        <span className="stat-lbl">Partial (1)</span>
      </div>
      <div className="stat">
        <span className="stat-val sv-red">{gaps}</span>
        <span className="stat-lbl">Gaps</span>
      </div>
      <div className="stat-div" />
      <div className="stat">
        <span className="stat-val" style={{ color: pctColor }}>{pct}%</span>
        <span className="stat-lbl">Coverage</span>
      </div>
    </div>
  );
}
