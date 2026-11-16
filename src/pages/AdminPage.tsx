import { useCallback, useEffect, useState } from 'react';
import {
  Building2,
  Check,
  FileText,
  Globe,
  HelpCircle,
  Inbox,
  LogOut,
  Plus,
  Rocket,
  Save,
  Trash2,
  Users,
} from 'lucide-react';
import {
  ASSET_IMAGES,
  ROOM_PURPOSE_LABELS,
  ROOM_STATUS_LABELS,
} from '../shared/defaultData';
import type {
  AnalyticsEventLog,
  CmsState,
  FaqItem,
  LeadSubmission,
  PropertyObject,
  ResidentItem,
  RoomItem,
  RoomPurpose,
  RoomStatus,
} from '../shared/types';
import {
  deleteLead,
  fetchAnalyticsStats,
  fetchLeads,
  loginAdmin,
  resetCmsState,
  saveCmsState,
  updateLeadStatus,
} from '../utils/api';
import { AdminIntegrationsTab } from '../components/AdminIntegrationsTab';
import { AdminLaunchTab } from '../components/AdminLaunchTab';

type AdminTab =
  | 'catalog'
  | 'pages'
  | 'residents'
  | 'faq'
  | 'leads'
  | 'integrations'
  | 'launch';

interface AdminPageProps {
  state: CmsState;
  smtpConfigured: boolean;
  onStateUpdated: (next: CmsState) => void;
  onNavigate: (route: string) => void;
}

const IMAGE_PRESETS = [
  { label: 'Промплощадка (фасад)', value: ASSET_IMAGES.exterior },
  { label: 'Производственный цех', value: ASSET_IMAGES.workshop },
  { label: 'Складской комплекс', value: ASSET_IMAGES.warehouse },
  { label: 'Деловой центр / офис', value: ASSET_IMAGES.office },
];

export function AdminPage({
  state,
  smtpConfigured,
  onStateUpdated,
  onNavigate,
}: AdminPageProps) {
  const [token, setToken] = useState<string>(() => sessionStorage.getItem('tsukon_cms_token') || '');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<AdminTab>('catalog');
  const [draft, setDraft] = useState<CmsState>(() => structuredClone(state));
  const [saving, setSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  const [leads, setLeads] = useState<LeadSubmission[]>([]);
  const [analyticsStats, setAnalyticsStats] = useState<{
    events: AnalyticsEventLog[];
    counts: Record<string, number>;
  }>({ events: [], counts: {} });

  useEffect(() => {
    setDraft(structuredClone(state));
  }, [state]);

  const loadProtectedData = useCallback(async (authToken: string) => {
    try {
      const [loadedLeads, loadedStats] = await Promise.all([
        fetchLeads(authToken),
        fetchAnalyticsStats(authToken),
      ]);
      setLeads(loadedLeads);
      setAnalyticsStats(loadedStats);
    } catch {
      // Token expired or invalid
      sessionStorage.removeItem('tsukon_cms_token');
      setToken('');
    }
  }, []);

  useEffect(() => {
    if (token) {
      void loadProtectedData(token);
    }
  }, [token, loadProtectedData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      const issued = await loginAdmin(password);
      sessionStorage.setItem('tsukon_cms_token', issued);
      setToken(issued);
      setPassword('');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('tsukon_cms_token');
    setToken('');
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setSaveNotice(null);
    try {
      const saved = await saveCmsState(token, draft);
      onStateUpdated(saved);
      setSaveNotice('Изменения сохранены и применены на сайте.');
    } catch (err) {
      setSaveNotice(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    setSaveNotice(null);
    try {
      const reset = await resetCmsState(token);
      onStateUpdated(reset);
      setSaveNotice('Данные сброшены к базовым настройкам.');
    } catch (err) {
      setSaveNotice(err instanceof Error ? err.message : 'Ошибка сброса');
    } finally {
      setSaving(false);
    }
  };

  const handleFileToDataUrl = (file: File, onDone: (dataUrl: string) => void) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onDone(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  if (!token) {
    return (
      <section className="c3-section sub">
        <div className="w">
          <div className="max-w-lg mx-auto rounded-3xl bg-[var(--card)] border border-[var(--line)] p-6 md:p-8">
            <h1 className="c3-h2" style={{ fontSize: 28 }}>
              CMS ЦУКОН
            </h1>
            <p className="text-sm mute mt-2">
              Система управления контентом, объектами, заявками, Яндекс.Метрикой и экспортом WordPress.
            </p>
            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <div>
                <label htmlFor="cms-pass" className="block text-xs mute mb-1.5">
                  Пароль администратора
                </label>
                <input
                  id="cms-pass"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Введите пароль"
                  className="w-full h-11 rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3.5 text-sm leading-snug text-[var(--ink)] placeholder:text-[var(--mute)]"
                />
              </div>
              {authError && <p className="text-sm text-red-700 font-medium">{authError}</p>}
              <div className="flex flex-wrap gap-2.5">
                <button type="submit" className="c3-btn flex-1" disabled={authLoading}>
                  {authLoading ? 'Вход…' : 'Войти в CMS'}
                </button>
                <button type="button" className="c3-btn l" onClick={() => onNavigate('')}>
                  На сайт
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    );
  }

  const tabs: Array<{ id: AdminTab; label: string; icon: typeof Building2 }> = [
    { id: 'catalog', label: 'Объекты и помещения', icon: Building2 },
    { id: 'pages', label: 'Страницы и тексты', icon: FileText },
    { id: 'residents', label: 'Резиденты и контакты', icon: Users },
    { id: 'faq', label: 'FAQ и SEO / ИИ', icon: HelpCircle },
    { id: 'leads', label: `Заявки (${leads.length})`, icon: Inbox },
    { id: 'integrations', label: 'WordPress и Метрика', icon: Globe },
    { id: 'launch', label: 'Выпуск и инструкция', icon: Rocket },
  ];

  const addObject = () => {
    const nextId = Math.max(0, ...draft.objects.map((o) => o.id)) + 1;
    const nextObj: PropertyObject = {
      id: nextId,
      name: `Новый объект № ${nextId}`,
      address: 'г. Саранск, ул. Промышленная',
      description: 'Производственно-складской комплекс под управлением ЦУКОН.',
      utilities: 'Электричество, отопление, охрана',
      security: 'КПП 24/7, видеонаблюдение',
      image: ASSET_IMAGES.exterior,
      x: 240,
      y: 160,
      lat: 54.19,
      lng: 45.18,
    };
    setDraft((prev) => ({ ...prev, objects: [...prev.objects, nextObj] }));
  };

  const addRoom = () => {
    const nextId = Math.max(0, ...draft.rooms.map((r) => r.id)) + 1;
    const defaultObjId = draft.objects[0]?.id || 1;
    const nextRoom: RoomItem = {
      id: nextId,
      objectId: defaultObjId,
      title: `Новое помещение № ${nextId}`,
      area: 250,
      purpose: 'prod',
      pricePerSqm: 350,
      status: 'free',
      features: ['Электричество 60 кВт', 'Ворота 3×3 м', 'Охрана'],
      image: ASSET_IMAGES.workshop,
      leaseTerms: 'Прямой договор аренды от УК.',
      featuredOnStart: true,
    };
    setDraft((prev) => ({ ...prev, rooms: [nextRoom, ...prev.rooms] }));
  };

  const addResident = () => {
    const nextId = Math.max(0, ...draft.residents.map((r) => r.id)) + 1;
    const nextRes: ResidentItem = {
      id: nextId,
      name: 'ООО «Новый Резидент»',
      industry: 'Производство / логистика',
      objectId: draft.objects[0]?.id || 1,
      sinceYear: '2026',
      description: 'Работает на площадке ЦУКОН.',
    };
    setDraft((prev) => ({ ...prev, residents: [...prev.residents, nextRes] }));
  };

  const addFaq = () => {
    const nextId = Math.max(0, ...draft.faqs.map((f) => f.id)) + 1;
    const nextFaq: FaqItem = {
      id: nextId,
      question: 'Новый вопрос для раздела FAQ',
      answer: 'Подробный ответ с указанием характеристик, ставок и условий аренды в Саранске.',
      category: 'rent',
      isPriorityAi: false,
    };
    setDraft((prev) => ({ ...prev, faqs: [...prev.faqs, nextFaq] }));
  };

  return (
    <section className="c3-section sub" style={{ paddingTop: 28 }}>
      <div className="w">
        {/* Top CMS Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[var(--line)]">
          <div>
            <div className="text-xs mute">Панель управления контентом · {draft.settings.contacts.domain}</div>
            <h1 className="c3-h2" style={{ fontSize: 'clamp(22px, 3vw, 32px)' }}>
              CMS ЦУКОН
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {saveNotice && (
              <span className="text-xs font-medium text-[var(--ok)] flex items-center gap-1">
                <Check size={14} /> {saveNotice}
              </span>
            )}
            <button type="button" className="c3-btn" disabled={saving} onClick={handleSaveAll}>
              <Save size={15} />
              <span>{saving ? 'Сохранение…' : 'Сохранить все изменения'}</span>
            </button>
            <button type="button" className="c3-btn l" onClick={() => onNavigate('')}>
              Открыть сайт
            </button>
            <button
              type="button"
              className="c3-btn l"
              onClick={handleLogout}
              aria-label="Выйти из CMS"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 mt-6">
          {/* Sidebar */}
          <aside className="space-y-1.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-left transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[var(--ink)] text-[var(--bg)]'
                      : 'bg-[var(--card)] border border-[var(--line)] text-[var(--ink)] hover:bg-white'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}

            <div className="pt-4">
              <button
                type="button"
                className="w-full text-xs mute underline text-left px-2 py-1 cursor-pointer"
                onClick={handleReset}
              >
                Сбросить контент к исходным данным
              </button>
            </div>
          </aside>

          {/* Main Workspace */}
          <div className="min-w-0">
            {activeTab === 'catalog' && (
              <div className="space-y-6">
                {/* 5-7 Featured Limit Setting (TZ 4.1) */}
                <div className="rounded-2xl bg-[var(--card)] border border-[var(--line)] p-5 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-sm">
                      Лимит свободных помещений на старте (ТЗ п. 4.1: 5–7 шт.)
                    </h2>
                    <p className="text-xs mute mt-0.5">
                      Сколько свободных помещений показывать на Главной и в разделе «Арендаторам» до раскрытия полного списка.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {[5, 6, 7].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() =>
                          setDraft((prev) => ({
                            ...prev,
                            settings: { ...prev.settings, featuredFreeLimit: num },
                          }))
                        }
                        className={`w-10 h-10 rounded-full text-sm font-semibold tabular border cursor-pointer ${
                          draft.settings.featuredFreeLimit === num
                            ? 'bg-[var(--ink)] text-[var(--bg)] border-[var(--ink)]'
                            : 'bg-[var(--bg)] border-[var(--line)]'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Objects Editor */}
                <div className="rounded-2xl bg-[var(--card)] border border-[var(--line)] p-5">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <h2 className="c3-h3" style={{ fontSize: 18 }}>
                      Объекты ({draft.objects.length})
                    </h2>
                    <button type="button" className="c3-btn l" onClick={addObject}>
                      <Plus size={15} />
                      <span>Добавить объект</span>
                    </button>
                  </div>

                  <div className="divide-y divide-[var(--line)]">
                    {draft.objects.map((obj, idx) => (
                      <div
                        key={obj.id}
                        className="py-4 first:pt-0 last:pb-0 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <strong className="text-sm">Объект № {obj.id}</strong>
                          <button
                            type="button"
                            className="text-xs text-red-700 inline-flex items-center gap-1 cursor-pointer"
                            onClick={() =>
                              setDraft((prev) => ({
                                ...prev,
                                objects: prev.objects.filter((o) => o.id !== obj.id),
                              }))
                            }
                          >
                            <Trash2 size={13} /> Удалить
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <input
                            aria-label="Название объекта"
                            value={obj.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDraft((prev) => {
                                const next = [...prev.objects];
                                next[idx] = { ...next[idx], name: val };
                                return { ...prev, objects: next };
                              });
                            }}
                            placeholder="Название объекта"
                            className="rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
                          />
                          <input
                            aria-label="Адрес объекта"
                            value={obj.address}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDraft((prev) => {
                                const next = [...prev.objects];
                                next[idx] = { ...next[idx], address: val };
                                return { ...prev, objects: next };
                              });
                            }}
                            placeholder="Адрес"
                            className="rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
                          />
                          <input
                            aria-label="Коммуникации"
                            value={obj.utilities}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDraft((prev) => {
                                const next = [...prev.objects];
                                next[idx] = { ...next[idx], utilities: val };
                                return { ...prev, objects: next };
                              });
                            }}
                            placeholder="Коммуникации"
                            className="rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
                          />
                          <select
                            aria-label="Фотография объекта"
                            value={IMAGE_PRESETS.some((p) => p.value === obj.image) ? obj.image : ''}
                            onChange={(e) => {
                              if (!e.target.value) return;
                              const val = e.target.value;
                              setDraft((prev) => {
                                const next = [...prev.objects];
                                next[idx] = { ...next[idx], image: val };
                                return { ...prev, objects: next };
                              });
                            }}
                            className="rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
                          >
                            <option value="">Своя фотография</option>
                            {IMAGE_PRESETS.map((p) => (
                              <option key={p.value} value={p.value}>
                                Фото: {p.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rooms Editor */}
                <div className="rounded-2xl bg-[var(--card)] border border-[var(--line)] p-5">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <h2 className="c3-h3" style={{ fontSize: 18 }}>
                      Помещения ({draft.rooms.length})
                    </h2>
                    <button type="button" className="c3-btn" onClick={addRoom}>
                      <Plus size={15} />
                      <span>Добавить помещение</span>
                    </button>
                  </div>

                  <div className="divide-y divide-[var(--line)]">
                    {draft.rooms.map((room, idx) => (
                      <div
                        key={room.id}
                        className="py-4 first:pt-0 last:pb-0 space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <strong className="text-sm">#{room.id}</strong>
                            <label className="text-xs inline-flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={room.featuredOnStart !== false}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setDraft((prev) => {
                                    const next = [...prev.rooms];
                                    next[idx] = { ...next[idx], featuredOnStart: checked };
                                    return { ...prev, rooms: next };
                                  });
                                }}
                              />
                              Показывать на старте
                            </label>
                          </div>
                          <button
                            type="button"
                            className="text-xs text-red-700 inline-flex items-center gap-1 cursor-pointer"
                            onClick={() =>
                              setDraft((prev) => ({
                                ...prev,
                                rooms: prev.rooms.filter((r) => r.id !== room.id),
                              }))
                            }
                          >
                            <Trash2 size={13} /> Удалить
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                          <input
                            aria-label="Название помещения"
                            value={room.title}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDraft((prev) => {
                                const next = [...prev.rooms];
                                next[idx] = { ...next[idx], title: val };
                                return { ...prev, rooms: next };
                              });
                            }}
                            placeholder="Название"
                            className="sm:col-span-2 rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
                          />
                          <select
                            aria-label="Объект"
                            value={room.objectId}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setDraft((prev) => {
                                const next = [...prev.rooms];
                                next[idx] = { ...next[idx], objectId: val };
                                return { ...prev, rooms: next };
                              });
                            }}
                            className="rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
                          >
                            {draft.objects.map((o) => (
                              <option key={o.id} value={o.id}>
                                {o.name}
                              </option>
                            ))}
                          </select>
                          <select
                            aria-label="Статус помещения"
                            value={room.status}
                            onChange={(e) => {
                              const val = e.target.value as RoomStatus;
                              setDraft((prev) => {
                                const next = [...prev.rooms];
                                next[idx] = { ...next[idx], status: val };
                                return { ...prev, rooms: next };
                              });
                            }}
                            className="rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2 font-medium"
                          >
                            {Object.entries(ROOM_STATUS_LABELS).map(([k, v]) => (
                              <option key={k} value={k}>
                                {v}
                              </option>
                            ))}
                          </select>

                          <select
                            aria-label="Назначение"
                            value={room.purpose}
                            onChange={(e) => {
                              const val = e.target.value as RoomPurpose;
                              setDraft((prev) => {
                                const next = [...prev.rooms];
                                next[idx] = { ...next[idx], purpose: val };
                                return { ...prev, rooms: next };
                              });
                            }}
                            className="rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
                          >
                            {Object.entries(ROOM_PURPOSE_LABELS).map(([k, v]) => (
                              <option key={k} value={k}>
                                {v}
                              </option>
                            ))}
                          </select>

                          <input
                            aria-label="Площадь м²"
                            type="number"
                            value={room.area}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0;
                              setDraft((prev) => {
                                const next = [...prev.rooms];
                                next[idx] = { ...next[idx], area: val };
                                return { ...prev, rooms: next };
                              });
                            }}
                            placeholder="Площадь (м²)"
                            className="rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2 tabular"
                          />

                          <input
                            aria-label="Цена ₽/м²"
                            type="number"
                            value={room.pricePerSqm}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0;
                              setDraft((prev) => {
                                const next = [...prev.rooms];
                                next[idx] = { ...next[idx], pricePerSqm: val };
                                return { ...prev, rooms: next };
                              });
                            }}
                            placeholder="Цена (₽/м²)"
                            className="rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2 tabular"
                          />

                          <div className="flex gap-1.5 items-center">
                            <select
                              aria-label="Выбрать фото"
                              value={IMAGE_PRESETS.some((p) => p.value === room.image) ? room.image : ''}
                              onChange={(e) => {
                                if (!e.target.value) return;
                                const val = e.target.value;
                                setDraft((prev) => {
                                  const next = [...prev.rooms];
                                  next[idx] = { ...next[idx], image: val };
                                  return { ...prev, rooms: next };
                                });
                              }}
                              className="flex-1 rounded-lg border border-[var(--line)] bg-[var(--bg)] px-2.5 py-2 text-xs"
                            >
                              <option value="">Загруженное фото</option>
                              {IMAGE_PRESETS.map((p) => (
                                <option key={p.value} value={p.value}>
                                  {p.label}
                                </option>
                              ))}
                            </select>
                            <label className="text-xs px-2.5 py-2 rounded-lg border border-[var(--line)] bg-[var(--bg)] cursor-pointer shrink-0">
                              Файл
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  handleFileToDataUrl(file, (url) => {
                                    setDraft((prev) => {
                                      const next = [...prev.rooms];
                                      next[idx] = { ...next[idx], image: url };
                                      return { ...prev, rooms: next };
                                    });
                                  });
                                }}
                              />
                            </label>
                          </div>
                        </div>

                        <input
                          aria-label="Характеристики через запятую"
                          value={room.features.join(', ')}
                          onChange={(e) => {
                            const feats = e.target.value
                              .split(',')
                              .map((s) => s.trim())
                              .filter(Boolean);
                            setDraft((prev) => {
                              const next = [...prev.rooms];
                              next[idx] = { ...next[idx], features: feats };
                              return { ...prev, rooms: next };
                            });
                          }}
                          placeholder="Характеристики (через запятую)"
                          className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'pages' && (
              <div className="rounded-2xl bg-[var(--card)] border border-[var(--line)] p-6 space-y-4">
                <h2 className="c3-h3" style={{ fontSize: 18 }}>
                  Редактирование текстов страниц
                </h2>
                {(
                  [
                    ['homeHeroLead', 'Главная — лид-текст под заголовком'],
                    ['homeManifestoLead', 'Главная — главный тезис'],
                    ['homeManifestoSub', 'Главная — подзаголовок тезиса'],
                    ['tenantsIntro', 'Арендаторам — вступительный текст'],
                    ['ownersIntro', 'Собственникам — вступительный текст'],
                    ['residentsIntro', 'Резиденты — вступительный текст'],
                    ['aboutStatement', 'О компании — ключевое описание'],
                    ['privacyText', 'Политика конфиденциальности'],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-xs mute mb-1">{label}</label>
                    <textarea
                      rows={key === 'privacyText' ? 4 : 2}
                      value={draft.pages[key]}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          pages: { ...prev.pages, [key]: e.target.value },
                        }))
                      }
                      className="w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
                    />
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'residents' && (
              <div className="space-y-6">
                <div className="rounded-2xl bg-[var(--card)] border border-[var(--line)] p-6 space-y-4">
                  <h2 className="c3-h3" style={{ fontSize: 18 }}>
                    Контакты и реквизиты компании
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {(
                      [
                        ['companyName', 'Название организации'],
                        ['phoneDisplay', 'Телефон на сайте'],
                        ['email', 'Email на сайте'],
                        ['leadRecipientEmail', 'Email для приёма заявок'],
                        ['legalAddress', 'Адрес'],
                        ['workHours', 'График работы'],
                        ['inn', 'ИНН'],
                        ['ogrn', 'ОГРН'],
                        ['domain', 'Домен'],
                      ] as const
                    ).map(([key, label]) => (
                      <div key={key}>
                        <label className="block text-xs mute mb-1">{label}</label>
                        <input
                          value={draft.settings.contacts[key]}
                          onChange={(e) =>
                            setDraft((prev) => ({
                              ...prev,
                              settings: {
                                ...prev.settings,
                                contacts: {
                                  ...prev.settings.contacts,
                                  [key]: e.target.value,
                                },
                              },
                            }))
                          }
                          className="w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3.5 py-2"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-[var(--card)] border border-[var(--line)] p-6">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <h2 className="c3-h3" style={{ fontSize: 18 }}>
                      Резиденты ({draft.residents.length})
                    </h2>
                    <button type="button" className="c3-btn l" onClick={addResident}>
                      <Plus size={15} />
                      <span>Добавить резидента</span>
                    </button>
                  </div>
                  <div className="space-y-3">
                    {draft.residents.map((res, idx) => (
                      <div
                        key={res.id}
                        className="rounded-xl bg-[var(--bg)] border border-[var(--line)] p-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm"
                      >
                        <input
                          aria-label="Название резидента"
                          value={res.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDraft((prev) => {
                              const next = [...prev.residents];
                              next[idx] = { ...next[idx], name: val };
                              return { ...prev, residents: next };
                            });
                          }}
                          className="rounded-lg border border-[var(--line)] bg-[var(--card)] px-3 py-2"
                        />
                        <input
                          aria-label="Отрасль"
                          value={res.industry}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDraft((prev) => {
                              const next = [...prev.residents];
                              next[idx] = { ...next[idx], industry: val };
                              return { ...prev, residents: next };
                            });
                          }}
                          className="rounded-lg border border-[var(--line)] bg-[var(--card)] px-3 py-2"
                        />
                        <div className="flex gap-2">
                          <input
                            aria-label="Описание"
                            value={res.description}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDraft((prev) => {
                                const next = [...prev.residents];
                                next[idx] = { ...next[idx], description: val };
                                return { ...prev, residents: next };
                              });
                            }}
                            className="flex-1 rounded-lg border border-[var(--line)] bg-[var(--card)] px-3 py-2"
                          />
                          <button
                            type="button"
                            className="text-red-700 px-2 cursor-pointer"
                            aria-label="Удалить резидента"
                            onClick={() =>
                              setDraft((prev) => ({
                                ...prev,
                                residents: prev.residents.filter((r) => r.id !== res.id),
                              }))
                            }
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'faq' && (
              <div className="rounded-2xl bg-[var(--card)] border border-[var(--line)] p-6 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="c3-h3" style={{ fontSize: 18 }}>
                      Раздел FAQ (оптимизация под поиск и ИИ)
                    </h2>
                    <p className="text-xs mute mt-0.5">
                      Вопросы автоматически попадают в Schema.org FAQPage и <code>/llms.txt</code>.
                    </p>
                  </div>
                  <button type="button" className="c3-btn" onClick={addFaq}>
                    <Plus size={15} />
                    <span>Добавить вопрос</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {draft.faqs.map((item, idx) => (
                    <div
                      key={item.id}
                      className="rounded-xl bg-[var(--bg)] border border-[var(--line)] p-4 space-y-2.5 text-sm"
                    >
                      <div className="flex justify-between gap-2">
                        <input
                          aria-label="Вопрос"
                          value={item.question}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDraft((prev) => {
                              const next = [...prev.faqs];
                              next[idx] = { ...next[idx], question: val };
                              return { ...prev, faqs: next };
                            });
                          }}
                          className="flex-1 rounded-lg border border-[var(--line)] bg-[var(--card)] px-3 py-2 font-medium"
                        />
                        <button
                          type="button"
                          className="text-red-700 px-2 cursor-pointer"
                          aria-label="Удалить вопрос"
                          onClick={() =>
                            setDraft((prev) => ({
                              ...prev,
                              faqs: prev.faqs.filter((f) => f.id !== item.id),
                            }))
                          }
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        aria-label="Ответ"
                        value={item.answer}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDraft((prev) => {
                            const next = [...prev.faqs];
                            next[idx] = { ...next[idx], answer: val };
                            return { ...prev, faqs: next };
                          });
                        }}
                        className="w-full rounded-lg border border-[var(--line)] bg-[var(--card)] px-3 py-2"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'leads' && (
              <div className="rounded-2xl bg-[var(--card)] border border-[var(--line)] p-6">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="c3-h3" style={{ fontSize: 18 }}>
                      Входящие заявки ({leads.length})
                    </h2>
                    <p className="text-xs mute mt-0.5">
                      Все заявки из форм «Подобрать помещение» и «Передать объект в управление».
                    </p>
                  </div>
                  <button
                    type="button"
                    className="c3-btn l"
                    onClick={() => void loadProtectedData(token)}
                  >
                    Обновить список
                  </button>
                </div>

                {leads.length === 0 ? (
                  <p className="text-sm mute py-8 text-center">
                    Заявок пока нет. Отправьте тестовую заявку через форму на сайте, чтобы проверить приём.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {leads.map((lead) => (
                      <div
                        key={lead.id}
                        className="rounded-xl bg-[var(--bg)] border border-[var(--line)] p-4 flex flex-wrap justify-between gap-4 text-sm"
                      >
                        <div className="space-y-1">
                          <div className="font-semibold">
                            {lead.type === 'owner' ? 'Объект в управление' : 'Подбор помещения'} · {lead.name}
                          </div>
                          <div className="tabular">
                            Тел: <strong>{lead.phone}</strong>
                            {lead.email ? ` · Email: ${lead.email}` : ''}
                          </div>
                          {(lead.purposeOrObject || lead.area) && (
                            <div className="text-xs mute">
                              {lead.purposeOrObject} {lead.area ? `· ${lead.area} м²` : ''}
                            </div>
                          )}
                          {lead.message && <div className="text-xs">{lead.message}</div>}
                          <div className="text-xs mute">
                            {new Date(lead.createdAt).toLocaleString('ru-RU')} · {lead.emailNote}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start">
                          <select
                            aria-label="Статус заявки"
                            value={lead.status}
                            onChange={async (e) => {
                              const status = e.target.value as LeadSubmission['status'];
                              const updated = await updateLeadStatus(token, lead.id, status);
                              setLeads((prev) => prev.map((l) => (l.id === lead.id ? updated : l)));
                            }}
                            className="rounded-lg border border-[var(--line)] bg-[var(--card)] px-2.5 py-1.5 text-xs"
                          >
                            <option value="new">Новая</option>
                            <option value="in_progress">В работе</option>
                            <option value="done">Закрыта</option>
                          </select>
                          <button
                            type="button"
                            className="text-red-700 p-1.5 cursor-pointer"
                            aria-label="Удалить заявку"
                            onClick={async () => {
                              await deleteLead(token, lead.id);
                              setLeads((prev) => prev.filter((l) => l.id !== lead.id));
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'integrations' && (
              <AdminIntegrationsTab
                draft={draft}
                token={token}
                analyticsStats={analyticsStats}
                onChangeDraft={setDraft}
                onRefreshStats={() => void loadProtectedData(token)}
              />
            )}

            {activeTab === 'launch' && (
              <AdminLaunchTab
                draft={draft}
                leadsCount={leads.length}
                smtpConfigured={smtpConfigured}
                token={token}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
