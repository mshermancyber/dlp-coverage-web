import { PRESETS, type RiskLevel } from '../data/presets';
import { VECTORS } from '../data/vectors';
import type { Rule } from '../data/types';

const DEFAULT_RISK: RiskLevel = 'medium';

export function getRisk(id: string, riskOverrides: Record<string, RiskLevel>): RiskLevel {
  return riskOverrides[id] || PRESETS.find(p => p.id === id)?.risk || DEFAULT_RISK;
}

export function ruleCount(classifId: string, vectorId: string, rules: Rule[]): number {
  return rules.filter(r => {
    const covers = r.classifIds ? r.classifIds.includes(classifId) : r.classifId === classifId;
    return covers && r.vectors.includes(vectorId);
  }).length;
}

export function covColor(n: number): string {
  return n === 0 ? '#e85555' : n === 1 ? '#e8a43a' : '#3ecf8e';
}

export function covLevel(n: number): 'gap' | 'partial' | 'strong' {
  return n === 0 ? 'gap' : n === 1 ? 'partial' : 'strong';
}

export function pipClass(n: number): string {
  if (n === 0) return 'pip-0';
  if (n === 1) return 'pip-1';
  if (n >= 2) return 'pip-3';
  return 'pip-high';
}

export function buildRuleName(classifIds: string[], vectors: string[], enf: string): string {
  const classifPart = classifIds.length === 1
    ? PRESETS.find(p => p.id === classifIds[0])?.name || 'Unknown'
    : 'MultiClassification';
  const vecPart = vectors.length === 1
    ? VECTORS.find(v => v.id === vectors[0])?.short || 'Unknown'
    : 'MultiChannel';
  const resp = enf === 'block' ? 'Block' : enf === 'monitor' ? 'Monitor' : 'Log';
  return `DLP-${vecPart}-${classifPart}-${resp}`;
}

export function esc(s: string): string {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
