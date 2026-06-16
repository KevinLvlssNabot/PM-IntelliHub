import React from 'react';

const variants = {
  primary: {
    background: 'var(--color-accent)',
    color: '#fff',
    border: 'none',
    hoverBg: 'var(--color-accent-hover)',
  },
  secondary: {
    background: 'var(--color-bg-tertiary)',
    color: 'var(--color-text-primary)',
    border: '1px solid var(--color-border)',
    hoverBg: '#333',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--color-text-secondary)',
    border: 'none',
    hoverBg: 'var(--color-bg-tertiary)',
  },
  danger: {
    background: 'var(--color-danger)',
    color: '#fff',
    border: 'none',
    hoverBg: '#dc2626',
  },
};

const sizes = {
  sm: { padding: '4px 10px', fontSize: '12px', height: '28px' },
  md: { padding: '7px 14px', fontSize: '14px', height: '36px' },
  lg: { padding: '10px 20px', fontSize: '15px', height: '44px' },
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  style = {},
  type = 'button',
  title,
  ...props
}) {
  const v = variants[variant] || variants.primary;
  const s = sizes[size] || sizes.md;

  const [hovered, setHovered] = React.useState(false);

  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    borderRadius: 'var(--radius-badge)',
    fontWeight: 500,
    lineHeight: 1,
    whiteSpace: 'nowrap',
    userSelect: 'none',
    background: hovered && !disabled ? v.hoverBg : v.background,
    color: v.color,
    border: v.border || 'none',
    ...s,
    ...style,
  };

  return (
    <button
      type={type}
      style={baseStyle}
      disabled={disabled || loading}
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      {...props}
    >
      {loading && (
        <span
          style={{
            display: 'inline-block',
            width: 12,
            height: 12,
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
          }}
        />
      )}
      {children}
    </button>
  );
}
