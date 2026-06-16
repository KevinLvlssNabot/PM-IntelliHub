import React from 'react';

const shimmerStyle = {
  background: 'linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-hover) 50%, var(--bg-elevated) 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.4s ease infinite',
  borderRadius: 'var(--r-sm)',
};

export function Skeleton({ width, height = 12, style }) {
  return (
    <div
      style={{
        ...shimmerStyle,
        width: width ? `${width}px` : '100%',
        height: height,
        ...style,
      }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <Skeleton width={120} height={11} />
      <Skeleton width={220} height={15} />
      <Skeleton width={180} height={11} />
    </div>
  );
}
