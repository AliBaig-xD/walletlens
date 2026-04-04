// ─── Icons ────────────────────────────────────────────────────────────────────

export function TableIcon({ active }: { active: boolean }) {
  const c = active ? "#060c11" : "rgba(160,200,210,0.5)";
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
      <rect x="0" y="0" width="11" height="3" rx="1" fill={c} opacity="0.9" />
      <rect x="0" y="4" width="11" height="3" rx="1" fill={c} opacity="0.6" />
      <rect x="0" y="8" width="11" height="3" rx="1" fill={c} opacity="0.4" />
    </svg>
  );
}

export function GraphIcon({ active }: { active: boolean }) {
  const c = active ? "#060c11" : "rgba(160,200,210,0.5)";
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
      <circle cx="5.5" cy="5.5" r="2" fill={c} />
      <circle cx="1.5" cy="1.5" r="1.2" fill={c} opacity="0.7" />
      <circle cx="9.5" cy="1.5" r="1.2" fill={c} opacity="0.7" />
      <circle cx="1.5" cy="9.5" r="1.2" fill={c} opacity="0.7" />
      <circle cx="9.5" cy="9.5" r="1.2" fill={c} opacity="0.7" />
      <line
        x1="5.5"
        y1="5.5"
        x2="1.5"
        y2="1.5"
        stroke={c}
        strokeWidth="0.8"
        opacity="0.5"
      />
      <line
        x1="5.5"
        y1="5.5"
        x2="9.5"
        y2="1.5"
        stroke={c}
        strokeWidth="0.8"
        opacity="0.5"
      />
      <line
        x1="5.5"
        y1="5.5"
        x2="1.5"
        y2="9.5"
        stroke={c}
        strokeWidth="0.8"
        opacity="0.5"
      />
      <line
        x1="5.5"
        y1="5.5"
        x2="9.5"
        y2="9.5"
        stroke={c}
        strokeWidth="0.8"
        opacity="0.5"
      />
    </svg>
  );
}
