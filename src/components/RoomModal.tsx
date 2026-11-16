import { useEffect, useState } from 'react';
import { Building2, X } from 'lucide-react';
import type { PropertyObject, RoomItem } from '../shared/types';
import { ROOM_PURPOSE_LABELS, ROOM_STATUS_LABELS } from '../shared/defaultData';
import { formatRub } from '../utils/catalog';

interface RoomModalProps {
  room: RoomItem | null;
  object?: PropertyObject;
  onClose: () => void;
  onRequestRoom: (room: RoomItem, object?: PropertyObject) => void;
}

export function RoomModal({ room, object, onClose, onRequestRoom }: RoomModalProps) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [room?.id]);

  useEffect(() => {
    if (!room) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [room, onClose]);

  if (!room) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="room-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[92dvh] overflow-y-auto rounded-3xl bg-[var(--bg)] text-[var(--ink)] border border-[var(--line)] p-5 md:p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="text-xs mute mb-1">
              {ROOM_PURPOSE_LABELS[room.purpose]} ·{' '}
              <span className={`c3-status ${room.status}`}>{ROOM_STATUS_LABELS[room.status]}</span>
            </div>
            <h2 id="room-modal-title" className="c3-h2" style={{ fontSize: 'clamp(22px, 3vw, 28px)' }}>
              {room.title}
            </h2>
          </div>
          <button
            type="button"
            className="w-10 h-10 rounded-full border border-[var(--line)] bg-[var(--card)] flex items-center justify-center hover:border-[var(--ink)] cursor-pointer shrink-0"
            aria-label="Закрыть карточку помещения"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="c3-pic" style={{ height: 240 }}>
          {!imgError && room.image ? (
            <img
              src={room.image}
              alt={room.title}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-200 text-neutral-600">
              <Building2 size={36} />
            </div>
          )}
          <div className="c3-pic-scrim">
            <b className="tabular" style={{ fontSize: 30 }}>
              {room.area} м²
            </b>
            <span className="text-sm">{object?.address}</span>
          </div>
        </div>

        <p className="text-sm mute mt-2 mb-5">
          {object?.name} · {object?.address}
        </p>

        <dl className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-y-3 gap-x-6 py-4 border-y border-[var(--line)] text-sm">
          <dt className="mute">Площадь</dt>
          <dd className="font-medium tabular">{room.area} м²</dd>

          <dt className="mute">Назначение</dt>
          <dd>{ROOM_PURPOSE_LABELS[room.purpose]}</dd>

          <dt className="mute">Ставка аренды</dt>
          <dd className="font-medium tabular">
            {formatRub(room.pricePerSqm)} ₽/м² в мес. (≈ {formatRub(room.pricePerSqm * room.area)} ₽ в мес.)
          </dd>

          <dt className="mute">Характеристики</dt>
          <dd>{room.features.join(' · ')}</dd>

          <dt className="mute">Условия аренды</dt>
          <dd>{room.leaseTerms}</dd>

          {object && (
            <>
              <dt className="mute">Инфраструктура</dt>
              <dd>{object.utilities}</dd>
            </>
          )}
        </dl>

        <div className="flex flex-wrap items-center justify-between gap-3 mt-6">
          <button
            type="button"
            className="c3-btn"
            onClick={() => onRequestRoom(room, object)}
          >
            Оставить заявку на помещение
          </button>
          <button type="button" className="c3-btn l" onClick={onClose}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
