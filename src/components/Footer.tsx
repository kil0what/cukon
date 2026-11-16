import type { ContactInfo } from '../shared/types';
import type { AnalyticsSettings } from '../shared/types';
import { trackGoal } from '../utils/analytics';

interface FooterProps {
  contacts: ContactInfo;
  analytics: AnalyticsSettings;
  onNavigate: (route: string) => void;
}

export function Footer({ contacts, analytics, onNavigate }: FooterProps) {
  const go = (e: React.MouseEvent, route: string) => {
    e.preventDefault();
    onNavigate(route);
  };

  return (
    <footer className="c3-footer">
      <div className="w c3-fg">
        <div>
          <div className="c3-logo" style={{ color: '#f1f2f3' }}>
            <i style={{ background: '#f1f2f3', color: '#111316' }} aria-hidden="true">
              Ц
            </i>
            <span>ЦУКОН</span>
          </div>
          <p style={{ marginTop: 16, maxWidth: '38ch', color: '#b4b9c0', fontSize: 14.5 }}>
            Недвижимость, которая работает. Управление производственно-коммерческой недвижимостью в Республике Мордовия.
          </p>
          <p style={{ marginTop: 10, color: '#8f959d', fontSize: 13 }}>
            {contacts.companyName} · ИНН {contacts.inn} · ОГРН {contacts.ogrn}
          </p>
        </div>

        <div>
          <a href="#/objects" onClick={(e) => go(e, 'objects')}>
            Объекты и помещения
          </a>
          <a href="#/tenants" onClick={(e) => go(e, 'tenants')}>
            Арендаторам
          </a>
          <a href="#/owners" onClick={(e) => go(e, 'owners')}>
            Собственникам
          </a>
          <a href="#/residents" onClick={(e) => go(e, 'residents')}>
            Резиденты
          </a>
          <a href="#/about" onClick={(e) => go(e, 'about')}>
            О компании
          </a>
          <a href="#/faq" onClick={(e) => go(e, 'faq')}>
            Вопросы и ответы (FAQ)
          </a>
        </div>

        <div>
          <a
            href={contacts.phoneHref}
            onClick={() => trackGoal(analytics, 'phone_click', '/footer', contacts.phoneDisplay)}
          >
            {contacts.phoneDisplay}
          </a>
          <a
            href={`mailto:${contacts.email}`}
            onClick={() => trackGoal(analytics, 'email_click', '/footer', contacts.email)}
          >
            {contacts.email}
          </a>
          <a href="#/contacts" onClick={(e) => go(e, 'contacts')}>
            {contacts.legalAddress}
          </a>
          <a href="#/privacy-policy" onClick={(e) => go(e, 'privacy-policy')}>
            Политика обработки персональных данных
          </a>
        </div>
      </div>

      <div className="c3-mark" aria-hidden="true">
        ЦУКОН
      </div>

      <p className="c3-wm">© {contacts.companyName}, 2026</p>
    </footer>
  );
}
