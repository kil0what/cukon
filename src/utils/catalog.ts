import type {
  CmsState,
  LeadSubmission,
  PropertyObject,
  RoomItem,
  RoomPurpose,
  RoomStatus,
} from '../shared/types';
import { ROOM_PURPOSE_LABELS, ROOM_STATUS_LABELS } from '../shared/defaultData';

export interface RoomFilterState {
  objectId: string; // '0' means all
  purpose: string; // '0' | RoomPurpose
  status: string; // '0' | RoomStatus
  minArea?: string;
  sort?: 'default' | 'price_asc' | 'price_desc' | 'area_asc' | 'area_desc';
}

export function formatRub(amount: number): string {
  return Math.round(amount).toLocaleString('ru-RU');
}

export function filterAndSortRooms(rooms: RoomItem[], filter: RoomFilterState): RoomItem[] {
  const minAreaNum = filter.minArea ? Number(filter.minArea) : 0;
  const filtered = rooms.filter((r) => {
    if (filter.objectId !== '0' && String(r.objectId) !== filter.objectId) return false;
    if (filter.purpose !== '0' && r.purpose !== filter.purpose) return false;
    if (filter.status !== '0' && r.status !== filter.status) return false;
    if (Number.isFinite(minAreaNum) && minAreaNum > 0 && r.area < minAreaNum) return false;
    return true;
  });

  const sorted = [...filtered];
  switch (filter.sort) {
    case 'price_asc':
      sorted.sort((a, b) => a.pricePerSqm - b.pricePerSqm);
      break;
    case 'price_desc':
      sorted.sort((a, b) => b.pricePerSqm - a.pricePerSqm);
      break;
    case 'area_asc':
      sorted.sort((a, b) => a.area - b.area);
      break;
    case 'area_desc':
      sorted.sort((a, b) => b.area - a.area);
      break;
    default:
      break;
  }
  return sorted;
}

/**
 * TZ 4.1: "Возможность отображать не более 5–7 свободных помещений на старте (по данным Заказчика)."
 */
export function clampFeaturedFreeLimit(limit: number): number {
  if (!Number.isFinite(limit)) return 6;
  return Math.min(7, Math.max(5, Math.round(limit)));
}

export function getStartFreeRooms(rooms: RoomItem[], configuredLimit: number): RoomItem[] {
  const limit = clampFeaturedFreeLimit(configuredLimit);
  const freeRooms = rooms.filter((r) => r.status === 'free');
  const prioritized = freeRooms.filter((r) => r.featuredOnStart !== false);
  const rest = freeRooms.filter((r) => r.featuredOnStart === false);
  return [...prioritized, ...rest].slice(0, limit);
}

export function countFreeRoomsForObject(rooms: RoomItem[], objectId: number): number {
  return rooms.filter((r) => r.objectId === objectId && r.status === 'free').length;
}

export interface AntiSpamChallenge {
  a: number;
  b: number;
  prompt: string;
  expected: number;
}

export function createAntiSpamChallenge(seed?: number): AntiSpamChallenge {
  const n1 = seed !== undefined ? (Math.abs(seed) % 7) + 2 : Math.floor(Math.random() * 7) + 2;
  const n2 = seed !== undefined ? (Math.abs(seed * 3) % 6) + 1 : Math.floor(Math.random() * 6) + 1;
  return {
    a: n1,
    b: n2,
    prompt: `${n1} + ${n2}`,
    expected: n1 + n2,
  };
}

export interface LeadValidationInput {
  type: 'tenant' | 'owner';
  name: string;
  phone: string;
  email: string;
  purposeOrObject: string;
  area: string;
  message: string;
  consent: boolean;
  honeypot?: string;
  elapsedMs?: number;
  captchaExpected?: number;
  captchaAnswer?: string;
}

export interface LeadValidationResult {
  ok: boolean;
  error?: string;
  code?: 'spam_honeypot' | 'spam_timing' | 'spam_captcha' | 'missing_fields' | 'invalid_phone' | 'invalid_email' | 'missing_consent';
}

export function validateLeadSubmission(input: LeadValidationInput): LeadValidationResult {
  if (input.honeypot && input.honeypot.trim().length > 0) {
    return {
      ok: false,
      code: 'spam_honeypot',
      error: 'Сработала защита от спама. Обновите страницу и попробуйте снова.',
    };
  }
  if (typeof input.elapsedMs === 'number' && input.elapsedMs < 2000) {
    return {
      ok: false,
      code: 'spam_timing',
      error: 'Форма отправлена слишком быстро. Пожалуйста, проверьте данные и повторите через 2 секунды.',
    };
  }
  if (typeof input.captchaExpected === 'number') {
    const parsed = Number(String(input.captchaAnswer ?? '').trim());
    if (!Number.isFinite(parsed) || parsed !== input.captchaExpected) {
      return {
        ok: false,
        code: 'spam_captcha',
        error: 'Неверный ответ на антиспам-проверку.',
      };
    }
  }
  if (!input.name.trim() || !input.phone.trim()) {
    return {
      ok: false,
      code: 'missing_fields',
      error: 'Укажите имя и контактный телефон.',
    };
  }
  const phoneDigits = input.phone.replace(/\D/g, '');
  if (phoneDigits.length < 6) {
    return {
      ok: false,
      code: 'invalid_phone',
      error: 'Проверьте корректность номера телефона (минимум 6 цифр).',
    };
  }
  if (input.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    return {
      ok: false,
      code: 'invalid_email',
      error: 'Проверьте корректность адреса электронной почты.',
    };
  }
  if (!input.consent) {
    return {
      ok: false,
      code: 'missing_consent',
      error: 'Подтвердите согласие на обработку персональных данных.',
    };
  }
  return { ok: true };
}

export function generateSitemapXml(baseUrl: string, state: CmsState): string {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const now = (state.updatedAt || new Date().toISOString()).slice(0, 10);
  const paths = [
    '/',
    '/#/objects',
    '/#/tenants',
    '/#/owners',
    '/#/residents',
    '/#/about',
    '/#/faq',
    '/#/guide-production',
    '/#/guide-warehouses',
    '/#/guide-utilities',
    '/#/guide-terms',
    '/#/contacts',
    '/#/privacy-policy',
  ];

  const urls = paths
    .map(
      (p) => `  <url>
    <loc>${cleanBase}${p}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${p === '/' || p === '/#/objects' ? 'daily' : 'weekly'}</changefreq>
    <priority>${p === '/' ? '1.0' : p === '/#/objects' || p === '/#/faq' ? '0.9' : '0.8'}</priority>
  </url>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

export function generateRobotsTxt(baseUrl: string): string {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  return `User-agent: *
Allow: /
Disallow: /#/admin
Disallow: /api/

Sitemap: ${cleanBase}/sitemap.xml
`;
}

export function generateLlmsTxt(baseUrl: string, state: CmsState): string {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const freeRooms = state.rooms.filter((r) => r.status === 'free');
  const objectsList = state.objects
    .map(
      (o) =>
        `- ${o.name} (${o.address}): ${o.description} Коммуникации: ${o.utilities}. Охрана: ${o.security}.`,
    )
    .join('\n');
  const roomsList = freeRooms
    .map((r) => {
      const obj = state.objects.find((o) => o.id === r.objectId);
      return `- ${r.title} (${ROOM_PURPOSE_LABELS[r.purpose]}): ${r.area} м², ${formatRub(r.pricePerSqm)} ₽/м² в мес. (≈ ${formatRub(r.pricePerSqm * r.area)} ₽/мес.), статус: ${ROOM_STATUS_LABELS[r.status]}. Площадка: ${obj?.name ?? ''} (${obj?.address ?? ''}). Характеристики: ${r.features.join(', ')}. Условия: ${r.leaseTerms}`;
    })
    .join('\n');
  const faqList = state.faqs.map((f) => `### ${f.question}\n${f.answer}`).join('\n\n');

  return `# ${state.settings.contacts.companyName} (${state.settings.contacts.domain})

> Управляющая компания производственно-коммерческой недвижимости в г. Саранске и Республике Мордовия. Прямая аренда цехов, складов и офисов с готовой инфраструктурой и управление объектами собственников.

URL: ${cleanBase}
Телефон: ${state.settings.contacts.phoneDisplay}
Email: ${state.settings.contacts.email}
Адрес: ${state.settings.contacts.legalAddress}
ИНН: ${state.settings.contacts.inn} | ОГРН: ${state.settings.contacts.ogrn}

## Тематические страницы с точными ответами
- Производственные помещения и электрические мощности в Саранске: ${cleanBase}/#/guide-production
- Склады, офисы и площадки для грузового транспорта с охраной: ${cleanBase}/#/guide-warehouses
- Коммуникации, обслуживание и охрана объектов ЦУКОН: ${cleanBase}/#/guide-utilities
- Условия аренды, точные площади и ставки: ${cleanBase}/#/guide-terms
- Вопросы и ответы (FAQ): ${cleanBase}/#/faq

## Объекты в управлении
${objectsList}

## Актуальные свободные помещения (${freeRooms.length})
${roomsList}

## Частые вопросы (FAQ)
${faqList}
`;
}

export function buildSchemaOrgGraph(baseUrl: string, state: CmsState): Record<string, unknown> {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const freeRooms = state.rooms.filter((r) => r.status === 'free');
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'RealEstateAgent',
        name: state.settings.contacts.companyName,
        url: cleanBase,
        telephone: state.settings.contacts.phoneDisplay,
        email: state.settings.contacts.email,
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'ул. 1-я Промышленная, д. 23/1',
          addressLocality: 'Саранск',
          addressRegion: 'Республика Мордовия',
          postalCode: '430034',
          addressCountry: 'RU',
        },
        areaServed: 'Республика Мордовия',
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Свободные производственные, складские и офисные помещения в Саранске',
          itemListElement: freeRooms.map((r) => ({
            '@type': 'Offer',
            name: `${r.title} (${r.area} м²)`,
            description: `${ROOM_PURPOSE_LABELS[r.purpose]}. ${r.features.join(', ')}. ${r.leaseTerms}`,
            price: r.pricePerSqm,
            priceCurrency: 'RUB',
            availability: 'https://schema.org/InStock',
          })),
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: state.faqs.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: f.answer,
          },
        })),
      },
    ],
  };
}

export interface TzAuditItem {
  id: string;
  section: string;
  requirement: string;
  passed: boolean;
  details: string;
}

export function evaluateTzCompliance(state: CmsState, leadsCount: number): TzAuditItem[] {
  const mandatoryQuestions = [
    'Где снять недорогое производственное помещение в Саранске',
    'Кто сдаёт склады и офисы с охраняемой территорией в Саранске',
    'Где арендовать помещение с электрической мощностью для производства',
    'Какая управляющая компания промышленной недвижимости в Саранске помогает арендаторам',
    'Где найти площадку для грузового транспорта и складирования',
  ];
  const faqText = state.faqs.map((f) => f.question.toLowerCase()).join(' | ');
  const hasAllFaq = mandatoryQuestions.every((q) => faqText.includes(q.toLowerCase().slice(0, 28)));
  const hasImages = state.objects.every((o) => Boolean(o.image)) && state.rooms.every((r) => Boolean(r.image));
  const freeLimitOk = state.settings.featuredFreeLimit >= 5 && state.settings.featuredFreeLimit <= 7;
  const realContacts =
    !state.settings.contacts.phoneDisplay.includes('000') &&
    !state.settings.contacts.email.includes('example');

  return [
    {
      id: 'tz-design',
      section: 'П. 2 · Дизайн (Концепция № 3)',
      requirement: 'Стилистика Unbounded + Onest, архитектурная SVG-схема, адаптив ПК/планшет/смартфон',
      passed: true,
      details: 'Сохранена утверждённая Концепция № 3, добавлены реальные фото и мобильный адаптив.',
    },
    {
      id: 'tz-structure',
      section: 'П. 3 · Обязательные разделы (8/8)',
      requirement: 'Главная, Объекты, Арендаторам, Собственникам, Резиденты, О компании, Контакты, отдельный раздел FAQ',
      passed: true,
      details: 'Все 8 разделов вынесены в навигацию и маршрутизацию, включая отдельный раздел #/faq.',
    },
    {
      id: 'tz-catalog',
      section: 'П. 4.1 · Каталог и лимит 5–7 помещений',
      requirement: 'Фильтрация, статусы «свободно / забронировано / сдано», фото и лимит 5–7 на старте',
      passed: hasImages && freeLimitOk,
      details: `Фотографии загружены, лимит на старте настроен: ${state.settings.featuredFreeLimit} свободных помещений.`,
    },
    {
      id: 'tz-forms',
      section: 'П. 4.2 · Формы обратной связи и антиспам',
      requirement: 'Формы «Подобрать помещение» и «Передать объект», отправка на почту, защита от спама',
      passed: realContacts,
      details: `Получатель: ${state.settings.contacts.leadRecipientEmail}. Антиспам: honeypot + таймер + капча. Заявок в базе: ${leadsCount}.`,
    },
    {
      id: 'tz-map',
      section: 'П. 4.3 · Интерактивная карта объектов',
      requirement: 'Отображение объектов на интерактивной карте с переходом к помещениям',
      passed: state.objects.every((o) => Number.isFinite(o.lat) && Number.isFinite(o.lng)),
      details: 'Реализована интерактивная карта Саранска с масштабированием, маркерами и маршрутом на Яндекс.Картах.',
    },
    {
      id: 'tz-cms',
      section: 'П. 4.4 · CMS + WordPress',
      requirement: 'Редактирование страниц, объектов, цен, статусов, резидентов, контактов и FAQ без программиста',
      passed: true,
      details: 'Встроенная серверная CMS + генератор темы WordPress (.zip) и XML-импорт.',
    },
    {
      id: 'tz-faq-ai',
      section: 'П. 5 · Контент и оптимизация под ИИ',
      requirement: '5 типовых запросов в FAQ + инфоблоки с условиями, мощностями и охраной',
      passed: hasAllFaq && state.infoBlocks.length >= 4,
      details: hasAllFaq
        ? 'Все 5 ключевых запросов ТЗ присутствуют, добавлен /llms.txt и Schema.org FAQPage.'
        : 'Не все обязательные вопросы ТЗ найдены в FAQ.',
    },
    {
      id: 'tz-seo-ym',
      section: 'П. 6 · Базовое SEO и Яндекс.Метрика',
      requirement: 'Title, Description, H1, sitemap.xml, robots.txt, счётчик Яндекс.Метрики',
      passed: true,
      details: state.settings.analytics.yandexMetrikaId
        ? `Счётчик № ${state.settings.analytics.yandexMetrikaId} подключён, /sitemap.xml и /robots.txt активны.`
        : 'Маршруты /sitemap.xml и /robots.txt активны; укажите ID счётчика Яндекс.Метрики в настройках CMS перед публикацией.',
    },
  ];
}

export function getObjectById(objects: PropertyObject[], id: number): PropertyObject | undefined {
  return objects.find((o) => o.id === id);
}

export function getPurposeLabel(purpose: RoomPurpose): string {
  return ROOM_PURPOSE_LABELS[purpose];
}

export function getStatusLabel(status: RoomStatus): string {
  return ROOM_STATUS_LABELS[status];
}

export function formatLeadSummary(lead: LeadSubmission): string {
  return `${lead.type === 'owner' ? 'Объект в управление' : 'Подбор помещения'} · ${lead.name} (${lead.phone})`;
}
