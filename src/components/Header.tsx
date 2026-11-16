import { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface HeaderProps {
  currentRoute: string;
  onNavigate: (route: string, scrollTarget?: string) => void;
}

const NAV_ITEMS = [
  { route: '', label: 'Главная' },
  { route: 'objects', label: 'Объекты' },
  { route: 'tenants', label: 'Арендаторам' },
  { route: 'owners', label: 'Собственникам' },
  { route: 'residents', label: 'Резиденты' },
  { route: 'about', label: 'О компании' },
  { route: 'faq', label: 'FAQ' },
  { route: 'contacts', label: 'Контакты' },
] as const;

export function Header({ currentRoute, onNavigate }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLink = (e: React.MouseEvent, route: string, scrollTarget?: string) => {
    e.preventDefault();
    setMenuOpen(false);
    onNavigate(route, scrollTarget);
  };

  return (
    <header className="c3-header">
      <div className="w c3-nav-wrap">
        <a
          className="c3-logo"
          href="#/"
          aria-label="ЦУКОН — на главную"
          onClick={(e) => handleLink(e, '')}
        >
          <i aria-hidden="true">Ц</i>
          <span>ЦУКОН</span>
        </a>

        <button
          type="button"
          className="c3-burger"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          {menuOpen ? <X size={16} /> : <Menu size={16} />}
          <span className="ml-1.5">Меню</span>
        </button>

        <nav className={`c3-nav ${menuOpen ? 'open' : ''}`} aria-label="Основное меню">
          {NAV_ITEMS.map((item) => {
            const active = currentRoute === item.route;
            return (
              <a
                key={item.route || 'home'}
                href={`#/${item.route}`}
                className={active ? 'on' : ''}
                onClick={(e) => handleLink(e, item.route)}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        <a
          className="c3-btn"
          href="#/tenants"
          onClick={(e) => handleLink(e, 'tenants', '.c3-fbox')}
        >
          Подобрать помещение
        </a>
      </div>
    </header>
  );
}
