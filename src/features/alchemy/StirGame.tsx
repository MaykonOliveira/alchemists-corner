import { useEffect, useMemo, useRef, useState } from 'react';
import { INGREDIENTS_BY_ID } from '../../domain/data/ingredients';
import type { BrewJob, GameSave } from '../../domain/models/types';
import {
  brewSteps, POINT_BAND, QUALITY_BONUS, QUALITY_NAME, qualityFromHits, shuffledOrder, STIR_LEVEL, STIR_TAPS,
} from '../../domain/rules/quality';
import { sfx } from '../../audio/sound';
import { useGameStore } from '../../store/gameStore';
import { Icon } from '../../ui/Icon';
import { SpriteIcon } from '../../ui/SpriteIcon';

const STEP_NAMES = ['Ordem', 'Fogo', 'Ponto'] as const;

/** Marcador que vai e volta (fogo) ou só vai, e recomeça (ponto). */
function useMarker(active: boolean, period: number, bounce: boolean) {
  const [pos, setPos] = useState(0);
  const ref = useRef(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();
    const step = (t: number) => {
      const k = ((t - start) % period) / period;
      const p = (bounce ? (k < 0.5 ? k * 2 : 2 - k * 2) : k) * 100;
      ref.current = p;
      setPos(p);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [active, period, bounce]);
  return [pos, ref] as const;
}

/**
 * Toque de mestre (auditoria P2.3): três gestos de alquimista, um acerto cada.
 * 1. Ordem: tocar os ingredientes na ordem do livro.
 * 2. Fogo: segurar a chama na faixa da receita (brando, médio, firme ou forte).
 * 3. Ponto: tirar do fogo quando o líquido chega na cor da poção.
 * 3 acertos = Primorosa, 2 = Fina. Opcional: sem mexer, a poção sai Comum.
 */
export function StirGame({ save, job, slot, label }: { save: GameSave; job: BrewJob; slot: 1 | 2; label?: string }) {
  const dispatch = useGameStore((s) => s.dispatch);
  const reduce = save.settings.reduceMotion;
  const steps = useMemo(() => brewSteps(job.recipeId), [job.recipeId]);
  const shown = useMemo(() => shuffledOrder(steps.order, job.totalMs + job.batches), [steps, job.totalMs, job.batches]);
  const [hits, setHits] = useState<boolean[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const step = hits.length;
  const [heat, heatRef] = useMarker(step === 1, reduce ? 2600 : 1500, true);
  const [point, pointRef] = useMarker(step === 2, reduce ? 3600 : 2200, false);

  if (save.level < STIR_LEVEL || job.byHelper) return null;
  if (job.hits !== undefined) {
    const q = qualityFromHits(job.hits);
    return (
      <p className={`stir-result q-${q}`}>
        {label ? `${label}: ` : ''}<Icon e={q === 3 ? '✨' : q === 2 ? '★' : '·'} /> Qualidade <b>{QUALITY_NAME[q]}</b>
        {q > 1 ? ` · clientes pagam ${Math.round(QUALITY_BONUS[q] * 100)}% a mais` : ' · ordem, fogo e ponto certos no próximo preparo'}
      </p>
    );
  }

  const score = (ok: boolean) => {
    const next = [...hits, ok];
    if (ok) sfx.sparkle();
    setHits(next);
    if (next.length >= STIR_TAPS) dispatch({ type: 'STIR', slot, hits: next.filter(Boolean).length });
  };
  const pick = (id: string) => {
    const next = [...picked, id];
    // Errou a ordem: o gesto acaba ali, sem acerto.
    if (steps.order[next.length - 1] !== id) { setPicked([]); score(false); return; }
    if (next.length === steps.order.length) { setPicked([]); score(true); return; }
    setPicked(next);
  };
  const [lo, hi] = steps.heat.band;

  return (
    <div className="stir" aria-label="Toque de mestre">
      <div className="stir-head">
        <span className="row-title"><Icon e="✋" /> Toque de mestre{label ? <span className="stir-label"> · {label}</span> : null}</span>
        <span className="stir-dots" aria-label={`${hits.filter(Boolean).length} acertos`}>
          {STEP_NAMES.map((n, i) => <span key={n} title={n} className={i < hits.length ? (hits[i] ? 'hit' : 'miss') : i === step ? 'now' : ''} />)}
        </span>
      </div>
      <p className="stir-step"><b>{step + 1}/3 · {STEP_NAMES[Math.min(step, 2)]}</b>{' '}
        {step === 0 && 'Ponha os ingredientes na ordem do livro.'}
        {step === 1 && <>Segure o fogo <b>{steps.heat.name}</b>: mexa com a chama na faixa.</>}
        {step === 2 && 'Tire do fogo quando a cor ficar igual à da poção.'}
      </p>

      {step === 0 && (
        <div className="stir-order">
          {shown.map((id) => {
            const n = picked.indexOf(id);
            return (
              <button key={id} className={`stir-ing ${n >= 0 ? 'on' : ''}`} disabled={n >= 0} onClick={() => pick(id)}>
                <SpriteIcon name={`ingredient-${id}`} size={24} />
                <span>{INGREDIENTS_BY_ID[id]?.name ?? id}</span>
                {n >= 0 && <span className="stir-n">{n + 1}</span>}
              </button>
            );
          })}
        </div>
      )}

      {step === 1 && (
        <>
          <div className="stir-bar stir-heat" aria-hidden>
            <span className="stir-zone" style={{ left: `${lo}%`, width: `${hi - lo}%` }} />
            <span className="stir-marker" style={{ left: `${heat}%` }} />
          </div>
          <button className="btn btn-primary stir-btn" onClick={() => score(heatRef.current >= lo && heatRef.current <= hi)}>Mexer!</button>
        </>
      )}

      {step === 2 && (
        <>
          <div className="stir-point">
            <span className="stir-liquid" style={{ background: liquidAt(point, steps.color) }} aria-hidden />
            <span className="small">Cor certa: <span className="stir-swatch" style={{ background: steps.color }} /></span>
          </div>
          <button className="btn btn-primary stir-btn" onClick={() => score(pointRef.current >= POINT_BAND[0] && pointRef.current <= POINT_BAND[1])}>Tirar do fogo!</button>
        </>
      )}
      <p className="card-text small muted">3 acertos: Primorosa (+50%). 2: Fina (+20%). Pular é só deixar: a poção sai Comum.</p>
    </div>
  );
}

/** Cor do líquido no gesto do ponto: turvo, chega na cor da poção na faixa do ponto e passa do ponto depois. */
function liquidAt(p: number, color: string): string {
  const mid = (POINT_BAND[0] + POINT_BAND[1]) / 2;
  if (p <= mid) return `color-mix(in srgb, ${color} ${Math.round((p / mid) * 100)}%, #6b6658)`;
  return `color-mix(in srgb, ${color} ${Math.round(100 - ((p - mid) / (100 - mid)) * 70)}%, #3a2414)`;
}
