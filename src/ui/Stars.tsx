import { MAX_STARS } from '../domain/rules/mastery';

/** Estrelas de maestria de uma receita (0 a 5). */
export function Stars({ n, showEmpty = false }: { n: number; showEmpty?: boolean }) {
  if (n <= 0 && !showEmpty) return null;
  return (
    <span className={`stars ${n >= MAX_STARS ? 'stars-max' : ''}`} aria-label={`Maestria: ${n} de ${MAX_STARS} estrelas`} title={`Maestria ${n}/${MAX_STARS}`}>
      {Array.from({ length: MAX_STARS }, (_, i) => (
        <span key={i} className={i < n ? 'star on' : 'star'} aria-hidden>★</span>
      ))}
    </span>
  );
}
