import type { CmsState } from '../shared/types';

export interface BegetPackageFiles {
  [relativePath: string]: string;
}

export function buildBegetPackageFiles(
  state: CmsState,
  initialPasswordHash: string,
): BegetPackageFiles {
  const htaccess = `Options -Indexes

<IfModule mod_headers.c>
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"
</IfModule>

<IfModule mod_rewrite.c>
  RewriteEngine On

  # Передача заголовка Authorization в PHP на Apache/Beget
  RewriteCond %{HTTP:Authorization} .
  RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

  # API встроенной CMS и заявки
  RewriteRule ^api/(.*)$ api.php?route=$1 [QSA,L]

  # SEO и ИИ-файлы
  RewriteRule ^sitemap\\.xml$ api.php?route=sitemap.xml [QSA,L]
  RewriteRule ^robots\\.txt$ api.php?route=robots.txt [QSA,L]
  RewriteRule ^llms\\.txt$ api.php?route=llms.txt [QSA,L]

  # Статика и SPA
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . index.html [L]
</IfModule>
`;

  const dataHtaccess = `<IfModule mod_authz_core.c>
  Require all denied
</IfModule>
<IfModule !mod_authz_core.c>
  Deny from all
</IfModule>
`;

  const defaultCmsJson = JSON.stringify(
    {
      state,
      leads: [],
      analyticsEvents: [],
      adminPasswordHash: initialPasswordHash,
    },
    null,
    2,
  );

  const apiPhp = `<?php
/**
 * ЦУКОН — лёгкий PHP-бэкенд для Beget (встроенная CMS #/admin, заявки, SEO/ИИ).
 * Работает в обычной папке public_html без WordPress, MySQL и Node.js.
 */
declare(strict_types=1);

const TSUKON_DATA_DIR = __DIR__ . '/data';
const TSUKON_DATA_FILE = TSUKON_DATA_DIR . '/cms-data.json';
const TSUKON_DEFAULT_FILE = TSUKON_DATA_DIR . '/default-cms.json';
const TSUKON_TOKENS_FILE = TSUKON_DATA_DIR . '/tokens.json';
const TSUKON_RATELIMIT_FILE = TSUKON_DATA_DIR . '/ratelimit.json';
const TSUKON_LOGIN_LIMIT_FILE = TSUKON_DATA_DIR . '/login-ratelimit.json';
const TSUKON_ANALYTICS_LIMIT_FILE = TSUKON_DATA_DIR . '/analytics-ratelimit.json';

function tsukon_json(int $status, array $payload): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function tsukon_ensure_storage(): void {
    if (!is_dir(TSUKON_DATA_DIR)) {
        @mkdir(TSUKON_DATA_DIR, 0755, true);
    }
    if (!file_exists(TSUKON_DATA_FILE)) {
        if (file_exists(TSUKON_DEFAULT_FILE)) {
            copy(TSUKON_DEFAULT_FILE, TSUKON_DATA_FILE);
        } else {
            tsukon_json(500, ['error' => 'Отсутствует файл data/default-cms.json']);
        }
    }
}

function tsukon_load_db(): array {
    tsukon_ensure_storage();
    $raw = file_get_contents(TSUKON_DATA_FILE);
    $db = json_decode($raw ?: '', true);
    if (!is_array($db) || !isset($db['state'])) {
        $def = json_decode(file_get_contents(TSUKON_DEFAULT_FILE) ?: '', true);
        return is_array($def) ? $def : [];
    }
    return $db;
}

function tsukon_save_db(array $db): void {
    tsukon_ensure_storage();
    $json = json_encode($db, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    file_put_contents(TSUKON_DATA_FILE, $json, LOCK_EX);
}

function tsukon_hash_password(string $pwd): string {
    $salt = bin2hex(random_bytes(16));
    $derived = hash_pbkdf2('sha256', $pwd, $salt, 100000, 64, false);
    return 'pbkdf2_sha256$' . $salt . '$' . $derived;
}

function tsukon_verify_password(string $pwd, string $storedHash): array {
    if ($storedHash === '') {
        return ['valid' => false, 'upgrade' => false];
    }
    if (strncmp($storedHash, 'pbkdf2_sha256$', 14) === 0) {
        $parts = explode('$', $storedHash);
        if (count($parts) !== 3 || $parts[1] === '' || $parts[2] === '') {
            return ['valid' => false, 'upgrade' => false];
        }
        $candidate = hash_pbkdf2('sha256', $pwd, $parts[1], 100000, 64, false);
        return ['valid' => hash_equals($parts[2], $candidate), 'upgrade' => false];
    }
    $legacy = hash('sha256', 'tsukon_salt_' . $pwd);
    $valid = hash_equals($storedHash, $legacy);
    return ['valid' => $valid, 'upgrade' => $valid];
}

function tsukon_get_bearer_token(): string {
    $hdr = $_SERVER['HTTP_AUTHORIZATION']
        ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
        ?? '';
    if (!$hdr && function_exists('apache_request_headers')) {
        $all = apache_request_headers();
        foreach ($all as $k => $v) {
            if (strtolower((string)$k) === 'authorization') {
                $hdr = (string)$v;
                break;
            }
        }
    }
    if (stripos($hdr, 'Bearer ') === 0) {
        return trim(substr($hdr, 7));
    }
    return '';
}

function tsukon_load_tokens(): array {
    if (!file_exists(TSUKON_TOKENS_FILE)) return [];
    $data = json_decode(file_get_contents(TSUKON_TOKENS_FILE) ?: '', true);
    if (!is_array($data)) return [];
    $now = time();
    return array_filter($data, static fn($exp) => is_int($exp) && $exp > $now);
}

function tsukon_issue_token(): string {
    $tokens = tsukon_load_tokens();
    $token = bin2hex(random_bytes(24));
    $tokens[$token] = time() + 86400;
    file_put_contents(TSUKON_TOKENS_FILE, json_encode($tokens), LOCK_EX);
    return $token;
}

function tsukon_revoke_other_tokens(string $keepToken): void {
    $tokens = tsukon_load_tokens();
    if ($keepToken !== '' && isset($tokens[$keepToken])) {
        $kept = [$keepToken => $tokens[$keepToken]];
    } else {
        $kept = [];
    }
    file_put_contents(TSUKON_TOKENS_FILE, json_encode($kept), LOCK_EX);
}

function tsukon_require_auth(): void {
    $token = tsukon_get_bearer_token();
    $tokens = tsukon_load_tokens();
    if (!$token || !isset($tokens[$token])) {
        tsukon_json(401, ['error' => 'Требуется авторизация в CMS']);
    }
}

function tsukon_read_body(): array {
    $raw = file_get_contents('php://input');
    if (!$raw) return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function tsukon_base_url(): string {
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https')
        || (($_SERVER['SERVER_PORT'] ?? '') === '443');
    $scheme = $https ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'цукон.рф';
    return $scheme . '://' . $host;
}

function tsukon_sliding_check(string $file, string $ip, int $max, int $windowSec, bool $recordNow): bool {
    tsukon_ensure_storage();
    $map = [];
    if (file_exists($file)) {
        $parsed = json_decode(file_get_contents($file) ?: '', true);
        if (is_array($parsed)) $map = $parsed;
    }
    $now = time();
    $recent = array_values(array_filter($map[$ip] ?? [], static fn($ts) => ($now - (int)$ts) < $windowSec));
    if (count($recent) >= $max) {
        $map[$ip] = $recent;
        file_put_contents($file, json_encode($map), LOCK_EX);
        return false;
    }
    if ($recordNow) {
        $recent[] = $now;
        $map[$ip] = $recent;
        file_put_contents($file, json_encode($map), LOCK_EX);
    }
    return true;
}

function tsukon_reset_ratelimit(string $file, string $ip): void {
    if (!file_exists($file)) return;
    $parsed = json_decode(file_get_contents($file) ?: '', true);
    if (!is_array($parsed)) return;
    unset($parsed[$ip]);
    file_put_contents($file, json_encode($parsed), LOCK_EX);
}

function tsukon_check_ratelimit(string $ip): bool {
    return tsukon_sliding_check(TSUKON_RATELIMIT_FILE, $ip, 12, 300, true);
}

$route = trim((string)($_GET['route'] ?? ''), '/');
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$db = tsukon_load_db();

// SEO & AI Discovery endpoints
if ($route === 'sitemap.xml' && $method === 'GET') {
    header('Content-Type: application/xml; charset=utf-8');
    $base = rtrim(tsukon_base_url(), '/');
    $slugs = ['', 'objects', 'tenants', 'owners', 'residents', 'about', 'faq', 'guide-production', 'guide-warehouses', 'guide-utilities', 'guide-terms', 'contacts', 'privacy-policy'];
    $urls = '';
    foreach ($slugs as $s) {
        $loc = $s === '' ? $base . '/' : $base . '/#/' . $s;
        $prio = ($s === '' || $s === 'objects' || $s === 'faq' || strncmp($s, 'guide-', 6) === 0) ? '0.9' : '0.7';
        $urls .= "  <url><loc>" . htmlspecialchars($loc, ENT_XML1) . "</loc><changefreq>weekly</changefreq><priority>{$prio}</priority></url>\\n";
    }
    echo "<?xml version=\\"1.0\\" encoding=\\"UTF-8\\"?>\\n<urlset xmlns=\\"http://www.sitemaps.org/schemas/sitemap/0.9\\">\\n{$urls}</urlset>";
    exit;
}

if ($route === 'robots.txt' && $method === 'GET') {
    header('Content-Type: text/plain; charset=utf-8');
    $base = rtrim(tsukon_base_url(), '/');
    echo "User-agent: *\\nAllow: /\\nDisallow: /#/admin\\nDisallow: /api/\\nDisallow: /data/\\nSitemap: {$base}/sitemap.xml\\n";
    exit;
}

if ($route === 'llms.txt' && $method === 'GET') {
    header('Content-Type: text/plain; charset=utf-8');
    $base = rtrim(tsukon_base_url(), '/');
    $contacts = $db['state']['settings']['contacts'] ?? [];
    $lines = [
        '# ' . ($contacts['companyName'] ?? 'ООО «ЦУКОН»'),
        '> Управляющая компания производственно-коммерческой недвижимостью в Республике Мордовия (г. Саранск).',
        '',
        '## Разделы сайта и подробные страницы для ИИ',
        "- Главная: {$base}/",
        "- Каталог объектов и помещений: {$base}/#/objects",
        "- Производственные помещения (кВт, площади): {$base}/#/guide-production",
        "- Склады, офисы и площадки для грузового транспорта: {$base}/#/guide-warehouses",
        "- Коммуникации, обслуживание и охрана: {$base}/#/guide-utilities",
        "- Условия аренды, точные площади и стоимость: {$base}/#/guide-terms",
        "- FAQ: {$base}/#/faq",
        '',
        '## Свободные помещения сейчас',
    ];
    $objectsById = [];
    foreach ($db['state']['objects'] ?? [] as $o) {
        $objectsById[$o['id']] = $o;
    }
    foreach ($db['state']['rooms'] ?? [] as $r) {
        if (($r['status'] ?? '') === 'free') {
            $obj = $objectsById[$r['objectId'] ?? 0] ?? [];
            $lines[] = "- {$r['title']} ({$r['area']} м², {$r['pricePerSqm']} ₽/м² в мес.) — " . ($obj['address'] ?? '');
        }
    }
    $lines[] = '';
    $lines[] = '## Контакты';
    $lines[] = 'Телефон: ' . ($contacts['phoneDisplay'] ?? '');
    $lines[] = 'Email: ' . ($contacts['email'] ?? '');
    $lines[] = 'Адрес: ' . ($contacts['legalAddress'] ?? '');
    echo implode("\\n", $lines);
    exit;
}

// Public CMS read
if ($route === 'cms' && $method === 'GET') {
    tsukon_json(200, [
        'state' => $db['state'],
        'leadsCount' => count($db['leads'] ?? []),
        'smtpConfigured' => true,
    ]);
}

// Auth login
if ($route === 'auth/login' && $method === 'POST') {
    $ip = (string)($_SERVER['REMOTE_ADDR'] ?? 'unknown');
    if (!tsukon_sliding_check(TSUKON_LOGIN_LIMIT_FILE, $ip, 8, 900, false)) {
        tsukon_json(429, ['error' => 'Слишком много неудачных попыток входа. Повторите через 15 минут.']);
    }
    $body = tsukon_read_body();
    $pwd = (string)($body['password'] ?? '');
    $expectedHash = (string)($db['adminPasswordHash'] ?? '');
    $check = tsukon_verify_password($pwd, $expectedHash);
    if (!$check['valid']) {
        tsukon_sliding_check(TSUKON_LOGIN_LIMIT_FILE, $ip, 8, 900, true);
        tsukon_json(401, ['error' => 'Неверный пароль администратора']);
    }
    tsukon_reset_ratelimit(TSUKON_LOGIN_LIMIT_FILE, $ip);
    if ($check['upgrade']) {
        $db['adminPasswordHash'] = tsukon_hash_password($pwd);
        tsukon_save_db($db);
    }
    tsukon_json(200, ['token' => tsukon_issue_token()]);
}

// Change admin password
if ($route === 'auth/password' && $method === 'POST') {
    tsukon_require_auth();
    $body = tsukon_read_body();
    $next = trim((string)($body['newPassword'] ?? ''));
    if (mb_strlen($next) < 6) {
        tsukon_json(400, ['error' => 'Новый пароль должен содержать минимум 6 символов']);
    }
    $db['adminPasswordHash'] = tsukon_hash_password($next);
    tsukon_save_db($db);
    tsukon_revoke_other_tokens(tsukon_get_bearer_token());
    tsukon_json(200, ['ok' => true]);
}

// Save CMS state
if ($route === 'cms' && $method === 'PUT') {
    tsukon_require_auth();
    $body = tsukon_read_body();
    $incoming = $body['state'] ?? null;
    if (!is_array($incoming) || !isset($incoming['objects'], $incoming['rooms'])) {
        tsukon_json(400, ['error' => 'Некорректная структура данных CMS']);
    }
    $limit = (int)($incoming['settings']['featuredFreeLimit'] ?? 6);
    $incoming['settings']['featuredFreeLimit'] = max(5, min(7, $limit));
    $incoming['updatedAt'] = gmdate('c');
    $db['state'] = $incoming;
    tsukon_save_db($db);
    tsukon_json(200, ['ok' => true, 'state' => $db['state']]);
}

// Reset CMS state
if ($route === 'cms/reset' && $method === 'POST') {
    tsukon_require_auth();
    $def = json_decode(file_get_contents(TSUKON_DEFAULT_FILE) ?: '', true);
    if (!is_array($def) || !isset($def['state'])) {
        tsukon_json(500, ['error' => 'Не найден файл default-cms.json']);
    }
    $db['state'] = $def['state'];
    $db['state']['updatedAt'] = gmdate('c');
    tsukon_save_db($db);
    tsukon_json(200, ['ok' => true, 'state' => $db['state']]);
}

// Leads submission with anti-spam + PHP mail()
if ($route === 'leads' && $method === 'POST') {
    $ip = (string)($_SERVER['REMOTE_ADDR'] ?? 'unknown');
    if (!tsukon_check_ratelimit($ip)) {
        tsukon_json(429, ['error' => 'Слишком много запросов с одного адреса. Повторите через пару минут.']);
    }
    $body = tsukon_read_body();
    if (trim((string)($body['honeypot'] ?? '')) !== '') {
        tsukon_json(400, ['error' => 'Заявка отклонена защитой от спама.', 'code' => 'spam_honeypot']);
    }
    $elapsed = (int)($body['elapsedMs'] ?? 5000);
    if ($elapsed < 1200) {
        tsukon_json(400, ['error' => 'Слишком быстрая отправка формы. Повторите через секунду.', 'code' => 'spam_timing']);
    }
    $capExp = $body['captchaExpected'] ?? null;
    $capAns = trim((string)($body['captchaAnswer'] ?? ''));
    if ($capExp === null || !is_numeric($capExp) || $capAns === '' || (int)$capAns !== (int)$capExp) {
        tsukon_json(400, ['error' => 'Неверный ответ на контрольный вопрос защиты от спама.', 'code' => 'spam_captcha']);
    }
    if (empty($body['consent'])) {
        tsukon_json(400, ['error' => 'Необходимо согласие на обработку персональных данных.']);
    }
    $name = trim((string)($body['name'] ?? ''));
    $phone = trim((string)($body['phone'] ?? ''));
    $email = trim((string)($body['email'] ?? ''));
    if (mb_strlen($name) < 2) tsukon_json(400, ['error' => 'Укажите имя или название компании.']);
    if (mb_strlen($phone) < 6) tsukon_json(400, ['error' => 'Укажите корректный номер телефона.']);

    $recipient = $db['state']['settings']['contacts']['leadRecipientEmail']
        ?? $db['state']['settings']['contacts']['email']
        ?? 'zukonar@mail.ru';
    $type = ($body['type'] ?? 'tenant') === 'owner' ? 'owner' : 'tenant';
    $purposeOrObject = trim((string)($body['purposeOrObject'] ?? ''));
    $area = trim((string)($body['area'] ?? ''));
    $message = trim((string)($body['message'] ?? ''));

    $subjectText = $type === 'owner'
        ? "ЦУКОН: Заявка от собственника ({$name})"
        : "ЦУКОН: Подбор помещения ({$name})";
    $subject = '=?UTF-8?B?' . base64_encode($subjectText) . '?=';
    $mailBody = "Тип заявки: " . ($type === 'owner' ? 'Передать объект в управление' : 'Подобрать помещение') . "\\n"
        . "Имя: {$name}\\n"
        . "Телефон: {$phone}\\n"
        . "Email: " . ($email ?: '—') . "\\n"
        . "Объект/Назначение: " . ($purposeOrObject ?: '—') . "\\n"
        . "Площадь (м²): " . ($area ?: '—') . "\\n"
        . "Комментарий: " . ($message ?: '—') . "\\n"
        . "Дата: " . date('Y-m-d H:i:s') . "\\n";
    $headers = "MIME-Version: 1.0\\r\\nContent-Type: text/plain; charset=UTF-8\\r\\nFrom: noreply@xn--j1abm5d.xn--p1ai\\r\\n";
    $sent = @mail($recipient, $subject, $mailBody, $headers);

    $lead = [
        'id' => bin2hex(random_bytes(12)),
        'type' => $type,
        'name' => $name,
        'phone' => $phone,
        'email' => $email,
        'purposeOrObject' => $purposeOrObject,
        'area' => $area,
        'message' => $message,
        'status' => 'new',
        'createdAt' => gmdate('c'),
        'emailDispatched' => (bool)$sent,
        'emailNote' => $sent
            ? "Письмо отправлено на {$recipient}"
            : "Сохранено в журнале CMS (проверьте настройки исходящей почты в панели Beget)",
    ];
    array_unshift($db['leads'], $lead);
    array_unshift($db['analyticsEvents'], [
        'id' => bin2hex(random_bytes(12)),
        'goal' => $type === 'owner' ? 'form_owner_submit' : 'form_tenant_submit',
        'path' => $type === 'owner' ? '/owners' : '/tenants',
        'meta' => "{$name} ({$phone})",
        'timestamp' => gmdate('c'),
    ]);
    $db['analyticsEvents'] = array_slice($db['analyticsEvents'], 0, 200);
    tsukon_save_db($db);

    tsukon_json(201, [
        'ok' => true,
        'lead' => [
            'id' => $lead['id'],
            'status' => $lead['status'],
            'createdAt' => $lead['createdAt'],
        ],
    ]);
}

// Leads CRUD (admin)
if ($route === 'leads' && $method === 'GET') {
    tsukon_require_auth();
    tsukon_json(200, ['leads' => array_values($db['leads'] ?? [])]);
}

if (preg_match('#^leads/([^/]+)$#', $route, $m)) {
    tsukon_require_auth();
    $targetId = $m[1];
    if ($method === 'PATCH') {
        $body = tsukon_read_body();
        $st = $body['status'] ?? '';
        foreach ($db['leads'] as &$l) {
            if (($l['id'] ?? '') === $targetId && in_array($st, ['new', 'in_progress', 'done'], true)) {
                $l['status'] = $st;
                tsukon_save_db($db);
                tsukon_json(200, ['ok' => true, 'lead' => $l]);
            }
        }
        tsukon_json(404, ['error' => 'Заявка не найдена']);
    }
    if ($method === 'DELETE') {
        $db['leads'] = array_values(array_filter($db['leads'] ?? [], static fn($l) => ($l['id'] ?? '') !== $targetId));
        tsukon_save_db($db);
        tsukon_json(200, ['ok' => true]);
    }
}

// Analytics
if ($route === 'analytics/event' && $method === 'POST') {
    $ip = (string)($_SERVER['REMOTE_ADDR'] ?? 'unknown');
    if (!tsukon_sliding_check(TSUKON_ANALYTICS_LIMIT_FILE, $ip, 60, 60, true)) {
        tsukon_json(429, ['error' => 'rate limit exceeded']);
    }
    $body = tsukon_read_body();
    $goal = mb_substr(trim((string)($body['goal'] ?? '')), 0, 64);
    if (!$goal) tsukon_json(400, ['error' => 'goal required']);
    array_unshift($db['analyticsEvents'], [
        'id' => bin2hex(random_bytes(12)),
        'goal' => $goal,
        'path' => mb_substr((string)($body['path'] ?? '/'), 0, 160),
        'meta' => isset($body['meta']) ? mb_substr((string)$body['meta'], 0, 120) : null,
        'timestamp' => gmdate('c'),
    ]);
    $db['analyticsEvents'] = array_slice($db['analyticsEvents'], 0, 200);
    tsukon_save_db($db);
    tsukon_json(200, ['ok' => true]);
}

if ($route === 'analytics/stats' && $method === 'GET') {
    tsukon_require_auth();
    $counts = [];
    foreach ($db['analyticsEvents'] ?? [] as $ev) {
        $g = (string)($ev['goal'] ?? '');
        if ($g !== '') $counts[$g] = ($counts[$g] ?? 0) + 1;
    }
    tsukon_json(200, [
        'events' => array_slice($db['analyticsEvents'] ?? [], 0, 50),
        'counts' => $counts,
    ]);
}

tsukon_json(404, ['error' => 'Маршрут API не найден']);
`;

  const readmeBeget = `ЦУКОН — Готовый пакет сайта со встроенной CMS для хостинга Beget (БЕЗ WordPress)
================================================================================

Как выложить на сайт цукон.рф за 3 минуты:
1. Войдите в панель Beget (cp.beget.com) -> раздел «Хостинг» -> «Файловый менеджер».
2. Откройте папку вашего сайта: /cukon.rf/public_html (для домена цукон.рф).
   (Если внутри лежат файлы старого сайта 2016 года — выделите их и удалите или перенесите в отдельную резервную папку.)
3. Нажмите «Загрузить файлы» и загрузите этот архив tsukon-beget-site.zip прямо в public_html.
4. Нажмите правой кнопкой по архиву -> «Распаковать архив» (в корне public_html должны появиться index.html, api.php, .htaccess и папки assets, data, src).
5. Готово! Сайт работает по адресу https://цукон.рф, а встроенная CMS — по адресу https://цукон.рф/#/admin.
   Все изменения (объекты, помещения, цены, статусы, тексты, FAQ, заявки) сохраняются прямо на вашем Beget в папке data/.
`;

  return {
    '.htaccess': htaccess,
    'api.php': apiPhp,
    'data/.htaccess': dataHtaccess,
    'data/default-cms.json': defaultCmsJson,
    'README-BEGET.txt': readmeBeget,
  };
}
