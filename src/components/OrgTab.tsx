import { useState, useEffect } from 'react';
import { useAppState } from '../context/AppContext';
import type { OrgInfo } from '../data/types';

export function OrgTab({ active }: { active: boolean }) {
  const { orgInfo, setOrgInfo } = useAppState();
  const [form, setForm] = useState<OrgInfo>(orgInfo);

  useEffect(() => { setForm(orgInfo); }, [orgInfo]);

  const update = (field: keyof OrgInfo, value: string) => {
    const next = { ...form, [field]: value };
    setForm(next);
    setOrgInfo(next);
  };

  const hasAny = form.org || form.dept || form.audience || form.analyst;

  return (
    <div className={`tab-panel${active ? ' active' : ''}`} id="tab-org">
      <p className="shead">Organization information</p>
      <p style={{ fontSize: 10, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 12 }}>
        Appears above the map and in the report.
      </p>
      <div className="fg">
        <label className="fl">Organization name</label>
        <input className="fi" type="text" placeholder="e.g. Federal Reserve Bank of New York" value={form.org} onChange={e => update('org', e.target.value)} />
      </div>
      <div className="fg">
        <label className="fl">Department / Business unit</label>
        <input className="fi" type="text" placeholder="e.g. Cybersecurity · DLP Program" value={form.dept} onChange={e => update('dept', e.target.value)} />
      </div>
      <div className="fg">
        <label className="fl">Audience</label>
        <input className="fi" type="text" placeholder="e.g. CISO, Security Leadership" value={form.audience} onChange={e => update('audience', e.target.value)} />
      </div>
      <div className="fg">
        <label className="fl">Analyst / Author</label>
        <input className="fi" type="text" placeholder="e.g. J. Smith, Sr. Security Analyst" value={form.analyst} onChange={e => update('analyst', e.target.value)} />
      </div>
      <div className="org-preview-box">
        <p className="shead" style={{ marginBottom: 6 }}>Preview</p>
        {hasAny ? (
          <>
            {form.org && <div><strong style={{ color: 'var(--text)' }}>{form.org}</strong></div>}
            {form.dept && <div>{form.dept}</div>}
            {form.audience && <div style={{ color: 'var(--text3)' }}>Audience: {form.audience}</div>}
            {form.analyst && <div style={{ color: 'var(--text3)' }}>Analyst: {form.analyst}</div>}
          </>
        ) : (
          <span style={{ color: 'var(--text3)' }}>Fill in the fields above.</span>
        )}
      </div>
    </div>
  );
}
