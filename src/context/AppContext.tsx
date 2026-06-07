import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Rule, OrgInfo, SaveData } from '../data/types';
import type { RiskLevel } from '../data/presets';
import { buildRuleName } from '../utils/coverage';

const SAVE_KEY = 'dlp-coverage-map-v3';

interface AppState {
  rules: Rule[];
  riskOverrides: Record<string, RiskLevel>;
  orgInfo: OrgInfo;
  selectedNodeId: string | null;

  // Actions
  createRule: (classifIds: string[], vectors: string[], enforcement: Rule['enforcement'], desc: string) => void;
  deleteRule: (id: string) => void;
  setRiskOverride: (classifId: string, risk: RiskLevel) => void;
  setOrgInfo: (info: OrgInfo) => void;
  setSelectedNodeId: (id: string | null) => void;
  resetAll: () => void;

  // Derived
  getRisk: (id: string) => RiskLevel;
  ruleCount: (classifId: string, vectorId: string) => number;
}

const defaultOrgInfo: OrgInfo = { org: 'Evil Corp', dept: '', audience: '', analyst: 'Anonymous' };

const AppContext = createContext<AppState | null>(null);

// ── Runtime validation for localStorage data ──
const VALID_ENFORCEMENTS = new Set(['block', 'monitor', 'log']);
const VALID_PRESET_IDS = new Set(['pii', 'restricted', 'internal', 'supervisory', 'regulated', 'customer', 'sourcecode']);
const VALID_VECTOR_IDS = new Set(['removable', 'printing', 'clipboard', 'bluetooth', 'email_net', 'email_ep', 'proxy', 'webupload', 'fileshare', 'cloudexfil']);
const VALID_RISKS = new Set(['critical', 'high', 'medium', 'low']);

function isValidRule(r: unknown): r is Rule {
  if (!r || typeof r !== 'object') return false;
  const rule = r as Record<string, unknown>;
  if (typeof rule.id !== 'string' || typeof rule.name !== 'string') return false;
  if (!Array.isArray(rule.vectors) || !rule.vectors.every((v: unknown) => typeof v === 'string' && VALID_VECTOR_IDS.has(v))) return false;
  if (typeof rule.enforcement !== 'string' || !VALID_ENFORCEMENTS.has(rule.enforcement)) return false;
  if (typeof rule.desc !== 'string') return false;
  if (typeof rule.created !== 'string') return false;
  // classifIds can be array or single classifId (legacy)
  if (Array.isArray(rule.classifIds)) {
    if (!rule.classifIds.every((c: unknown) => typeof c === 'string' && VALID_PRESET_IDS.has(c))) return false;
  } else if (typeof rule.classifId !== 'string' || !VALID_PRESET_IDS.has(rule.classifId)) {
    return false;
  }
  return true;
}

function isValidRiskOverrides(o: unknown): o is Record<string, RiskLevel> {
  if (!o || typeof o !== 'object') return false;
  for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
    if (!VALID_PRESET_IDS.has(k) || !VALID_RISKS.has(v as string)) return false;
  }
  return true;
}

function isValidOrgInfo(o: unknown): o is OrgInfo {
  if (!o || typeof o !== 'object') return false;
  const org = o as Record<string, unknown>;
  return typeof org.org === 'string' && typeof org.dept === 'string' &&
    typeof org.audience === 'string' && typeof org.analyst === 'string';
}

function validateSaveData(raw: unknown): SaveData | null {
  if (!raw || typeof raw !== 'object') return null;
  const d = raw as Record<string, unknown>;
  if (typeof d.version !== 'string') return null;
  if (!Array.isArray(d.rules) || !d.rules.every(isValidRule)) return null;
  if (d.riskOverrides !== undefined && !isValidRiskOverrides(d.riskOverrides)) return null;
  if (d.orgInfo !== undefined && !isValidOrgInfo(d.orgInfo)) return null;
  return d as unknown as SaveData;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [rules, setRules] = useState<Rule[]>([]);
  const [riskOverrides, setRiskOverrides] = useState<Record<string, RiskLevel>>({});
  const [orgInfo, setOrgInfo] = useState<OrgInfo>(defaultOrgInfo);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Load from localStorage on mount — with runtime validation
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const validated = validateSaveData(parsed);
        if (validated) {
          if (validated.rules) setRules(validated.rules);
          if (validated.riskOverrides) setRiskOverrides(validated.riskOverrides);
          if (validated.orgInfo) setOrgInfo(validated.orgInfo);
        } else {
          console.warn('DLP Coverage Web: invalid data in localStorage, using defaults');
        }
      }
    } catch { /* ignore — use defaults */ }
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    try {
      const data: SaveData = { version: 'beta3', rules, riskOverrides, orgInfo };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch { /* ignore */ }
  }, [rules, riskOverrides, orgInfo]);

  const createRule = useCallback((
    classifIds: string[],
    vectors: string[],
    enforcement: Rule['enforcement'],
    desc: string,
  ) => {
    const name = buildRuleName(classifIds, vectors, enforcement);
    const newRule: Rule = {
      id: 'r_' + Date.now(),
      name,
      classifIds,
      classifId: classifIds[0],
      vectors,
      enforcement,
      desc,
      created: new Date().toISOString(),
    };
    setRules(prev => [...prev, newRule]);
  }, []);

  const deleteRule = useCallback((id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
    setSelectedNodeId(prev => prev === id ? null : prev);
  }, []);

  const setRiskOverride = useCallback((classifId: string, risk: RiskLevel) => {
    setRiskOverrides(prev => {
      const preset = { pii: 'critical' as RiskLevel, restricted: 'critical' as RiskLevel,
        internal: 'medium' as RiskLevel, supervisory: 'high' as RiskLevel,
        regulated: 'high' as RiskLevel, customer: 'high' as RiskLevel,
        sourcecode: 'high' as RiskLevel }[classifId];
      if (risk === preset) {
        const next = { ...prev };
        delete next[classifId];
        return next;
      }
      return { ...prev, [classifId]: risk };
    });
  }, []);

  const resetAll = useCallback(() => {
    setRules([]);
    setRiskOverrides({});
    setOrgInfo(defaultOrgInfo);
    setSelectedNodeId(null);
  }, []);

  const getRiskFn = useCallback((id: string): RiskLevel => {
    return riskOverrides[id] ||
      { pii: 'critical', restricted: 'critical', internal: 'medium',
        supervisory: 'high', regulated: 'high', customer: 'high',
        sourcecode: 'high' }[id] as RiskLevel || 'medium';
  }, [riskOverrides]);

  const ruleCountFn = useCallback((classifId: string, vectorId: string): number => {
    return rules.filter(r => {
      const covers = r.classifIds ? r.classifIds.includes(classifId) : r.classifId === classifId;
      return covers && r.vectors.includes(vectorId);
    }).length;
  }, [rules]);

  return (
    <AppContext.Provider value={{
      rules, riskOverrides, orgInfo, selectedNodeId,
      createRule, deleteRule, setRiskOverride, setOrgInfo, setSelectedNodeId, resetAll,
      getRisk: getRiskFn, ruleCount: ruleCountFn,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppState(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
}
