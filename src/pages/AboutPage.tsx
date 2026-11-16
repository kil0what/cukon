import type { CmsState } from '../shared/types';

interface AboutPageProps {
  state: CmsState;
  onNavigate: (route: string) => void;
}

export function AboutPage({ state, onNavigate }: AboutPageProps) {
  return (
    <section className="c3-section sub">
      <div className="w">
        <h1 className="c3-h1">О компании</h1>
        <p className="c3-big mt-7">{state.pages.aboutStatement}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-11">
          <div className="rounded-3xl bg-[var(--card)] border border-[var(--line)] p-7">
            <h2 className="c3-h3 mb-2" style={{ fontSize: 18 }}>
              Для собственника
            </h2>
            <p className="text-sm mute leading-relaxed">
              Превращаем производственно-коммерческую недвижимость в работающий актив с прозрачной экономикой и бережной эксплуатацией.
            </p>
          </div>
          <div className="rounded-3xl bg-[var(--card)] border border-[var(--line)] p-7">
            <h2 className="c3-h3 mb-2" style={{ fontSize: 18 }}>
              Для арендатора
            </h2>
            <p className="text-sm mute leading-relaxed">
              Предоставляем помещения с готовыми коммуникациями, кран-балками, рампами, охраной и круглосуточным доступом.
            </p>
          </div>
          <div className="rounded-3xl bg-[var(--card)] border border-[var(--line)] p-7">
            <h2 className="c3-h3 mb-2" style={{ fontSize: 18 }}>
              Для Республики Мордовия
            </h2>
            <p className="text-sm mute leading-relaxed">
              Помогаем эффективнее использовать промышленную инфраструктуру региона, сохранять рабочие места и развивать локальное производство.
            </p>
          </div>
          <div className="rounded-3xl bg-[var(--card)] border border-[var(--line)] p-7">
            <h2 className="c3-h3 mb-2" style={{ fontSize: 18 }}>
              Официальные реквизиты
            </h2>
            <p className="text-sm mute leading-relaxed">
              {state.settings.contacts.companyName} · ИНН {state.settings.contacts.inn} · КПП{' '}
              {state.settings.contacts.kpp} · ОГРН {state.settings.contacts.ogrn}. Адрес:{' '}
              {state.settings.contacts.legalAddress}.
            </p>
          </div>
        </div>

        <div className="mt-10 flex gap-3 flex-wrap">
          <a
            href="#/objects"
            className="c3-btn"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('objects');
            }}
          >
            Каталог объектов
          </a>
          <a
            href="#/contacts"
            className="c3-btn l"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('contacts');
            }}
          >
            Связаться с нами
          </a>
        </div>
      </div>
    </section>
  );
}
