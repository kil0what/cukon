/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { DEFAULT_CMS_STATE } from './shared/defaultData';
import type { CmsState, PropertyObject, RoomItem } from './shared/types';
import { buildSchemaOrgGraph, getObjectById } from './utils/catalog';
import { fetchCmsBootstrap } from './utils/api';
import { initYandexMetrika, trackGoal, trackPageHit } from './utils/analytics';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { RoomModal } from './components/RoomModal';
import { CookieBanner } from './components/CookieBanner';
import { HomePage } from './pages/HomePage';
import { ObjectsPage } from './pages/ObjectsPage';
import { TenantsPage } from './pages/TenantsPage';
import { OwnersPage } from './pages/OwnersPage';
import { ResidentsPage } from './pages/ResidentsPage';
import { AboutPage } from './pages/AboutPage';
import { FaqPage } from './pages/FaqPage';
import { GuidePage, type GuideSlug } from './pages/GuidePage';
import { ContactsPage } from './pages/ContactsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { AdminPage } from './pages/AdminPage';

const VALID_ROUTES = new Set([
  '',
  'objects',
  'tenants',
  'owners',
  'residents',
  'about',
  'faq',
  'guide-production',
  'guide-warehouses',
  'guide-utilities',
  'guide-terms',
  'contacts',
  'privacy-policy',
  'privacy',
  'admin',
]);

const ROUTE_SEO: Record<string, [string, string]> = {
  '': [
    'ЦУКОН — управление производственно-коммерческой недвижимостью в Мордовии',
    'Аренда производственных цехов, складов и офисов в Саранске с готовой инфраструктурой. Управление коммерческой недвижимостью.',
  ],
  objects: [
    'Объекты и свободные помещения в Саранске — ЦУКОН',
    'Каталог производственных, складских и офисных помещений с фильтрацией, ценами, статусами и интерактивной картой объектов.',
  ],
  tenants: [
    'Арендаторам — аренда производственных и складских помещений | ЦУКОН',
    'Подберём помещение в Саранске за 1 рабочий день. Электричество до 350 кВт, газ, охрана 24/7, подъезд для грузового транспорта.',
  ],
  owners: [
    'Собственникам — передать объект в управление | ЦУКОН',
    'Превращаем производственно-коммерческую недвижимость в работающий актив: привлечение арендаторов и эксплуатация сетей.',
  ],
  residents: [
    'Резиденты ЦУКОН — компании на наших площадках в Саранске',
    'Более 120 арендаторов работают на производственных и офисных площадках под управлением ЦУКОН.',
  ],
  about: [
    'О компании ЦУКОН — управляющая компания недвижимости в Мордовии',
    'ООО «ЦУКОН» (г. Саранск): управление коммерческой недвижимостью, эксплуатация инженерной инфраструктуры и развитие площадок.',
  ],
  faq: [
    'Частые вопросы (FAQ) по аренде помещений в Саранске — ЦУКОН',
    'Ответы на вопросы: где снять недорогое производство, склад с охраной и электрическими мощностями в Саранске.',
  ],
  'guide-production': [
    'Производственные помещения в Саранске: площади и кВт — ЦУКОН',
    'Аренда производственных цехов в Саранске от 180 до 620 м² с мощностью до 350 кВт, газом и кран-балками.',
  ],
  'guide-warehouses': [
    'Склады, офисы и площадки для фур с охраной в Саранске — ЦУКОН',
    'Отапливаемые склады от 250 ₽/м², офисы и площадки для грузового транспорта с охраной 24/7 в Саранске.',
  ],
  'guide-utilities': [
    'Коммуникации, обслуживание и охрана объектов — ЦУКОН Саранск',
    'Условия эксплуатации, электроснабжение, газоснабжение, КПП 24/7 и помощь арендаторам от УК ЦУКОН.',
  ],
  'guide-terms': [
    'Условия аренды, точные площади и ставки помещений — ЦУКОН',
    'Полная таблица площадей, цен и статусов производственных, складских и офисных помещений ЦУКОН.',
  ],
  contacts: [
    'Контакты и реквизиты — ЦУКОН Саранск',
    'Телефон +7 (8342) 27-10-27, email zukonar@mail.ru, адрес: г. Саранск, ул. 1-я Промышленная, д. 23/1.',
  ],
  'privacy-policy': [
    'Политика обработки персональных данных — ЦУКОН',
    'Политика обработки персональных данных ООО «ЦЕНТР УПРАВЛЕНИЯ КОММЕРЧЕСКОЙ НЕДВИЖИМОСТЬЮ» в соответствии с 152-ФЗ.',
  ],
  privacy: [
    'Политика обработки персональных данных — ЦУКОН',
    'Политика обработки персональных данных ООО «ЦЕНТР УПРАВЛЕНИЯ КОММЕРЧЕСКОЙ НЕДВИЖИМОСТЬЮ» в соответствии с 152-ФЗ.',
  ],
  admin: [
    'CMS Панель управления — ЦУКОН',
    'Система управления контентом, объектами, заявками, Яндекс.Метрикой и экспортом WordPress.',
  ],
};

function readRouteFromHash(): string {
  const hashRaw = window.location.hash.replace(/^#\/?/, '').split('?')[0].replace(/\/+$/, '');
  if (hashRaw) {
    if (hashRaw === 'privacy') return 'privacy-policy';
    return VALID_ROUTES.has(hashRaw) ? hashRaw : '';
  }
  const pathRaw = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (pathRaw === 'privacy-policy' || pathRaw === 'privacy') {
    return 'privacy-policy';
  }
  return VALID_ROUTES.has(pathRaw) ? pathRaw : '';
}

export default function App() {
  const [cmsState, setCmsState] = useState<CmsState>(DEFAULT_CMS_STATE);
  const [smtpConfigured, setSmtpConfigured] = useState(false);
  const [route, setRoute] = useState<string>(() => readRouteFromHash());
  const [catalogObjectFilter, setCatalogObjectFilter] = useState<string>('0');
  const [selectedRoom, setSelectedRoom] = useState<RoomItem | null>(null);
  const [prefillLeadMsg, setPrefillLeadMsg] = useState<string>('');

  useEffect(() => {
    let active = true;
    fetchCmsBootstrap()
      .then((res) => {
        if (!active) return;
        setCmsState(res.state);
        setSmtpConfigured(res.smtpConfigured);
      })
      .catch(() => {
        // Keep seed state if offline
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      setRoute(readRouteFromHash());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Sync SEO meta, Schema.org JSON-LD, and Yandex.Metrika hits
  useEffect(() => {
    const [title, desc] = ROUTE_SEO[route] || ROUTE_SEO[''];
    document.title = title;
    const descMeta = document.querySelector('meta[name="description"]');
    if (descMeta) descMeta.setAttribute('content', desc);

    const schemaId = 'tsukon-jsonld';
    let scriptEl = document.getElementById(schemaId) as HTMLScriptElement | null;
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = schemaId;
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }
    scriptEl.textContent = JSON.stringify(
      buildSchemaOrgGraph(window.location.origin, cmsState),
    );

    initYandexMetrika(cmsState.settings.analytics);
    trackPageHit(cmsState.settings.analytics, `/#/${route}`);
  }, [route, cmsState]);

  const navigate = useCallback((nextRoute: string, scrollTarget?: string) => {
    const targetHash = `#/${nextRoute}`;
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    } else {
      setRoute(nextRoute);
      window.scrollTo({ top: 0 });
    }
    if (nextRoute !== 'objects') {
      setCatalogObjectFilter('0');
    }
    if (scrollTarget) {
      setTimeout(() => {
        const el = document.querySelector(scrollTarget);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 90);
    }
  }, []);

  const handleSelectObjectForCatalog = useCallback(
    (objectId: number) => {
      setCatalogObjectFilter(String(objectId));
      navigate('objects', '#rooms');
    },
    [navigate],
  );

  const handleSelectRoom = useCallback(
    (room: RoomItem) => {
      setSelectedRoom(room);
      trackGoal(cmsState.settings.analytics, 'room_card_open', `/#/${route}`, room.title);
    },
    [cmsState.settings.analytics, route],
  );

  const handleRequestRoom = useCallback(
    (room: RoomItem, object?: PropertyObject) => {
      setSelectedRoom(null);
      setPrefillLeadMsg(
        `Интересует: ${room.title}, ${object?.name || 'ЦУКОН'}, ${room.area} м²`,
      );
      navigate('tenants', '.c3-fbox');
    },
    [navigate],
  );

  const selectedRoomObject = useMemo(
    () => (selectedRoom ? getObjectById(cmsState.objects, selectedRoom.objectId) : undefined),
    [selectedRoom, cmsState.objects],
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header currentRoute={route} onNavigate={navigate} />

      <main className="flex-1">
        {route === '' && (
          <HomePage
            state={cmsState}
            onNavigate={navigate}
            onSelectObjectForCatalog={handleSelectObjectForCatalog}
            onSelectRoom={handleSelectRoom}
          />
        )}
        {route === 'objects' && (
          <ObjectsPage
            key={catalogObjectFilter}
            state={cmsState}
            initialObjectId={catalogObjectFilter}
            onSelectRoom={handleSelectRoom}
            onNavigate={navigate}
          />
        )}
        {route === 'tenants' && (
          <TenantsPage
            state={cmsState}
            prefillMessage={prefillLeadMsg}
            onSelectRoom={handleSelectRoom}
            onNavigate={navigate}
          />
        )}
        {route === 'owners' && <OwnersPage state={cmsState} onNavigate={navigate} />}
        {route === 'residents' && <ResidentsPage state={cmsState} onNavigate={navigate} />}
        {route === 'about' && <AboutPage state={cmsState} onNavigate={navigate} />}
        {route === 'faq' && <FaqPage state={cmsState} onNavigate={navigate} />}
        {(route === 'guide-production' ||
          route === 'guide-warehouses' ||
          route === 'guide-utilities' ||
          route === 'guide-terms') && (
          <GuidePage
            slug={route as GuideSlug}
            state={cmsState}
            onSelectRoom={handleSelectRoom}
            onNavigate={navigate}
          />
        )}
        {route === 'contacts' && <ContactsPage state={cmsState} onNavigate={navigate} />}
        {(route === 'privacy-policy' || route === 'privacy') && <PrivacyPage state={cmsState} />}
        {route === 'admin' && (
          <AdminPage
            state={cmsState}
            smtpConfigured={smtpConfigured}
            onStateUpdated={setCmsState}
            onNavigate={navigate}
          />
        )}
      </main>

      <Footer
        contacts={cmsState.settings.contacts}
        analytics={cmsState.settings.analytics}
        onNavigate={navigate}
      />

      <RoomModal
        room={selectedRoom}
        object={selectedRoomObject}
        onClose={() => setSelectedRoom(null)}
        onRequestRoom={handleRequestRoom}
      />

      {route !== 'admin' && (
        <CookieBanner onNavigatePrivacy={() => navigate('privacy-policy')} />
      )}
    </div>
  );
}
