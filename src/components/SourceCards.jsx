import React from 'react';
import { SOURCES, APPS } from '../constants.js';
import { Card } from './ui/Card.jsx';
import { Badge } from './ui/Badge.jsx';
import { Button } from './ui/Button.jsx';

function LinearCardContent({ settings }) {
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 6 }}>Live connection</div>
      <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
        Stale ticket data will appear in your Daily Digest. Open the Digest tab to see the full breakdown.
      </div>
    </div>
  );
}

const APP_SCOPED_SOURCES = new Set(['sentry', 'devtodev', 'appsflyer', 'appstore', 'googleplay']);

function SourceCard({ source, settings, appLabel, onOpenSettings }) {
  const hasToken = Boolean(settings[source.requiredKey]);
  const showComingSoon = Boolean(source.comingSoon) && !hasToken;
  const isAppScoped = APP_SCOPED_SOURCES.has(source.id);

  return (
    <div style={{ position: 'relative' }}>
      <Card
        style={{
          opacity: showComingSoon ? 0.5 : 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          minHeight: 130,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 14, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {source.label}
            </div>
            {isAppScoped && (
              <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>
                for {appLabel}
              </div>
            )}
          </div>
          <div style={{ flexShrink: 0 }}>
            {showComingSoon ? (
              <Badge variant="neutral">Coming soon</Badge>
            ) : hasToken ? (
              <Badge variant="live" dot>Live</Badge>
            ) : (
              <Badge variant="neutral">Not connected</Badge>
            )}
          </div>
        </div>

        {/* Description */}
        {source.description && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.05em', color: 'var(--text-3)', lineHeight: 1.5 }}>
            {source.description}
          </div>
        )}

        {/* Body */}
        {!showComingSoon && hasToken && source.id === 'linear' && (
          <LinearCardContent settings={settings} />
        )}

        {!showComingSoon && hasToken && source.id !== 'linear' && (
          <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
            Connected — data appears in your Daily Digest.
          </div>
        )}

        {!showComingSoon && !hasToken && (
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
      {showComingSoon && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--r-lg)',
            background: 'rgba(8,10,14,0.6)',
            backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0, rgba(255,255,255,0.03) 1px, transparent 0, transparent 50%)',
            backgroundSize: '8px 8px',
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--text-3)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              padding: '4px 10px',
              borderRadius: 'var(--r-sm)',
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
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 6 }}>
            Data Sources
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 300, fontSize: 22, color: 'var(--text-1)', marginBottom: 4 }}>
            Integrations
          </h3>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)' }}>
            {connectedCount} / {sourceList.filter(s => !s.comingSoon).length} connected
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
