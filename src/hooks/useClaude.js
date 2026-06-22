import { useCallback, useContext } from 'react';
import { ANTHROPIC_API_URL, CLAUDE_MODEL } from '../constants.js';

/**
 * Hook that provides a callClaude function for making Anthropic API calls.
 * Reads the anthropicKey from the settings object passed in.
 */
export function useClaude(settings) {
  const callClaude = useCallback(
    async ({ prompt, mcpList = [], systemPrompt = '', messages = null }) => {
      const apiKey = settings?.anthropicKey;
      if (!apiKey) {
        throw new Error('Anthropic API key is not configured. Please open Settings and add your key.');
      }

      // Build the messages array
      const msgArray = messages
        ? messages
        : [{ role: 'user', content: prompt }];

      const body = {
        model: CLAUDE_MODEL,
        max_tokens: 16384,
        system: systemPrompt || undefined,
        messages: msgArray,
      };

      // Add MCP servers if provided
      if (mcpList && mcpList.length > 0) {
        body.mcp_servers = mcpList.map(({ mcpUrl, token, name }) => ({
          type: 'url',
          url: mcpUrl,
          name: name,
          ...(token ? { authorization_token: token } : {}),
        }));
      }

      const headers = {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      };

      if (mcpList && mcpList.length > 0) {
        headers['anthropic-beta'] = 'mcp-client-2025-11-20';
      }

      const response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        let errMsg = `API error ${response.status}`;
        try {
          const errData = await response.json();
          errMsg = errData?.error?.message || errMsg;
        } catch {}
        throw new Error(errMsg);
      }

      const data = await response.json();

      // Extract text content from response
      const textContent = data.content
        ?.filter(block => block.type === 'text')
        ?.map(block => block.text)
        ?.join('');

      return { text: textContent || '', raw: data };
    },
    [settings?.anthropicKey]
  );

  /**
   * Parse JSON from Claude's response, handling potential markdown fences.
   */
  const parseJSON = useCallback((text) => {
    // Strip markdown code fences if present
    const stripped = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
    return JSON.parse(stripped);
  }, []);

  return { callClaude, parseJSON };
}
