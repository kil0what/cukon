import { useState } from 'react';
import { INFRASTRUCTURE_ITEMS } from '../shared/defaultData';
import type { PageTexts } from '../shared/types';

interface HeroSceneProps {
  pages: PageTexts;
  tenantsTotalCount: string;
  objectsCount: number;
  freeRoomsCount: number;
  showInfra?: boolean;
  onNavigate: (route: string, scrollTarget?: string) => void;
}

export function HeroScene({
  pages,
  tenantsTotalCount,
  objectsCount,
  freeRoomsCount,
  showInfra = true,
  onNavigate,
}: HeroSceneProps) {
  const [activeInfra, setActiveInfra] = useState<string | null>(null);

  const windows: Array<{ x: number; y: number; w: number; h: number; d: string }> = [];
  for (let r = 0; r < 4; r += 1) {
    for (let c = 0; c < 4; c += 1) {
      windows.push({
        x: 718 + c * 34,
        y: 178 + r * 42,
        w: 16,
        h: 22,
        d: `${(1.1 + (r * 4 + c) * 0.08).toFixed(2)}s`,
      });
    }
  }
  for (let i = 0; i < 3; i += 1) {
    windows.push({
      x: 84 + i * 80,
      y: 252,
      w: 44,
      h: 26,
      d: `${(1.4 + i * 0.2).toFixed(2)}s`,
    });
  }

  return (
    <section className="c3-hero">
      <div className="w">
        <h1 className="c3-h1">
          <span className="m">
            <span>{pages.homeHeroTitle1}</span>
          </span>
          <span className="m">
            <span>{pages.homeHeroTitle2}</span>
          </span>
          <span className="m">
            <span>{pages.homeHeroTitle3}</span>
          </span>
        </h1>

        <div className="c3-lead">
          <p>{pages.homeHeroLead}</p>
          <div className="flex gap-2.5 flex-wrap">
            <a
              className="c3-btn"
              href="#/objects"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('objects', '#rooms');
              }}
            >
              Смотреть помещения
            </a>
            <a
              className="c3-btn l"
              href="#/owners"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('owners', '.c3-fbox');
              }}
            >
              Передать объект
            </a>
          </div>
        </div>

        <div className="c3-scene">
          <svg
            className={`hero-svg ${activeInfra ? 'dim' : ''}`}
            viewBox="0 0 1200 400"
            role="img"
            aria-label="Архитектурная схема производственной площадки: цеха, электросети, газоснабжение, КПП охраны и инженерные коммуникации"
          >
            <g className="s">
              <path pathLength={1} d="M0 360H1200" />
              <path pathLength={1} d="M60 360V212L140 172V212L220 172V212L300 172V360" />
              <path pathLength={1} d="M400 360V240H640V360M390 240H650" />
              <path pathLength={1} d="M700 360V150H860V360M690 150H870" />
              <rect pathLength={1} x="488" y="296" width="74" height="64" />
            </g>

            <g data-g="gas" className={activeInfra === 'gas' ? 'hl' : ''}>
              <path pathLength={1} d="M0 382H1200" />
              <path pathLength={1} d="M1070 360V322a28 28 0 0 1 56 0V360" />
              <path pathLength={1} d="M330 360V88H360V360" />
            </g>

            <g data-g="power" className={activeInfra === 'power' ? 'hl' : ''}>
              <path pathLength={1} d="M935 360L968 140L1001 360M948 250H988M956 200H980M968 140V96M938 108H998" />
              <path pathLength={1} d="M938 108Q900 156 860 152" />
              <path pathLength={1} d="M998 108Q1080 150 1170 128" />
            </g>

            <g data-g="guard" className={activeInfra === 'guard' ? 'hl' : ''}>
              <path pathLength={1} d="M18 360V308H72V360M72 328H190" />
              <path pathLength={1} d="M190 322V360" />
            </g>

            <g data-g="clean" className={activeInfra === 'clean' ? 'hl' : ''}>
              <path pathLength={1} d="M250 360V298Q250 286 264 286H280" />
              <path pathLength={1} d="M1020 360V312M1000 332Q1020 296 1040 332" />
            </g>

            <g data-g="eng" className={activeInfra === 'eng' ? 'hl' : ''}>
              <circle pathLength={1} cx="520" cy="212" r="18" />
              <path pathLength={1} d="M520 194V230M502 212H538M600 240V206H620V240" />
            </g>

            {windows.map((w, idx) => (
              <rect
                key={idx}
                className="lt"
                style={{ ['--d' as string]: w.d }}
                x={w.x}
                y={w.y}
                width={w.w}
                height={w.h}
              />
            ))}
          </svg>
        </div>

        {showInfra && (
          <div className="c3-inf" onMouseLeave={() => setActiveInfra(null)}>
            {INFRASTRUCTURE_ITEMS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={activeInfra === item.key ? 'active' : ''}
                onMouseEnter={() => setActiveInfra(item.key)}
                onFocus={() => setActiveInfra(item.key)}
                onBlur={() => setActiveInfra(null)}
                onClick={() => setActiveInfra((prev) => (prev === item.key ? null : item.key))}
              >
                <h3 className="c3-h3">{item.title}</h3>
                <p>{item.desc}</p>
              </button>
            ))}
          </div>
        )}

        <div className="c3-stats">
          <div>
            <b>{tenantsTotalCount}</b>
            <span className="mute">арендаторов на наших объектах</span>
          </div>
          <div>
            <b>{objectsCount}</b>
            <span className="mute">производственно-деловых комплекса</span>
          </div>
          <div>
            <b>{freeRoomsCount}</b>
            <span className="mute">свободных помещений готовых к въезду</span>
          </div>
        </div>
      </div>
    </section>
  );
}
