import test from 'node:test';
import assert from 'node:assert/strict';
import { apiFetch, parseApiJson, type FetchLike } from './api';

test('parseApiJson parses valid JSON and rejects HTML DOCTYPE responses with a clear message', async () => {
  const okRes = new Response(JSON.stringify({ token: 'abc123' }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
  const parsed = await parseApiJson<{ token: string }>(okRes, 'Ошибка');
  assert.equal(parsed.token, 'abc123');

  const spaHtmlRes = new Response('<!doctype html><html><body><div id="root"></div></body></html>', {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
  await assert.rejects(
    () => parseApiJson(spaHtmlRes, 'Ошибка авторизации'),
    /статическая копия сайта|api\.php/i,
  );

  const genericHtmlRes = new Response('<!DOCTYPE html><html><body>404 Not Found</body></html>', {
    status: 404,
    headers: { 'content-type': 'text/html' },
  });
  await assert.rejects(
    () => parseApiJson(genericHtmlRes, 'Ошибка авторизации'),
    /Бэкенд CMS не ответил/i,
  );
});

test('apiFetch automatically falls back to api.php?route=... when /api/<route> returns 404 HTML', async () => {
  const calls: string[] = [];
  const mockFetch: FetchLike = async (input) => {
    const url = String(input);
    calls.push(url);
    if (url.startsWith('/api/')) {
      return new Response('<!DOCTYPE html><html><body>404</body></html>', {
        status: 404,
        headers: { 'content-type': 'text/html' },
      });
    }
    return new Response(JSON.stringify({ token: 'php-token' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  const res = await apiFetch('auth/login', { method: 'POST' }, mockFetch);
  assert.deepEqual(calls, ['/api/auth/login', 'api.php?route=auth%2Flogin']);
  const body = await parseApiJson<{ token: string }>(res, 'Ошибка');
  assert.equal(body.token, 'php-token');
});
