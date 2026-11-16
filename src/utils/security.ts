import crypto from 'node:crypto';
import net from 'node:net';

const PBKDF2_PREFIX = 'pbkdf2_sha256';
const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_KEYLEN = 32;

export function hashLegacySha256(password: string): string {
  return crypto.createHash('sha256').update(`tsukon_salt_${password}`).digest('hex');
}

export function hashPasswordPbkdf2(password: string, saltHex?: string): string {
  const salt = saltHex || crypto.randomBytes(16).toString('hex');
  const derived = crypto
    .pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, 'sha256')
    .toString('hex');
  return `${PBKDF2_PREFIX}$${salt}$${derived}`;
}

function timingSafeHexEqual(aHex: string, bHex: string): boolean {
  if (aHex.length !== bHex.length || aHex.length === 0) return false;
  const aBuf = Buffer.from(aHex, 'utf-8');
  const bBuf = Buffer.from(bHex, 'utf-8');
  return aBuf.length === bBuf.length && crypto.timingSafeEqual(aBuf, bBuf);
}

export function verifyPasswordHash(
  password: string,
  storedHash: string,
): { valid: boolean; needsUpgrade: boolean } {
  if (!storedHash) {
    return { valid: false, needsUpgrade: false };
  }

  if (storedHash.startsWith(`${PBKDF2_PREFIX}$`)) {
    const parts = storedHash.split('$');
    if (parts.length !== 3) {
      return { valid: false, needsUpgrade: false };
    }
    const [, saltHex, expectedHex] = parts;
    if (!saltHex || !expectedHex) {
      return { valid: false, needsUpgrade: false };
    }
    const candidate = crypto
      .pbkdf2Sync(password, saltHex, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, 'sha256')
      .toString('hex');
    return { valid: timingSafeHexEqual(candidate, expectedHex), needsUpgrade: false };
  }

  const legacyCandidate = hashLegacySha256(password);
  const valid = timingSafeHexEqual(legacyCandidate, storedHash);
  return { valid, needsUpgrade: valid };
}

export class SlidingWindowLimiter {
  private readonly store = new Map<string, number[]>();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts: number, windowMs: number) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isLimited(key: string, now = Date.now()): boolean {
    const recent = (this.store.get(key) || []).filter((ts) => now - ts < this.windowMs);
    this.store.set(key, recent);
    return recent.length >= this.maxAttempts;
  }

  record(key: string, now = Date.now()): boolean {
    const recent = (this.store.get(key) || []).filter((ts) => now - ts < this.windowMs);
    if (recent.length >= this.maxAttempts) {
      this.store.set(key, recent);
      return false;
    }
    recent.push(now);
    this.store.set(key, recent);
    return true;
  }

  reset(key: string): void {
    this.store.delete(key);
  }
}

function isPrivateOrReservedIpv4(ip: string): boolean {
  const parts = ip.split('.').map((p) => Number(p));
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return true;
  }
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a >= 224) return true;
  return false;
}

function isPrivateOrReservedIp(ip: string): boolean {
  const normalized = ip.replace(/^\[|\]$/g, '').toLowerCase();
  const ver = net.isIP(normalized);
  if (ver === 4) {
    return isPrivateOrReservedIpv4(normalized);
  }
  if (ver === 6) {
    if (normalized === '::' || normalized === '::1') return true;
    if (normalized.startsWith('::ffff:')) {
      const mapped = normalized.slice('::ffff:'.length);
      if (net.isIP(mapped) === 4) {
        return isPrivateOrReservedIpv4(mapped);
      }
    }
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
    if (
      normalized.startsWith('fe8') ||
      normalized.startsWith('fe9') ||
      normalized.startsWith('fea') ||
      normalized.startsWith('feb')
    ) {
      return true;
    }
    return false;
  }
  return false;
}

export function validateExternalHttpUrl(
  rawUrl: string,
): { ok: true; normalized: string } | { ok: false; error: string } {
  const trimmed = rawUrl.trim().replace(/\/+$/, '');
  if (!trimmed) {
    return { ok: false, error: 'Укажите корректный URL WordPress сайта (например, https://cms.tsukon.ru)' };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, error: 'Некорректный формат URL WordPress сайта.' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, error: 'Разрешены только протоколы HTTP и HTTPS.' };
  }
  if (parsed.username || parsed.password) {
    return { ok: false, error: 'URL не должен содержать логин или пароль.' };
  }

  const rawHost = parsed.hostname.toLowerCase();
  const host = rawHost.replace(/^\[|\]$/g, '');
  if (
    !host ||
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  ) {
    return { ok: false, error: 'Локальные и внутренние адреса не допускаются.' };
  }

  if (net.isIP(host) !== 0 && isPrivateOrReservedIp(host)) {
    return { ok: false, error: 'Приватные и системные IP-адреса не допускаются.' };
  }

  return { ok: true, normalized: parsed.toString().replace(/\/+$/, '') };
}
