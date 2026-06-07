import { useState } from 'react';
import { useAppState } from '../context/AppContext';
import { PRESETS, RISK_LEVELS } from '../data/presets';
import { VECTORS } from '../data/vectors';
import { ruleCount, covColor, pipClass } from '../utils/coverage';

export function ClassesTab({ active }: { active: boolean }) {
  const { rules, riskOverrides, setRiskOverride } = useAppState();
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  const toggleCard = (id: string) => {
    setOpenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className={`tab-panel${active ? ' active' : ''}`} id="tab-classify">
      <p className="shead">Coverage by classification</p>
      {PRESETS.map(p => {
        const risk = riskOverrides[p.id] || p.risk;
        const isOverridden = !!riskOverrides[p.id];
        const open = openIds.has(p.id);

        return (
          <div key={p.id} className={`ccard${open ? ' open' : ''}`}>
            <div className="ccard-hdr" onClick={() => toggleCard(p.id)}>
              <span className="ccard-name">{p.name}</span>
              <span className={`rbadge rb-${risk}`}>{risk}{isOverridden ? ' *' : ''}</span>
              <span className="chev">▶</span>
            </div>
            <div className="ccard-pips">
              {VECTORS.map(v => (
                <div key={v.id} className={`pip ${pipClass(ruleCount(p.id, v.id, rules))}`} title={`${v.short}: ${ruleCount(p.id, v.id, rules)} rules`} />
              ))}
            </div>
            <div className="ccard-body">
              <p className="cdesc">{p.desc}</p>
              <p className="cexamples">e.g. {p.examples}</p>
              <div className="risk-row">
                <span className="risk-row-lbl">Criticality</span>
                {RISK_LEVELS.map(r => (
                  <button
                    key={r}
                    className={`risk-btn rb-${r}${risk === r ? ' on' : ''}`}
                    onClick={() => setRiskOverride(p.id, r)}
                  >
                    {r}
                  </button>
                ))}
                {isOverridden && <span className="risk-override-tag">overridden</span>}
              </div>
              {VECTORS.map(v => {
                const n = ruleCount(p.id, v.id, rules);
                const col = covColor(n);
                const bw = Math.min(n * 50, 100);
                return (
                  <div key={v.id} className="vec-cov-row">
                    <span className="vico">{v.icon}</span>
                    <span className="vname">{v.short}</span>
                    <div style={{ flex: 1, height: 3, background: 'var(--bg4)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${bw}%`, height: '100%', background: col, borderRadius: 2, transition: 'width .3s' }} />
                    </div>
                    <span className="vcov-count" style={{ color: col }}>{n}r</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
