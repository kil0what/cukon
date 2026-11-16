import type { AnalyticsEventLog, CmsState, LeadSubmission, WordPressSettings } from '../shared/types';

export interface CmsBootstrapResponse {
  state: CmsState;
  leadsCount: number;
  smtpConfigured: boolean;
}

export async function fetchCmsBootstrap(): Promise<CmsBootstrapResponse> {
  const res = await fetch('/api/cms');
  if (!res.ok) throw new Error('Не удалось загрузить данные сайта');
  return (await res.json()) as CmsBootstrapResponse;
}

export async function loginAdmin(password: string): Promise<string> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  const data = (await res.json()) as { token?: string; error?: string };
  if (!res.ok || !data.token) {
    throw new Error(data.error || 'Ошибка авторизации');
  }
  return data.token;
}

export async function updateAdminPassword(token: string, newPassword: string): Promise<void> {
  const res = await fetch('/api/auth/password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ newPassword }),
  });
  const data = (await res.json()) as { ok?: boolean; error?: string };
  if (!res.ok) throw new Error(data.error || 'Не удалось сменить пароль');
}

export async function saveCmsState(token: string, state: CmsState): Promise<CmsState> {
  const res = await fetch('/api/cms', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ state }),
  });
  const data = (await res.json()) as { state?: CmsState; error?: string };
  if (!res.ok || !data.state) throw new Error(data.error || 'Не удалось сохранить изменения');
  return data.state;
}

export async function resetCmsState(token: string): Promise<CmsState> {
  const res = await fetch('/api/cms/reset', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = (await res.json()) as { state?: CmsState; error?: string };
  if (!res.ok || !data.state) throw new Error(data.error || 'Не удалось сбросить данные');
  return data.state;
}

export async function submitLead(payload: {
  type: 'tenant' | 'owner';
  name: string;
  phone: string;
  email: string;
  purposeOrObject: string;
  area: string;
  message: string;
  consent: boolean;
  honeypot: string;
  elapsedMs: number;
  captchaExpected: number;
  captchaAnswer: string;
}): Promise<{ ok: boolean; lead: Pick<LeadSubmission, 'id' | 'createdAt' | 'status'> }> {
  const res = await fetch('/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as {
    ok?: boolean;
    lead?: Pick<LeadSubmission, 'id' | 'createdAt' | 'status'>;
    error?: string;
  };
  if (!res.ok || !data.ok || !data.lead) {
    throw new Error(data.error || 'Ошибка отправки заявки');
  }
  return { ok: true, lead: data.lead };
}

export async function fetchLeads(token: string): Promise<LeadSubmission[]> {
  const res = await fetch('/api/leads', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = (await res.json()) as { leads?: LeadSubmission[]; error?: string };
  if (!res.ok) throw new Error(data.error || 'Ошибка загрузки заявок');
  return data.leads || [];
}

export async function updateLeadStatus(
  token: string,
  id: string,
  status: LeadSubmission['status'],
): Promise<LeadSubmission> {
  const res = await fetch(`/api/leads/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
  const data = (await res.json()) as { lead?: LeadSubmission; error?: string };
  if (!res.ok || !data.lead) throw new Error(data.error || 'Ошибка обновления статуса');
  return data.lead;
}

export async function deleteLead(token: string, id: string): Promise<void> {
  const res = await fetch(`/api/leads/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Ошибка удаления заявки');
}

export async function postAnalyticsEvent(payload: {
  goal: string;
  path: string;
  meta?: string;
}): Promise<void> {
  try {
    await fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    // Non-blocking telemetry
  }
}

export async function fetchAnalyticsStats(token: string): Promise<{
  events: AnalyticsEventLog[];
  counts: Record<string, number>;
}> {
  const res = await fetch('/api/analytics/stats', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = (await res.json()) as {
    events?: AnalyticsEventLog[];
    counts?: Record<string, number>;
    error?: string;
  };
  if (!res.ok) throw new Error(data.error || 'Ошибка загрузки статистики');
  return { events: data.events || [], counts: data.counts || {} };
}

export async function testWordPressSync(token: string, siteUrl: string): Promise<WordPressSettings> {
  const res = await fetch('/api/wordpress/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ siteUrl }),
  });
  const data = (await res.json()) as { wordpress?: WordPressSettings; error?: string };
  if (!res.ok || !data.wordpress) throw new Error(data.error || 'Не удалось подключиться к WordPress');
  return data.wordpress;
}
