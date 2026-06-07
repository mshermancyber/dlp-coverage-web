import { useState, useCallback } from 'react';
import { AppProvider, useAppState } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Toolbar } from './components/Toolbar';
import { OrgBanner } from './components/OrgBanner';
import { StatsBar } from './components/StatsBar';
import { InfoPanel } from './components/InfoPanel';
import { Tooltip } from './components/Tooltip';
import { ThreeGraph } from './components/ThreeGraph';
import './styles/global.css';

function AppContent() {
  const { selectedNodeId, setSelectedNodeId, ruleCount: ruleCountFn, riskOverrides } = useAppState();
  const [tooltipData, setTooltipData] = useState<{
    id: string;
    type: 'classif' | 'vector';
    mouseX: number;
    mouseY: number;
  } | null>(null);

  const [panelNodeType, setPanelNodeType] = useState<'classif' | 'vector' | null>(null);

  const handleSelectNode = useCallback((id: string, type: 'classif' | 'vector') => {
    const newId = selectedNodeId === id ? null : id;
    setSelectedNodeId(newId);
    setPanelNodeType(newId ? type : null);
  }, [selectedNodeId, setSelectedNodeId]);

  const handleHoverNode = useCallback((data: {
    id: string;
    type: 'classif' | 'vector';
    mouseX: number;
    mouseY: number;
  } | null) => {
    setTooltipData(data);
  }, []);

  const handleBackgroundClick = useCallback(() => {
    setSelectedNodeId(null);
    setPanelNodeType(null);
  }, [setSelectedNodeId]);

  const handleClosePanel = useCallback(() => {
    setSelectedNodeId(null);
    setPanelNodeType(null);
  }, [setSelectedNodeId]);

  const tooltipFull = tooltipData ? {
    ...tooltipData,
    riskOverride: tooltipData.type === 'classif' ? riskOverrides[tooltipData.id] : undefined,
    ruleCount: ruleCountFn,
  } : null;

  return (
    <div className="app-layout">
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <Toolbar />
        <OrgBanner />
        <div style={{ flex: 1, position: 'relative' }}>
          <ThreeGraph
            onSelectNode={handleSelectNode}
            onHoverNode={handleHoverNode}
            onBackgroundClick={handleBackgroundClick}
          />
          <InfoPanel
            nodeId={selectedNodeId}
            nodeType={panelNodeType}
            onClose={handleClosePanel}
          />
          <StatsBar />
        </div>
      </div>
      <Tooltip data={tooltipFull} />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
