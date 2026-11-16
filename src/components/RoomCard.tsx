import { useState } from 'react';
import { Building2 } from 'lucide-react';
import type { PropertyObject, RoomItem } from '../shared/types';
import { ROOM_PURPOSE_LABELS, ROOM_STATUS_LABELS } from '../shared/defaultData';
import { formatRub } from '../utils/catalog';

interface RoomCardProps {
  room: RoomItem;
  object?: PropertyObject;
  onSelect: (room: RoomItem) => void;
}

export function RoomCard({ room, object, onSelect }: RoomCardProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <button
      type="button"
      className="c3-card"
      onClick={() => onSelect(room)}
      aria-label={`${room.title}, ${room.area} м², ${ROOM_STATUS_LABELS[room.status]}`}
    >
      <div className="c3-pic">
        {!imgError && room.image ? (
          <img
            src={room.image}
            alt={`${room.title} — ${object?.name || 'ЦУКОН'}`}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-200 text-neutral-600">
            <Building2 size={28} />
            <span className="text-xs mt-1">{ROOM_PURPOSE_LABELS[room.purpose]}</span>
          </div>
        )}
        <div className="c3-pic-scrim">
          <b className="tabular">{room.area} м²</b>
          <span className="text-xs opacity-90">{ROOM_PURPOSE_LABELS[room.purpose]}</span>
        </div>
      </div>

      <div className="flex items-start justify-between gap-2 px-1.5 mb-1">
        <h3 className="c3-h3 text-left">{room.title}</h3>
        <span className={`c3-status ${room.status}`}>{ROOM_STATUS_LABELS[room.status]}</span>
      </div>

      <p className="text-sm mute px-1.5 mb-2 line-clamp-1">
        {object ? object.name : 'Объект ЦУКОН'}
      </p>

      <div className="text-xs mute px-1.5 mb-3 flex flex-wrap gap-1.5">
        {room.features.slice(0, 3).map((feat, idx) => (
          <span key={feat}>
            {idx > 0 ? '· ' : ''}
            {feat}
          </span>
        ))}
      </div>

      <div className="mt-auto px-1.5 pt-2 border-t border-[var(--line)] flex items-baseline justify-between">
        <span className="font-medium tabular">{formatRub(room.pricePerSqm)} ₽/м² в мес.</span>
        <span className="text-xs mute tabular">≈ {formatRub(room.pricePerSqm * room.area)} ₽</span>
      </div>
    </button>
  );
}
