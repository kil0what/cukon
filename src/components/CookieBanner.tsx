import { useEffect, useState } from 'react';
import { Cookie } from 'lucide-react';

const COOKIE_STORAGE_KEY = 'tsukon_cookie_consent_v1';

interface CookieBannerProps {
  onNavigatePrivacy: () => void;
}

export function CookieBanner({ onNavigatePrivacy }: CookieBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(COOKIE_STORAGE_KEY);
      if (saved !== 'accepted') {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const handleAccept = () => {
    try {
      window.localStorage.setItem(COOKIE_STORAGE_KEY, 'accepted');
    } catch {
      // Ignore storage errors in private mode
    }
    setVisible(false);
  };

  return (
    <aside
      role="dialog"
      aria-label="Уведомление об использовании файлов cookie"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-lg z-40 rounded-3xl bg-[var(--dark)] text-[#f1f2f3] border border-white/15 p-5 shadow-2xl"
    >
      <div className="flex items-start gap-3.5">
        <div className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
          <Cookie size={18} aria-hidden="true" />
        </div>
        <div className="flex-1 text-xs md:text-sm leading-relaxed text-[#d3d6d9]">
          <p>
            Мы используем файлы <strong className="text-white font-medium">cookie</strong> и сервис
            аналитики Яндекс.Метрика для корректной работы сайта и улучшения качества сервиса.
            Продолжая использовать сайт, вы соглашаетесь с{' '}
            <a
              href="#/privacy-policy"
              className="underline text-white hover:text-[#9cb0ff] transition-colors"
              onClick={(e) => {
                e.preventDefault();
                onNavigatePrivacy();
              }}
            >
              Политикой обработки персональных данных
            </a>
            .
          </p>
          <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleAccept}
              className="px-5 py-2 rounded-full bg-[var(--acc)] text-white text-xs md:text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity"
            >
              Принять
            </button>
            <a
              href="#/privacy-policy"
              className="px-4 py-2 rounded-full border border-white/25 text-white text-xs md:text-sm hover:bg-white/10 transition-colors"
              onClick={(e) => {
                e.preventDefault();
                onNavigatePrivacy();
              }}
            >
              Подробнее
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
}
