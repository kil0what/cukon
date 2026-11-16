import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SlidingWindowLimiter,
  hashLegacySha256,
  hashPasswordPbkdf2,
  validateExternalHttpUrl,
  verifyPasswordHash,
} from './security';

test('PBKDF2 password hashing verifies matching passwords and upgrades legacy hashes', () => {
  const pbkdfHash = hashPasswordPbkdf2('StrongPass!2026');
  assert.ok(pbkdfHash.startsWith('pbkdf2_sha256$'));
  assert.deepEqual(verifyPasswordHash('StrongPass!2026', pbkdfHash), {
    valid: true,
    needsUpgrade: false,
  });
  assert.deepEqual(verifyPasswordHash('wrongpass', pbkdfHash), {
    valid: false,
    needsUpgrade: false,
  });

  const legacy = hashLegacySha256('tsukon2026');
  assert.deepEqual(verifyPasswordHash('tsukon2026', legacy), {
    valid: true,
    needsUpgrade: true,
  });
  assert.deepEqual(verifyPasswordHash('bad', legacy), {
    valid: false,
    needsUpgrade: false,
  });
});

test('SlidingWindowLimiter blocks after threshold and resets cleanly', () => {
  const limiter = new SlidingWindowLimiter(3, 60_000);
  const t0 = 1_000_000;
  assert.equal(limiter.record('1.2.3.4', t0), true);
  assert.equal(limiter.record('1.2.3.4', t0 + 10), true);
  assert.equal(limiter.record('1.2.3.4', t0 + 20), true);
  assert.equal(limiter.isLimited('1.2.3.4', t0 + 30), true);
  assert.equal(limiter.record('1.2.3.4', t0 + 30), false);

  // Separate IP is unaffected
  assert.equal(limiter.isLimited('5.6.7.8', t0 + 30), false);

  // Reset clears key
  limiter.reset('1.2.3.4');
  assert.equal(limiter.isLimited('1.2.3.4', t0 + 30), false);

  // Window expiry clears old entries
  assert.equal(limiter.record('9.9.9.9', t0), true);
  assert.equal(limiter.record('9.9.9.9', t0 + 1), true);
  assert.equal(limiter.record('9.9.9.9', t0 + 2), true);
  assert.equal(limiter.isLimited('9.9.9.9', t0 + 61_000), false);
});

test('validateExternalHttpUrl blocks localhost, private IPs, and unsafe schemes (SSRF protection)', () => {
  assert.equal(validateExternalHttpUrl('https://cms.tsukon.ru').ok, true);
  assert.equal(validateExternalHttpUrl('http://localhost:8080').ok, false);
  assert.equal(validateExternalHttpUrl('http://127.0.0.1/wp-json').ok, false);
  assert.equal(validateExternalHttpUrl('http://169.254.169.254/latest/meta-data').ok, false);
  assert.equal(validateExternalHttpUrl('http://192.168.1.10').ok, false);
  assert.equal(validateExternalHttpUrl('http://10.0.0.1').ok, false);
  assert.equal(validateExternalHttpUrl('http://[::1]/').ok, false);
  assert.equal(validateExternalHttpUrl('file:///etc/passwd').ok, false);
  assert.equal(validateExternalHttpUrl('https://user:pass@cms.tsukon.ru').ok, false);
});
