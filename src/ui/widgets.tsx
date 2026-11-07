import type { ReactNode } from 'react';
import { RECIPES_BY_ID } from '../domain/data/recipes';
import { CoinIcon } from './icons';
import { PotionIcon } from './SpriteIcon';

export function Stepper({ value, min, max, onChange, label }: { value: number; min: number; max: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button className="step-btn" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label="Diminuir">−</button>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        min={min}
        max={max}
        aria-label={label}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (Number.isFinite(v)) onChange(Math.max(min, Math.min(max, Math.round(v))));
        }}
      />
      <button className="step-btn" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="Aumentar">+</button>
    </div>
  );
}

export function Meter({ ratio, tone = 'gold', label }: { ratio: number; tone?: 'gold' | 'ok' | 'warn' | 'potion'; label?: string; color?: string }) {
  const r = Math.max(0, Math.min(1, ratio));
  return (
    <span className={`meter meter-${tone}`} role="progressbar" aria-valuenow={Math.round(r * 100)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <span style={{ width: `${r * 100}%` }} />
    </span>
  );
}

export function Coins({ n, size = 14 }: { n: number; size?: number }) {
  return (
    <span className="coins">
      <CoinIcon size={size} />
      {n}
    </span>
  );
}

export function PotionName({ id, size = 16 }: { id: string; size?: number }) {
  const r = RECIPES_BY_ID[id];
  return (
    <span className="potion-name">
      <PotionIcon recipeId={r.id} size={size} />
      {r.name}
    </span>
  );
}

export function Section({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="group">
      <div className="group-head">
        <h3>{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}
