import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SOURCES, CHAT_SYSTEM_PROMPT } from '../constants.js';
import { useClaude } from '../hooks/useClaude.js';
import { Button } from './ui/Button.jsx';

// Simple markdown renderer — handles the most common patterns without a library
function renderMarkdown(text) {
  if (!text) return '';

  let html = text
    // Escape HTML to avoid XSS
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

  // Unordered lists — group consecutive items
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

  // Paragraphs — wrap double-newline separated blocks not already in HTML tags
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
      className="animate-fade-in"
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
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'var(--color-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            flexShrink: 0,
            marginTop: 2,
          }}
        >
          AI
        </div>
      )}
      <div
        style={{
          maxWidth: '80%',
          padding: '10px 14px',
          borderRadius: isUser ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
          background: isUser ? 'var(--color-accent)' : 'var(--color-bg-tertiary)',
          border: isUser ? 'none' : '1px solid var(--color-border)',
          color: 'var(--color-text-primary)',
          fontSize: 14,
          lineHeight: 1.6,
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
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: 'var(--color-accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          flexShrink: 0,
        }}
      >
        AI
      </div>
      <div
        style={{
          padding: '10px 16px',
          borderRadius: '12px 12px 12px 4px',
          background: 'var(--color-bg-tertiary)',
          border: '1px solid var(--color-border)',
          display: 'flex',
          gap: 6,
          alignItems: 'center',
        }}
      >
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: 'var(--color-text-tertiary)',
              animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function buildSystemContext(settings) {
  const connected = Object.values(SOURCES)
    .filter(s => settings[s.requiredKey] && s.mcpUrl)
    .map(s => s.label);
  const notConnected = Object.values(SOURCES)
    .filter(s => !settings[s.requiredKey])
    .map(s => s.label);

  return `${CHAT_SYSTEM_PROMPT}

Connected sources: ${connected.length ? connected.join(', ') : 'none'}.
Not connected: ${notConnected.length ? notConnected.join(', ') : 'none'}.`;
}

function buildMcpList(settings) {
  return Object.values(SOURCES)
    .filter(s => s.mcpUrl && settings[s.requiredKey])
    .map(s => ({
      name: s.id,
      mcpUrl: s.mcpUrl,
      token: settings[s.requiredKey],
    }));
}

export function ChatView({ settings, selectedApp, onOpenSettings }) {
  const { callClaude } = useClaude(settings);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

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
      const mcpList = buildMcpList(settings);
      const systemCtx = buildSystemContext(settings);

      // Build API messages: convert our messages to Anthropic format
      const apiMessages = newMessages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const { text: responseText } = await callClaude({
        messages: apiMessages,
        mcpList,
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
        <div style={{ fontSize: 40 }}>🔑</div>
        <h3 style={{ fontSize: 16, fontWeight: 600 }}>API key required</h3>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, textAlign: 'center', maxWidth: 340 }}>
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
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--color-text-tertiary)' }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>💬</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: 'var(--color-text-secondary)' }}>
              Ask anything about {selectedApp}
            </div>
            <div style={{ fontSize: 13, maxWidth: 380, margin: '0 auto', lineHeight: 1.6 }}>
              Ask about open tickets, user metrics, acquisition trends, crashes, or anything else about your product.
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 24 }}>
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
                    background: 'var(--color-bg-tertiary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-card)',
                    color: 'var(--color-text-secondary)',
                    padding: '8px 14px',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
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
          borderTop: '1px solid var(--color-border)',
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
            borderRadius: 'var(--radius-card)',
          }}
          onInput={e => {
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
          }}
          disabled={isTyping}
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || isTyping}
          loading={isTyping}
          style={{ flexShrink: 0, height: 40 }}
        >
          Send
        </Button>
      </div>
    </div>
  );
}
