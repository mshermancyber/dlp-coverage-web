import { PRESETS } from '../data/presets';
import { VECTORS } from '../data/vectors';

interface TooltipData {
  id: string;
  type: 'classif' | 'vector';
  mouseX: number;
  mouseY: number;
  riskOverride?: string;
  ruleCount: (classifId: string, vectorId: string) => number;
}

interface Props {
  data: TooltipData | null;
}

export function Tooltip({ data }: Props) {
  if (!data) {
    return <div className="tip" style={{ display: 'none' }} />;
  }

  let content: React.ReactNode;

  if (data.type === 'classif') {
    const p = PRESETS.find(x => x.id === data.id);
    if (!p) return null;
    const risk = data.riskOverride || p.risk;
    let strong = 0, partial = 0, gaps = 0;
    VECTORS.forEach(v => {
      const n = data.ruleCount(data.id, v.id);
      if (n >= 2) strong++;
      else if (n === 1) partial++;
      else gaps++;
    });
    content = (
      <>
        <h4>{p.name} <span className={`rbadge rb-${risk}`} style={{ verticalAlign: 'middle' }}>{risk}</span></h4>
        <p>{strong} covered (2+) · {partial} partial (1) · <span style={{ color: 'var(--red)' }}>{gaps} gaps</span></p>
      </>
    );
  } else {
    const v = VECTORS.find(x => x.id === data.id);
    if (!v) return null;
    const g = PRESETS.filter(p => data.ruleCount(p.id, data.id) === 0).length;
    content = (
      <>
        <h4>{v.icon} {v.label}</h4>
        <p>{v.sub}</p>
        <p style={{ marginTop: 4, color: g ? 'var(--red)' : 'var(--green)' }}>
          {g ? `⚠ ${g} gap${g > 1 ? 's' : ''}` : ' ✓ all covered'}
        </p>
      </>
    );
  }

  let x = data.mouseX + 12;
  let y = data.mouseY - 8;
  // Keep tooltip within viewport
  if (x + 230 > window.innerWidth) x = data.mouseX - 240;
  if (y + 120 > window.innerHeight) y = data.mouseY - 100;

  return (
    <div className="tip visible" style={{ left: x, top: y }}>
      {content}
    </div>
  );
}
