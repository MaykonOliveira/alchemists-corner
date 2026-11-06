/** XP total necessário para alcançar o nível informado (nível 1 = 0 XP). */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  // Curva suave: 100, 250, 450, 700...
  return 25 * (level - 1) * (level + 2);
}

export function levelFromXp(xp: number): number {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) level++;
  return level;
}

/** Progresso (0..1) dentro do nível atual. */
export function levelProgress(xp: number): number {
  const level = levelFromXp(xp);
  const start = xpForLevel(level);
  const end = xpForLevel(level + 1);
  return (xp - start) / (end - start);
}
