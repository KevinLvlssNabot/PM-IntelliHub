import React, { useState, useRef, useEffect, useCallback } from 'react';
import { APPS, SOURCES, CHAT_SYSTEM_PROMPT } from '../constants.js';
import { useClaude } from '../hooks/useClaude.js';
import { fetchLinearStaleIssues } from '../utils/linear.js';
import { Button } from './ui/Button.jsx';

// Simple markdown renderer — handles the most common patterns without a library
function renderMarkdown(text) {
  if (!text) return '';

  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code blocks (fenced ```...```)
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre><code>${code.trim()}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');

  // Headings
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Horizontal rule
  html = html.replace(/^---+$/gm, '<hr>');

  // Blockquote
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

  // Unordered lists
  html = html.replace(/((?:^[ \t]*[-*+] .+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map(line =>
      `<li>${line.replace(/^[ \t]*[-*+] /, '')}</li>`
    ).join('');
    return `<ul>${items}</ul>`;
  });

  // Ordered lists
  html = html.replace(/((?:^[ \t]*\d+\. .+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map(line =>
      `<li>${line.replace(/^[ \t]*\d+\. /, '')}</li>`
    ).join('');
    return `<ol>${items}</ol>`;
  });

  // Paragraphs
  html = html.replace(/\n\n+/g, '\n\n');
  const parts = html.split(/\n\n/);
  html = parts.map(part => {
    const trimmed = part.trim();
    if (!trimmed) return '';
    if (/^<(h[1-6]|ul|ol|pre|hr|blockquote)/.test(trimmed)) return trimmed;
    return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`;
  }).join('\n');

  return html;
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  return (
    <div
      className="animate-slide-up"
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 16,
        gap: 10,
        alignItems: 'flex-start',
      }}
    >
      {!isUser && (
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 'var(--r-sm)',
            background: 'var(--accent-dim)',
            border: '1px solid rgba(200,255,87,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: 8,
            fontWeight: 600,
            letterSpacing: '0.05em',
            color: 'var(--accent)',
            flexShrink: 0,
            marginTop: 2,
          }}
        >
          AI
        </div>
      )}
      <div
        style={{
          maxWidth: '82%',
          ...(isUser
            ? {
                padding: '10px 14px',
                borderRadius: 'var(--r-lg)',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                color: 'var(--text-1)',
                fontFamily: 'var(--font-ui)',
                fontSize: 14,
                lineHeight: 1.6,
              }
            : {
                borderLeft: '3px solid var(--accent-dim)',
                paddingLeft: 16,
                color: 'var(--text-1)',
                fontFamily: 'var(--font-ui)',
                fontSize: 14,
                lineHeight: 1.6,
              }),
        }}
      >
        {isUser ? (
          <p style={{ margin: 0 }}>{message.content}</p>
        ) : (
          <div
            className="md-content"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
          />
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: 'var(--r-sm)',
          background: 'var(--accent-dim)',
          border: '1px solid rgba(200,255,87,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: 8,
          fontWeight: 600,
          letterSpacing: '0.05em',
          color: 'var(--accent)',
          flexShrink: 0,
        }}
      >
        AI
      </div>
      <div
        style={{
          padding: '10px 16px',
          borderLeft: '3px solid var(--accent-dim)',
          paddingLeft: 16,
          display: 'flex',
          gap: 5,
          alignItems: 'center',
        }}
      >
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--text-3)',
              animation: `pulse 1.2s ease-in-out ${i * 0.22}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function buildSystemContext(settings, appLabel, linearData) {
  const connected = Object.values(SOURCES)
    .filter(s => settings[s.requiredKey] && s.mcpUrl && !s.comingSoon)
    .map(s => s.label);
  const notConnected = Object.values(SOURCES)
    .filter(s => !settings[s.requiredKey] && !s.comingSoon)
    .map(s => s.label);

  let ctx = `${CHAT_SYSTEM_PROMPT}

Current app: ${appLabel}.
Connected sources: ${connected.length ? connected.join(', ') : 'none'}.
Not connected: ${notConnected.length ? notConnected.join(', ') : 'none'}.`;

  if (linearData && linearData.length > 0) {
    const appIssues = linearData.filter(i =>
      !i.team || i.team.toLowerCase().includes(appLabel.toLowerCase().split(' ')[0])
    );
    ctx += `\n\nPre-fetched Linear stale issues for "${appLabel}" (In Progress / In Review, 3+ days idle):\n` +
      JSON.stringify(appIssues.length > 0 ? appIssues : linearData, null, 2);
  }

  return ctx;
}

export function ChatView({ settings, selectedApp, onOpenSettings }) {
  const { callClaude } = useClaude(settings);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [linearData, setLinearData] = useState(null);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!settings?.linearToken) { setLinearData(null); return; }
    fetchLinearStaleIssues(settings.linearToken).then(setLinearData).catch(() => {});
  }, [settings?.linearToken]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    const userMessage = { role: 'user', content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setError(null);
    setIsTyping(true);

    try {
      const appLabel = APPS.find(a => a.id === selectedApp)?.label ?? selectedApp;
      const systemCtx = buildSystemContext(settings, appLabel, linearData);

      const apiMessages = newMessages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const { text: responseText } = await callClaude({
        messages: apiMessages,
        systemPrompt: systemCtx,
      });

      setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
    } catch (err) {
      setError(err.message || 'Failed to get response');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${err.message}. Please check your API key in Settings.`,
      }]);
    } finally {
      setIsTyping(false);
    }
  }, [input, messages, isTyping, settings, callClaude]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!settings?.anthropicKey) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 16 }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--text-3)',
          marginBottom: 4,
        }}>
          — API key required —
        </div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 24, fontWeight: 300, color: 'var(--text-1)' }}>
          Connect to start chatting
        </h3>
        <p style={{ color: 'var(--text-2)', fontSize: 14, textAlign: 'center', maxWidth: 340 }}>
          Add your Anthropic API key to start chatting.
        </p>
        <Button onClick={onOpenSettings}>Open Settings</Button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Messages area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 0 8px',
          minHeight: 0,
        }}
      >
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-3)' }}>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--text-3)',
              marginBottom: 14,
            }}>
              Ask AI
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 24, fontWeight: 300, color: 'var(--text-1)', marginBottom: 10 }}>
              Ask anything about {selectedApp}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', maxWidth: 380, margin: '0 auto', lineHeight: 1.6, marginBottom: 24 }}>
              Ask about open tickets, user metrics, acquisition trends, crashes, or anything else about your product.
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              {[
                'What are the most urgent open tickets?',
                'Show me user retention trends',
                'Any recent crashes or anomalies?',
              ].map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion);
                    textareaRef.current?.focus();
                  }}
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-lg)',
                    color: 'var(--text-2)',
                    padding: '8px 14px',
                    fontFamily: 'var(--font-ui)',
                    fontSize: 12,
                    cursor: 'pointer',
                    transition: 'background 0.15s, border-color 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.borderColor = 'rgba(200,255,87,0.2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div
        style={{
          borderTop: '1px solid var(--border)',
          paddingTop: 16,
          display: 'flex',
          gap: 10,
          alignItems: 'flex-end',
        }}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your product… (Enter to send, Shift+Enter for new line)"
          rows={1}
          style={{
            flex: 1,
            resize: 'none',
            minHeight: 40,
            maxHeight: 160,
            overflowY: 'auto',
            padding: '10px 12px',
            lineHeight: 1.5,
            borderRadius: 'var(--r-md)',
            fontFamily: 'var(--font-ui)',
            fontSize: 13,
          }}
          onInput={e => {
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
          }}
          disabled={isTyping}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isTyping}
          style={{
            flexShrink: 0,
            height: 40,
            padding: '0 18px',
            background: 'var(--accent)',
            border: 'none',
            borderRadius: 'var(--r-md)',
            color: '#080a0e',
            fontFamily: 'var(--font-ui)',
            fontWeight: 600,
            fontSize: 13,
            cursor: !input.trim() || isTyping ? 'not-allowed' : 'pointer',
            opacity: !input.trim() || isTyping ? 0.5 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
