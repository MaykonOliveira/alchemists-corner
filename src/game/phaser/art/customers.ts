import type { CustomerArchetype } from '../../../domain/models/types';
import { PAL, painter, type Painter } from './painter';

export const CUSTOMER_W = 16;
export const CUSTOMER_H = 34;
export const CUSTOMER_FRAMES = 3; // 0 parado, 1 e 2 caminhando

interface Look {
  skin: string;
  hair: string;
  top: string;
  topDark: string;
  legs: string;
  accent: string;
  hat?: string;
}

const LOOKS: Record<CustomerArchetype, Look> = {
  aventureiro: { skin: PAL.skin2, hair: '#5a3220', top: '#8a5a32', topDark: '#5e3a20', legs: '#3a3a4a', accent: PAL.terracotta },
  estudioso: { skin: PAL.skin1, hair: '#c8c0b8', top: PAL.violet, topDark: '#4a3070', legs: '#3a2a4a', accent: PAL.gold, hat: '#4a3070' },
  morador: { skin: PAL.skin3, hair: '#2a1a14', top: '#6a8a4a', topDark: '#4a6a32', legs: '#5a4030', accent: PAL.cream },
  viajante: { skin: PAL.skin1, hair: '#b0642c', top: PAL.teal, topDark: '#2a6a6a', legs: '#4a3a2a', accent: PAL.parchment, hat: '#2a6a6a' },
};

function drawFrame(p: Painter, ox: number, look: Look, frame: number) {
  const o = (x: number) => ox + x;
  const bob = frame === 0 ? 0 : 1; // corpo sobe 1px nos passos
  const top = 1 - bob + 1;
  // Pernas e botas
  const lift = [0, frame === 1 ? 2 : 0, frame === 2 ? 2 : 0];
  for (const [lx, l] of [[5, lift[1]], [9, lift[2]]] as const) {
    p.rect(o(lx), 25, 3, 7 - l, look.legs);
    p.rect(o(lx), 31 - l, 3, 2, PAL.woodDeep);
    p.hline(o(lx), 33 - l, 3, PAL.ink);
  }
  // Tronco (túnica/manto)
  const ty = top + 12;
  p.rect(o(3), ty, 10, 13, look.top);
  p.rect(o(3), ty + 10, 10, 3, look.topDark);
  p.vline(o(3), ty, 13, look.topDark);
  p.rect(o(3), ty + 8, 10, 1, PAL.woodDark); // cinto
  p.px(o(8), ty + 8, PAL.gold);
  p.vline(o(8), ty + 1, 6, look.accent);
  p.hline(o(5), ty, 6, look.accent); // gola
  // Braços
  const sw = frame === 1 ? 1 : frame === 2 ? -1 : 0;
  p.rect(o(1), ty + 1 + sw, 2, 8, look.topDark);
  p.rect(o(13), ty + 1 - sw, 2, 8, look.topDark);
  p.rect(o(1), ty + 9 + sw, 2, 2, look.skin);
  p.rect(o(13), ty + 9 - sw, 2, 2, look.skin);
  // Cabeça
  const hy = top + 2;
  p.rect(o(4), hy, 8, 9, look.skin);
  p.rect(o(4), hy + 9, 8, 1, PAL.skin3);
  p.rect(o(4), hy - 1, 8, 3, look.hair);
  p.vline(o(4), hy, 5, look.hair);
  p.vline(o(11), hy, 5, look.hair);
  p.rect(o(6), hy + 4, 1, 2, PAL.ink);
  p.rect(o(9), hy + 4, 1, 2, PAL.ink);
  p.px(o(5), hy + 6, '#e8a088');
  p.px(o(10), hy + 6, '#e8a088');
  p.hline(o(7), hy + 7, 2, '#9a4a3a');
  if (look.hat) {
    p.rect(o(2), hy - 1, 12, 2, look.hat);
    p.rect(o(4), hy - 4, 8, 3, look.hat);
    p.rect(o(6), hy - 5, 4, 1, look.hat);
    p.hline(o(4), hy - 2, 8, look.accent);
  }
  // Contorno para destacar a silhueta no cenário
  p.vline(o(3), hy, 9, PAL.ink);
  p.vline(o(12), hy, 9, PAL.ink);
}

/** Folha de sprites (3 quadros lado a lado) para um arquétipo. */
export function drawCustomerSheet(archetype: CustomerArchetype): HTMLCanvasElement {
  const p = painter(CUSTOMER_W * CUSTOMER_FRAMES, CUSTOMER_H);
  for (let f = 0; f < CUSTOMER_FRAMES; f++) drawFrame(p, f * CUSTOMER_W, LOOKS[archetype], f);
  return p.canvas;
}
