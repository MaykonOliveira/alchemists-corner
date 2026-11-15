import { describe, expect, it } from 'vitest';
import classic from '../../assets/sprites/shop.json';
import vector from '../../assets/sprites/vector/shop.json';

type Frames = Record<string, { frame: { w: number; h: number } }>;

// O visual vetorial (teste) reaproveita a cena inteira: mesmos nomes de quadro e mesmas medidas lógicas,
// só que em alta resolução. Se um desenho novo entrar só no pixel art, a cena vetorial quebraria.
describe('visual vetorial (teste)', () => {
  const k = Number(vector.meta.scale);
  const c = classic.frames as Frames;
  const v = vector.frames as Frames;

  it('tem todos os quadros do atlas clássico (rode python3 art/vector/build.py depois do art/build.py)', () => {
    expect(Object.keys(c).filter((n) => !v[n])).toEqual([]);
  });

  it('cada quadro tem a medida do clássico vezes a escala', () => {
    const wrong = Object.keys(c).filter((n) => v[n] && (v[n].frame.w !== c[n].frame.w * k || v[n].frame.h !== c[n].frame.h * k));
    expect(wrong).toEqual([]);
  });
});
