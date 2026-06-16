import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useClaude } from '../hooks/useClaude.js';
import { fetchAppStoreTrending, fetchGooglePlayTrending } from '../utils/trendingGames.js';
import { Card } from './ui/Card.jsx';
import { Badge } from './ui/Badge.jsx';
import { Button } from './ui/Button.jsx';
import { Skeleton } from './ui/Skeleton.jsx';

const PLATFORMS = [
  { id: 'ios',     label: 'App Store',   emoji: '🍎' },
  { id: 'android', label: 'Google Play', emoji: '▶' },
];

function SectionLabel({ children }) {
  return (
    <div style={{
      fontFamily: 'var(--font-mono)',
      fontSize: 9,
      fontWeight: 600,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'var(--text-3)',
      marginBottom: 14,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    }}>
      <span style={{ flexShrink: 0 }}>{children}</span>
      <span style={{ height: 1, background: 'var(--border)', flex: 1 }} />
    </div>
  );
}

function fmtCount(n) {
  if (n == null) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${Math.round(n / 1_000)}k`;
  return String(n);
}

function fmtDate(dateStr) {
  if (!dateStr) return null;
  try {
    return new Date(`${dateStr}T12:00:00Z`).toLocaleDateString('en', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function isRecent(dateStr, days = 14) {
  if (!dateStr) return false;
  const ms = new Date(`${dateStr}T12:00:00Z`).getTime();
  return !isNaN(ms) && ms >= Date.now() - days * 86_400_000;
}

function GameRow({ game, index }) {
  const fresh    = isRecent(game.releaseDate, 14);
  const topThree = game.rank <= 3;

  return (
    <div
      className="animate-slide-up"
      style={{
        animationDelay: `${index * 35}ms`,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '11px 14px',
        background: 'var(--bg-elevated)',
        borderRadius: 'var(--r-md)',
        marginBottom: 6,
        cursor: game.storeUrl ? 'pointer' : 'default',
        transition: 'background 0.15s',
      }}
      onClick={() => game.storeUrl && window.open(game.storeUrl, '_blank', 'noopener')}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; }}
    >
      {/* Rank */}
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 15,
        fontWeight: 700,
        color: topThree ? 'var(--accent)' : 'var(--text-3)',
        width: 30,
        textAlign: 'center',
        flexShrink: 0,
      }}>
        {game.rank}
      </div>

      {/* Icon */}
      {game.icon ? (
        <img
          src={game.icon}
          alt=""
          width={40}
          height={40}
          style={{ borderRadius: 10, flexShrink: 0, objectFit: 'cover', border: '1px solid var(--border)' }}
          onError={e => { e.currentTarget.style.display = 'none'; }}
        />
      ) : (
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
        }}>
          🎮
        </div>
      )}

      {/* Name / developer / description */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2, flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: 'var(--font-ui)',
            fontWeight: 600,
            fontSize: 13,
            color: 'var(--text-1)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: 230,
          }}>
            {game.name}
          </span>
          {fresh && <Badge variant="live" dot>New</Badge>}
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--text-3)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          marginBottom: game.description ? 3 : 0,
        }}>
          {game.developer}
        </div>
        {game.description && (
          <div style={{
            fontSize: 11,
            color: 'var(--text-2)',
            lineHeight: 1.45,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>
            {game.description}
          </div>
        )}
      </div>

      {/* Stats column */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
        <Badge variant="neutral">{game.genre}</Badge>
        {game.rating != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--warn)' }}>
              ★ {game.rating.toFixed(1)}
            </span>
            {game.reviewCount != null && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-3)' }}>
                {fmtCount(game.reviewCount)}
              </span>
            )}
          </div>
        )}
        {game.releaseDate && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.04em' }}>
            {fmtDate(game.releaseDate)}
          </span>
        )}
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '11px 14px',
      background: 'var(--bg-elevated)',
      borderRadius: 'var(--r-md)',
      marginBottom: 6,
    }}>
      <Skeleton width={30} height={16} />
      <Skeleton width={40} height={40} style={{ borderRadius: 10, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <Skeleton width={150} height={13} style={{ marginBottom: 6 }} />
        <Skeleton width={90} height={10} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
        <Skeleton width={64} height={20} />
        <Skeleton width={42} height={11} />
        <Skeleton width={54} height={9} />
      </div>
    </div>
  );
}

export function TrendingGamesView({ settings, onOpenSettings }) {
  const { callClaude, parseJSON } = useClaude(settings);
  const [platform, setPlatform]   = useState('ios');
  const [gameData, setGameData]   = useState({ ios: null, android: null });
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [refreshedAt, setRefreshedAt] = useState(null);

  // Track which platforms have been loaded to avoid duplicate fetches
  const loadedRef = useRef(new Set());

  const fetchPlatform = useCallback(async (p, force = false) => {
    if (!force && loadedRef.current.has(p)) return;
    setLoading(true);
    setError(null);
    try {
      let games;
      if (p === 'ios') {
        games = await fetchAppStoreTrending(10);
      } else {
        if (!settings?.anthropicKey) {
          throw new Error('An Anthropic API key is required to generate Google Play market analysis. Add it in Settings.');
        }
        games = await fetchGooglePlayTrending(callClaude, parseJSON, 10);
      }
      loadedRef.current.add(p);
      setGameData(prev => ({ ...prev, [p]: games }));
      setRefreshedAt(new Date());
    } catch (err) {
      setError(err.message || 'Failed to load trending games');
    } finally {
      setLoading(false);
    }
  }, [settings, callClaude, parseJSON]);

  useEffect(() => { fetchPlatform('ios'); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePlatformSwitch = (p) => {
    setPlatform(p);
    setError(null);
    fetchPlatform(p);
  };

  const handleRefresh = () => {
    loadedRef.current.delete(platform);
    fetchPlatform(platform, true);
  };

  const games    = gameData[platform];
  const isLive   = platform === 'ios';
  const hasGames = games && games.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--text-3)',
            marginBottom: 6,
          }}>
            Market Intelligence
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: 28,
            color: 'var(--text-1)',
            lineHeight: 1.1,
            marginBottom: 8,
          }}>
            Trending Games
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Badge variant={isLive ? 'ok' : 'medium'} dot>
              {isLive ? 'Live · iTunes Charts' : 'AI Market Analysis'}
            </Badge>
            {refreshedAt && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)' }}>
                refreshed {refreshedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleRefresh}
          loading={loading && !!games}
        >
          {loading && !!games ? 'Refreshing…' : <><span style={{ display: 'inline-block' }}>↻</span> Refresh</>}
        </Button>
      </div>

      {/* Platform switcher */}
      <div style={{
        display: 'flex',
        gap: 4,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        padding: 4,
        width: 'fit-content',
      }}>
        {PLATFORMS.map(tab => {
          const active = platform === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handlePlatformSwitch(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '6px 18px',
                borderRadius: 'var(--r-md)',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-ui)',
                fontSize: 12,
                fontWeight: active ? 600 : 400,
                transition: 'all 0.15s',
                background: active ? 'var(--bg-elevated)' : 'transparent',
                color: active ? 'var(--text-1)' : 'var(--text-3)',
                boxShadow: active ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
              }}
            >
              <span style={{ fontSize: 14 }}>{tab.emoji}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Context note */}
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', lineHeight: 1.8 }}>
        {isLive
          ? 'Top casual & puzzle games released in the last 30 days · Ranked by live App Store chart position · Filtered for Play Smart platform fit'
          : "AI-curated shortlist of trending casual & puzzle games on Google Play · Based on Claude's market knowledge · Selections may not reflect real-time rankings"}
      </div>

      {/* Error state */}
      {error && !loading && (
        <div style={{
          background: 'var(--crit-dim)',
          border: '1px solid var(--crit)',
          borderRadius: 'var(--r-lg)',
          padding: '16px 20px',
        }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--crit)',
            marginBottom: 6,
          }}>
            Error loading data
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 12 }}>{error}</div>
          {!settings?.anthropicKey && (
            <Button size="sm" onClick={onOpenSettings}>Open Settings</Button>
          )}
        </div>
      )}

      {/* Loading skeletons */}
      {loading && !games && (
        <Card>
          <SectionLabel>
            Loading top 10 · {platform === 'ios' ? 'App Store' : 'Google Play'}
          </SectionLabel>
          {Array.from({ length: 10 }, (_, i) => <SkeletonRow key={i} />)}
        </Card>
      )}

      {/* Game list */}
      {games && (
        <Card>
          <SectionLabel>
            Top {games.length} · {platform === 'ios' ? 'App Store' : 'Google Play'} · Casual &amp; Puzzle
          </SectionLabel>
          {!hasGames ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--text-3)',
                marginBottom: 8,
              }}>
                No results
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
                No casual or puzzle games found in the last 30 days' top charts.
              </div>
            </div>
          ) : (
            games.map((game, i) => (
              <GameRow key={`${game.platform}-${game.rank}-${i}`} game={game} index={i} />
            ))
          )}
        </Card>
      )}
    </div>
  );
}
