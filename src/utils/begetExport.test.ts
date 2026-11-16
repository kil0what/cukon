import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CMS_STATE } from '../shared/defaultData';
import { buildBegetPackageFiles } from './begetExport';

test('buildBegetPackageFiles creates complete PHP + htaccess + CMS seed files for Beget without WordPress', () => {
  const files = buildBegetPackageFiles(DEFAULT_CMS_STATE, 'testhash123');
  assert.ok(files['.htaccess'].includes('api.php?route=$1'));
  assert.ok(files['.htaccess'].includes('HTTP_AUTHORIZATION'));
  assert.ok(files['.htaccess'].includes('X-Content-Type-Options'));
  assert.ok(files['.htaccess'].includes('Options -Indexes'));
  assert.ok(files['.htaccess'].includes('sitemap'));
  assert.ok(files['data/.htaccess'].includes('Require all denied'));
  assert.ok(files['api.php'].includes('tsukon_require_auth'));
  assert.ok(files['api.php'].includes('tsukon_verify_password'));
  assert.ok(files['api.php'].includes('TSUKON_LOGIN_LIMIT_FILE'));
  assert.ok(files['api.php'].includes('tsukon_revoke_other_tokens'));
  assert.ok(!files['api.php'].includes('tsukon2026'));
  assert.ok(files['api.php'].includes('auth/login'));
  assert.ok(files['api.php'].includes('llms.txt'));
  assert.ok(files['api.php'].includes('leads'));

  const parsed = JSON.parse(files['data/default-cms.json']) as {
    adminPasswordHash: string;
    state: { rooms: unknown[] };
  };
  assert.equal(parsed.adminPasswordHash, 'testhash123');
  assert.equal(parsed.state.rooms.length, DEFAULT_CMS_STATE.rooms.length);
});
