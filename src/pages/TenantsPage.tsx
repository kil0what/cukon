import { useState } from 'react';
import type { CmsState, RoomItem } from '../shared/types';
import { getObjectById, getStartFreeRooms } from '../utils/catalog';
import { RoomCard } from '../components/RoomCard';
import { LeadForm } from '../components/LeadForm';

interface TenantsPageProps {
  state: CmsState;
  prefillMessage?: string;
  onSelectRoom: (room: RoomItem) => void;
  onNavigate: (route: string) => void;
}

export function TenantsPage({
  state,
  prefillMessage,
  onSelectRoom,
  onNavigate,
}: TenantsPageProps) {
  const [showAllFree, setShowAllFree] = useState(false);
  const allFree = state.rooms.filter((r) => r.status === 'free');
  const startFree = getStartFreeRooms(state.rooms, state.settings.featuredFreeLimit);
  const visibleRooms = showAllFree ? allFree : startFree;

  return (
    <section className="c3-section sub">
      <div className="w">
        <h1 className="c3-h1">Арендаторам</h1>
        <p className="mute mt-5 max-w-2xl text-lg">{state.pages.tenantsIntro}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-9">
          {state.infoBlocks.map((block) => (
            <div
              key={block.id}
              className="rounded-3xl bg-[var(--card)] border border-[var(--line)] p-7"
            >
              <h2 className="c3-h3 mb-2" style={{ fontSize: 18 }}>
                {block.title}
              </h2>
              <p className="text-sm mute leading-relaxed">{block.summary}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4 mt-14 mb-6">
          <div>
            <h2 className="c3-h2">Свободные помещения</h2>
            <p className="text-sm mute mt-1">
              Актуальные свободные площади, готовые к заселению
            </p>
          </div>
          <div className="flex gap-2.5 flex-wrap">
            {allFree.length > startFree.length && (
              <button
                type="button"
                className="c3-btn l"
                onClick={() => setShowAllFree((prev) => !prev)}
              >
                {showAllFree ? `Показать первые ${startFree.length}` : `Показать все (${allFree.length})`}
              </button>
            )}
            <a
              className="c3-btn l"
              href="#/objects"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('objects');
              }}
            >
              Весь каталог и карта
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              object={getObjectById(state.objects, room.objectId)}
              onSelect={onSelectRoom}
            />
          ))}
        </div>

        <div className="c3-fbox mt-14">
          <h2 className="c3-h2">Подобрать помещение</h2>
          <p className="mute mt-2">
            Укажите желаемую площадь и технические требования — подготовим подборку в течение рабочего дня.
          </p>
          <LeadForm
            type="tenant"
            prefillMessage={prefillMessage}
            contacts={state.settings.contacts}
            analytics={state.settings.analytics}
            onNavigatePrivacy={() => onNavigate('privacy-policy')}
          />
        </div>
      </div>
    </section>
  );
}
