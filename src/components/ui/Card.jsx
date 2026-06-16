import React from 'react';

export function Card({ children, style, className, accent }) {
  return (
    <div
      className={className}
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid ${accent ? 'rgba(200,255,87,0.2)' : 'var(--border)'}`,
        borderRadius: 'var(--r-lg)',
        padding: '20px 22px',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
