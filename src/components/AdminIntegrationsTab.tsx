import { useState } from 'react';
import JSZip from 'jszip';
import { BarChart3, Check, Copy, Download, FileCode2, Globe, RefreshCw, Server } from 'lucide-react';
import { ASSET_IMAGES } from '../shared/defaultData';
import type { AnalyticsEventLog, CmsState } from '../shared/types';
import { saveCmsState, testWordPressSync } from '../utils/api';
import { buildWordPressThemeFiles, buildWordPressWxrXml } from '../utils/wordpressExport';

interface AdminIntegrationsTabProps {
  draft: CmsState;
  token: string;
  analyticsStats: { events: AnalyticsEventLog[]; counts: Record<string, number> };
  onChangeDraft: (updater: (prev: CmsState) => CmsState) => void;
  onRefreshStats: () => void;
}

export function AdminIntegrationsTab({
  draft,
  token,
  analyticsStats,
  onChangeDraft,
  onRefreshStats,
}: AdminIntegrationsTabProps) {
  const [wpUrl, setWpUrl] = useState(draft.settings.wordpress.siteUrl);
  const [wpBusy, setWpBusy] = useState(false);
  const [wpStatus, setWpStatus] = useState<string | null>(null);
  const [showXmlPreview, setShowXmlPreview] = useState(false);
  const [xmlCopied, setXmlCopied] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [begetBusy, setBegetBusy] = useState(false);
  const [begetNotice, setBegetNotice] = useState<string | null>(null);

  const triggerBlobDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  };

  const handleDownloadBegetZip = async () => {
    setBegetBusy(true);
    setBegetNotice(null);
    try {
      if (token) {
        await saveCmsState(token, draft).catch(() => undefined);
      }
      const res = await fetch('/api/beget/site.zip', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const blob = await res.blob();
      triggerBlobDownload(blob, 'tsukon-beget-site.zip');
      setBegetNotice(
        'Архив tsukon-beget-site.zip готов! Загрузите его в Beget (Файловый менеджер → cukon.rf/public_html) и нажмите «Распаковать».',
      );
    } catch (err) {
      setBegetNotice(
        err instanceof Error
          ? `Не удалось скачать пакет для Beget: ${err.message}`
          : 'Не удалось скачать пакет для Beget.',
      );
    } finally {
      setBegetBusy(false);
    }
  };

  const handleDownloadThemeZip = async () => {
    setExportNotice(null);
    try {
      const res = await fetch('/api/wordpress/theme.zip', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (res.ok && res.headers.get('content-type')?.includes('zip')) {
        const blob = await res.blob();
        triggerBlobDownload(blob, 'tsukon-wp-theme.zip');
        setExportNotice('Архив темы tsukon-wp-theme.zip сформирован и отправлен на скачивание.');
        return;
      }
    } catch {
      // Fallback to client-side ZIP assembly
    }

    const files = buildWordPressThemeFiles(draft);
    const zip = new JSZip();
    for (const [filePath, content] of Object.entries(files)) {
      zip.file(filePath, content);
    }
    const imagePairs: Array<[string, string]> = [
      [ASSET_IMAGES.workshop, 'tsukon-theme/assets/images/production_workshop.jpg'],
      [ASSET_IMAGES.warehouse, 'tsukon-theme/assets/images/logistics_warehouse.jpg'],
      [ASSET_IMAGES.office, 'tsukon-theme/assets/images/business_center_office.jpg'],
      [ASSET_IMAGES.exterior, 'tsukon-theme/assets/images/industrial_park_exterior.jpg'],
    ];
    await Promise.all(
      imagePairs.map(async ([srcUrl, destPath]) => {
        try {
          const imgRes = await fetch(srcUrl);
          if (imgRes.ok) {
            zip.file(destPath, await imgRes.blob());
          }
        } catch {
          // Ignore optional asset fetch errors
        }
      }),
    );
    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
    triggerBlobDownload(blob, 'tsukon-wp-theme.zip');
    setExportNotice('Архив темы tsukon-wp-theme.zip собран в браузере и отправлен на скачивание.');
  };

  const handleDownloadXml = () => {
    const xml = buildWordPressWxrXml(draft);
    const blob = new Blob([xml], { type: 'application/octet-stream' });
    triggerBlobDownload(blob, 'tsukon-wordpress.xml');
    setExportNotice(
      'Файл tsukon-wordpress.xml сформирован. Если окно предпросмотра блокирует скачивание — нажмите «Показать / скопировать XML».',
    );
  };

  const handleCopyXml = async () => {
    const xml = buildWordPressWxrXml(draft);
    try {
      await navigator.clipboard.writeText(xml);
      setXmlCopied(true);
      setTimeout(() => setXmlCopied(false), 2500);
    } catch {
      setShowXmlPreview(true);
    }
  };

  const handleWpSync = async () => {
    setWpBusy(true);
    setWpStatus(null);
    try {
      const updated = await testWordPressSync(token, wpUrl);
      onChangeDraft((prev) => ({
        ...prev,
        settings: { ...prev.settings, wordpress: updated },
      }));
      setWpStatus(updated.lastSyncMessage || 'Подключение к WordPress выполнено.');
    } catch (err) {
      setWpStatus(err instanceof Error ? err.message : 'Ошибка подключения к WordPress');
    } finally {
      setWpBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Yandex Metrika & Anti-spam */}
      <div className="rounded-2xl bg-[var(--card)] border border-[var(--line)] p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={18} />
          <h2 className="c3-h3" style={{ fontSize: 18 }}>
            Яндекс.Метрика и SmartCaptcha
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs mute mb-1" htmlFor="ym-id">
              ID счётчика Яндекс.Метрики (8 цифр)
            </label>
            <input
              id="ym-id"
              type="text"
              placeholder="Например: 98765432"
              value={draft.settings.analytics.yandexMetrikaId}
              onChange={(e) =>
                onChangeDraft((prev) => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    analytics: {
                      ...prev.settings.analytics,
                      yandexMetrikaId: e.target.value.replace(/\D/g, ''),
                    },
                  },
                }))
              }
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3.5 py-2.5 text-sm tabular"
            />
            <p className="text-xs mute mt-1.5">
              После сохранения счётчик автоматически подключается на всех страницах сайта и в теме WordPress, передавая цели <code>form_tenant_submit</code>, <code>form_owner_submit</code>, <code>room_card_open</code>, <code>map_pin_click</code>.
            </p>
          </div>

          <div>
            <label className="block text-xs mute mb-1" htmlFor="sc-key">
              Ключ клиента Яндекс SmartCaptcha (необязательно)
            </label>
            <input
              id="sc-key"
              type="text"
              placeholder="ysc1_..."
              value={draft.settings.analytics.smartCaptchaSiteKey}
              onChange={(e) =>
                onChangeDraft((prev) => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    analytics: {
                      ...prev.settings.analytics,
                      smartCaptchaSiteKey: e.target.value.trim(),
                    },
                  },
                }))
              }
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
            />
            <p className="text-xs mute mt-1.5">
              Встроенная защита (honeypot + проверка времени + арифметическая капча + серверный rate-limit) уже активна по умолчанию.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-5 mt-5 pt-4 border-t border-[var(--line)] text-sm">
          {(
            [
              ['webvisor', 'Вебвизор (Webvisor)'],
              ['clickmap', 'Карта кликов'],
              ['trackLinks', 'Отслеживание внешних ссылок'],
              ['accurateTrackBounce', 'Точный показатель отказов'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={draft.settings.analytics[key]}
                onChange={(e) =>
                  onChangeDraft((prev) => ({
                    ...prev,
                    settings: {
                      ...prev.settings,
                      analytics: {
                        ...prev.settings.analytics,
                        [key]: e.target.checked,
                      },
                    },
                  }))
                }
              />
              <span>{label}</span>
            </label>
          ))}
        </div>

        {/* Local Goal Conversion Log */}
        <div className="mt-6 pt-5 border-t border-[var(--line)]">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="text-sm font-semibold">Журнал зафиксированных целей</h3>
            <button type="button" className="text-xs underline cursor-pointer" onClick={onRefreshStats}>
              Обновить статистику
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {Object.entries(analyticsStats.counts).length > 0 ? (
              Object.entries(analyticsStats.counts).map(([goal, count]) => (
                <div key={goal} className="rounded-xl bg-[var(--bg)] border border-[var(--line)] p-3">
                  <div className="text-xs mute truncate">{goal}</div>
                  <div className="text-xl font-semibold tabular mt-0.5">{count}</div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-xs mute">
                Пока нет событий. Откройте карточку помещения или отправьте тестовую заявку — событие появится здесь и уйдёт в Яндекс.Метрику.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Direct Beget Deployment WITHOUT WordPress */}
      <div className="rounded-2xl bg-[var(--card)] border border-[var(--line)] p-6">
        <div className="flex items-center gap-2 mb-3">
          <Server size={18} />
          <h2 className="c3-h3" style={{ fontSize: 18 }}>
            Публикация на Beget БЕЗ WordPress (сайт + наша CMS)
          </h2>
        </div>
        <p className="text-sm mute mb-4 max-w-3xl">
          По ТЗ WordPress не требуется — нужна только удобная CMS. Этот архив содержит{' '}
          <strong>готовый сайт Концепции № 3 + нашу встроенную CMS (<code>#/admin</code>)</strong>{' '}
          на лёгком PHP-бэкенде (<code>api.php</code>). Работает на обычном хостинге Beget без WordPress, без MySQL и без привязки к домену при установке.
        </p>

        <ol className="text-xs mute list-decimal pl-5 space-y-1.5 mb-5 max-w-3xl">
          <li>Нажмите кнопку ниже, чтобы скачать архив <code>tsukon-beget-site.zip</code>.</li>
          <li>
            В панели Beget (<code>cp.beget.com</code>) откройте <strong>Хостинг → Файловый менеджер</strong> и зайдите в папку{' '}
            <code>/cukon.rf/public_html</code>.
          </li>
          <li>
            Загрузите <code>tsukon-beget-site.zip</code> в <code>public_html</code> и нажмите <strong>«Распаковать архив»</strong>. Сайт сразу откроется на <code>цукон.рф</code>, а админка — на <code>цукон.рф/#/admin</code>.
          </li>
        </ol>

        <button
          type="button"
          disabled={begetBusy}
          onClick={handleDownloadBegetZip}
          className="c3-btn"
        >
          <Download size={15} />
          <span>{begetBusy ? 'Сборка архива для Beget…' : 'Скачать готовый сайт для Beget (.zip)'}</span>
        </button>
        {begetNotice && <p className="text-xs font-medium mt-3 text-[var(--ok)]">{begetNotice}</p>}
      </div>

      {/* WordPress Integration & Export */}
      <div className="rounded-2xl bg-[var(--card)] border border-[var(--line)] p-6">
        <div className="flex items-center gap-2 mb-3">
          <Globe size={18} />
          <h2 className="c3-h3" style={{ fontSize: 18 }}>
            Альтернатива: интеграция с WordPress (если нужен именно WP)
          </h2>
        </div>
        <p className="text-sm mute mb-4 max-w-3xl">
          Тема <code>tsukon-wp-theme.zip</code> (с вшитыми фотографиями объектов) и файл <code>tsukon-wordpress.xml</code> работают по принципу <strong>единого источника данных</strong>: вы добавляете, редактируете или удаляете помещение на одной странице <strong>«ЦУКОН: Помещения»</strong> в админке WordPress — и изменения синхронно применяются на Главной, в «Объектах», в «Арендаторам», на 4 ИИ-страницах и в Schema.org.
        </p>

        <ol className="text-xs mute list-decimal pl-5 space-y-1.5 mb-5 max-w-3xl">
          <li>
            Установите WordPress на Beget (1 клик) и загрузите тему <code>tsukon-wp-theme.zip</code> через <em>Внешний вид → Темы → Загрузить тему</em>, затем активируйте её (страницы создадутся автоматически).
          </li>
          <li>
            Импортируйте файл <code>tsukon-wordpress.xml</code> через <em>Инструменты → Импорт → WordPress</em> (связи помещений с объектами проставятся автоматически по ID).
          </li>
          <li>
            Откройте в меню админки WordPress раздел <strong>«ЦУКОН: Помещения»</strong> — меняйте цены, статусы, привязку к объекту, создавайте и удаляйте блоки на одном экране.
          </li>
        </ol>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="rounded-xl bg-[var(--bg)] border border-[var(--line)] p-4 flex flex-col justify-between gap-3">
            <div>
              <h3 className="font-semibold text-sm">1. Тема WordPress «ЦУКОН — Концепция № 3»</h3>
              <p className="text-xs mute mt-1">
                Содержит связанные типы записей (Объекты → Помещения → Резиденты, FAQ), единую панель управления помещениями, шаблоны всех страниц и ИИ-таблиц, фото и Метрику.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadThemeZip}
              className="c3-btn w-fit"
            >
              <Download size={15} />
              <span>Скачать тему (.zip)</span>
            </button>
          </div>

          <div className="rounded-xl bg-[var(--bg)] border border-[var(--line)] p-4 flex flex-col justify-between gap-3">
            <div>
              <h3 className="font-semibold text-sm">2. Импорт контента и связей (WXR 1.2 XML)</h3>
              <p className="text-xs mute mt-1">
                Экспортирует {draft.objects.length} объекта, {draft.rooms.length} связанных помещений, {draft.residents.length} резидентов, {draft.faqs.length} вопросов FAQ и все страницы сайта.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDownloadXml}
                className="c3-btn l"
              >
                <Download size={15} />
                <span>Скачать контент (.xml)</span>
              </button>
              <button
                type="button"
                onClick={() => setShowXmlPreview((v) => !v)}
                className="c3-btn l"
              >
                <FileCode2 size={15} />
                <span>{showXmlPreview ? 'Скрыть XML' : 'Показать / скопировать XML'}</span>
              </button>
            </div>
          </div>
        </div>

        {exportNotice && (
          <p className="text-xs font-medium mb-4 text-[var(--ok)]">{exportNotice}</p>
        )}

        {showXmlPreview && (
          <div className="mb-6 rounded-xl border border-[var(--line)] bg-[var(--bg)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="text-xs mute">
                Если загрузка файлов заблокирована окном предпросмотра — скопируйте текст ниже, вставьте в «Блокнот» и сохраните как <code>tsukon-wordpress.xml</code> (кодировка UTF-8).
              </span>
              <button type="button" onClick={handleCopyXml} className="c3-btn l">
                {xmlCopied ? <Check size={14} /> : <Copy size={14} />}
                <span>{xmlCopied ? 'Скопировано!' : 'Скопировать XML'}</span>
              </button>
            </div>
            <textarea
              readOnly
              rows={8}
              value={buildWordPressWxrXml(draft)}
              onFocus={(e) => e.currentTarget.select()}
              className="w-full rounded-lg border border-[var(--line)] bg-[var(--card)] p-2.5 text-xs font-mono"
            />
          </div>
        )}

        <div className="pt-4 border-t border-[var(--line)]">
          <label className="block text-xs mute mb-1" htmlFor="wp-url">
            Подключение к внешнему WordPress (REST API Bridge)
          </label>
          <div className="flex flex-wrap gap-2.5">
            <input
              id="wp-url"
              type="url"
              placeholder="https://cms.tsukon.ru"
              value={wpUrl}
              onChange={(e) => setWpUrl(e.target.value)}
              className="flex-1 min-w-[240px] rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
            />
            <button
              type="button"
              className="c3-btn l"
              disabled={wpBusy}
              onClick={handleWpSync}
            >
              <RefreshCw size={15} className={wpBusy ? 'animate-spin' : ''} />
              <span>{wpBusy ? 'Проверка…' : 'Проверить WP REST API'}</span>
            </button>
          </div>
          {(wpStatus || draft.settings.wordpress.lastSyncMessage) && (
            <p className="text-xs mute mt-2">
              {wpStatus || draft.settings.wordpress.lastSyncMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
