import type { Customer } from '../../domain/models/types';
import { SpriteIcon } from '../../ui/SpriteIcon';

export type Mood = 'feliz' | 'neutro' | 'bravo';

/** Quem é o rosto: a Condessa da estreia, o freguês fiel pelo nome ou o tipo de cliente. */
export const faceKey = (c: Customer) => (c.vip?.kind === 'estreia' ? 'condessa' : c.regularId ?? c.archetype);

/** A expressão acompanha a paciência (auditoria P1.5): contente, neutro e bravo. Pechinchando, fica sério. */
export function mood(c: Customer): Mood {
  const left = 1 - c.waitedMs / c.patienceMs;
  if (c.offer) return left > 0.25 ? 'neutro' : 'bravo';
  return left > 0.5 ? 'feliz' : left > 0.25 ? 'neutro' : 'bravo';
}

const MOOD_LABEL: Record<Mood, string> = { feliz: 'contente', neutro: 'impaciente', bravo: 'bravo' };

export function CustomerFace({ c, size = 48 }: { c: Customer; size?: number }) {
  const m = mood(c);
  return (
    <span className={`customer-face face-${m}`} title={`Humor: ${MOOD_LABEL[m]}`}>
      <SpriteIcon name={`face-${faceKey(c)}-${m}`} size={size} title={`Humor: ${MOOD_LABEL[m]}`} />
    </span>
  );
}
