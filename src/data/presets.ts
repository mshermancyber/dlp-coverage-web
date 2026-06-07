export type RiskLevel = 'critical' | 'high' | 'medium' | 'low';

export interface Preset {
  id: string;
  name: string;
  risk: RiskLevel;
  desc: string;
  examples: string;
}

export const PRESETS: Preset[] = [
  {
    id: 'pii',
    name: 'PII',
    risk: 'critical',
    desc: 'Personally identifiable information — names, SSN, DOB, addresses, government IDs, biometrics.',
    examples: 'SSN, passport no., DOB, home address',
  },
  {
    id: 'restricted',
    name: 'Restricted',
    risk: 'critical',
    desc: 'Highest sensitivity internal data — board materials, strategic plans, M&A activity.',
    examples: 'Board memos, acquisition targets, roadmaps',
  },
  {
    id: 'internal',
    name: 'Internal Data',
    risk: 'medium',
    desc: 'General internal information not approved for external distribution.',
    examples: 'Org charts, internal wikis, budgets',
  },
  {
    id: 'supervisory',
    name: 'Supervisory',
    risk: 'high',
    desc: 'Data subject to regulatory or supervisory review — MRAs, CSI, exam findings.',
    examples: 'CSI, MRA findings, LISCC materials',
  },
  {
    id: 'regulated',
    name: 'Regulated',
    risk: 'high',
    desc: 'Data governed by regulatory frameworks — MNPI, GLBA, SOX.',
    examples: 'MNPI, GLBA records, SOX controls',
  },
  {
    id: 'customer',
    name: 'Customer Data',
    risk: 'high',
    desc: 'Non-public customer account data, transactions, KYC.',
    examples: 'Account numbers, KYC/AML docs',
  },
  {
    id: 'sourcecode',
    name: 'Source Code',
    risk: 'high',
    desc: 'Proprietary software, algorithms, IaC, security configurations.',
    examples: 'Repos, IaC templates, pipeline configs',
  },
];

export const RISK_LEVELS: RiskLevel[] = ['critical', 'high', 'medium', 'low'];

export const RISK_HEX: Record<RiskLevel, number> = {
  critical: 0xe85555,
  high: 0xe8a43a,
  medium: 0xa78bfa,
  low: 0x3ecf8e,
};

export const RISK_EMISSIVE: Record<RiskLevel, number> = {
  critical: 0x3a0808,
  high: 0x3a2208,
  medium: 0x1a0e3a,
  low: 0x083a20,
};

export const RISK_SPECULAR: Record<RiskLevel, number> = {
  critical: 0xff9999,
  high: 0xffcc88,
  medium: 0xcc99ff,
  low: 0x99ffcc,
};
