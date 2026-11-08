import { useEffect, useRef, useState } from 'react';
import type { BrewJob, GameSave } from '../../domain/models/types';
import { QUALITY_BONUS, QUALITY_NAME, qualityFromHits, STIR_LEVEL, STIR_TAPS } from '../../domain/rules/quality';
import { sfx } from '../../audio/sound';
import { useGameStore } from '../../store/gameStore';

/** Faixa dourada (em %) onde mexer conta como acerto. Fica um pouco menor a cada toque. */
const ZONES = [[38, 62], [41, 59], [43, 57]] as const;

/**
 * Toque de mestre: um marcador vai e volta na barra; mexer com ele na faixa dourada é um acerto.
 * Três toques. 3 acertos = Primorosa, 2 = Fina. Opcional: sem mexer, a poção sai Comum.
 */
export function StirGame({ save, job, slot, label }: { save: GameSave; job: BrewJob; slot: 1 | 2; label?: string }) {
  const dispatch = useGameStore((s) => s.dispatch);
  const reduce = save.settings.reduceMotion;
  const [hits, setHits] = useState<boolean[]>([]);
  const [pos, setPos] = useState(0);
  const posRef = useRef(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    // Com "reduzir movimento" o marcador anda mais devagar.
    const period = reduce ? 2600 : 1500;
    const step = (t: number) => {
      const k = ((t - start) % period) / period;
      const p = (k < 0.5 ? k * 2 : 2 - k * 2) * 100;
      posRef.current = p;
      setPos(p);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [reduce]);

  if (save.level < STIR_LEVEL || job.byHelper) return null;
  if (job.hits !== undefined) {
    const q = qualityFromHits(job.hits);
    return (
      <p className={`stir-result q-${q}`}>
        {label ? `${label}: ` : ''}{q === 3 ? '✨' : q === 2 ? '★' : '·'} Qualidade <b>{QUALITY_NAME[q]}</b>
        {q > 1 ? ` · clientes pagam ${Math.round(QUALITY_BONUS[q] * 100)}% a mais` : ' · mexa no tempo certo no próximo preparo'}
      </p>
    );
  }
  const zone = ZONES[Math.min(hits.length, ZONES.length - 1)];
  const tap = () => {
    const ok = posRef.current >= zone[0] && posRef.current <= zone[1];
    const next = [...hits, ok];
    if (ok) sfx.sparkle();
    setHits(next);
    if (next.length >= STIR_TAPS) dispatch({ type: 'STIR', slot, hits: next.filter(Boolean).length });
  };
  return (
    <div className="stir" aria-label="Toque de mestre">
      <div className="stir-head">
        <span className="row-title">✋ Toque de mestre{label ? <span className="stir-label"> · {label}</span> : null}</span>
        <span className="stir-dots" aria-label={`${hits.filter(Boolean).length} acertos`}>
          {Array.from({ length: STIR_TAPS }, (_, i) => <span key={i} className={i < hits.length ? (hits[i] ? 'hit' : 'miss') : ''} />)}
        </span>
      </div>
      <div className="stir-bar" aria-hidden>
        <span className="stir-zone" style={{ left: `${zone[0]}%`, width: `${zone[1] - zone[0]}%` }} />
        <span className="stir-marker" style={{ left: `${pos}%` }} />
      </div>
      <button className="btn btn-primary stir-btn" onClick={tap}>Mexer! ({hits.length + 1}/{STIR_TAPS})</button>
      <p className="card-text small muted">Mexa com o marcador na faixa dourada. 3 acertos: Primorosa (+50%). 2: Fina (+20%).</p>
    </div>
  );
}
