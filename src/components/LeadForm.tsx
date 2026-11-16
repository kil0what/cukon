import { useEffect, useMemo, useRef, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import type { AnalyticsSettings, ContactInfo } from '../shared/types';
import { ROOM_PURPOSE_LABELS } from '../shared/defaultData';
import { createAntiSpamChallenge, validateLeadSubmission } from '../utils/catalog';
import { submitLead } from '../utils/api';
import { trackGoal } from '../utils/analytics';

interface LeadFormProps {
  type: 'tenant' | 'owner';
  prefillMessage?: string;
  contacts: ContactInfo;
  analytics: AnalyticsSettings;
  onNavigatePrivacy: () => void;
}

export function LeadForm({
  type,
  prefillMessage,
  analytics,
  onNavigatePrivacy,
}: LeadFormProps) {
  const mountTimeRef = useRef<number>(Date.now());
  const [challenge, setChallenge] = useState(() => createAntiSpamChallenge());
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [purposeOrObject, setPurposeOrObject] = useState('');
  const [area, setArea] = useState('');
  const [message, setMessage] = useState(prefillMessage || '');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [consent, setConsent] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    mountTimeRef.current = Date.now();
  }, [type]);

  useEffect(() => {
    if (prefillMessage) {
      setMessage(prefillMessage);
    }
  }, [prefillMessage]);

  const isOwner = type === 'owner';
  const submitLabel = useMemo(
    () => (isOwner ? 'Передать объект в управление' : 'Подобрать помещение'),
    [isOwner],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    const elapsedMs = Date.now() - mountTimeRef.current;
    const localValidation = validateLeadSubmission({
      type,
      name,
      phone,
      email,
      purposeOrObject,
      area,
      message,
      consent,
      honeypot,
      elapsedMs,
      captchaExpected: challenge.expected,
      captchaAnswer,
    });

    if (!localValidation.ok) {
      setStatusMsg({ kind: 'err', text: localValidation.error || 'Проверьте заполнение формы.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitLead({
        type,
        name,
        phone,
        email,
        purposeOrObject,
        area,
        message,
        consent,
        honeypot,
        elapsedMs,
        captchaExpected: challenge.expected,
        captchaAnswer,
      });

      trackGoal(
        analytics,
        isOwner ? 'form_owner_submit' : 'form_tenant_submit',
        isOwner ? '/owners' : '/tenants',
        name,
      );

      setStatusMsg({
        kind: 'ok',
        text: `Заявка № ${res.lead.id.slice(0, 8)} принята. Свяжемся с вами в рабочее время.`,
      });
      setName('');
      setPhone('');
      setEmail('');
      setPurposeOrObject('');
      setArea('');
      setMessage('');
      setCaptchaAnswer('');
      setConsent(false);
      setChallenge(createAntiSpamChallenge());
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Не удалось отправить заявку.';
      setStatusMsg({ kind: 'err', text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="c3-form" onSubmit={handleSubmit} noValidate>
      <div>
        <label className="sr-only" htmlFor={`lead-name-${type}`}>
          Имя
        </label>
        <input
          id={`lead-name-${type}`}
          name="name"
          placeholder="Ваше имя *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
        />
      </div>

      <div>
        <label className="sr-only" htmlFor={`lead-phone-${type}`}>
          Телефон
        </label>
        <input
          id={`lead-phone-${type}`}
          name="phone"
          type="tel"
          placeholder="Телефон *"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          autoComplete="tel"
        />
      </div>

      <div>
        <label className="sr-only" htmlFor={`lead-email-${type}`}>
          Электронная почта
        </label>
        <input
          id={`lead-email-${type}`}
          name="email"
          type="email"
          placeholder="Электронная почта"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </div>

      {isOwner ? (
        <>
          <div>
            <label className="sr-only" htmlFor={`lead-obj-${type}`}>
              Адрес и тип объекта
            </label>
            <input
              id={`lead-obj-${type}`}
              name="purposeOrObject"
              placeholder="Адрес и тип объекта"
              value={purposeOrObject}
              onChange={(e) => setPurposeOrObject(e.target.value)}
            />
          </div>
          <div>
            <label className="sr-only" htmlFor={`lead-area-${type}`}>
              Общая площадь, м²
            </label>
            <input
              id={`lead-area-${type}`}
              name="area"
              placeholder="Общая площадь, м²"
              inputMode="numeric"
              value={area}
              onChange={(e) => setArea(e.target.value)}
            />
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="sr-only" htmlFor={`lead-purpose-${type}`}>
              Назначение помещения
            </label>
            <select
              id={`lead-purpose-${type}`}
              name="purposeOrObject"
              value={purposeOrObject}
              onChange={(e) => setPurposeOrObject(e.target.value)}
            >
              <option value="">Назначение помещения</option>
              {Object.values(ROOM_PURPOSE_LABELS).map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="sr-only" htmlFor={`lead-area-${type}`}>
              Нужная площадь, м²
            </label>
            <input
              id={`lead-area-${type}`}
              name="area"
              placeholder="Нужная площадь, м²"
              inputMode="numeric"
              value={area}
              onChange={(e) => setArea(e.target.value)}
            />
          </div>
        </>
      )}

      <div className="full">
        <label className="sr-only" htmlFor={`lead-msg-${type}`}>
          Комментарий
        </label>
        <textarea
          id={`lead-msg-${type}`}
          name="message"
          rows={2}
          placeholder="Комментарий: требуемая мощность (кВт), ворота, сроки"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      {/* Anti-spam challenge & honeypot */}
      <div className="full flex flex-wrap items-center gap-4 pt-1">
        <div className="flex items-center gap-2.5 text-sm">
          <ShieldCheck size={17} className="text-[var(--ok)] shrink-0" />
          <label htmlFor={`lead-captcha-${type}`} className="font-medium whitespace-nowrap">
            Проверка от спама: сколько будет {challenge.prompt}? *
          </label>
          <input
            id={`lead-captcha-${type}`}
            name="captchaAnswer"
            inputMode="numeric"
            placeholder="Ответ"
            value={captchaAnswer}
            onChange={(e) => setCaptchaAnswer(e.target.value)}
            style={{ width: 90, padding: '6px 0' }}
            required
          />
        </div>
      </div>

      <div className="hp" aria-hidden="true">
        <label htmlFor={`lead-hp-${type}`}>Website</label>
        <input
          id={`lead-hp-${type}`}
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      <label className="full flex items-start gap-2.5 text-xs mute cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          style={{ width: 16, height: 16, marginTop: 2, accentColor: 'var(--acc)' }}
        />
        <span>
          Согласен на обработку персональных данных.{' '}
          <a
            href="#/privacy-policy"
            className="underline text-[var(--ink)]"
            onClick={(e) => {
              e.preventDefault();
              onNavigatePrivacy();
            }}
          >
            Политика обработки персональных данных
          </a>
        </span>
      </label>

      <div className="full">
        <button className="c3-btn" type="submit" disabled={submitting}>
          {submitting ? 'Отправляем…' : submitLabel}
        </button>

        {statusMsg && (
          <div
            role="status"
            className={`mt-4 text-sm font-medium ${
              statusMsg.kind === 'ok' ? 'text-[var(--ok)]' : 'text-red-700'
            }`}
          >
            {statusMsg.text}
          </div>
        )}
      </div>
    </form>
  );
}
