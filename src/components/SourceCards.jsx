import React from 'react';
import { SOURCES, APPS } from '../constants.js';
import { Card } from './ui/Card.jsx';
import { Badge } from './ui/Badge.jsx';
import { Button } from './ui/Button.jsx';

function LinearCardContent({ settings }) {
  // Placeholder — real data comes from the digest or a dedicated call
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginBottom: 6 }}>Live connection</div>
      <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
        Stale ticket data will appear in your Daily Digest. Open the Digest tab to see the full breakdown.
      </div>
    </div>
  );
}

// Sources that are per-app (show app context badge)
const APP_SCOPED_SOURCES = new Set(['sentry', 'amplitude', 'appsflyer', 'appstore', 'googleplay']);

function SourceCard({ source, settings, appLabel, onOpenSettings }) {
  const hasToken = Boolean(settings[source.requiredKey]);
  const isComingSoon = Boolean(source.comingSoon);
  const isAppScoped = APP_SCOPED_SOURCES.has(source.id);

  return (
    <div style={{ position: 'relative' }}>
      <Card
        style={{
          opacity: isComingSoon ? 0.6 : 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          minHeight: 130,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>{source.icon}</span>
            <div>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{source.label}</span>
              {isAppScoped && (
                <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 1 }}>
                  for {appLabel}
                </div>
              )}
            </div>
          </div>
          {isComingSoon ? (
            <Badge variant="neutral">Coming soon</Badge>
          ) : hasToken ? (
            <Badge variant="ok" dot>Live</Badge>
          ) : (
            <Badge variant="neutral">Not connected</Badge>
          )}
        </div>

        {/* Description */}
        {source.description && (
          <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>{source.description}</div>
        )}

        {/* Body */}
        {!isComingSoon && hasToken && source.id === 'linear' && (
          <LinearCardContent settings={settings} />
        )}

        {!isComingSoon && hasToken && source.id !== 'linear' && (
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            Connected — data appears in your Daily Digest.
          </div>
        )}

        {!isComingSoon && !hasToken && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end' }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={onOpenSettings}
            >
              Connect →
            </Button>
          </div>
        )}
      </Card>

      {/* Coming soon overlay */}
      {isComingSoon && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--radius-card)',
            background: 'rgba(0,0,0,0.3)',
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              fontSize: 12,
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
  const connectedCount = sourceList.filter(s => settings[s.requiredKey] && !s.comingSoon).length;
  const appLabel = APPS.find(a => a.id === selectedApp)?.label ?? selectedApp;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>Data Sources</h3>
          <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)' }}>
            {connectedCount} of {sourceList.filter(s => !s.comingSoon).length} sources connected
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onOpenSettings}>
          Manage →
        </Button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
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
