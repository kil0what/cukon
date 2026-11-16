import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';
import JSZip from 'jszip';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { DEFAULT_CMS_STATE } from './src/shared/defaultData';
import type { AnalyticsEventLog, CmsState, LeadSubmission } from './src/shared/types';
import {
  clampFeaturedFreeLimit,
  generateLlmsTxt,
  generateRobotsTxt,
  generateSitemapXml,
  validateLeadSubmission,
} from './src/utils/catalog';
import { buildWordPressThemeFiles, buildWordPressWxrXml } from './src/utils/wordpressExport';
import { buildBegetPackageFiles } from './src/utils/begetExport';
import {
  SlidingWindowLimiter,
  hashPasswordPbkdf2,
  validateExternalHttpUrl,
  verifyPasswordHash,
} from './src/utils/security';

function addDirToZip(zip: JSZip, rootDir: string, currentDir: string): void {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(currentDir, entry.name);
    const rel = path.relative(rootDir, full).replace(/\\/g, '/');
    if (rel === 'assets/aistudio' || rel.startsWith('assets/aistudio/')) {
      continue;
    }
    if (entry.isDirectory()) {
      addDirToZip(zip, rootDir, full);
    } else if (entry.isFile()) {
      zip.file(rel, fs.readFileSync(full));
    }
  }
}

dotenv.config();

interface PersistedDatabase {
  state: CmsState;
  leads: LeadSubmission[];
  analyticsEvents: AnalyticsEventLog[];
  adminPasswordHash: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'cms-data.json');
const PORT = Number(process.env.PORT || 3000);

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

function loadDatabase(): PersistedDatabase {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const defaultPwd = process.env.CMS_ADMIN_PASSWORD?.trim() || 'tsukon2026';

  if (fs.existsSync(DATA_FILE)) {
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<PersistedDatabase>;
      if (parsed && parsed.state && Array.isArray(parsed.state.objects) && Array.isArray(parsed.state.rooms)) {
        return {
          state: parsed.state,
          leads: Array.isArray(parsed.leads) ? parsed.leads : [],
          analyticsEvents: Array.isArray(parsed.analyticsEvents) ? parsed.analyticsEvents : [],
          adminPasswordHash: parsed.adminPasswordHash || hashPasswordPbkdf2(defaultPwd),
        };
      }
    } catch (err) {
      console.error('Failed to read CMS database, re-seeding defaults:', err);
    }
  }

  const initial: PersistedDatabase = {
    state: structuredClone(DEFAULT_CMS_STATE),
    leads: [],
    analyticsEvents: [],
    adminPasswordHash: hashPasswordPbkdf2(defaultPwd),
  };
  saveDatabase(initial);
  return initial;
}

function saveDatabase(db: PersistedDatabase): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmpFile = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(db, null, 2), 'utf-8');
  fs.renameSync(tmpFile, DATA_FILE);
}

let db = loadDatabase();
const activeTokens = new Map<string, number>();
const loginLimiter = new SlidingWindowLimiter(8, 15 * 60 * 1000);
const leadLimiter = new SlidingWindowLimiter(12, 5 * 60 * 1000);
const analyticsLimiter = new SlidingWindowLimiter(60, 60 * 1000);

function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

async function trySendLeadEmail(lead: LeadSubmission, recipient: string): Promise<{ sent: boolean; note: string }> {
  if (!isSmtpConfigured()) {
    return {
      sent: false,
      note: `Сохранено в журнале CMS. Для прямой SMTP-отправки на ${recipient} задайте SMTP_HOST, SMTP_USER и SMTP_PASS в переменных окружения сервера.`,
    };
  }
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: process.env.SMTP_SECURE !== 'false',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    const subject =
      lead.type === 'owner'
        ? `ЦУКОН: Заявка от собственника (${lead.name})`
        : `ЦУКОН: Подбор помещения (${lead.name})`;
    const text = [
      `Тип заявки: ${lead.type === 'owner' ? 'Передать объект в управление' : 'Подобрать помещение'}`,
      `Имя: ${lead.name}`,
      `Телефон: ${lead.phone}`,
      `Email: ${lead.email || '—'}`,
      `${lead.type === 'owner' ? 'Объект' : 'Назначение'}: ${lead.purposeOrObject || '—'}`,
      `Площадь (м²): ${lead.area || '—'}`,
      `Комментарий: ${lead.message || '—'}`,
      `Дата: ${lead.createdAt}`,
    ].join('\n');

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: recipient,
      subject,
      text,
    });
    return { sent: true, note: `Письмо отправлено на ${recipient}` };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { sent: false, note: `Сохранено в CMS; ошибка SMTP: ${message}` };
  }
}

function getBaseUrl(req: Request): string {
  if (process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL') {
    return process.env.APP_URL;
  }
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.get('host') || `localhost:${PORT}`;
  return `${proto}://${host}`;
}

function extractBearerToken(req: Request): string {
  const auth = req.headers.authorization || '';
  return auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
}

function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractBearerToken(req);
  const expiresAt = token ? activeTokens.get(token) : undefined;
  if (!token || !expiresAt || expiresAt <= Date.now()) {
    if (token) activeTokens.delete(token);
    res.status(401).json({ error: 'Требуется авторизация в CMS' });
    return;
  }
  next();
}

function getClientIp(req: Request): string {
  return req.ip || req.socket.remoteAddress || 'unknown';
}

async function startServer(): Promise<void> {
  const app = express();
  app.disable('x-powered-by');
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });
  app.use(express.json({ limit: '5mb' }));

  // SEO & AI Discovery endpoints
  app.get('/sitemap.xml', (req, res) => {
    res.type('application/xml').send(generateSitemapXml(getBaseUrl(req), db.state));
  });

  app.get('/robots.txt', (req, res) => {
    res.type('text/plain').send(generateRobotsTxt(getBaseUrl(req)));
  });

  app.get('/llms.txt', (req, res) => {
    res.type('text/plain; charset=utf-8').send(generateLlmsTxt(getBaseUrl(req), db.state));
  });

  // Public CMS read
  app.get('/api/cms', (_req, res) => {
    res.json({
      state: db.state,
      leadsCount: db.leads.length,
      smtpConfigured: isSmtpConfigured(),
    });
  });

  // Admin auth
  app.post('/api/auth/login', (req, res) => {
    const ip = getClientIp(req);
    if (loginLimiter.isLimited(ip)) {
      res.status(429).json({ error: 'Слишком много неудачных попыток входа. Повторите через 15 минут.' });
      return;
    }

    const password = String(req.body?.password || '');
    const verification = verifyPasswordHash(password, db.adminPasswordHash);
    if (!verification.valid) {
      loginLimiter.record(ip);
      res.status(401).json({ error: 'Неверный пароль администратора' });
      return;
    }

    loginLimiter.reset(ip);
    if (verification.needsUpgrade) {
      db.adminPasswordHash = hashPasswordPbkdf2(password);
      saveDatabase(db);
    }

    const token = crypto.randomBytes(24).toString('hex');
    activeTokens.set(token, Date.now() + TOKEN_TTL_MS);
    res.json({ token });
  });

  app.post('/api/auth/password', requireAuth, (req, res) => {
    const nextPassword = String(req.body?.newPassword || '').trim();
    if (nextPassword.length < 6) {
      res.status(400).json({ error: 'Новый пароль должен содержать минимум 6 символов' });
      return;
    }
    db.adminPasswordHash = hashPasswordPbkdf2(nextPassword);
    saveDatabase(db);

    const currentToken = extractBearerToken(req);
    for (const token of activeTokens.keys()) {
      if (token !== currentToken) {
        activeTokens.delete(token);
      }
    }
    res.json({ ok: true });
  });

  // CMS Update
  app.put('/api/cms', requireAuth, (req, res) => {
    const incoming = req.body?.state as CmsState | undefined;
    if (!incoming || !Array.isArray(incoming.objects) || !Array.isArray(incoming.rooms)) {
      res.status(400).json({ error: 'Некорректная структура данных CMS' });
      return;
    }
    incoming.settings.featuredFreeLimit = clampFeaturedFreeLimit(incoming.settings.featuredFreeLimit);
    incoming.updatedAt = new Date().toISOString();
    db.state = incoming;
    saveDatabase(db);
    res.json({ ok: true, state: db.state });
  });

  app.post('/api/cms/reset', requireAuth, (_req, res) => {
    db.state = structuredClone(DEFAULT_CMS_STATE);
    db.state.updatedAt = new Date().toISOString();
    saveDatabase(db);
    res.json({ ok: true, state: db.state });
  });

  // Leads submission with server-side anti-spam + SMTP + persistence
  app.post('/api/leads', async (req, res) => {
    const ip = getClientIp(req);
    if (!leadLimiter.record(ip)) {
      res.status(429).json({ error: 'Слишком много запросов с одного адреса. Повторите через пару минут.' });
      return;
    }

    const body = req.body || {};
    if (typeof body.captchaExpected !== 'number' || !Number.isFinite(body.captchaExpected)) {
      res.status(400).json({ error: 'Не пройдена проверка защиты от спама.', code: 'spam_captcha' });
      return;
    }

    const validation = validateLeadSubmission({
      type: body.type === 'owner' ? 'owner' : 'tenant',
      name: String(body.name || ''),
      phone: String(body.phone || ''),
      email: String(body.email || ''),
      purposeOrObject: String(body.purposeOrObject || ''),
      area: String(body.area || ''),
      message: String(body.message || ''),
      consent: Boolean(body.consent),
      honeypot: String(body.honeypot || ''),
      elapsedMs: typeof body.elapsedMs === 'number' ? body.elapsedMs : 5000,
      captchaExpected: body.captchaExpected,
      captchaAnswer: body.captchaAnswer !== undefined ? String(body.captchaAnswer) : '',
    });

    if (!validation.ok) {
      res.status(400).json({ error: validation.error, code: validation.code });
      return;
    }

    const recipient = db.state.settings.contacts.leadRecipientEmail || db.state.settings.contacts.email;
    const lead: LeadSubmission = {
      id: crypto.randomUUID(),
      type: body.type === 'owner' ? 'owner' : 'tenant',
      name: String(body.name).trim(),
      phone: String(body.phone).trim(),
      email: String(body.email || '').trim(),
      purposeOrObject: String(body.purposeOrObject || '').trim(),
      area: String(body.area || '').trim(),
      message: String(body.message || '').trim(),
      status: 'new',
      createdAt: new Date().toISOString(),
      emailDispatched: false,
      emailNote: '',
    };

    const mailResult = await trySendLeadEmail(lead, recipient);
    lead.emailDispatched = mailResult.sent;
    lead.emailNote = mailResult.note;

    db.leads.unshift(lead);
    db.analyticsEvents.unshift({
      id: crypto.randomUUID(),
      goal: lead.type === 'owner' ? 'form_owner_submit' : 'form_tenant_submit',
      path: lead.type === 'owner' ? '/owners' : '/tenants',
      meta: `${lead.name} (${lead.phone})`,
      timestamp: new Date().toISOString(),
    });
    if (db.analyticsEvents.length > 200) db.analyticsEvents.length = 200;
    saveDatabase(db);

    res.status(201).json({
      ok: true,
      lead: {
        id: lead.id,
        status: lead.status,
        createdAt: lead.createdAt,
      },
    });
  });

  app.get('/api/leads', requireAuth, (_req, res) => {
    res.json({ leads: db.leads });
  });

  app.patch('/api/leads/:id', requireAuth, (req, res) => {
    const lead = db.leads.find((l) => l.id === req.params.id);
    if (!lead) {
      res.status(404).json({ error: 'Заявка не найдена' });
      return;
    }
    const status = req.body?.status;
    if (status === 'new' || status === 'in_progress' || status === 'done') {
      lead.status = status;
      saveDatabase(db);
    }
    res.json({ ok: true, lead });
  });

  app.delete('/api/leads/:id', requireAuth, (req, res) => {
    db.leads = db.leads.filter((l) => l.id !== req.params.id);
    saveDatabase(db);
    res.json({ ok: true });
  });

  // Analytics goal logger (mirrors Yandex.Metrika goals)
  app.post('/api/analytics/event', (req, res) => {
    const ip = getClientIp(req);
    if (!analyticsLimiter.record(ip)) {
      res.status(429).json({ error: 'rate limit exceeded' });
      return;
    }
    const goal = String(req.body?.goal || '').trim().slice(0, 64);
    if (!goal) {
      res.status(400).json({ error: 'goal required' });
      return;
    }
    db.analyticsEvents.unshift({
      id: crypto.randomUUID(),
      goal,
      path: String(req.body?.path || '/').slice(0, 160),
      meta: req.body?.meta ? String(req.body.meta).slice(0, 120) : undefined,
      timestamp: new Date().toISOString(),
    });
    if (db.analyticsEvents.length > 200) db.analyticsEvents.length = 200;
    saveDatabase(db);
    res.json({ ok: true });
  });

  app.get('/api/analytics/stats', requireAuth, (_req, res) => {
    const counts: Record<string, number> = {};
    for (const ev of db.analyticsEvents) {
      counts[ev.goal] = (counts[ev.goal] || 0) + 1;
    }
    res.json({ events: db.analyticsEvents.slice(0, 50), counts });
  });

  // WordPress Theme ZIP & WXR Export (CMS admin only)
  app.get('/api/wordpress/theme.zip', requireAuth, async (_req, res) => {
    const files = buildWordPressThemeFiles(db.state);
    const zip = new JSZip();
    for (const [filePath, content] of Object.entries(files)) {
      zip.file(filePath, content);
    }

    // Bundle generated complex & room photos directly into the WP theme
    const assetPairs: Array<[string, string]> = [
      ['production_workshop_interior_1794852671445.jpg', 'tsukon-theme/assets/images/production_workshop.jpg'],
      ['logistics_warehouse_interior_1794852671907.jpg', 'tsukon-theme/assets/images/logistics_warehouse.jpg'],
      ['business_center_office_1794852672605.jpg', 'tsukon-theme/assets/images/business_center_office.jpg'],
      ['industrial_park_exterior_1794852673408.jpg', 'tsukon-theme/assets/images/industrial_park_exterior.jpg'],
    ];
    for (const [srcName, zipDest] of assetPairs) {
      const fullPath = path.resolve(process.cwd(), 'src/assets/images', srcName);
      if (fs.existsSync(fullPath)) {
        zip.file(zipDest, fs.readFileSync(fullPath));
      }
    }

    const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="tsukon-wp-theme.zip"');
    res.send(buffer);
  });

  app.get('/api/wordpress/export.xml', requireAuth, (_req, res) => {
    const xml = buildWordPressWxrXml(db.state);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', 'attachment; filename="tsukon-wordpress.xml"');
    res.send(Buffer.from(xml, 'utf-8'));
  });

  // One-click Beget ZIP (CMS admin only: embeds adminPasswordHash inside default-cms.json)
  app.get('/api/beget/site.zip', requireAuth, async (_req, res) => {
    try {
      const distDir = path.resolve(process.cwd(), 'dist');
      if (!fs.existsSync(path.join(distDir, 'index.html'))) {
        const { build: viteBuild } = await import('vite');
        await viteBuild({ logLevel: 'silent' });
      }
      const zip = new JSZip();
      if (fs.existsSync(distDir)) {
        addDirToZip(zip, distDir, distDir);
      }
      const pkgFiles = buildBegetPackageFiles(db.state, db.adminPasswordHash);
      for (const [relPath, content] of Object.entries(pkgFiles)) {
        zip.file(relPath, content);
      }
      const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="tsukon-beget-site.zip"');
      res.send(buffer);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: `Ошибка сборки пакета для Beget: ${msg}` });
    }
  });

  app.post('/api/wordpress/sync', requireAuth, async (req, res) => {
    const rawSiteUrl = String(req.body?.siteUrl || db.state.settings.wordpress.siteUrl || '');
    const validatedUrl = validateExternalHttpUrl(rawSiteUrl);
    if (!validatedUrl.ok) {
      res.status(400).json({ error: validatedUrl.error });
      return;
    }
    const siteUrl = validatedUrl.normalized;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(`${siteUrl}/wp-json/wp/v2/types`, {
        signal: controller.signal,
        redirect: 'error',
      });
      clearTimeout(timeout);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} от WordPress REST API`);
      }
      const typesJson = (await response.json()) as Record<string, unknown>;
      const typeKeys = Object.keys(typesJson);
      db.state.settings.wordpress = {
        siteUrl,
        syncEnabled: true,
        lastSyncAt: new Date().toISOString(),
        lastSyncMessage: `Подключено к WP REST API (${typeKeys.length} типов записей: ${typeKeys.slice(0, 5).join(', ')})`,
      };
      saveDatabase(db);
      res.json({ ok: true, wordpress: db.state.settings.wordpress });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      db.state.settings.wordpress = {
        siteUrl,
        syncEnabled: false,
        lastSyncAt: new Date().toISOString(),
        lastSyncMessage: `Ошибка подключения к ${siteUrl}/wp-json: ${msg}`,
      };
      saveDatabase(db);
      res.status(502).json({ error: db.state.settings.wordpress.lastSyncMessage });
    }
  });

  // Never fall back to index.html for unknown /api/* endpoints
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Маршрут API не найден' });
  });

  // Vite / Static frontend serving
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use('/assets/aistudio', (_req, res) => {
      res.status(404).end();
    });
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ЦУКОН server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
