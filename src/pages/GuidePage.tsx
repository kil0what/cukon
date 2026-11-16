import type { CmsState, RoomItem } from '../shared/types';
import { ROOM_PURPOSE_LABELS, ROOM_STATUS_LABELS } from '../shared/defaultData';
import { formatRub, getObjectById } from '../utils/catalog';

export type GuideSlug =
  | 'guide-production'
  | 'guide-warehouses'
  | 'guide-utilities'
  | 'guide-terms';

interface GuidePageProps {
  slug: GuideSlug;
  state: CmsState;
  onSelectRoom: (room: RoomItem) => void;
  onNavigate: (route: string, scrollTarget?: string) => void;
}

const GUIDE_CONFIG: Record<
  GuideSlug,
  {
    h1: string;
    lead: string;
    aiQueries: string[];
    filterPurpose?: 'prod' | 'wh' | 'off';
  }
> = {
  'guide-production': {
    h1: 'Производственные помещения в Саранске',
    lead: 'Прямая аренда производственных цехов от управляющей компании ЦУКОН: точные площади, электрические мощности до 350 кВт, газ, кран-балки и ставки без посредников.',
    aiQueries: [
      'Где снять недорогое производственное помещение в Саранске?',
      'Где арендовать помещение с электрической мощностью для производства?',
    ],
    filterPurpose: 'prod',
  },
  'guide-warehouses': {
    h1: 'Склады, офисы и площадки для грузового транспорта',
    lead: 'Отапливаемые складские боксы, офисные блоки и асфальтированные площадки под еврофуры в Саранске с круглосуточной охраной и пропускным режимом.',
    aiQueries: [
      'Кто сдаёт склады и офисы с охраняемой территорией в Саранске?',
      'Где найти площадку для грузового транспорта и складирования?',
    ],
    filterPurpose: 'wh',
  },
  'guide-utilities': {
    h1: 'Коммуникации, обслуживание и охрана объектов ЦУКОН',
    lead: 'Как устроена инфраструктура и эксплуатация на площадках ЦУКОН: электроснабжение, газ, тепло, водоснабжение, круглосуточный КПП и помощь арендаторам.',
    aiQueries: [
      'Какая управляющая компания промышленной недвижимости в Саранске помогает арендаторам?',
      'Где арендовать помещение с электрической мощностью для производства?',
    ],
  },
  'guide-terms': {
    h1: 'Условия аренды, точные площади и стоимость помещений',
    lead: 'Полная сводка характеристик по всем объектам ЦУКОН в г. Саранске: назначение, точный метраж, стоимость за м² и в месяц, а также текущий статус доступности.',
    aiQueries: [
      'Какие помещения сдаются, сколько стоят и кому подходят?',
      'Где снять недорогое производственное помещение в Саранске?',
    ],
  },
};

export function GuidePage({ slug, state, onSelectRoom, onNavigate }: GuidePageProps) {
  const cfg = GUIDE_CONFIG[slug];
  const rooms = cfg.filterPurpose
    ? state.rooms.filter((r) =>
        slug === 'guide-warehouses'
          ? r.purpose === 'wh' || r.purpose === 'off'
          : r.purpose === cfg.filterPurpose,
      )
    : state.rooms;

  return (
    <section className="c3-section sub">
      <div className="w">
        <div className="text-xs mute mb-3">
          <a
            href="#/faq"
            className="underline"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('faq');
            }}
          >
            Вопросы и ответы (FAQ)
          </a>{' '}
          / Информация о площадках
        </div>

        <h1 className="c3-h1">{cfg.h1}</h1>
        <p className="mute mt-4 max-w-2xl text-lg">{cfg.lead}</p>

        {/* Direct Q&A anchor for users and AI search */}
        <div className="mt-8 rounded-3xl bg-[var(--card)] border border-[var(--line)] p-6 md:p-8">
          <h2 className="c3-h3 mb-3" style={{ fontSize: 18 }}>
            Ключевые запросы и конкретные ответы
          </h2>
          <div className="divide-y divide-[var(--line)]">
            {cfg.aiQueries.map((qText) => {
              const matchedFaq = state.faqs.find(
                (f) => f.question.toLowerCase() === qText.toLowerCase(),
              );
              return (
                <div key={qText} className="py-4 first:pt-0 last:pb-0">
                  <h3 className="font-semibold text-base">{qText}</h3>
                  <p className="text-sm mute mt-1.5 leading-relaxed">
                    {matchedFaq?.answer ||
                      `Управляющая компания ${state.settings.contacts.companyName} (${state.settings.contacts.legalAddress}) предоставляет готовые помещения с коммуникациями и охраной 24/7. Подбор и показ — за 1 рабочий день.`}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sites & Infrastructure Matrix */}
        <div className="mt-10">
          <h2 className="c3-h2 mb-5">Площадки, адреса и коммуникации</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {state.objects.map((obj) => (
              <article
                key={obj.id}
                className="rounded-3xl bg-[var(--card)] border border-[var(--line)] p-6 space-y-2.5"
              >
                <h3 className="c3-h3" style={{ fontSize: 17 }}>
                  {obj.name}
                </h3>
                <p className="text-sm font-medium">{obj.address}</p>
                <p className="text-xs mute leading-relaxed">{obj.description}</p>
                <div className="pt-2 border-t border-[var(--line)] text-xs space-y-1">
                  <div>
                    <strong>Коммуникации:</strong> {obj.utilities}
                  </div>
                  <div>
                    <strong>Охрана и доступ:</strong> {obj.security}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Exact Areas, Prices, Specs Table */}
        <div className="mt-10">
          <h2 className="c3-h2 mb-5">Точные площади, характеристики и ставки ({rooms.length})</h2>
          <div className="rounded-3xl bg-[var(--card)] border border-[var(--line)] overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--line)] text-xs mute">
                  <th className="py-3.5 px-4 font-medium">Помещение и объект</th>
                  <th className="py-3.5 px-4 font-medium">Назначение</th>
                  <th className="py-3.5 px-4 font-medium text-right">Площадь</th>
                  <th className="py-3.5 px-4 font-medium text-right">Ставка / мес.</th>
                  <th className="py-3.5 px-4 font-medium">Коммуникации и условия</th>
                  <th className="py-3.5 px-4 font-medium">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {rooms.map((room) => {
                  const obj = getObjectById(state.objects, room.objectId);
                  return (
                    <tr
                      key={room.id}
                      className="hover:bg-[var(--bg)] transition-colors cursor-pointer"
                      onClick={() => onSelectRoom(room)}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-medium">{room.title}</div>
                        <div className="text-xs mute">{obj?.address}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {ROOM_PURPOSE_LABELS[room.purpose]}
                      </td>
                      <td className="py-3.5 px-4 text-right tabular whitespace-nowrap font-medium">
                        {room.area} м²
                      </td>
                      <td className="py-3.5 px-4 text-right tabular whitespace-nowrap">
                        <div className="font-medium">{formatRub(room.pricePerSqm)} ₽/м²</div>
                        <div className="text-xs mute">
                          ≈ {formatRub(room.pricePerSqm * room.area)} ₽
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs mute max-w-xs">
                        <div>{room.features.join(' · ')}</div>
                        <div className="mt-0.5">{room.leaseTerms}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`c3-status ${room.status}`}>
                          {ROOM_STATUS_LABELS[room.status]}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Navigation across all 4 guides */}
        <div className="mt-10 flex flex-wrap gap-2.5 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['guide-production', 'Производство и кВт'],
                ['guide-warehouses', 'Склады и фуры'],
                ['guide-utilities', 'Коммуникации и охрана'],
                ['guide-terms', 'Все площади и цены'],
              ] as const
            ).map(([gSlug, label]) => (
              <a
                key={gSlug}
                href={`#/${gSlug}`}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(gSlug);
                }}
                className={`px-4 py-2 rounded-full text-xs font-medium border ${
                  slug === gSlug
                    ? 'bg-[var(--ink)] text-[var(--bg)] border-[var(--ink)]'
                    : 'bg-[var(--card)] border-[var(--line)] hover:border-[var(--ink)]'
                }`}
              >
                {label}
              </a>
            ))}
          </div>

          <a
            href="#/tenants"
            className="c3-btn"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('tenants', '.c3-fbox');
            }}
          >
            Подобрать помещение
          </a>
        </div>
      </div>
    </section>
  );
}
