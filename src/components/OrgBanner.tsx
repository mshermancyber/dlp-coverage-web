import { useAppState } from '../context/AppContext';

export function OrgBanner() {
  const { orgInfo } = useAppState();
  const has = orgInfo.org || orgInfo.dept || orgInfo.audience || orgInfo.analyst;
  if (!has) return null;

  return (
    <div className="org-banner">
      {orgInfo.org && <span className="org-banner-name">{orgInfo.org}</span>}
      {orgInfo.dept && <span className="org-banner-dept">{orgInfo.dept}</span>}
      {orgInfo.audience && <span className="org-banner-meta">Audience: {orgInfo.audience}</span>}
      {orgInfo.analyst && <span className="org-banner-meta">Analyst: {orgInfo.analyst}</span>}
    </div>
  );
}
