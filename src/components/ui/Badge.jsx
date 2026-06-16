import React from 'react';

const colorMap = {
  ok:       { bg: 'rgba(34,197,94,0.15)',  color: 'var(--color-success)' },
  success:  { bg: 'rgba(34,197,94,0.15)',  color: 'var(--color-success)' },
  warning:  { bg: 'rgba(245,158,11,0.15)', color: 'var(--color-warning)' },
  critical: { bg: 'rgba(239,68,68,0.15)',  color: 'var(--color-danger)'  },
  danger:   { bg: 'rgba(239,68,68,0.15)',  color: 'var(--color-danger)'  },
  error:    { bg: 'rgba(239,68,68,0.15)',  color: 'var(--color-danger)'  },
  info:     { bg: 'rgba(59,130,246,0.15)', color: 'var(--color-info)'    },
  accent:   { bg: 'rgba(99,102,241,0.15)', color: 'var(--color-accent)'  },
  neutral:  { bg: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' },
  high:     { bg: 'rgba(239,68,68,0.15)',  color: 'var(--color-danger)'  },
  medium:   { bg: 'rgba(245,158,11,0.15)', color: 'var(--color-warning)' },
  low:      { bg: 'rgba(34,197,94,0.15)',  color: 'var(--color-success)' },
  urgent:   { bg: 'rgba(239,68,68,0.2)',   color: '#ff6b6b' },
};

export function Badge({ children, variant = 'neutral', style = {}, dot = false }) {
  const c = colorMap[variant] || colorMap.neutral;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: dot ? 5 : 0,
        padding: '2px 8px',
        borderRadius: 'var(--radius-badge)',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
        background: c.bg,
        color: c.color,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: c.color,
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </span>
  );
}
