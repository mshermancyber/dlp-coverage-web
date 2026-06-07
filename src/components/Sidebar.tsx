import { useState } from 'react';
import { RulesTab } from './RulesTab';
import { AllRulesTab } from './AllRulesTab';
import { OrgTab } from './OrgTab';
import { ClassesTab } from './ClassesTab';
import { VectorsTab } from './VectorsTab';
import { useAppState } from '../context/AppContext';

const TABS = [
  { key: 'rules', label: 'Rules' },
  { key: 'all-rules', label: 'All Rules' },
  { key: 'org', label: 'Org' },
  { key: 'classify', label: 'Classes' },
  { key: 'vectors', label: 'Vectors' },
] as const;

export function Sidebar() {
  const [activeTab, setActiveTab] = useState<string>('rules');
  const { resetAll } = useAppState();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div>
          <div className="sidebar-title">DLP Coverage Map</div>
          <div className="sidebar-subtitle">Policy Gap Analysis</div>
        </div>
        <button
          className="toolbar-btn"
          style={{ marginLeft: 'auto', fontSize: 9, padding: '3px 8px' }}
          onClick={() => { if (confirm('Reset all rules, overrides, and org info?')) resetAll(); }}
          title="Reset all data"
        >
          ↺ Reset
        </button>
      </div>

      <div className="stabs">
        {TABS.map(t => (
          <div
            key={t.key}
            className={`stab${activeTab === t.key ? ' active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </div>
        ))}
      </div>

      {/* All tabs mounted always — CSS toggles visibility (matches original behavior, preserves state) */}
      <div className="tab-content">
        <RulesTab active={activeTab === 'rules'} />
        <AllRulesTab active={activeTab === 'all-rules'} />
        <OrgTab active={activeTab === 'org'} />
        <ClassesTab active={activeTab === 'classify'} />
        <VectorsTab active={activeTab === 'vectors'} />
      </div>
    </aside>
  );
}
