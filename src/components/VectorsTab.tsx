import { useAppState } from '../context/AppContext';
import { VECTORS } from '../data/vectors';
import { PRESETS } from '../data/presets';
import { ruleCount } from '../utils/coverage';

export function VectorsTab({ active }: { active: boolean }) {
  const { rules } = useAppState();

  return (
    <div className={`tab-panel${active ? ' active' : ''}`} id="tab-vectors">
      <p className="shead">Coverage by vector</p>
      {VECTORS.map(v => {
        const strong = PRESETS.filter(p => ruleCount(p.id, v.id, rules) >= 2);
        const partial = PRESETS.filter(p => ruleCount(p.id, v.id, rules) === 1);
        const gaps = PRESETS.filter(p => ruleCount(p.id, v.id, rules) === 0);
        const status = gaps.length === 0
          ? <span style={{ fontSize: 9, fontFamily: 'var(--font)', color: 'var(--green)' }}>✓ no gaps</span>
          : <span style={{ fontSize: 9, fontFamily: 'var(--font)', color: 'var(--red)' }}>⚠ {gaps.length} gap{gaps.length > 1 ? 's' : ''}</span>;

        return (
          <div key={v.id} className="vdetail">
            <div className="vd-hd">
              <span style={{ fontSize: 12 }}>{v.icon}</span>
              <span className="vd-title">{v.label}</span>
              {status}
            </div>
            <p className="vd-sub">{v.sub}</p>
            <div className="vd-tags">
              {strong.map(p => <span key={p.id} className="vtag vtag-strong">{p.name} ✓</span>)}
              {partial.map(p => <span key={p.id} className="vtag vtag-partial">{p.name} ~</span>)}
              {gaps.map(p => <span key={p.id} className="vtag vtag-gap">{p.name} ✗</span>)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
