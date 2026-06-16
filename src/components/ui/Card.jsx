import React from 'react';

export function Card({ children, style = {}, className = '', onClick, hoverable = false }) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      className={className}
      style={{
        background: 'var(--color-bg-secondary)',
        border: `1px solid ${hovered && hoverable ? 'var(--color-accent)' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-card)',
        padding: '16px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        boxShadow: hovered && hoverable ? '0 0 0 1px var(--color-accent)' : 'none',
        ...style,
      }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </div>
  );
}
