import React, { useState } from 'react';
import { SOURCES } from '../constants.js';
import { Button } from './ui/Button.jsx';

const SOURCE_LIST = Object.values(SOURCES);

function FieldRow({ label, id, value, onChange, placeholder, type = 'password', helpText }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      <label
        htmlFor={id}
        style={{
          display: 'block',
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-2)',
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          type={show ? 'text' : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ paddingRight: type === 'password' ? 44 : 12 }}
          autoComplete="off"
          spellCheck={false}
        />
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-3)',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              letterSpacing: '0.05em',
              padding: 0,
            }}
          >
            {show ? 'hide' : 'show'}
          </button>
        )}
      </div>
      {helpText && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', marginTop: 5, lineHeight: 1.5 }}>
          {helpText}
        </p>
      )}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 16,
      marginTop: 24,
      paddingBottom: 10,
      borderBottom: '1px solid var(--border)',
    }}>
      <h3 style={{
        fontFamily: 'var(--font-display)',
        fontStyle: 'italic',
        fontWeight: 300,
        fontSize: 18,
        color: 'var(--text-1)',
        flex: '0 0 auto',
      }}>
        {children}
      </h3>
    </div>
  );
}

export function SettingsPanel({ settings, onSave, onClose, isWizard = false }) {
  const [draft, setDraft] = useState({ ...settings });
  const [saved, setSaved] = useState(false);

  const set = (key) => (val) => setDraft(d => ({ ...d, [key]: val }));

  const handleSave = () => {
    if (!draft.anthropicKey.trim()) {
      alert('Anthropic API key is required.');
      return;
    }
    onSave(draft);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      if (onClose) onClose();
    }, 800);
  };

  const panelStyle = isWizard
    ? {
        position: 'fixed',
        inset: 0,
        background: 'var(--bg)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }
    : {
        position: 'fixed',
        inset: 0,
        background: 'rgba(8,10,14,0.85)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      };

  return (
    <div style={panelStyle} onClick={isWizard ? undefined : (e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-lg)',
          width: '100%',
          maxWidth: 560,
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: 32,
          position: 'relative',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>
              {isWizard ? 'Setup' : 'Configuration'}
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 300, fontSize: 26, color: 'var(--text-1)', marginBottom: 6 }}>
              {isWizard ? 'Welcome to PM IntelliHub' : 'Settings'}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-2)' }}>
              {isWizard
                ? 'Add your Anthropic API key to get started. Other integrations are optional.'
                : 'Manage your API keys and integrations.'}
            </p>
          </div>
          {!isWizard && (
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                color: 'var(--text-3)',
                fontSize: 16,
                lineHeight: 1,
                padding: '4px 9px',
                borderRadius: 'var(--r-sm)',
                fontFamily: 'var(--font-ui)',
              }}
              title="Close"
            >
              ×
            </button>
          )}
        </div>

        {/* Anthropic Key */}
        <SectionTitle>Anthropic (required)</SectionTitle>
        <FieldRow
          label="API Key"
          id="anthropicKey"
          value={draft.anthropicKey}
          onChange={set('anthropicKey')}
          placeholder="sk-ant-..."
          helpText="Get yours at console.anthropic.com — used for AI digest and chat."
        />

        {/* Integrations */}
        <SectionTitle>Integrations (optional)</SectionTitle>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', marginBottom: 16, lineHeight: 1.6 }}>
          Connect data sources to enrich your daily digest with real data.
        </p>

        {SOURCE_LIST.map(source => {
          const fieldType = source.fieldType || 'password';
          const isUrl = fieldType === 'url';
          return (
            <FieldRow
              key={source.id}
              label={isUrl ? `${source.label} Worker URL` : `${source.label} Token`}
              id={source.requiredKey}
              value={draft[source.requiredKey] || ''}
              onChange={set(source.requiredKey)}
              placeholder={isUrl
                ? `https://pm-intellihub-gplay.your-subdomain.workers.dev`
                : `Paste your ${source.label} token here…`}
              type={isUrl ? 'text' : 'password'}
            />
          );
        })}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, marginTop: 28, justifyContent: 'flex-end' }}>
          {!isWizard && (
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button
            variant="primary"
            onClick={handleSave}
            loading={saved}
            style={{ minWidth: 120 }}
          >
            {saved ? 'Saved!' : isWizard ? 'Get Started →' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}
