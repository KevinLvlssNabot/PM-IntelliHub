import React, { useEffect, useState, useCallback } from 'react';
import { SOURCES, DIGEST_SYSTEM_PROMPT } from '../constants.js';
import { useClaude } from '../hooks/useClaude.js';
import { Card } from './ui/Card.jsx';
import { Badge } from './ui/Badge.jsx';
import { Button } from './ui/Button.jsx';
import { SkeletonCard, Skeleton } from './ui/Skeleton.jsx';

function buildMcpList(settings) {
  return Object.values(SOURCES)
    .filter(s => s.mcpUrl && settings[s.requiredKey])
    .map(s => ({
      name: s.id,
      mcpUrl: s.mcpUrl,
      token: settings[s.requiredKey],
    }));
}

function buildDigestPrompt(selectedApp, mcpList) {
  const sourceNames = mcpList.map(m => m.name).join(', ') || 'none';
  return `You are analyzing data for the "${selectedApp}" product.
Connected data sources: ${sourceNames || 'none'}.

${mcpList.length > 0
    ? 'Use the available MCP tools to gather real data, then produce the digest JSON.'
    : 'No live data sources are connected. Produce a placeholder digest that clearly notes data is unavailable and suggests connecting sources in Settings.'}

Respond ONLY with raw JSON (no markdown fences) matching this exact schema:
{
  "summary": "string",
  "highlights": [{"label": "string", "value": "string", "trend": "up|down|flat", "status": "ok|warning|critical"}],
  "anomalies": [{"title": "string", "detail": "string", "severity": "low|medium|high"}],
  "stale_tickets": [{"id": "string", "title": "string", "assignee": "string", "days_idle": 0, "priority": "urgent|high|medium|low"}]
}`;
}

function TrendArrow({ trend }) {
  if (trend === 'up') return <span style={{ color: 'var(--color-success)' }}>↑</span>;
  if (trend === 'down') return <span style={{ color: 'var(--color-danger)' }}>↓</span>;
  return <span style={{ color: 'var(--color-text-tertiary)' }}>→</span>;
}

function HighlightChip({ item }) {
  const statusColor = {
    ok: 'var(--color-success)',
    warning: 'var(--color-warning)',
    critical: 'var(--color-danger)',
  }[item.status] || 'var(--color-text-secondary)';

  return (
    <div
      style={{
        background: 'var(--color-bg-tertiary)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-card)',
        padding: '12px 16px',
        minWidth: 140,
        flex: '1 1 140px',
      }}
    >
      <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginBottom: 6, fontWeight: 500 }}>
        {item.label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: statusColor }}>
          {item.value}
        </span>
        <TrendArrow trend={item.trend} />
      </div>
    </div>
  );
}

function AnomalyItem({ item }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        padding: '12px 0',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <div style={{ paddingTop: 2 }}>
        <Badge variant={item.severity} dot>
          {item.severity}
        </Badge>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{item.title}</div>
        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{item.detail}</div>
      </div>
    </div>
  );
}

function TicketRow({ ticket }) {
  const priorityBadge = {
    urgent: 'urgent',
    high: 'high',
    medium: 'medium',
    low: 'low',
  }[ticket.priority] || 'neutral';

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '80px 1fr 120px 80px 80px',
        gap: 12,
        padding: '10px 12px',
        borderRadius: 'var(--radius-badge)',
        background: 'var(--color-bg-tertiary)',
        marginBottom: 6,
        alignItems: 'center',
        fontSize: 13,
      }}
    >
      <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-accent)' }}>
        {ticket.id}
      </code>
      <span
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          color: 'var(--color-text-primary)',
        }}
        title={ticket.title}
      >
        {ticket.title}
      </span>
      <span style={{ color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {ticket.assignee || '—'}
      </span>
      <span style={{ color: 'var(--color-warning)', fontWeight: 600 }}>
        {ticket.days_idle}d idle
      </span>
      <Badge variant={priorityBadge}>{ticket.priority}</Badge>
    </div>
  );
}

export function DigestView({ settings, selectedApp, onOpenSettings }) {
  const { callClaude, parseJSON } = useClaude(settings);
  const [digest, setDigest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshedAt, setRefreshedAt] = useState(null);

  const fetchDigest = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const mcpList = buildMcpList(settings);
      const prompt = buildDigestPrompt(selectedApp, mcpList);
      const { text } = await callClaude({
        prompt,
        mcpList,
        systemPrompt: DIGEST_SYSTEM_PROMPT,
      });
      const parsed = parseJSON(text);
      setDigest(parsed);
      setRefreshedAt(new Date());
    } catch (err) {
      setError(err.message || 'Failed to fetch digest');
    } finally {
      setLoading(false);
    }
  }, [settings, selectedApp, callClaude, parseJSON]);

  useEffect(() => {
    if (settings?.anthropicKey) {
      fetchDigest();
    }
  }, [selectedApp, settings?.anthropicKey]);

  if (!settings?.anthropicKey) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 16 }}>
        <div style={{ fontSize: 40 }}>🔑</div>
        <h3 style={{ fontSize: 16, fontWeight: 600 }}>API key required</h3>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, textAlign: 'center', maxWidth: 340 }}>
          Add your Anthropic API key to start generating daily digests.
        </p>
        <Button onClick={onOpenSettings}>Open Settings</Button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>Daily Digest</h2>
          {refreshedAt && (
            <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
              Refreshed at {refreshedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
        <Button variant="secondary" onClick={fetchDigest} loading={loading} size="sm">
          {loading ? 'Refreshing…' : '↻ Refresh'}
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <Card style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.3)' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--color-danger)' }}>Error fetching digest</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{error}</div>
            </div>
          </div>
        </Card>
      )}

      {/* Loading skeletons */}
      {loading && !digest && (
        <>
          <SkeletonCard />
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                style={{
                  background: 'var(--color-bg-tertiary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  padding: '12px 16px',
                  flex: '1 1 140px',
                }}
              >
                <Skeleton width={80} height={12} style={{ marginBottom: 10 }} />
                <Skeleton width={60} height={22} />
              </div>
            ))}
          </div>
          <SkeletonCard />
        </>
      )}

      {/* Digest content */}
      {digest && !loading && (
        <>
          {/* Summary */}
          <Card>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', marginBottom: 10 }}>
              Executive Summary
            </div>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--color-text-primary)' }}>
              {digest.summary}
            </p>
          </Card>

          {/* Highlights */}
          {digest.highlights?.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', marginBottom: 12 }}>
                Key Metrics
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {digest.highlights.map((h, i) => (
                  <HighlightChip key={i} item={h} />
                ))}
              </div>
            </div>
          )}

          {/* Anomalies */}
          {digest.anomalies?.length > 0 && (
            <Card>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', marginBottom: 4 }}>
                Anomalies & Alerts
              </div>
              <div>
                {digest.anomalies.map((a, i) => (
                  <AnomalyItem key={i} item={a} />
                ))}
              </div>
            </Card>
          )}

          {/* Stale tickets */}
          {digest.stale_tickets?.length > 0 && (
            <Card>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', marginBottom: 12 }}>
                Stale Tickets ({digest.stale_tickets.length})
              </div>
              {/* Table header */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr 120px 80px 80px',
                  gap: 12,
                  padding: '6px 12px',
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-tertiary)',
                  marginBottom: 4,
                }}
              >
                <span>ID</span>
                <span>Title</span>
                <span>Assignee</span>
                <span>Idle</span>
                <span>Priority</span>
              </div>
              {digest.stale_tickets.map((t, i) => (
                <TicketRow key={i} ticket={t} />
              ))}
            </Card>
          )}

          {/* Empty state */}
          {!digest.anomalies?.length && !digest.stale_tickets?.length && !digest.highlights?.length && (
            <Card style={{ textAlign: 'center', padding: 32 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>All clear</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                No anomalies or stale tickets found.
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
