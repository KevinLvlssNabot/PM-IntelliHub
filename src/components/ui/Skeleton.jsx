import React from 'react';

export function Skeleton({ width = '100%', height = 16, style = {}, borderRadius = 4 }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background: 'var(--color-bg-tertiary)',
        animation: 'pulse 1.5s ease-in-out infinite',
        ...style,
      }}
    />
  );
}

export function SkeletonText({ lines = 3, style = {} }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, ...style }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? '60%' : '100%'} height={14} />
      ))}
    </div>
  );
}

export function SkeletonCard({ style = {} }) {
  return (
    <div
      style={{
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-card)',
        padding: 16,
        ...style,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <Skeleton width={120} height={16} />
        <Skeleton width={50} height={20} borderRadius={4} />
      </div>
      <SkeletonText lines={3} />
    </div>
  );
}
