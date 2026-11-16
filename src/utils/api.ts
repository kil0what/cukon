import type { AnalyticsEventLog, CmsState, LeadSubmission, WordPressSettings } from '../shared/types';

export interface CmsBootstrapResponse {
  state: CmsState;
  leadsCount: number;
  smtpConfigured: boolean;
}

export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

function isHtmlResponseText(text: string, contentType: string): boolean {
  const trimmed = text.trim();
  return trimmed.startsWith('<') || contentType.toLowerCase().includes('text/html');
}

export async function apiFetch(
  route: string,
  init?: RequestInit,
  fetcher: FetchLike = fetch,
): Promise<Response> {
  const cleanRoute = route.replace(/^\/+/, '');
  const primaryRes = await fetcher(`/api/${cleanRoute}`, init);

  const primaryType = (primaryRes.headers.get('content-type') || '').toLowerCase();
  let shouldFallbackToPhp = false;

  if (primaryRes.status === 404 && !primaryType.includes('application/json')) {
    shouldFallbackToPhp = true;
  } else if (primaryType.includes('text/html')) {
    shouldFallbackToPhp = true;
  } else if (!primaryType.includes('application/json') && !primaryType.includes('zip') && !primaryType.includes('octet-stream')) {
    const preview = await primaryRes.clone().text().catch(() => '');
    if (preview.trim().startsWith('<')) {
      shouldFallbackToPhp = true;
    }
  }

  if (!shouldFallbackToPhp) {
    return primaryRes;
  }

  // Fallback for hostings/subdomains where .htaccess RewriteRule ^api/ did not trigger
  const phpRes = await fetcher(`api.php?route=${encodeURIComponent(cleanRoute)}`, init);
  if (phpRes.status !== 404) {
    return phpRes;
  }
  const phpType = (phpRes.headers.get('content-type') || '').toLowerCase();
  if (phpType.includes('application/json')) {
    return phpRes;
  }
  return primaryRes;
}

export async function parseApiJson<T>(res: Response, fallbackError: string): Promise<T & { error?: string }> {
  const text = await res.text();
  const trimmed = text.trim();
  const contentType = (res.headers.get('content-type') || '').toLowerCase();

  if (!trimmed) {
    if (!res.ok) {
      throw new Error(`${fallbackError} (HTTP ${res.status})`);
    }
    return {} as T & { error?: string };
  }

  if (isHtmlResponseText(trimmed, contentType)) {
    const looksLikeSpaShell =
      /<!doctype\s+html/i.test(trimmed) && (trimmed.includes('id="root"') || trimmed.includes('ЦУКОН'));
    if (looksLikeSpaShell) {
      throw new Error(
        'Сервер CMS (/api и api.php) недоступен: открыта статическая копия сайта без серверной части. Если вы в AI Studio — используйте окно разработки (ais-dev), а если на Beget — загрузите полный пакет tsukon-beget-site.zip (с api.php, .htaccess и папкой data/) в public_html выбранного домена.',
      );
    }
    throw new Error(
      `Бэкенд CMS не ответил на запрос (HTTP ${res.status}, получен HTML вместо JSON). На Beget проверьте, что файлы из tsukon-beget-site.zip (index.html, api.php, .htaccess, data/) распакованы именно в папку public_html этого домена и для домена включён PHP.`,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error(`${fallbackError} (некорректный ответ сервера HTTP ${res.status})`);
  }

  return (parsed && typeof parsed === 'object' ? parsed : {}) as T & { error?: string };
}

export async function fetchCmsBootstrap(): Promise<CmsBootstrapResponse> {
  const res = await apiFetch('cms');
  const data = await parseApiJson<CmsBootstrapResponse>(res, 'Не удалось загрузить данные сайта');
  if (!res.ok || !data.state) throw new Error(data.error || 'Не удалось загрузить данные сайта');
  return data;
}

export async function loginAdmin(password: string): Promise<string> {
  const res = await apiFetch('auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  const data = await parseApiJson<{ token?: string }>(res, 'Ошибка авторизации');
  if (!res.ok || !data.token) {
    throw new Error(data.error || 'Ошибка авторизации');
  }
  return data.token;
}

export async function updateAdminPassword(token: string, newPassword: string): Promise<void> {
  const res = await apiFetch('auth/password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ newPassword }),
  });
  const data = await parseApiJson<{ ok?: boolean }>(res, 'Не удалось сменить пароль');
  if (!res.ok) throw new Error(data.error || 'Не удалось сменить пароль');
}

export async function saveCmsState(token: string, state: CmsState): Promise<CmsState> {
  const res = await apiFetch('cms', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ state }),
  });
  const data = await parseApiJson<{ state?: CmsState }>(res, 'Не удалось сохранить изменения');
  if (!res.ok || !data.state) throw new Error(data.error || 'Не удалось сохранить изменения');
  return data.state;
}

export async function resetCmsState(token: string): Promise<CmsState> {
  const res = await apiFetch('cms/reset', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await parseApiJson<{ state?: CmsState }>(res, 'Не удалось сбросить данные');
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
  const res = await apiFetch('leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseApiJson<{
    ok?: boolean;
    lead?: Pick<LeadSubmission, 'id' | 'createdAt' | 'status'>;
  }>(res, 'Ошибка отправки заявки');
  if (!res.ok || !data.ok || !data.lead) {
    throw new Error(data.error || 'Ошибка отправки заявки');
  }
  return { ok: true, lead: data.lead };
}

export async function fetchLeads(token: string): Promise<LeadSubmission[]> {
  const res = await apiFetch('leads', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await parseApiJson<{ leads?: LeadSubmission[] }>(res, 'Ошибка загрузки заявок');
  if (!res.ok) throw new Error(data.error || 'Ошибка загрузки заявок');
  return data.leads || [];
}

export async function updateLeadStatus(
  token: string,
  id: string,
  status: LeadSubmission['status'],
): Promise<LeadSubmission> {
  const res = await apiFetch(`leads/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
  const data = await parseApiJson<{ lead?: LeadSubmission }>(res, 'Ошибка обновления статуса');
  if (!res.ok || !data.lead) throw new Error(data.error || 'Ошибка обновления статуса');
  return data.lead;
}

export async function deleteLead(token: string, id: string): Promise<void> {
  const res = await apiFetch(`leads/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await parseApiJson<{ ok?: boolean }>(res, 'Ошибка удаления заявки');
  if (!res.ok) throw new Error(data.error || 'Ошибка удаления заявки');
}

export async function postAnalyticsEvent(payload: {
  goal: string;
  path: string;
  meta?: string;
}): Promise<void> {
  try {
    await apiFetch('analytics/event', {
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
  const res = await apiFetch('analytics/stats', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await parseApiJson<{
    events?: AnalyticsEventLog[];
    counts?: Record<string, number>;
  }>(res, 'Ошибка загрузки статистики');
  if (!res.ok) throw new Error(data.error || 'Ошибка загрузки статистики');
  return { events: data.events || [], counts: data.counts || {} };
}

export async function testWordPressSync(token: string, siteUrl: string): Promise<WordPressSettings> {
  const res = await apiFetch('wordpress/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ siteUrl }),
  });
  const data = await parseApiJson<{ wordpress?: WordPressSettings }>(res, 'Не удалось подключиться к WordPress');
  if (!res.ok || !data.wordpress) throw new Error(data.error || 'Не удалось подключиться к WordPress');
  return data.wordpress;
}
