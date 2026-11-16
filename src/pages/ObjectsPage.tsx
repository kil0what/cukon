import { useMemo, useState } from 'react';
import { Building2, RotateCcw } from 'lucide-react';
import type { CmsState, PropertyObject, RoomItem } from '../shared/types';
import { ROOM_PURPOSE_LABELS, ROOM_STATUS_LABELS } from '../shared/defaultData';
import {
  countFreeRoomsForObject,
  filterAndSortRooms,
  getObjectById,
  type RoomFilterState,
} from '../utils/catalog';
import { InteractiveMap } from '../components/InteractiveMap';
import { RoomCard } from '../components/RoomCard';

interface ObjectsPageProps {
  state: CmsState;
  initialObjectId: string;
  onSelectRoom: (room: RoomItem) => void;
  onNavigate: (route: string, scrollTarget?: string) => void;
}

export function ObjectsPage({
  state,
  initialObjectId,
  onSelectRoom,
  onNavigate,
}: ObjectsPageProps) {
  const [filter, setFilter] = useState<RoomFilterState>({
    objectId: initialObjectId || '0',
    purpose: '0',
    status: '0',
    minArea: '',
    sort: 'default',
  });

  const filteredRooms = useMemo(
    () => filterAndSortRooms(state.rooms, filter),
    [state.rooms, filter],
  );

  const handleSelectObject = (objId: number) => {
    setFilter((prev) => ({ ...prev, objectId: String(objId) }));
    const roomsEl = document.getElementById('rooms');
    if (roomsEl) {
      roomsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const resetFilters = () => {
    setFilter({
      objectId: '0',
      purpose: '0',
      status: '0',
      minArea: '',
      sort: 'default',
    });
  };

  return (
    <>
      <section className="c3-section sub">
        <div className="w">
          <h1 className="c3-h1">Объекты и каталог помещений</h1>
          <p className="mute mt-4 max-w-2xl">
            Производственные цеха, отапливаемые склады и офисы в г. Саранске. Выберите комплекс на карте или отфильтруйте помещения по параметрам.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-9">
            {state.objects.map((obj: PropertyObject) => {
              const freeCount = countFreeRoomsForObject(state.rooms, obj.id);
              const isSelected = filter.objectId === String(obj.id);
              return (
                <button
                  key={obj.id}
                  type="button"
                  onClick={() => handleSelectObject(obj.id)}
                  className={`c3-card ${isSelected ? 'ring-2 ring-[var(--acc)]' : ''}`}
                >
                  <div className="c3-pic">
                    {obj.image ? (
                      <img src={obj.image} alt={obj.name} loading="lazy" referrerPolicy="no-referrer" />
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
                  <p className="text-sm mute px-1.5 mt-1">{obj.address}</p>
                  <p className="text-xs mute px-1.5 mt-2 mb-2 line-clamp-2">{obj.utilities}</p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="c3-section" style={{ paddingTop: 0 }}>
        <div className="w">
          <h2 className="c3-h2 mb-6">Карта объектов в Саранске</h2>
          <InteractiveMap
            objects={state.objects}
            rooms={state.rooms}
            selectedObjectId={filter.objectId}
            analytics={state.settings.analytics}
            onSelectObject={handleSelectObject}
          />
        </div>
      </section>

      <section id="rooms" className="c3-section" style={{ paddingTop: 0 }}>
        <div className="w">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="c3-h2">Помещения ({filteredRooms.length})</h2>
              <p className="text-sm mute mt-1">
                Нажмите на карточку помещения, чтобы открыть характеристики и условия аренды.
              </p>
            </div>
            {(filter.objectId !== '0' ||
              filter.purpose !== '0' ||
              filter.status !== '0' ||
              filter.minArea ||
              filter.sort !== 'default') && (
              <button type="button" className="c3-btn l" onClick={resetFilters}>
                <RotateCcw size={15} />
                <span>Сбросить фильтры</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2.5 mb-7">
            <select
              aria-label="Фильтр по объекту"
              value={filter.objectId}
              onChange={(e) => setFilter((prev) => ({ ...prev, objectId: e.target.value }))}
              className="rounded-full border border-[var(--line)] bg-[var(--card)] px-4 py-2.5 text-sm min-h-[44px]"
            >
              <option value="0">Все объекты</option>
              {state.objects.map((o) => (
                <option key={o.id} value={String(o.id)}>
                  {o.name}
                </option>
              ))}
            </select>

            <select
              aria-label="Фильтр по назначению"
              value={filter.purpose}
              onChange={(e) => setFilter((prev) => ({ ...prev, purpose: e.target.value }))}
              className="rounded-full border border-[var(--line)] bg-[var(--card)] px-4 py-2.5 text-sm min-h-[44px]"
            >
              <option value="0">Любое назначение</option>
              {Object.entries(ROOM_PURPOSE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>

            <select
              aria-label="Фильтр по статусу"
              value={filter.status}
              onChange={(e) => setFilter((prev) => ({ ...prev, status: e.target.value }))}
              className="rounded-full border border-[var(--line)] bg-[var(--card)] px-4 py-2.5 text-sm min-h-[44px]"
            >
              <option value="0">Любой статус</option>
              {Object.entries(ROOM_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>

            <input
              aria-label="Минимальная площадь, м²"
              type="number"
              min={0}
              placeholder="Площадь от (м²)"
              value={filter.minArea || ''}
              onChange={(e) => setFilter((prev) => ({ ...prev, minArea: e.target.value }))}
              className="rounded-full border border-[var(--line)] bg-[var(--card)] px-4 py-2.5 text-sm min-h-[44px] w-44"
            />

            <select
              aria-label="Сортировка"
              value={filter.sort || 'default'}
              onChange={(e) =>
                setFilter((prev) => ({
                  ...prev,
                  sort: e.target.value as RoomFilterState['sort'],
                }))
              }
              className="rounded-full border border-[var(--line)] bg-[var(--card)] px-4 py-2.5 text-sm min-h-[44px]"
            >
              <option value="default">Сначала рекомендуемые</option>
              <option value="price_asc">Цена: по возрастанию</option>
              <option value="price_desc">Цена: по убыванию</option>
              <option value="area_asc">Площадь: от меньшей</option>
              <option value="area_desc">Площадь: от большей</option>
            </select>
          </div>

          {filteredRooms.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  object={getObjectById(state.objects, room.objectId)}
                  onSelect={onSelectRoom}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl bg-[var(--card)] border border-[var(--line)] p-8 text-center">
              <p className="font-medium">По выбранным фильтрам помещения не найдены.</p>
              <p className="text-sm mute mt-1">
                Сбросьте параметры фильтрации или оставьте заявку на индивидуальный подбор.
              </p>
              <div className="mt-5 flex justify-center gap-3 flex-wrap">
                <button type="button" className="c3-btn l" onClick={resetFilters}>
                  Показать все помещения
                </button>
                <button
                  type="button"
                  className="c3-btn"
                  onClick={() => onNavigate('tenants', '.c3-fbox')}
                >
                  Оставить заявку
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
