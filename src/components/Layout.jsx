import React from 'react';
import { APPS } from '../constants.js';

function GearIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

export function Layout({ children, selectedApp, onSelectApp, activeTab, onSelectTab, onOpenSettings }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* Top bar */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        height: 48,
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: 20,
            fontWeight: 300,
            color: 'var(--accent)',
            letterSpacing: '0.02em',
          }}>
            PM IntelliHub
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            color: 'var(--text-3)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}>
            v0.1
          </span>
        </div>
        <button
          onClick={onOpenSettings}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-3)',
            display: 'flex',
            alignItems: 'center',
            padding: 6,
            borderRadius: 'var(--r-sm)',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-1)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
          title="Settings"
        >
          <GearIcon />
        </button>
      </header>

      {/* App selector */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0 28px',
        height: 40,
        borderBottom: '1px solid var(--border)',
        gap: 2,
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--text-3)',
          marginRight: 14,
        }}>App</span>
        {APPS.map(app => {
          const isActive = selectedApp === app.id;
          return (
            <button
              key={app.id}
              onClick={() => onSelectApp(app.id)}
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 12,
                fontWeight: isActive ? 600 : 400,
                padding: '4px 12px',
                border: '1px solid',
                borderColor: isActive ? 'rgba(200,255,87,0.35)' : 'transparent',
                borderRadius: 'var(--r-sm)',
                background: isActive ? 'var(--accent-dim)' : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--text-2)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {app.label}
            </button>
          );
        })}
      </div>

      {/* Tab nav */}
      <nav style={{
        display: 'flex',
        padding: '0 28px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        {[
          { id: 'digest', label: 'Daily Digest' },
          { id: 'chat',   label: 'Ask AI' },
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                padding: '11px 0',
                marginRight: 28,
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
                color: isActive ? 'var(--text-1)' : 'var(--text-3)',
                cursor: 'pointer',
                transition: 'color 0.15s, border-color 0.15s',
                marginBottom: -1,
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Main content */}
      <main style={{
        flex: 1,
        overflowY: 'auto',
        padding: '32px 28px 48px',
        maxWidth: 940,
        width: '100%',
        margin: '0 auto',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}>
        {children}
      </main>
    </div>
  );
}
