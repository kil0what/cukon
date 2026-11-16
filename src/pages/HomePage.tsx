import { ArrowUpRight, Building2 } from 'lucide-react';
import type { CmsState, PropertyObject, RoomItem } from '../shared/types';
import { countFreeRoomsForObject, getObjectById, getStartFreeRooms } from '../utils/catalog';
import { HeroScene } from '../components/HeroScene';
import { ProcessTimeline } from '../components/ProcessTimeline';
import { RoomCard } from '../components/RoomCard';
import { LeadForm } from '../components/LeadForm';

interface HomePageProps {
  state: CmsState;
  onNavigate: (route: string, scrollTarget?: string) => void;
  onSelectObjectForCatalog: (objectId: number) => void;
  onSelectRoom: (room: RoomItem) => void;
}

export function HomePage({
  state,
  onNavigate,
  onSelectObjectForCatalog,
  onSelectRoom,
}: HomePageProps) {
  const startFreeRooms = getStartFreeRooms(state.rooms, state.settings.featuredFreeLimit);
  const totalFreeRooms = state.rooms.filter((r) => r.status === 'free').length;
  const theme = state.settings.theme;
  const showInfra = theme?.showInfraOnHome !== false;
  const showProcess = theme?.showProcessOnHome !== false;
  const showFaq = theme?.showFaqOnHome !== false;
  const showLeadForm = theme?.showLeadFormOnHome !== false;

  return (
    <>
      <HeroScene
        pages={state.pages}
        tenantsTotalCount={state.settings.tenantsTotalCount}
        objectsCount={state.objects.length}
        freeRoomsCount={totalFreeRooms}
        showInfra={showInfra}
        onNavigate={onNavigate}
      />

      <section className="c3-section">
        <div className="w">
          <p className="c3-big">
            {state.pages.homeManifestoLead} <span>{state.pages.homeManifestoSub}</span>
          </p>
        </div>
      </section>

      {/* Objects Section */}
      <section className="c3-section" style={{ paddingTop: 0 }}>
        <div className="w">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-7">
            <h2 className="c3-h2">Объекты в управлении</h2>
            <a
              className="c3-btn l"
              href="#/objects"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('objects');
              }}
            >
              Все объекты и карта
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {state.objects.map((obj: PropertyObject) => {
              const freeCount = countFreeRoomsForObject(state.rooms, obj.id);
              return (
                <button
                  key={obj.id}
                  type="button"
                  className="c3-card group"
                  onClick={() => onSelectObjectForCatalog(obj.id)}
                >
                  <div className="c3-pic">
                    {obj.image ? (
                      <img
                        src={obj.image}
                        alt={obj.name}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-neutral-200">
                        <Building2 size={28} />
                      </div>
                    )}
                    <div className="c3-pic-scrim">
                      <b className="tabular">{freeCount} своб.</b>
                      <span className="text-xs opacity-90">Саранск</span>
                    </div>
                  </div>
                  <h3 className="c3-h3 px-1.5">{obj.name}</h3>
                  <p className="text-sm mute px-1.5 mt-1 mb-3">{obj.address}</p>
                  <div className="mt-auto px-1.5 pt-2 border-t border-[var(--line)] flex items-center justify-between text-sm font-medium">
                    <span>Смотреть помещения</span>
                    <ArrowUpRight size={17} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Free Rooms (5-7 limit per TZ 4.1) */}
      <section className="c3-section" style={{ paddingTop: 0 }}>
        <div className="w">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-7">
            <div>
              <h2 className="c3-h2">Свободные помещения</h2>
              <p className="text-sm mute mt-1">
                Актуальные предложения · прямая аренда от управляющей компании
              </p>
            </div>
            <a
              className="c3-btn l"
              href="#/objects"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('objects', '#rooms');
              }}
            >
              Весь каталог ({state.rooms.length})
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {startFreeRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                object={getObjectById(state.objects, room.objectId)}
                onSelect={onSelectRoom}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Tenants vs Owners Panels */}
      <section className="c3-section" style={{ paddingTop: 0 }}>
        <div className="w c3-pan">
          <a
            href="#/tenants"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('tenants');
            }}
          >
            <h2 className="c3-h2">Арендатору</h2>
            <div>
              <p>Не просто квадратные метры, а готовая инфраструктура для запуска и роста бизнеса.</p>
            </div>
          </a>

          <a
            href="#/owners"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('owners');
            }}
          >
            <h2 className="c3-h2">Собственнику</h2>
            <div>
              <p>Превращаем производственно-коммерческую недвижимость в работающий актив под ключ.</p>
            </div>
          </a>
        </div>
      </section>

      {/* How We Work */}
      {showProcess && (
        <section className="c3-section" style={{ paddingTop: 0 }}>
          <div className="w">
            <ProcessTimeline />
          </div>
        </section>
      )}

      {/* Key FAQ Preview */}
      {showFaq && (
        <section className="c3-section" style={{ paddingTop: 0 }}>
          <div className="w">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-7">
              <h2 className="c3-h2">Частые вопросы</h2>
              <a
                className="c3-btn l"
                href="#/faq"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('faq');
                }}
              >
                Все вопросы и ответы ({state.faqs.length})
              </a>
            </div>

            <div className="c3-faq border-t border-[var(--line)]">
              {state.faqs.slice(0, 5).map((item, idx) => (
                <details key={item.id} open={idx === 0}>
                  <summary>{item.question}</summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Lead Form */}
      {showLeadForm && (
        <section className="c3-section" style={{ paddingTop: 0 }}>
          <div className="w">
            <div className="c3-fbox">
              <h2 className="c3-h2">Остались вопросы?</h2>
              <p className="mute mt-2">
                Оставьте заявку — подберём помещение под вашу площадь, мощность и бюджет.
              </p>
              <LeadForm
                type="tenant"
                contacts={state.settings.contacts}
                analytics={state.settings.analytics}
                onNavigatePrivacy={() => onNavigate('privacy-policy')}
              />
            </div>
          </div>
        </section>
      )}
    </>
  );
}
