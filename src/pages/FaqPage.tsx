import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { CmsState, FaqItem } from '../shared/types';

interface FaqPageProps {
  state: CmsState;
  onNavigate: (route: string, scrollTarget?: string) => void;
}

const CATEGORY_LABELS: Record<'all' | FaqItem['category'], string> = {
  all: 'Все темы',
  rent: 'Аренда помещений',
  utilities: 'Мощности и охрана',
  terms: 'Условия и сроки',
  owners: 'Собственникам',
};

export function FaqPage({ state, onNavigate }: FaqPageProps) {
  const [category, setCategory] = useState<'all' | FaqItem['category']>('all');
  const [query, setQuery] = useState('');

  const filteredFaqs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.faqs.filter((item) => {
      if (category !== 'all' && item.category !== category) return false;
      if (!q) return true;
      return (
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q)
      );
    });
  }, [state.faqs, category, query]);

  return (
    <section className="c3-section sub">
      <div className="w">
        <h1 className="c3-h1">Вопросы и ответы (FAQ)</h1>
        <p className="mute mt-4 max-w-2xl text-lg">
          Конкретные ответы об аренде производственных цехов, складов и офисов в Саранске: цены, электрические мощности, охрана и условия работы управляющей компании ЦУКОН.
        </p>

        {/* Concrete Informational Blocks required by TZ Section 5 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-9">
          {state.infoBlocks.map((block) => (
            <article
              key={block.id}
              className="rounded-3xl bg-[var(--card)] border border-[var(--line)] p-6"
            >
              <h2 className="c3-h3 mb-2" style={{ fontSize: 17 }}>
                {block.title}
              </h2>
              <p className="text-sm mute leading-relaxed">{block.summary}</p>
            </article>
          ))}
        </div>

        {/* Dedicated AI/Search Specification Pages */}
        <div className="mt-6 flex flex-wrap gap-2.5">
          {(
            [
              ['guide-production', 'Производство и мощности (кВт)'],
              ['guide-warehouses', 'Склады, офисы и площадки для фур'],
              ['guide-utilities', 'Коммуникации, охрана и обслуживание'],
              ['guide-terms', 'Точные площади, цены и условия аренды'],
            ] as const
          ).map(([slug, label]) => (
            <a
              key={slug}
              href={`#/${slug}`}
              onClick={(e) => {
                e.preventDefault();
                onNavigate(slug);
              }}
              className="px-4 py-2 rounded-full text-xs font-medium bg-[var(--card)] border border-[var(--line)] hover:border-[var(--ink)] transition-colors"
            >
              {label} →
            </a>
          ))}
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-12 mb-6">
          <div className="flex flex-wrap gap-1.5 bg-[var(--card)] border border-[var(--line)] p-1 rounded-full">
            {(Object.keys(CATEGORY_LABELS) as Array<'all' | FaqItem['category']>).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  category === cat
                    ? 'bg-[var(--ink)] text-[var(--bg)]'
                    : 'text-[var(--mute)] hover:text-[var(--ink)]'
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          <div className="relative min-w-[260px] flex-1 max-w-sm">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--mute)]"
            />
            <input
              type="search"
              aria-label="Поиск по вопросам FAQ"
              placeholder="Поиск: электричество, склад, охрана…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-[var(--card)] border border-[var(--line)] text-sm"
            />
          </div>
        </div>

        <div className="c3-faq border-t border-[var(--line)]">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((item, idx) => (
              <details key={item.id} open={idx < 5}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))
          ) : (
            <div className="py-10 text-center mute">
              По вашему запросу вопросы не найдены. Оставьте заявку, и мы ответим напрямую.
            </div>
          )}
        </div>

        <div className="mt-12 rounded-3xl bg-[var(--card)] border border-[var(--line)] p-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="c3-h3" style={{ fontSize: 19 }}>
              Не нашли ответ или нужна подборка площадей?
            </h2>
            <p className="text-sm mute mt-1">
              Откройте каталог свободных помещений или отправьте заявку — подберём за 1 рабочий день.
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <a
              href="#/objects"
              className="c3-btn l"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('objects');
              }}
            >
              Каталог объектов
            </a>
            <a
              href="#/tenants"
              className="c3-btn"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('tenants', '.c3-fbox');
              }}
            >
              Подобрать помещение
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
