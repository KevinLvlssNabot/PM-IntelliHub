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
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--color-text-secondary)',
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
              color: 'var(--color-text-tertiary)',
              fontSize: 12,
              padding: 0,
            }}
          >
            {show ? 'hide' : 'show'}
          </button>
        )}
      </div>
      {helpText && (
        <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
          {helpText}
        </p>
      )}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h3
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--color-text-tertiary)',
        marginBottom: 16,
        marginTop: 24,
        paddingBottom: 8,
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      {children}
    </h3>
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
        background: 'var(--color-bg-primary)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }
    : {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
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
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-card)',
          width: '100%',
          maxWidth: 560,
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: 32,
          position: 'relative',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
              {isWizard ? 'Welcome to PM IntelliHub' : 'Settings'}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
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
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-tertiary)',
                fontSize: 20,
                lineHeight: 1,
                padding: '4px 8px',
                borderRadius: 4,
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
        <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)', marginBottom: 16 }}>
          Connect data sources to enrich your daily digest with real data.
        </p>

        {SOURCE_LIST.filter(s => !s.comingSoon).map(source => (
          <FieldRow
            key={source.id}
            label={`${source.icon} ${source.label} Token`}
            id={source.requiredKey}
            value={draft[source.requiredKey] || ''}
            onChange={set(source.requiredKey)}
            placeholder={`Paste your ${source.label} token here…`}
          />
        ))}

        {SOURCE_LIST.filter(s => s.comingSoon).map(source => (
          <div
            key={source.id}
            style={{
              marginBottom: 16,
              padding: '10px 12px',
              background: 'var(--color-bg-tertiary)',
              borderRadius: 'var(--radius-badge)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              opacity: 0.6,
            }}
          >
            <span>{source.icon}</span>
            <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
              {source.label}
            </span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--color-text-tertiary)' }}>
              Coming soon
            </span>
          </div>
        ))}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
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
