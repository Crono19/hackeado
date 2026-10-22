import type {
  DemoSession,
  DemoScenario,
  ExperienceRole,
  JoinRequestView,
  SessionCredentials,
  SessionMode,
} from '../../shared/types';

interface CreatedSessionResponse {
  session: DemoSession;
  credentials: SessionCredentials;
}

interface JoinTicketResponse {
  request: JoinRequestView;
  requestKey: string;
}

const JSON_HEADERS = { 'content-type': 'application/json' };

export async function createDemoSession(mode: SessionMode = 'simulated') {
  return request<CreatedSessionResponse>('/api/sessions', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ scenarioId: 'support-scam-default', mode }),
  });
}

export async function requestSessionJoin(
  code: string,
  role: Exclude<ExperienceRole, 'coordinator'>,
) {
  return request<JoinTicketResponse>('/api/sessions/join', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ code, role }),
  });
}

export async function pollJoin(requestId: string, requestKey: string) {
  return request<{ request: JoinRequestView; token?: string }>(
    `/api/join-requests/${requestId}?key=${encodeURIComponent(requestKey)}`,
  );
}

export async function listJoinRequests(credentials: SessionCredentials) {
  return request<{ requests: JoinRequestView[] }>(
    `/api/sessions/${credentials.sessionId}/join-requests`,
    withAuth(credentials),
  );
}

export async function decideJoin(
  credentials: SessionCredentials,
  requestId: string,
  approved: boolean,
) {
  return request<{ request: JoinRequestView }>(
    `/api/sessions/${credentials.sessionId}/join-requests/${requestId}/decision`,
    withAuth(credentials, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ approved }),
    }),
  );
}

export async function getScenario(scenarioId: string) {
  return request<{ scenario: DemoScenario }>(`/api/scenarios/${encodeURIComponent(scenarioId)}`);
}

function withAuth(credentials: SessionCredentials, init: RequestInit = {}): RequestInit {
  return {
    ...init,
    headers: {
      ...Object.fromEntries(new Headers(init.headers).entries()),
      authorization: `Bearer ${credentials.token}`,
    },
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  const body = (await response.json()) as T & { message?: string };
  if (!response.ok) throw new Error(body.message ?? `HTTP ${response.status}`);
  return body;
}
