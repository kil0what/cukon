import { useMemo, useState } from 'react';
import { ExternalLink, MapPin, Minus, Plus, RotateCcw } from 'lucide-react';
import type { AnalyticsSettings, PropertyObject, RoomItem } from '../shared/types';
import { countFreeRoomsForObject, formatRub } from '../utils/catalog';
import { trackGoal } from '../utils/analytics';

interface InteractiveMapProps {
  objects: PropertyObject[];
  rooms: RoomItem[];
  selectedObjectId: string;
  analytics: AnalyticsSettings;
  onSelectObject: (objectId: number) => void;
}

export function InteractiveMap({
  objects,
  rooms,
  selectedObjectId,
  analytics,
  onSelectObject,
}: InteractiveMapProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [activeObjId, setActiveObjId] = useState<number>(
    selectedObjectId !== '0' ? Number(selectedObjectId) : objects[0]?.id || 1,
  );

  const activeObj = useMemo(
    () => objects.find((o) => o.id === activeObjId) || objects[0],
    [objects, activeObjId],
  );

  const activeObjStats = useMemo(() => {
    if (!activeObj) return { freeCount: 0, minPrice: 0, totalArea: 0 };
    const objRooms = rooms.filter((r) => r.objectId === activeObj.id);
    const freeRooms = objRooms.filter((r) => r.status === 'free');
    const prices = objRooms.map((r) => r.pricePerSqm);
    return {
      freeCount: freeRooms.length,
      minPrice: prices.length ? Math.min(...prices) : 0,
      totalArea: freeRooms.reduce((sum, r) => sum + r.area, 0),
    };
  }, [activeObj, rooms]);

  const handlePinClick = (obj: PropertyObject) => {
    setActiveObjId(obj.id);
    trackGoal(analytics, 'map_pin_click', '/objects', obj.name);
  };

  return (
    <div className="rounded-3xl bg-[var(--card)] border border-[var(--line)] overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr]">
        {/* Interactive Map Canvas */}
        <div className="relative bg-[#e8ebee] min-h-[340px] md:min-h-[400px] overflow-hidden border-b lg:border-b-0 lg:border-r border-[var(--line)]">
          <div className="absolute top-3 left-3 z-10 bg-[var(--card)]/95 border border-[var(--line)] rounded-xl px-3 py-1.5 text-xs font-medium">
            г. Саранск · Интерактивная карта объектов ЦУКОН
          </div>

          <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
            <button
              type="button"
              className="w-9 h-9 rounded-xl bg-[var(--card)] border border-[var(--line)] flex items-center justify-center hover:border-[var(--ink)] cursor-pointer"
              aria-label="Приблизить карту"
              onClick={() => setZoom((z) => Math.min(1.6, +(z + 0.2).toFixed(1)))}
            >
              <Plus size={16} />
            </button>
            <button
              type="button"
              className="w-9 h-9 rounded-xl bg-[var(--card)] border border-[var(--line)] flex items-center justify-center hover:border-[var(--ink)] cursor-pointer"
              aria-label="Отдалить карту"
              onClick={() => setZoom((z) => Math.max(0.8, +(z - 0.2).toFixed(1)))}
            >
              <Minus size={16} />
            </button>
            <button
              type="button"
              className="w-9 h-9 rounded-xl bg-[var(--card)] border border-[var(--line)] flex items-center justify-center hover:border-[var(--ink)] cursor-pointer"
              aria-label="Сбросить масштаб карты"
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
            >
              <RotateCcw size={15} />
            </button>
          </div>

          <svg
            viewBox="0 0 640 380"
            className="w-full h-full block select-none"
            role="img"
            aria-label="Интерактивная карта Саранска с расположением производственных и складских объектов ЦУКОН"
          >
            <g
              transform={`translate(${320 + pan.x}, ${190 + pan.y}) scale(${zoom}) translate(-320, -190)`}
              style={{ transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}
            >
              {/* Saransk Industrial & Urban Road Grid */}
              <rect x="0" y="0" width="640" height="380" fill="#eaedf0" />
              <path
                d="M 280 0 Q 295 140 270 220 T 305 380"
                fill="none"
                stroke="#cfd9e6"
                strokeWidth="18"
              />
              <g fill="none" stroke="#d5d8dc" strokeWidth="8">
                <path d="M 0 95 H 640" />
                <path d="M 0 185 H 640" />
                <path d="M 0 265 H 640" />
                <path d="M 165 0 V 380" />
                <path d="M 325 0 V 380" />
                <path d="M 480 0 V 380" />
                <path d="M 40 340 L 580 55" strokeWidth="6" />
              </g>
              <g fill="none" stroke="#c3c7cc" strokeWidth="2" strokeDasharray="6 6">
                <path d="M 105 0 V 380" />
                <path d="M 0 320 H 640" />
              </g>

              {/* Street Labels */}
              <g fill="#737982" fontSize="10" fontFamily="Onest, sans-serif">
                <text x="28" y="88">ул. 1-я Промышленная</text>
                <text x="28" y="178">ул. Рабочая / Центр</text>
                <text x="395" y="242">Александровское шоссе</text>
                <text x="275" y="362">р. Инсар</text>
              </g>

              {/* Object Markers */}
              {objects.map((obj) => {
                const isSelected = activeObj?.id === obj.id;
                const freeCount = countFreeRoomsForObject(rooms, obj.id);
                return (
                  <g
                    key={obj.id}
                    className="cursor-pointer"
                    tabIndex={0}
                    role="button"
                    aria-label={`${obj.name}, свободных помещений: ${freeCount}`}
                    onClick={() => handlePinClick(obj)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handlePinClick(obj);
                      }
                    }}
                  >
                    <circle
                      cx={obj.x}
                      cy={obj.y}
                      r={isSelected ? 24 : 18}
                      fill={isSelected ? '#2447ff' : '#15171a'}
                      stroke="#ffffff"
                      strokeWidth="3"
                    />
                    <text
                      x={obj.x}
                      y={obj.y + 5}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="13"
                      fontWeight="600"
                      fontFamily="Unbounded, sans-serif"
                    >
                      {obj.id}
                    </text>
                    <rect
                      x={obj.x - 64}
                      y={obj.y + 24}
                      width="128"
                      height="22"
                      rx="6"
                      fill="#ffffff"
                      stroke={isSelected ? '#2447ff' : '#d3d6d9'}
                    />
                    <text
                      x={obj.x}
                      y={obj.y + 39}
                      textAnchor="middle"
                      fill="#15171a"
                      fontSize="10.5"
                      fontWeight="500"
                      fontFamily="Onest, sans-serif"
                    >
                      {freeCount} своб. · Объект № {obj.id}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Selected Object Panel */}
        {activeObj && (
          <div className="p-6 flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs mute mb-2">
                <MapPin size={14} />
                <span>Объект № {activeObj.id} · Саранск</span>
              </div>
              <h3 className="c3-h3" style={{ fontSize: 20 }}>
                {activeObj.name}
              </h3>
              <p className="text-sm font-medium mt-1.5">{activeObj.address}</p>
              <p className="text-sm mute mt-3 leading-relaxed">{activeObj.description}</p>

              <dl className="mt-4 pt-4 border-t border-[var(--line)] grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs mute">Свободно помещений</dt>
                  <dd className="font-semibold tabular text-lg text-[var(--ok)]">
                    {activeObjStats.freeCount}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs mute">Ставка от</dt>
                  <dd className="font-semibold tabular text-lg">
                    {activeObjStats.minPrice ? `${formatRub(activeObjStats.minPrice)} ₽/м²` : 'По запросу'}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs mute">Коммуникации</dt>
                  <dd className="text-xs mt-0.5">{activeObj.utilities}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs mute">Координаты</dt>
                  <dd className="text-xs tabular mt-0.5">
                    {activeObj.lat.toFixed(4)}, {activeObj.lng.toFixed(4)}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="flex flex-wrap gap-2.5 pt-2">
              <button
                type="button"
                className="c3-btn flex-1"
                onClick={() => onSelectObject(activeObj.id)}
              >
                Помещения объекта
              </button>
              <a
                className="c3-btn l"
                href={`https://yandex.ru/maps/?pt=${activeObj.lng},${activeObj.lat}&z=16&l=map`}
                target="_blank"
                rel="noopener noreferrer"
                title="Открыть точку в Яндекс.Картах"
              >
                <span>Яндекс.Карты</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
