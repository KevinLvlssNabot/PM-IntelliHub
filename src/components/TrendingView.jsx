import React, { useState } from 'react';
import { TRENDING_GAMES } from '../constants.js';

function PlatformToggle({ value, onChange }) {
  const opts = [
    { id: 'both',       label: 'All' },
    { id: 'googleplay', label: 'Google Play' },
    { id: 'appstore',   label: 'App Store' },
  ];
  return (
    <div style={{ display: 'flex', gap: 2, background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-badge)', padding: 3 }}>
      {opts.map(o => {
        const active = value === o.id;
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.04em',
              padding: '4px 12px',
              border: 'none',
              borderRadius: 'var(--radius-badge)',
              background: active ? 'var(--color-bg-secondary)' : 'transparent',
              color: active ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
              cursor: 'pointer',
              transition: 'all 0.15s',
              boxShadow: active ? '0 1px 3px rgba(0,0,0,0.4)' : 'none',
              outline: active ? '1px solid var(--color-border)' : 'none',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function TagChip({ tag }) {
  const isVibe = tag === 'vibe';
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 3,
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      letterSpacing: '0.04em',
      padding: '2px 7px',
      borderRadius: 'var(--radius-badge)',
      background: isVibe ? 'rgba(99,102,241,0.12)' : 'rgba(59,130,246,0.1)',
      color: isVibe ? 'var(--color-accent-hover)' : 'var(--color-info)',
      border: `1px solid ${isVibe ? 'rgba(99,102,241,0.3)' : 'rgba(59,130,246,0.25)'}`,
      whiteSpace: 'nowrap',
    }}>
      {isVibe ? '⚡' : '🔧'} {isVibe ? 'Vibe Coded' : 'Proper Dev'}
    </span>
  );
}

function GameRow({ game, index }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '12px 16px',
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-card)',
        animation: 'slideUp 0.3s ease both',
        animationDelay: `${index * 45}ms`,
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
    >
      {/* Rank */}
      <div style={{
        width: 26,
        flexShrink: 0,
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        fontWeight: 600,
        color: game.rank <= 3 ? 'var(--color-accent-hover)' : 'var(--color-text-tertiary)',
        textAlign: 'center',
      }}>
        {game.rank <= 3 ? `#${game.rank}` : game.rank}
      </div>

      {/* App icon */}
      <div style={{
        width: 42,
        height: 42,
        borderRadius: 10,
        background: game.iconBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: 17,
        color: 'rgba(255,255,255,0.92)',
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}>
        {game.initial}
      </div>

      {/* Name + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {game.name}
          </span>
          {game.fresh && (
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '2px 6px',
              borderRadius: 'var(--radius-badge)',
              background: 'rgba(34,197,94,0.1)',
              color: 'var(--color-success)',
              border: '1px solid rgba(34,197,94,0.25)',
            }}>
              New
            </span>
          )}
          <TagChip tag={game.tag} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-tertiary)' }}>{game.developer}</span>
          <span style={{ color: 'var(--color-text-tertiary)' }}>·</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-tertiary)' }}>{game.genre}</span>
        </div>
      </div>

      {/* Rating + reviews */}
      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-warning)', letterSpacing: '-0.02em' }}>
          ★ {game.rating.toFixed(1)}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 2 }}>{game.reviews} reviews</div>
      </div>
    </div>
  );
}

export function TrendingView() {
  const [platform, setPlatform] = useState('both');

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', marginBottom: 6 }}>
            Market Intelligence
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4 }}>
            Trending Games
          </h3>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-text-tertiary)' }}>
            Top casual & puzzle games by store ranking · updated daily
          </p>
        </div>
        <PlatformToggle value={platform} onChange={setPlatform} />
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-accent-hover)', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', padding: '2px 7px', borderRadius: 'var(--radius-badge)' }}>⚡ Vibe Coded</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-tertiary)' }}>AI-first dev workflow</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-info)', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', padding: '2px 7px', borderRadius: 'var(--radius-badge)' }}>🔧 Proper Dev</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-tertiary)' }}>Traditional engineering</span>
        </div>
      </div>

      {/* Games list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {TRENDING_GAMES.map((game, i) => (
          <GameRow key={game.rank} game={game} index={i} />
        ))}
      </div>

      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-tertiary)', textAlign: 'center', marginTop: 20, letterSpacing: '0.04em' }}>
        Mock data · Live rankings coming soon via App Store Connect & Google Play APIs
      </p>
    </div>
  );
}
