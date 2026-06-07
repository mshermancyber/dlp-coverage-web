import { useAppState } from '../context/AppContext';
import { PRESETS } from '../data/presets';
import { VECTORS } from '../data/vectors';
import { saveWork, loadFromFile, exportReport } from '../utils/report';

export function Toolbar() {
  const { rules } = useAppState();
  let gaps = 0;
  PRESETS.forEach(p => VECTORS.forEach(v => {
    if (!rules.some(r => {
      const covers = r.classifIds ? r.classifIds.includes(p.id) : r.classifId === p.id;
      return covers && r.vectors.includes(v.id);
    })) gaps++;
  }));

  return (
    <div className="toolbar">
      <span className="toolbar-title">3D Gap Map</span>
      <div className="legend">
        <div className="leg-swatch" style={{ background: 'var(--green)' }} /> Covered (2+)
        <div className="leg-swatch" style={{ background: 'var(--amber)' }} /> Partial (1)
        <div className="leg-swatch" style={{ background: 'var(--red)', opacity: 0.7 }} /> Gap (0)
        <div className="leg-dot" style={{ background: 'var(--accent)' }} /> Classification
        <div className="leg-dot" style={{ background: 'var(--teal)' }} /> Vector
      </div>
      <span className="gap-count">Gaps: {gaps}</span>
      <div className="toolbar-actions">
        <button className="toolbar-btn" onClick={saveWork}>💾 Save</button>
        <button className="toolbar-btn" onClick={loadFromFile}>📂 Load</button>
        <button className="toolbar-btn" onClick={exportReport}>📄 Report</button>
      </div>
    </div>
  );
}
