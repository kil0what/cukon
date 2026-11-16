import type { CmsState } from '../shared/types';
import { LeadForm } from '../components/LeadForm';
import { trackGoal } from '../utils/analytics';

interface ContactsPageProps {
  state: CmsState;
  onNavigate: (route: string) => void;
}

export function ContactsPage({ state, onNavigate }: ContactsPageProps) {
  const { contacts, analytics } = state.settings;

  return (
    <section className="c3-section sub">
      <div className="w">
        <h1 className="c3-h1">Контакты</h1>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-5 mt-9">
          <div className="rounded-3xl bg-[var(--card)] border border-[var(--line)] p-7 flex flex-col justify-between gap-6">
            <div>
              <h2 className="c3-h3 mb-1">Телефон</h2>
              <p className="text-xl font-medium tabular">
                <a
                  href={contacts.phoneHref}
                  className="hover:text-[var(--acc)]"
                  onClick={() => trackGoal(analytics, 'phone_click', '/contacts', contacts.phoneDisplay)}
                >
                  {contacts.phoneDisplay}
                </a>
              </p>

              <h2 className="c3-h3 mt-6 mb-1">Электронная почта</h2>
              <p className="text-lg">
                <a
                  href={`mailto:${contacts.email}`}
                  className="hover:text-[var(--acc)] underline"
                  onClick={() => trackGoal(analytics, 'email_click', '/contacts', contacts.email)}
                >
                  {contacts.email}
                </a>
              </p>

              <h2 className="c3-h3 mt-6 mb-1">Юридический и фактический адрес</h2>
              <p className="text-sm mute">{contacts.legalAddress}</p>

              <h2 className="c3-h3 mt-6 mb-1">Режим работы</h2>
              <p className="text-sm mute">{contacts.workHours}</p>
            </div>

            <div className="pt-5 border-t border-[var(--line)] text-xs mute space-y-1">
              <div className="font-medium text-[var(--ink)]">{contacts.companyName}</div>
              <div>
                ИНН {contacts.inn} · КПП {contacts.kpp} · ОГРН {contacts.ogrn}
              </div>
            </div>
          </div>

          <div className="c3-fbox">
            <h2 className="c3-h2" style={{ fontSize: 28 }}>
              Написать нам
            </h2>
            <p className="mute mt-2">
              Оставьте сообщение — менеджер ЦУКОН свяжется с вами в рабочее время.
            </p>
            <LeadForm
              type="tenant"
              contacts={contacts}
              analytics={analytics}
              onNavigatePrivacy={() => onNavigate('privacy-policy')}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
