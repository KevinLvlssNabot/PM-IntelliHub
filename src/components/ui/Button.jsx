import React from 'react';

export function Button({ children, variant = 'primary', size = 'md', onClick, disabled, loading, style, title, type }) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontFamily: 'var(--font-ui)',
    fontWeight: 600,
    letterSpacing: '0.03em',
    border: '1px solid',
    borderRadius: 'var(--r-md)',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.5 : 1,
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
  };

  const sizes = {
    sm: { fontSize: 11, padding: '5px 10px' },
    md: { fontSize: 13, padding: '8px 16px' },
    lg: { fontSize: 15, padding: '10px 22px' },
  };

  const variants = {
    primary:   { background: 'var(--accent)',     borderColor: 'var(--accent)',  color: '#080a0e' },
    secondary: { background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-1)' },
    ghost:     { background: 'transparent',        borderColor: 'transparent',   color: 'var(--text-2)' },
    danger:    { background: 'var(--crit-dim)',    borderColor: 'var(--crit)',   color: 'var(--crit)' },
  };

  return (
    <button
      type={type || 'button'}
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
      style={{ ...base, ...sizes[size] ?? sizes.md, ...variants[variant] ?? variants.secondary, ...style }}
    >
      {loading && (
        <span style={{ width: 10, height: 10, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
      )}
      {children}
    </button>
  );
}
