import { describe, expect, it } from 'vitest';
import sheet from '../../assets/sprites/icons.json';
import { EMOJI_ICON, EMOJI_RE } from '../../ui/Icon';

/** Símbolos de texto que a fonte desenha bem e ficam como letra (estrelas, corações, setas). */
const TEXT_GLYPHS = new Set(['✓', '✗', '★', '☆', '♥', '♡', '✦', '❚', '♪', '⏸', '▶', '⬛', '©', '™', '↔']);

/** Código-fonte do jogo (sem os testes), lido como texto. */
const SOURCES = import.meta.glob(['../../**/*.{ts,tsx}', '!../../tests/**'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

describe('ícones em pixel no lugar dos emojis', () => {
  it('todo ícone do mapa existe no spritesheet', () => {
    const names = new Set(Object.keys(sheet.icons));
    const missing = Object.values(EMOJI_ICON).filter((n) => !names.has(n));
    expect(missing).toEqual([]);
  });

  it('todo emoji usado no jogo tem desenho', () => {
    const found = new Set<string>();
    expect(Object.keys(SOURCES).length).toBeGreaterThan(50);
    for (const [f, text] of Object.entries(SOURCES)) {
      for (const m of text.matchAll(EMOJI_RE)) {
        const e = m[0].replace(/️/g, '');
        if (!TEXT_GLYPHS.has(e) && !EMOJI_ICON[e]) found.add(`${e} (${f})`);
      }
    }
    expect([...found]).toEqual([]);
  });
});
