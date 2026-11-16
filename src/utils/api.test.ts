import test from 'node:test';
import assert from 'node:assert/strict';
import { parseApiJson } from './api';

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

  const genericHtmlRes = new Response('<!DOCTYPE html><html><body>502 Bad Gateway</body></html>', {
    status: 502,
    headers: { 'content-type': 'text/html' },
  });
  await assert.rejects(
    () => parseApiJson(genericHtmlRes, 'Ошибка авторизации'),
    /HTML вместо ответа API/i,
  );
});
