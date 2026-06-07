import type { RiskLevel } from './presets';

export interface Rule {
  id: string;
  name: string;
  classifIds: string[];
  classifId: string; // legacy compat — first element of classifIds
  vectors: string[];
  enforcement: 'block' | 'monitor' | 'log';
  desc: string;
  created: string;
}

export interface OrgInfo {
  org: string;
  dept: string;
  audience: string;
  analyst: string;
}

export interface SaveData {
  version: string;
  rules: Rule[];
  riskOverrides: Record<string, RiskLevel>;
  orgInfo: OrgInfo;
}
