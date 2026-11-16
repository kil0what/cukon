import { useState } from 'react';
import { CheckCircle2, AlertCircle, BookOpen, Download, KeyRound, Upload } from 'lucide-react';
import type { CmsState } from '../shared/types';
import { evaluateTzCompliance } from '../utils/catalog';
import { updateAdminPassword } from '../utils/api';

interface AdminLaunchTabProps {
  draft: CmsState;
  leadsCount: number;
  smtpConfigured: boolean;
  token: string;
  onImportBackup: (next: CmsState) => void;
}

export function AdminLaunchTab({
  draft,
  leadsCount,
  smtpConfigured,
  token,
  onImportBackup,
}: AdminLaunchTabProps) {
  const auditItems = evaluateTzCompliance(draft, leadsCount);
  const passedCount = auditItems.filter((i) => i.passed).length;

  const [newPassword, setNewPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState<string | null>(null);
  const [backupMsg, setBackupMsg] = useState<string | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);
    try {
      await updateAdminPassword(token, newPassword);
      setPwdMsg('Пароль администратора обновлён и сохранён.');
      setNewPassword('');
    } catch (err) {
      setPwdMsg(err instanceof Error ? err.message : 'Ошибка смены пароля');
    }
  };

  return (
    <div className="space-y-6">
      {/* TZ Compliance Audit */}
      <div className="rounded-2xl bg-[var(--card)] border border-[var(--line)] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="c3-h3" style={{ fontSize: 18 }}>
              Аудит готовности к выпуску (соответствие ТЗ)
            </h2>
            <p className="text-xs mute mt-1">
              Автоматическая проверка выполнения Приложения № 1 к Договору № 1 от 26.10.2026 г.
            </p>
          </div>
          <div className="text-sm font-semibold tabular">
            Выполнено: {passedCount} из {auditItems.length}
          </div>
        </div>

        <div className="divide-y divide-[var(--line)]">
          {auditItems.map((item) => (
            <div key={item.id} className="py-3.5 flex items-start gap-3">
              {item.passed ? (
                <CheckCircle2 size={18} className="text-[var(--ok)] shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={18} className="text-[var(--wait)] shrink-0 mt-0.5" />
              )}
              <div>
                <div className="text-sm font-medium">{item.section}</div>
                <div className="text-xs mute mt-0.5">{item.requirement}</div>
                <div className="text-xs mt-1">{item.details}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-[var(--line)] text-xs mute space-y-1">
          <div>
            Статус SMTP-отправки почты:{' '}
            <strong>{smtpConfigured ? 'Настроено (переменные SMTP_* заданы)' : 'Используется журнал CMS (для прямой отправки задайте SMTP_HOST/SMTP_USER/SMTP_PASS на сервере)'}</strong>
          </div>
          <div>
            Доступные SEO-файлы:{' '}
            <a href="/sitemap.xml" target="_blank" rel="noreferrer" className="underline">
              /sitemap.xml
            </a>{' '}
            ·{' '}
            <a href="/robots.txt" target="_blank" rel="noreferrer" className="underline">
              /robots.txt
            </a>{' '}
            ·{' '}
            <a href="/llms.txt" target="_blank" rel="noreferrer" className="underline">
              /llms.txt
            </a>
          </div>
        </div>
      </div>

      {/* Interactive CMS Guide for Client (TZ Section 7) */}
      <div className="rounded-2xl bg-[var(--card)] border border-[var(--line)] p-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={18} />
          <h2 className="c3-h3" style={{ fontSize: 18 }}>
            Инструкция по управлению сайтом для Заказчика (ТЗ п. 7)
          </h2>
        </div>

        <ol className="space-y-3 text-sm list-decimal pl-5">
          <li>
            <strong>Изменение статуса и цены помещения:</strong> перейдите во вкладку «Объекты и помещения», выберите нужное помещение, измените статус на <em>«Свободно»</em>, <em>«Забронировано»</em> или <em>«Сдано»</em> и укажите новую ставку (₽/м²). Нажмите «Сохранить все изменения» в верхней панели.
          </li>
          <li>
            <strong>Ограничение 5–7 свободных помещений на старте:</strong> в верхней части вкладки «Объекты и помещения» установите лимит (5, 6 или 7). Отмеченные помещения появятся на главной странице и в разделе «Арендаторам».
          </li>
          <li>
            <strong>Добавление фотографий:</strong> выберите готовую фотографию комплекса или вставьте ссылку / загрузите файл с компьютера прямо в карточке объекта или помещения.
          </li>
          <li>
            <strong>Редактирование текстов страниц, резидентов, контактов и FAQ:</strong> используйте соответствующие вкладки CMS. Все изменения мгновенно обновляют сайт, файл <code>/sitemap.xml</code>, <code>/llms.txt</code> и Schema.org разметку.
          </li>
          <li>
            <strong>Перенос на WordPress (если используется WP-хостинг):</strong> во вкладке «WordPress и Метрика» скачайте архив темы <code>tsukon-wp-theme.zip</code> и файл контента <code>tsukon-wordpress.xml</code>, установите их в админке WordPress и укажите ID счётчика Яндекс.Метрики.
          </li>
        </ol>
      </div>

      {/* Beget + Reg.ru + Yandex.Metrika 2016 Migration Checklist */}
      <div className="rounded-2xl bg-[var(--card)] border border-[var(--line)] p-6">
        <h2 className="c3-h3 mb-3" style={{ fontSize: 18 }}>
          Чеклист выпуска на домен цукон.рф (Beget · Reg.ru · Яндекс.Метрика)
        </h2>
        <ol className="space-y-2.5 text-sm list-decimal pl-5 mute">
          <li>
            <strong className="text-[var(--ink)]">Домен на Reg.ru:</strong> проверьте, что для домена <code>цукон.рф</code> (Punycode: <code>xn--j1abm5d.xn--p1ai</code>) прописаны DNS-серверы хостинга Beget (<code>ns1.beget.com</code>, <code>ns2.beget.com</code>).
          </li>
          <li>
            <strong className="text-[var(--ink)]">Хостинг Beget (HTTPS и FTP):</strong> в панели Beget включите бесплатный SSL-сертификат Let&apos;s Encrypt и принудительную переадресацию с HTTP на HTTPS (требование п. 6 ТЗ). Для WordPress установите CMS в 1 клик в разделе «CMS», загрузите <code>tsukon-wp-theme.zip</code> и импортируйте <code>tsukon-wordpress.xml</code>.
          </li>
          <li>
            <strong className="text-[var(--ink)]">Пересоздание Яндекс.Метрики (вместо счётчика 2016 г.):</strong> создайте новый счётчик для <code>цукон.рф</code> в актуальном аккаунте Яндекса, включите Вебвизор, добавьте цели <code>form_tenant_submit</code>, <code>form_owner_submit</code>, <code>room_card_open</code> и вставьте 8-значный ID счётчика во вкладку «WordPress и Метрика».
          </li>
          <li>
            <strong className="text-[var(--ink)]">Яндекс.Вебмастер и ИИ-индексация:</strong> добавьте сайт в Яндекс.Вебмастер и отправьте на индексацию <code>/sitemap.xml</code> и <code>/llms.txt</code>.
          </li>
        </ol>
      </div>

      {/* JSON Backup & Restore */}
      <div className="rounded-2xl bg-[var(--card)] border border-[var(--line)] p-6">
        <div className="flex items-center gap-2 mb-2">
          <Download size={18} />
          <h2 className="c3-h3" style={{ fontSize: 18 }}>
            Резервная копия сайта (бэкап и восстановление .json)
          </h2>
        </div>
        <p className="text-xs mute mb-4 max-w-2xl">
          Скачайте все объекты, помещения, тексты, резидентов, FAQ и настройки в один файл. Если нужно откатиться или перенести контент на другой домен — загрузите файл обратно и нажмите «Сохранить все изменения».
        </p>
        <div className="flex flex-wrap gap-3 items-center">
          <button
            type="button"
            className="c3-btn"
            onClick={() => {
              const json = JSON.stringify(draft, null, 2);
              const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `tsukon-backup-${new Date().toISOString().slice(0, 10)}.json`;
              a.style.display = 'none';
              document.body.appendChild(a);
              a.click();
              setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }, 800);
              setBackupMsg('Резервная копия JSON скачана на устройство.');
            }}
          >
            <Download size={15} />
            <span>Скачать бэкап (.json)</span>
          </button>

          <label className="c3-btn l cursor-pointer">
            <Upload size={15} />
            <span>Восстановить из .json</span>
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  try {
                    const parsed = JSON.parse(String(reader.result || '')) as CmsState;
                    if (!parsed || !Array.isArray(parsed.objects) || !Array.isArray(parsed.rooms) || !parsed.pages) {
                      setBackupMsg('Ошибка: файл не является резервной копией CMS ЦУКОН.');
                      return;
                    }
                    onImportBackup(parsed);
                    setBackupMsg('Данные из бэкапа загружены в черновик. Нажмите «Сохранить все изменения» вверху.');
                  } catch {
                    setBackupMsg('Не удалось прочитать JSON-файл резервной копии.');
                  }
                };
                reader.readAsText(file, 'utf-8');
                e.target.value = '';
              }}
            />
          </label>
        </div>
        {backupMsg && <p className="text-xs mt-2.5 font-medium text-[var(--ok)]">{backupMsg}</p>}
      </div>

      {/* Security & Handover Password */}
      <div className="rounded-2xl bg-[var(--card)] border border-[var(--line)] p-6">
        <div className="flex items-center gap-2 mb-3">
          <KeyRound size={18} />
          <h2 className="c3-h3" style={{ fontSize: 18 }}>
            Смена пароля администратора перед передачей доступов
          </h2>
        </div>
        <form onSubmit={handlePasswordChange} className="flex flex-wrap gap-3 items-center">
          <input
            type="password"
            minLength={6}
            required
            placeholder="Новый пароль (от 6 символов)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3.5 py-2.5 text-sm min-w-[240px]"
          />
          <button type="submit" className="c3-btn l">
            Обновить пароль CMS
          </button>
        </form>
        {pwdMsg && <p className="text-xs mt-2 font-medium">{pwdMsg}</p>}
      </div>
    </div>
  );
}
