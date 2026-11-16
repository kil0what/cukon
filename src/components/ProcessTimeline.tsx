import { useEffect, useRef, useState } from 'react';
import { WORK_STEPS } from '../shared/defaultData';

export function ProcessTimeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0.25);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const updateScroll = () => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const y = window.innerHeight * 0.62;
      const nextProgress = Math.min(1, Math.max(0, (y - rect.top - 100) / Math.max(1, rect.height - 100)));
      setProgress(nextProgress);

      const stepEls = el.querySelectorAll<HTMLElement>('.st');
      let lastActive = 0;
      stepEls.forEach((stepEl, i) => {
        if (stepEl.getBoundingClientRect().top < y) {
          lastActive = i;
        }
      });
      setActiveIndex(lastActive);
    };

    updateScroll();
    window.addEventListener('scroll', updateScroll, { passive: true });
    return () => window.removeEventListener('scroll', updateScroll);
  }, []);

  return (
    <div
      ref={containerRef}
      className="proc"
      style={{ ['--p' as string]: progress }}
    >
      <div className="hd">
        <h2 className="c3-h2">Как мы работаем</h2>
        <p>От первой заявки до ежедневного технического сопровождения вашего бизнеса.</p>
      </div>
      <div className="sts">
        {WORK_STEPS.map((step, idx) => (
          <div
            key={step.title}
            className={`st ${idx <= activeIndex ? 'on' : ''}`}
            data-n={idx + 1}
          >
            <h3 className="c3-h3">{step.title}</h3>
            <p>{step.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
