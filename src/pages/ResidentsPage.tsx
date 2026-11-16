import type { CmsState } from '../shared/types';
import { getObjectById } from '../utils/catalog';

interface ResidentsPageProps {
  state: CmsState;
  onNavigate: (route: string) => void;
}

export function ResidentsPage({ state, onNavigate }: ResidentsPageProps) {
  return (
    <section className="c3-section sub">
      <div className="w">
        <h1 className="c3-h1">Резиденты</h1>
        <p className="mute mt-5 max-w-2xl text-lg">{state.pages.residentsIntro}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
          {state.residents.map((res) => {
            const obj = getObjectById(state.objects, res.objectId);
            return (
              <article
                key={res.id}
                className="rounded-3xl bg-[var(--card)] border border-[var(--line)] p-6 flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="text-xs mute mb-2">
                    Резидент с <span className="tabular">{res.sinceYear}</span> г. · {obj?.name || 'Саранск'}
                  </div>
                  <h2 className="c3-h3" style={{ fontSize: 18 }}>
                    {res.name}
                  </h2>
                  <p className="text-xs font-medium text-[var(--acc)] mt-1">{res.industry}</p>
                  <p className="text-sm mute mt-3 leading-relaxed">{res.description}</p>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-12 rounded-3xl bg-[var(--card)] border border-[var(--line)] p-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="c3-h3" style={{ fontSize: 20 }}>
              Станьте резидентом площадок ЦУКОН
            </h2>
            <p className="text-sm mute mt-1">
              Подберём производственное, складское или офисное помещение в Саранске.
            </p>
          </div>
          <a
            href="#/tenants"
            className="c3-btn"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('tenants');
            }}
          >
            Подобрать помещение
          </a>
        </div>
      </div>
    </section>
  );
}
