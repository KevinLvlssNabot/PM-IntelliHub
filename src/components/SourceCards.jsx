import React from 'react';
import { SOURCES, APPS } from '../constants.js';
import { Card } from './ui/Card.jsx';
import { Badge } from './ui/Badge.jsx';
import { Button } from './ui/Button.jsx';

const APP_SCOPED_SOURCES = new Set(['sentry', 'devtodev', 'appsflyer', 'appstore', 'googleplay']);

function LinearCardContent() {
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginBottom: 6 }}>Live connection</div>
      <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
        Stale ticket data will appear in your Daily Digest. Open the Digest tab to see the full breakdown.
      </div>
    </div>
  );
}

function SourceCard({ source, settings, appLabel, onOpenSettings }) {
  const hasToken = Boolean(settings[source.requiredKey]);
  const showComingSoon = Boolean(source.comingSoon) && !hasToken;
  const isAppScoped = APP_SCOPED_SOURCES.has(source.id);

  return (
    <div style={{ position: 'relative' }}>
      <Card
        style={{
          opacity: showComingSoon ? 0.6 : 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          minHeight: 130,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: source.iconBg || 'var(--color-bg-tertiary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 13,
              color: source.iconColor || 'var(--color-text-secondary)',
              flexShrink: 0,
            }}>
              {source.initial || source.label[0]}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {source.label}
              </div>
              {isAppScoped && appLabel && (
                <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                  for {appLabel}
                </div>
              )}
            </div>
          </div>
          <div style={{ flexShrink: 0 }}>
            {showComingSoon ? (
              <Badge variant="neutral">Coming soon</Badge>
            ) : hasToken ? (
              <Badge variant="ok" dot>Live</Badge>
            ) : (
              <Badge variant="neutral">Not connected</Badge>
            )}
          </div>
        </div>

        {/* Description */}
        {source.description && (
          <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', lineHeight: 1.5 }}>
            {source.description}
          </div>
        )}

        {/* Body */}
        {!showComingSoon && hasToken && source.id === 'linear' && <LinearCardContent />}

        {!showComingSoon && hasToken && source.id !== 'linear' && (
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            Connected. Data will appear in your Daily Digest.
          </div>
        )}

        {!showComingSoon && !hasToken && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end' }}>
            <Button variant="secondary" size="sm" onClick={onOpenSettings}>
              Connect →
            </Button>
          </div>
        )}
      </Card>

      {/* Coming soon overlay */}
      {showComingSoon && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--radius-card)',
            background: 'rgba(0,0,0,0.35)',
            backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0, rgba(255,255,255,0.02) 1px, transparent 0, transparent 50%)',
            backgroundSize: '8px 8px',
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--color-text-tertiary)',
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-badge)',
            }}
          >
            Coming Soon
          </span>
        </div>
      )}
    </div>
  );
}

export function SourceCards({ settings, selectedApp, onOpenSettings }) {
  const sourceList = Object.values(SOURCES);
  const connectedCount = sourceList.filter(s => settings[s.requiredKey]).length;
  const appLabel = APPS.find(a => a.id === selectedApp)?.label ?? selectedApp;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>Data Sources</h3>
          <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)' }}>
            {connectedCount} of {sourceList.filter(s => !s.comingSoon).length} connected
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onOpenSettings}>
          Manage →
        </Button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
          gap: 12,
        }}
      >
        {sourceList.map(source => (
          <SourceCard
            key={source.id}
            source={source}
            settings={settings}
            appLabel={appLabel}
            onOpenSettings={onOpenSettings}
          />
        ))}
      </div>
    </div>
  );
}
