import React from 'react';
import { APPS } from '../constants.js';
import { Button } from './ui/Button.jsx';

function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export function Layout({ children, selectedApp, onSelectApp, activeTab, onSelectTab, onOpenSettings }) {
  const platformIcon = {
    android: '🤖',
    ios: '🍎',
    both: '📱',
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--color-bg-primary)',
      }}
    >
      {/* Top bar */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          height: 56,
          background: 'var(--color-bg-secondary)',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 8 }}>
          <span style={{ fontSize: 18 }}>🧠</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
            PM IntelliHub
          </span>
        </div>

        {/* App switcher tabs */}
        <div
          style={{
            display: 'flex',
            gap: 2,
            flex: 1,
            minWidth: 0,
            overflowX: 'auto',
          }}
        >
          {APPS.map(app => {
            const isActive = selectedApp === app.id;
            return (
              <button
                key={app.id}
                onClick={() => onSelectApp(app.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-badge)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  background: isActive ? 'var(--color-accent)' : 'transparent',
                  color: isActive ? '#fff' : 'var(--color-text-secondary)',
                  whiteSpace: 'nowrap',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                <span>{platformIcon[app.platform] || '📱'}</span>
                <span>{app.label}</span>
              </button>
            );
          })}
        </div>

        {/* Settings gear */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenSettings}
          title="Settings"
          style={{ flexShrink: 0, color: 'var(--color-text-secondary)' }}
        >
          <GearIcon />
        </Button>
      </header>

      {/* Tab nav */}
      <nav
        style={{
          display: 'flex',
          padding: '0 20px',
          background: 'var(--color-bg-secondary)',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
          gap: 0,
        }}
      >
        {[
          { id: 'digest', label: '📊 Daily Digest' },
          { id: 'chat',   label: '💬 Ask AI' },
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              style={{
                padding: '10px 16px',
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${isActive ? 'var(--color-accent)' : 'transparent'}`,
                color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                fontWeight: isActive ? 600 : 400,
                fontSize: 14,
                cursor: 'pointer',
                transition: 'color 0.15s, border-color 0.15s',
                whiteSpace: 'nowrap',
                marginBottom: -1,
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Main content */}
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 24px 32px',
          maxWidth: 1100,
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        {children}
      </main>
    </div>
  );
}
