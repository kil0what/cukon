import type { AnalyticsSettings } from '../shared/types';
import { postAnalyticsEvent } from './api';

declare global {
  interface Window {
    ym?: (...args: unknown[]) => void;
    _tsukonYmInjected?: string;
  }
}

export function initYandexMetrika(settings: AnalyticsSettings): void {
  const id = settings.yandexMetrikaId.replace(/\D/g, '');
  if (!id) return;
  if (window._tsukonYmInjected === id) return;

  const numId = Number(id);
  if (!Number.isFinite(numId) || numId <= 0) return;

  window._tsukonYmInjected = id;

  // Official Yandex.Metrika async bootstrap
  const existing = document.querySelector('script[src="https://mc.yandex.ru/metrika/tag.js"]');
  if (!existing) {
    (function (m: Window & Record<string, unknown>, e: Document, t: string, r: string, i: string) {
      m[i] =
        m[i] ||
        function (...args: unknown[]) {
          const fn = m[i] as { a?: unknown[] };
          fn.a = fn.a || [];
          fn.a.push(args);
        };
      (m[i] as { l?: number }).l = Date.now();
      const k = e.createElement(t) as HTMLScriptElement;
      const a = e.getElementsByTagName(t)[0];
      k.async = true;
      k.src = r;
      a?.parentNode?.insertBefore(k, a);
    })(window as unknown as Window & Record<string, unknown>, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
  }

  window.ym?.(numId, 'init', {
    clickmap: settings.clickmap,
    trackLinks: settings.trackLinks,
    accurateTrackBounce: settings.accurateTrackBounce,
    webvisor: settings.webvisor,
  });
}

export function trackPageHit(settings: AnalyticsSettings, urlPath: string): void {
  const id = Number(settings.yandexMetrikaId.replace(/\D/g, ''));
  if (id > 0 && window.ym) {
    window.ym(id, 'hit', urlPath);
  }
}

export function trackGoal(
  settings: AnalyticsSettings,
  goal: string,
  path: string,
  meta?: string,
): void {
  const id = Number(settings.yandexMetrikaId.replace(/\D/g, ''));
  if (id > 0 && window.ym) {
    window.ym(id, 'reachGoal', goal, meta ? { meta } : undefined);
  }
  void postAnalyticsEvent({ goal, path, meta });
}
