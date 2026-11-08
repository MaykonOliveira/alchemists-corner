import { describe, expect, it, vi } from 'vitest';

vi.mock('../../store/gameStore', () => ({ useGameStore: () => null }));
const { NAV_GROUPS, SHORTCUTS, groupOf, panelForGroup, panelTitle, rememberPanel } = await import('../../app/layout/nav');

describe('navegação em áreas', () => {
  it('cada tela está em exatamente uma área, com tecla única', () => {
    const panels = SHORTCUTS.map((s) => s.panel);
    expect(new Set(panels).size).toBe(panels.length);
    expect(panels).toHaveLength(14);
    const keys = SHORTCUTS.map((s) => s.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(NAV_GROUPS.map((g) => g.id)).toEqual(['oficina', 'loja', 'progresso', 'mundo']);
  });

  it('a porta fica na área Loja e tem título', () => {
    expect(groupOf('door')?.id).toBe('loja');
    expect(panelTitle('door')).toBe('Porta da loja');
    expect(groupOf(null)).toBeNull();
  });

  it('tocar na área abre a tela com novidade, senão a última aberta, senão a primeira', () => {
    const mundo = NAV_GROUPS.find((g) => g.id === 'mundo')!;
    expect(panelForGroup(mundo, () => null)).toBe('street');
    rememberPanel('album');
    expect(panelForGroup(mundo, () => null)).toBe('album');
    expect(panelForGroup(mundo, (p) => (p === 'season' ? '🎉' : null))).toBe('season');
  });
});
