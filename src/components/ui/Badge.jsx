import React from 'react';

const VARIANTS = {
  ok:      { bg: 'var(--ok-dim)',   color: 'var(--ok)',   dot: 'var(--ok)' },
  warning: { bg: 'var(--warn-dim)', color: 'var(--warn)', dot: 'var(--warn)' },
  critical:{ bg: 'var(--crit-dim)', color: 'var(--crit)', dot: 'var(--crit)' },
  high:    { bg: 'var(--crit-dim)', color: 'var(--crit)', dot: 'var(--crit)' },
  urgent:  { bg: 'var(--crit-dim)', color: 'var(--crit)', dot: 'var(--crit)' },
  medium:  { bg: 'var(--info-dim)', color: 'var(--info)', dot: 'var(--info)' },
  low:     { bg: 'rgba(122,132,148,0.12)', color: 'var(--text-2)', dot: 'var(--text-2)' },
  neutral: { bg: 'rgba(122,132,148,0.12)', color: 'var(--text-2)', dot: 'var(--text-2)' },
  live:    { bg: 'var(--accent-dim)', color: 'var(--accent)', dot: 'var(--accent)' },
};

export function Badge({ children, variant = 'neutral', dot = false, style }) {
  const v = VARIANTS[variant] ?? VARIANTS.neutral;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontFamily: 'var(--font-ui)',
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        padding: '3px 7px',
        borderRadius: 'var(--r-sm)',
        background: v.bg,
        color: v.color,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {dot && (
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: v.dot,
            flexShrink: 0,
            animation: variant === 'live' ? 'livePulse 2s ease infinite' : undefined,
          }}
        />
      )}
      {children}
    </span>
  );
}
