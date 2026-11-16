import type { CmsState } from '../shared/types';
import { LeadForm } from '../components/LeadForm';

interface OwnersPageProps {
  state: CmsState;
  onNavigate: (route: string) => void;
}

export function OwnersPage({ state, onNavigate }: OwnersPageProps) {
  return (
    <section className="c3-section sub">
      <div className="w">
        <h1 className="c3-h1">Собственникам</h1>
        <p className="mute mt-5 max-w-2xl text-lg">{state.pages.ownersIntro}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-9">
          <div className="rounded-3xl bg-[var(--card)] border border-[var(--line)] p-7">
            <h2 className="c3-h3 mb-2" style={{ fontSize: 18 }}>
              Привлечение и отбор арендаторов
            </h2>
            <p className="text-sm mute leading-relaxed">
              Проводим маркетинг площадей, показы, проверку платёжеспособности резидентов и оформление договоров аренды с контролем дебиторской задолженности.
            </p>
          </div>
          <div className="rounded-3xl bg-[var(--card)] border border-[var(--line)] p-7">
            <h2 className="c3-h3 mb-2" style={{ fontSize: 18 }}>
              Техническая эксплуатация объекта
            </h2>
            <p className="text-sm mute leading-relaxed">
              Обеспечиваем обслуживание электроподстанций, газового хозяйства, котельных, систем водоснабжения, круглосуточной охраны и уборки территории.
            </p>
          </div>
          <div className="rounded-3xl bg-[var(--card)] border border-[var(--line)] p-7">
            <h2 className="c3-h3 mb-2" style={{ fontSize: 18 }}>
              Прозрачная отчётность для владельца
            </h2>
            <p className="text-sm mute leading-relaxed">
              Ежемесячные отчёты по заполняемости, арендным поступлениям, расходам на содержание сетей и планово-предупредительным ремонтам.
            </p>
          </div>
          <div className="rounded-3xl bg-[var(--card)] border border-[var(--line)] p-7">
            <h2 className="c3-h3 mb-2" style={{ fontSize: 18 }}>
              Рост стоимости промышленного актива
            </h2>
            <p className="text-sm mute leading-relaxed">
              Приводим инженерную инфраструктуру и навигацию к стандарту ЦУКОН, повышая ликвидность и стабильный денежный поток площадки.
            </p>
          </div>
        </div>

        <div className="c3-fbox mt-14">
          <h2 className="c3-h2">Передать объект в управление</h2>
          <p className="mute mt-2">
            Оставьте контакты и базовые характеристики площадки — проведём аудит и предложим модель управления.
          </p>
          <LeadForm
            type="owner"
            contacts={state.settings.contacts}
            analytics={state.settings.analytics}
            onNavigatePrivacy={() => onNavigate('privacy-policy')}
          />
        </div>
      </div>
    </section>
  );
}
