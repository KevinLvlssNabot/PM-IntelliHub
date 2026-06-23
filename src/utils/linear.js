const PRIORITY_LABEL = ['no priority', 'urgent', 'high', 'medium', 'low'];

export async function fetchLinearStaleIssues(linearToken, workerUrl) {
  if (!linearToken) return null;

  const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const auth = linearToken.startsWith('Bearer ') ? linearToken : `Bearer ${linearToken}`;

  const query = `{
    issues(
      filter: {
        state: { type: { in: [started, inReview] } }
        updatedAt: { lt: "${cutoff}" }
      }
      first: 50
      orderBy: updatedAt
    ) {
      nodes {
        identifier
        title
        updatedAt
        priority
        state { name }
        team { name }
        assignee { name }
      }
    }
  }`;

  const endpoint = workerUrl
    ? `${workerUrl.replace(/\/$/, '')}/linear`
    : 'https://api.linear.app/graphql';

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': auth,
      },
      body: JSON.stringify({ query }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (data.errors) return null;

    return (data.data?.issues?.nodes ?? []).map(i => ({
      id: i.identifier,
      title: i.title,
      assignee: i.assignee?.name ?? null,
      state: i.state?.name ?? null,
      team: i.team?.name ?? null,
      daysIdle: Math.floor((Date.now() - new Date(i.updatedAt).getTime()) / 86_400_000),
      priority: PRIORITY_LABEL[i.priority] ?? 'unknown',
    }));
  } catch {
    return null;
  }
}
