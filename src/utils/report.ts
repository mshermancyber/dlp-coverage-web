import { PRESETS } from '../data/presets';
import { VECTORS } from '../data/vectors';
import type { Rule, OrgInfo } from '../data/types';
import type { RiskLevel } from '../data/presets';
import { covLevel } from './coverage';

const SAVE_KEY = 'dlp-coverage-map-v3';
const VALID_ENFORCEMENTS = new Set(['block', 'monitor', 'log']);
const VALID_VECTOR_IDS = new Set(VECTORS.map(v => v.id));
const VALID_PRESET_IDS = new Set(PRESETS.map(p => p.id));
const VALID_RISKS = new Set(['critical', 'high', 'medium', 'low']);

interface Store {
  rules: Rule[];
  riskOverrides: Record<string, RiskLevel>;
  orgInfo: OrgInfo;
}

// ── Runtime validation (same rules as AppContext) ──
function isValidRule(r: unknown): r is Rule {
  if (!r || typeof r !== 'object') return false;
  const rule = r as Record<string, unknown>;
  if (typeof rule.id !== 'string' || typeof rule.name !== 'string') return false;
  if (!Array.isArray(rule.vectors) || !rule.vectors.every((v: unknown) => typeof v === 'string' && VALID_VECTOR_IDS.has(v))) return false;
  if (typeof rule.enforcement !== 'string' || !VALID_ENFORCEMENTS.has(rule.enforcement)) return false;
  if (typeof rule.desc !== 'string') return false;
  if (typeof rule.created !== 'string') return false;
  if (Array.isArray(rule.classifIds)) {
    if (!rule.classifIds.every((c: unknown) => typeof c === 'string' && VALID_PRESET_IDS.has(c))) return false;
  } else if (typeof rule.classifId !== 'string' || !VALID_PRESET_IDS.has(rule.classifId)) {
    return false;
  }
  return true;
}

function isValidOrgInfo(o: unknown): o is OrgInfo {
  if (!o || typeof o !== 'object') return false;
  const org = o as Record<string, unknown>;
  return typeof org.org === 'string' && typeof org.dept === 'string' &&
    typeof org.audience === 'string' && typeof org.analyst === 'string';
}

function validateSaveData(raw: unknown): Store | null {
  if (!raw || typeof raw !== 'object') return null;
  const d = raw as Record<string, unknown>;
  if (!Array.isArray(d.rules) || !d.rules.every(isValidRule)) return null;
  if (d.riskOverrides !== undefined) {
    if (typeof d.riskOverrides !== 'object') return null;
    for (const [, v] of Object.entries(d.riskOverrides as Record<string, unknown>)) {
      if (!VALID_RISKS.has(v as string)) return null;
    }
  }
  if (d.orgInfo !== undefined && !isValidOrgInfo(d.orgInfo)) return null;
  return d as unknown as Store;
}

function getStore(): Store {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return { rules: [], riskOverrides: {}, orgInfo: { org: 'Evil Corp', dept: '', audience: '', analyst: 'Anonymous' } };
  try {
    const parsed = JSON.parse(raw);
    const validated = validateSaveData(parsed);
    if (validated) return validated;
  } catch { /* fall through to defaults */ }
  return { rules: [], riskOverrides: {}, orgInfo: { org: 'Evil Corp', dept: '', audience: '', analyst: 'Anonymous' } };
}

function getRisk(id: string, overrides: Record<string, RiskLevel>): RiskLevel {
  return overrides[id] || PRESETS.find(p => p.id === id)?.risk || 'medium';
}

export function saveWork() {
  const data = getStore();
  const json = JSON.stringify({ version: 'beta3', ...data }, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeOrg = (data.orgInfo.org || 'export')
    .replace(/[^a-zA-Z0-9_.-]/g, '-')   // strip invalid filename chars
    .replace(/\s+/g, '-')
    .toLowerCase();
  a.download = `dlp-coverage-${safeOrg}-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  // Delay revocation long enough for browser to initiate the download
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

export function loadFromFile() {
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = '.json';
  inp.onchange = e => {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const d = JSON.parse(ev.target?.result as string);
        const validated = validateSaveData(d);
        if (validated) {
          localStorage.setItem(SAVE_KEY, JSON.stringify(d));
          window.location.reload();
        } else {
          alert('Invalid or corrupted DLP coverage file. The file must contain valid rules, risk overrides, and org info.');
        }
      } catch { alert('Invalid JSON file.'); }
    };
    reader.readAsText(f);
  };
  inp.click();
}

function esc(s: string) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function ruleCountForPath(pId: string, vId: string, rules: Rule[]): number {
  return rules.filter(r => {
    const covers = r.classifIds ? r.classifIds.includes(pId) : r.classifId === pId;
    return covers && r.vectors.includes(vId);
  }).length;
}

export function exportReport() {
  const { rules, riskOverrides, orgInfo } = getStore();
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  let ts = 0, tp = 0, tg = 0;
  const mRows = PRESETS.map(p => {
    const risk = getRisk(p.id, riskOverrides);
    const rBg = risk === 'critical' ? '#fde8e8' : risk === 'high' ? '#fef3e2' : risk === 'medium' ? '#ede8fd' : '#e8fdf3';
    const rTx = risk === 'critical' ? '#b91c1c' : risk === 'high' ? '#92400e' : risk === 'medium' ? '#5b21b6' : '#065f46';
    const cells = VECTORS.map(v => {
      const n = ruleCountForPath(p.id, v.id, rules);
      const lv = covLevel(n);
      if (lv === 'strong') ts++; else if (lv === 'partial') tp++; else tg++;
      const bg = lv === 'strong' ? '#d1fae5' : lv === 'partial' ? '#fef3c7' : '#fee2e2';
      const fg = lv === 'strong' ? '#065f46' : lv === 'partial' ? '#92400e' : '#991b1b';
      return `<td style="text-align:center;background:${bg};color:${fg};font-weight:700;font-size:11px;padding:5px 3px;border:1px solid #e5e7eb">${n || '✗'}</td>`;
    }).join('');
    return `<tr><td style="padding:6px 10px;font-weight:600;font-size:11px;border:1px solid #e5e7eb;white-space:nowrap">${esc(p.name)}</td>
      <td style="padding:5px 8px;text-align:center;border:1px solid #e5e7eb"><span style="font-size:9px;padding:2px 5px;border-radius:3px;background:${rBg};color:${rTx};font-weight:700;text-transform:uppercase">${esc(risk)}</span></td>${cells}</tr>`;
  }).join('');

  const tot = PRESETS.length * VECTORS.length;
  const pct = Math.round(((ts + tp * 0.5) / tot) * 100);
  const pCol = pct >= 80 ? '#065f46' : pct >= 40 ? '#92400e' : '#991b1b';
  const pBg = pct >= 80 ? '#d1fae5' : pct >= 40 ? '#fef3c7' : '#fee2e2';

  const sortedGaps: { p: typeof PRESETS[0]; v: typeof VECTORS[0]; risk: string }[] = [];
  PRESETS.forEach(p => VECTORS.forEach(v => {
    if (ruleCountForPath(p.id, v.id, rules) === 0) {
      sortedGaps.push({ p, v, risk: getRisk(p.id, riskOverrides) });
    }
  }));
  const riskO: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  sortedGaps.sort((a, b) => (riskO[a.risk] ?? 99) - (riskO[b.risk] ?? 99));

  const gRows = sortedGaps.length ? sortedGaps.map((g, i) => {
    const rc = g.risk === 'critical' ? '#b91c1c' : g.risk === 'high' ? '#92400e' : g.risk === 'medium' ? '#5b21b6' : '#065f46';
    const rbg = g.risk === 'critical' ? '#fde8e8' : g.risk === 'high' ? '#fef3e2' : g.risk === 'medium' ? '#ede8fd' : '#e8fdf3';
    return `<tr style="background:${i % 2 ? '#f9fafb' : '#fff'}">
      <td style="padding:6px 10px;font-weight:600;font-size:11px;border:1px solid #e5e7eb">${esc(g.p.name)}</td>
      <td style="padding:5px 8px;border:1px solid #e5e7eb"><span style="font-size:9px;padding:2px 5px;border-radius:3px;background:${rbg};color:${rc};font-weight:700;text-transform:uppercase">${esc(g.risk)}</span></td>
      <td style="padding:6px 10px;font-size:11px;border:1px solid #e5e7eb">${esc(g.v.label)}</td>
      <td style="padding:6px 10px;font-size:11px;color:#991b1b;font-weight:600;border:1px solid #e5e7eb">No rules defined</td>
    </tr>`;
  }).join('') : `<tr><td colspan="4" style="padding:12px;text-align:center;color:#6b7280;font-style:italic;border:1px solid #e5e7eb">No gaps — all paths covered.</td></tr>`;

  const rRows = rules.length ? rules.map((r: Rule, i: number) => {
    const cids = r.classifIds || [r.classifId];
    const classifNames = cids.map((id: string) => esc(PRESETS.find(p => p.id === id)?.name || id)).join(', ');
    const vecs = r.vectors.map((vid: string) => esc(VECTORS.find(v => v.id === vid)?.short || vid)).join(', ');
    const enfLabel = r.enforcement === 'block' ? 'Block' : r.enforcement === 'monitor' ? 'Monitor' : 'Log';
    const eBg = r.enforcement === 'block' ? '#d1fae5' : r.enforcement === 'monitor' ? '#fef3c7' : '#dbeafe';
    const eTx = r.enforcement === 'block' ? '#065f46' : r.enforcement === 'monitor' ? '#92400e' : '#1e40af';
    return `<tr style="background:${i % 2 ? '#f9fafb' : '#fff'}">
      <td style="padding:6px 10px;font-weight:600;font-size:11px;border:1px solid #e5e7eb">${esc(r.name)}</td>
      <td style="padding:6px 10px;font-size:11px;border:1px solid #e5e7eb">${classifNames}</td>
      <td style="padding:5px 8px;text-align:center;border:1px solid #e5e7eb"><span style="font-size:9px;padding:2px 5px;border-radius:3px;background:${eBg};color:${eTx};font-weight:700;text-transform:uppercase">${enfLabel}</span></td>
      <td style="padding:6px 10px;font-size:11px;color:#374151;border:1px solid #e5e7eb">${vecs}</td>
      <td style="padding:6px 10px;font-size:11px;color:#6b7280;border:1px solid #e5e7eb">${esc(r.desc || '—')}</td>
    </tr>`;
  }).join('') : `<tr><td colspan="5" style="padding:12px;text-align:center;color:#6b7280;font-style:italic;border:1px solid #e5e7eb">No rules defined.</td></tr>`;

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<title>DLP Coverage Report${orgInfo.org ? ' — ' + esc(orgInfo.org) : ''} — ${dateStr}</title>
<style>
@page{size:A4;margin:18mm 16mm}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,'Segoe UI',system-ui,sans-serif;font-size:11pt;color:#111827;background:#fff;line-height:1.5}
.screen-only{display:block}@media print{.screen-only{display:none!important}}
.print-bar{position:fixed;top:0;left:0;right:0;z-index:100;background:#1e293b;color:#f1f5f9;padding:9px 22px;display:flex;align-items:center;gap:10px;font-size:12px;font-family:monospace;box-shadow:0 2px 8px rgba(0,0,0,.3)}
.print-btn{margin-left:auto;padding:6px 16px;border-radius:4px;background:#3b82f6;color:#fff;border:none;font-size:12px;font-weight:600;cursor:pointer}
.print-btn:hover{background:#2563eb}
.page{padding:52px 32px 32px}@media print{.page{padding:0}}
.rpt-hdr{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:6px;padding-bottom:12px;border-bottom:3px solid #1e293b}
.org-name{font-size:18pt;font-weight:800;color:#0f172a;line-height:1.1;margin-bottom:2px}
.org-dept{font-size:10pt;color:#374151;margin-bottom:1px}
.org-meta{font-size:9pt;color:#6b7280}
.rpt-title{font-size:11pt;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px}
.rpt-sub{font-size:9pt;color:#6b7280;font-family:monospace;margin-top:5px}
.cov-big{font-size:32pt;font-weight:900;color:${pCol};background:${pBg};padding:7px 14px;border-radius:7px;display:inline-block;font-family:monospace;line-height:1}
.cov-lbl{font-size:8pt;color:#6b7280;text-align:center;margin-top:2px;font-family:monospace;text-transform:uppercase;letter-spacing:.06em}
.kpi-row{display:flex;gap:8px;margin:14px 0}
.kpi{flex:1;border:1.5px solid #e5e7eb;border-radius:7px;padding:9px 10px;text-align:center}
.kpi-val{font-size:20pt;font-weight:800;font-family:monospace;line-height:1.1}
.kpi-lbl{font-size:8pt;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;font-family:monospace;margin-top:1px}
h2{font-size:10pt;font-weight:700;color:#0f172a;text-transform:uppercase;letter-spacing:.07em;margin:20px 0 7px;padding-bottom:4px;border-bottom:1.5px solid #e5e7eb}
.section{margin-bottom:22px;page-break-inside:avoid}
.rules-section{page-break-before:always}
.legend{display:flex;gap:14px;margin-bottom:7px;flex-wrap:wrap}
.leg-item{display:flex;align-items:center;gap:4px;font-size:9pt;color:#374151}
.leg-swatch{width:12px;height:8px;border-radius:2px;flex-shrink:0;border:1px solid rgba(0,0,0,.08)}
table{width:100%;border-collapse:collapse;font-size:10pt}
th{padding:5px 8px;text-align:left;font-size:8pt;font-family:monospace;color:#374151;text-transform:uppercase;letter-spacing:.06em;background:#f1f5f9;border:1px solid #e5e7eb;font-weight:700}
.tc{text-align:center!important}
.rpt-footer{margin-top:28px;padding-top:9px;border-top:1px solid #e5e7eb;font-size:8pt;color:#9ca3af;font-family:monospace;display:flex;justify-content:space-between}
</style></head><body>
<div class="print-bar screen-only">
  <strong>${orgInfo.org ? esc(orgInfo.org) + ' · ' : ''}DLP Coverage Report</strong>
  <span style="color:#94a3b8;font-size:10px">· ${dateStr} · ${rules.length} rules · ${pct}% coverage</span>
  <button class="print-btn" onclick="window.print()">🖨 Print / Save as PDF</button>
</div>
<div class="page">
  <div class="rpt-hdr">
    <div>
      <div class="rpt-title">DLP Coverage Report</div>
      ${orgInfo.org ? `<div class="org-name">${esc(orgInfo.org)}</div>` : ''}
      ${orgInfo.dept ? `<div class="org-dept">${esc(orgInfo.dept)}</div>` : ''}
      ${orgInfo.audience ? `<div class="org-meta">Prepared for: ${esc(orgInfo.audience)}</div>` : ''}
      ${orgInfo.analyst ? `<div class="org-meta">Analyst: ${esc(orgInfo.analyst)}</div>` : ''}
      <div class="rpt-sub">Generated ${dateStr} at ${timeStr} · DLP Coverage Web BETA 3</div>
    </div>
    <div style="text-align:right;flex-shrink:0;margin-left:20px">
      <div class="cov-big">${pct}%</div><div class="cov-lbl">Coverage score</div>
    </div>
  </div>
  <div class="kpi-row">
    <div class="kpi" style="border-color:#bfdbfe"><div class="kpi-val" style="color:#1d4ed8">${rules.length}</div><div class="kpi-lbl">Total rules</div></div>
    <div class="kpi" style="border-color:#6ee7b7"><div class="kpi-val" style="color:#065f46">${ts}</div><div class="kpi-lbl">Strong (2+)</div></div>
    <div class="kpi" style="border-color:#fde68a"><div class="kpi-val" style="color:#92400e">${tp}</div><div class="kpi-lbl">Partial (1)</div></div>
    <div class="kpi" style="border-color:#fca5a5"><div class="kpi-val" style="color:#991b1b">${tg}</div><div class="kpi-lbl">Gaps (0)</div></div>
    <div class="kpi" style="border-color:#e5e7eb"><div class="kpi-val" style="color:#374151">${tot}</div><div class="kpi-lbl">Total paths</div></div>
  </div>
  <div class="section">
    <h2>Coverage matrix</h2>
    <div class="legend">
      <div class="leg-item"><div class="leg-swatch" style="background:#d1fae5"></div>Covered — 2+ rules</div>
      <div class="leg-item"><div class="leg-swatch" style="background:#fef3c7"></div>Partial — 1 rule</div>
      <div class="leg-item"><div class="leg-swatch" style="background:#fee2e2"></div>Gap — no rules</div>
    </div>
    <table><thead><tr><th>Classification</th><th class="tc">Risk</th>${VECTORS.map(v => `<th class="tc" style="font-size:7pt">${esc(v.short)}</th>`).join('')}</tr></thead>
    <tbody>${mRows}</tbody></table>
  </div>
  <div class="section">
    <h2>Priority gaps</h2>
    <table><thead><tr><th>Classification</th><th>Risk</th><th>Vector</th><th>Status</th></tr></thead><tbody>${gRows}</tbody></table>
  </div>
  <div class="section rules-section">
    <h2>All defined rules (${rules.length})</h2>
    <table><thead><tr><th>Rule name</th><th>Classification</th><th class="tc">Mode</th><th>Vectors</th><th>Notes</th></tr></thead><tbody>${rRows}</tbody></table>
  </div>
  <div class="rpt-footer">
    <span>${orgInfo.org ? esc(orgInfo.org) + ' · ' : ''}DLP Coverage Web BETA 3</span>
    <span>${rules.length} rules · ${PRESETS.length} classifications · ${VECTORS.length} vectors · ${dateStr}</span>
  </div>
</div>
<script>window.addEventListener('load',()=>{if(new URLSearchParams(location.search).get('autoprint')==='1')setTimeout(()=>window.print(),400);});</${'script'}
</body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, '_blank');
  if (w) {
    // Check if already loaded (no race); otherwise listen for load
    if (w.document.readyState === 'complete') {
      URL.revokeObjectURL(url);
    } else {
      w.addEventListener('load', () => URL.revokeObjectURL(url), { once: true });
    }
  } else {
    // Popup blocked — revoke after a delay long enough for user to unblock
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
}
