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
      className="animate-slide-up"
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 14,
        gap: 10,
        alignItems: 'flex-start',
      }}
    >
      {isUser ? (
        <div
          style={{
            maxWidth: '78%',
            padding: '10px 14px',
            borderRadius: 'var(--r-lg)',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            color: 'var(--text-1)',
            fontSize: 14,
            lineHeight: 1.6,
            fontFamily: 'var(--font-ui)',
          }}
        >
          {message.content}
        </div>
      ) : (
        <div
          style={{
            maxWidth: '88%',
            borderLeft: '3px solid rgba(200,255,87,0.25)',
            paddingLeft: 16,
            paddingTop: 4,
            paddingBottom: 4,
          }}
        >
          <div
            className="md-content"
            style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text-1)' }}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
          />
        </div>
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14, paddingLeft: 19 }}>
      <div style={{ borderLeft: '3px solid rgba(200,255,87,0.25)', paddingLeft: 16, paddingTop: 8, paddingBottom: 8, display: 'flex', gap: 5, alignItems: 'center' }}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: 'var(--text-3)',
              animation: `pulse 1.2s ease-in-out ${i * 0.18}s infinite`,
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
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)' }}>API key required</div>
        <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--text-2)', fontSize: 16, textAlign: 'center', maxWidth: 340 }}>
          Add your Anthropic API key to start chatting.
        </p>
        <Button onClick={onOpenSettings}>Open Settings</Button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Messages area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 0 8px', minHeight: 0 }}>
        {messages.length === 0 && (
          <div style={{ padding: '40px 0' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 10 }}>
              Intelligence query
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 22, color: 'var(--text-2)', marginBottom: 24, lineHeight: 1.4 }}>
              Ask anything about {selectedApp}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                'What are the most urgent open tickets?',
                'Show me user retention trends',
                'Any recent crashes or anomalies?',
              ].map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => { setInput(suggestion); textareaRef.current?.focus(); }}
                  style={{
                    fontFamily: 'var(--font-ui)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-md)',
                    color: 'var(--text-2)',
                    padding: '7px 12px',
                    fontSize: 12,
                    cursor: 'pointer',
                    transition: 'border-color 0.15s, color 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(200,255,87,0.3)'; e.currentTarget.style.color = 'var(--text-1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)'; }}
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
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your product… (Enter to send)"
          rows={1}
          style={{
            flex: 1,
            resize: 'none',
            minHeight: 40,
            maxHeight: 160,
            overflowY: 'auto',
            padding: '10px 12px',
            lineHeight: 1.5,
            fontFamily: 'var(--font-ui)',
            fontSize: 13,
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
