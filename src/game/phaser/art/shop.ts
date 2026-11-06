import { PAL, painter, pixelText, rng, textWidth, type Painter } from './painter';

// Dimensões do mundo lógico (PRD 6.3).
export const WORLD_W = 384;
export const WORLD_H = 216;
export const FLOOR_Y = 112;

/** Cenário de fundo da loja (paredes, piso, janela, decoração não interativa). */
export function drawRoom(): HTMLCanvasElement {
  const p = painter(WORLD_W, WORLD_H);
  const r = rng(7);

  // --- Piso de tábuas ---
  for (let y = FLOOR_Y, row = 0; y < WORLD_H; y += 8, row++) {
    p.rect(0, y, WORLD_W, 8, row % 2 ? PAL.woodMid : PAL.woodLight);
    p.hline(0, y, WORLD_W, PAL.wood);
    p.hline(0, y + 1, WORLD_W, row % 2 ? PAL.woodLight : PAL.woodHi);
    const off = (row * 29) % 56;
    for (let x = off; x < WORLD_W; x += 56) {
      p.vline(x, y + 1, 7, PAL.wood);
      p.px(x + 3, y + 4, PAL.wood); // prego
    }
    for (let i = 0; i < 18; i++) p.hline(Math.floor(r() * WORLD_W), y + 3 + Math.floor(r() * 4), 3 + Math.floor(r() * 6), row % 2 ? PAL.wood : PAL.woodMid);
  }
  // Sombra junto à parede do fundo
  p.rect(24, FLOOR_Y, 336, 2, PAL.woodDark);
  p.rect(24, FLOOR_Y + 2, 336, 2, PAL.wood);

  // --- Parede do fundo (reboco + pedras) ---
  p.rect(24, 10, 336, 76, PAL.plaster);
  for (let i = 0; i < 520; i++) {
    p.px(24 + Math.floor(r() * 336), 10 + Math.floor(r() * 74), r() > 0.5 ? PAL.plasterDark : PAL.plasterHi);
  }
  // Pedras aparentes onde o reboco caiu
  const stones = (sx: number, sy: number, cols: number, rows: number) => {
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const x = sx + i * 9 + (j % 2 ? 4 : 0);
        const y = sy + j * 5;
        p.rect(x, y, 8, 4, PAL.stone);
        p.hline(x, y, 8, PAL.stoneHi);
        p.hline(x, y + 4, 8, PAL.stoneDark);
      }
    }
  };
  stones(28, 14, 2, 3);
  stones(272, 70, 2, 2);
  stones(232, 14, 3, 2);

  // --- Rodapé de madeira (lambri) ---
  p.rect(24, 84, 336, 28, PAL.wood);
  p.rect(24, 84, 336, 2, PAL.woodHi);
  p.hline(24, 86, 336, PAL.woodDark);
  for (let x = 30; x < 356; x += 22) {
    p.frame(x, 89, 18, 18, PAL.woodDark);
    p.hline(x + 1, 89 + 1, 16, PAL.woodMid);
  }
  p.rect(24, 109, 336, 3, PAL.woodDeep);

  // --- Paredes laterais em perspectiva ---
  for (let x = 0; x < 24; x++) {
    const bottom = FLOOR_Y + (24 - x);
    const wainscot = 84 + Math.floor((24 - x) * 0.6);
    p.rect(x, 0, 1, wainscot, PAL.plasterDark);
    p.rect(x, wainscot, 1, bottom - wainscot, PAL.woodDark);
    const rx = WORLD_W - 1 - x;
    p.rect(rx, 0, 1, wainscot, PAL.plasterDark);
    p.rect(rx, wainscot, 1, bottom - wainscot, PAL.woodDark);
  }
  p.vline(24, 10, FLOOR_Y - 10, PAL.woodDeep);
  p.vline(WORLD_W - 25, 10, FLOOR_Y - 10, PAL.woodDeep);

  // --- Viga do teto ---
  p.rect(0, 0, WORLD_W, 10, PAL.woodDark);
  p.hline(0, 9, WORLD_W, PAL.ink);
  p.hline(0, 2, WORLD_W, PAL.wood);
  for (let x = 8; x < WORLD_W; x += 64) {
    p.rect(x, 0, 8, 13, PAL.wood);
    p.rect(x, 12, 8, 1, PAL.ink);
    p.vline(x, 0, 12, PAL.woodMid);
  }

  drawWindow(p, 50, 22);
  drawHangingHerbs(p, 112, 10);
  drawLanternBody(p, 104, 10, 14);
  drawLanternBody(p, 286, 10, 10);

  // Tapete da porta
  p.rect(302, FLOOR_Y + 1, 38, 6, PAL.moss);
  p.hline(302, FLOOR_Y + 6, 38, PAL.ink);
  for (let x = 304; x < 338; x += 3) p.px(x, FLOOR_Y + 3, PAL.leaf);

  drawForeground(p);
  return p.canvas;
}

/** Janela com vista da rua. A cena aplica a luz do período do dia por cima. */
function drawWindow(p: Painter, x: number, y: number) {
  const w = 50;
  const h = 50;
  // Vista externa
  const sky = ['#a9d4ea', '#b5dbec', '#c4e2ee', '#d4e9ee', '#e3efe8'];
  for (let i = 0; i < 30; i++) p.hline(x + 2, y + 2 + i, w - 4, sky[Math.min(4, Math.floor(i / 6))]);
  // Casas do outro lado da rua
  const houses = [
    { hx: x + 2, hw: 14, hh: 18, wall: '#d8c0a0', roof: '#7a3a2e' },
    { hx: x + 16, hw: 12, hh: 22, wall: '#c9b4d0', roof: '#4a3a6a' },
    { hx: x + 28, hw: 20, hh: 16, wall: '#e0cfa8', roof: '#6a4a2e' },
  ];
  for (const hs of houses) {
    const top = y + h - 10 - hs.hh;
    p.rect(hs.hx, top, hs.hw, hs.hh, hs.wall);
    for (let i = 0; i < 4; i++) p.hline(hs.hx - 1 + i, top - 4 + i, hs.hw + 2 - i * 2, hs.roof);
    p.rect(hs.hx + 3, top + 4, 3, 4, '#5a6a8a');
    p.px(hs.hx + 4, top + 5, '#ffe9a8');
    p.rect(hs.hx + hs.hw - 6, top + hs.hh - 7, 4, 7, PAL.woodDark);
  }
  // Rua de paralelepípedos
  p.rect(x + 2, y + h - 10, w - 4, 8, '#8c8478');
  for (let i = 0; i < 16; i++) p.px(x + 3 + ((i * 7) % (w - 6)), y + h - 9 + (i % 3) * 2, '#a49c90');
  // Poste de luz
  p.vline(x + 40, y + 20, 20, PAL.charcoal);
  p.rect(x + 38, y + 17, 5, 4, PAL.charcoal);
  p.rect(x + 39, y + 18, 3, 2, PAL.warm);

  // Moldura e caixilhos
  p.frame(x, y, w, h, PAL.woodDeep);
  p.frame(x + 1, y + 1, w - 2, h - 2, PAL.woodMid);
  p.rect(x + w / 2 - 1, y + 1, 2, h - 2, PAL.woodMid);
  p.rect(x + 1, y + h / 2 - 1, w - 2, 2, PAL.woodMid);
  p.vline(x + w / 2 + 1, y + 1, h - 2, PAL.woodDark);
  // Reflexo no vidro
  p.hline(x + 4, y + 4, 4, '#ffffff');
  p.hline(x + 4, y + 5, 2, '#ffffff');
  p.hline(x + 30, y + 30, 3, '#ffffff');
  // Parapeito com vaso
  p.rect(x - 3, y + h, w + 6, 3, PAL.woodHi);
  p.hline(x - 3, y + h + 3, w + 6, PAL.woodDark);
  p.rect(x + 6, y + h - 6, 8, 6, PAL.terracotta);
  p.hline(x + 6, y + h - 6, 8, '#d06e50');
  p.rect(x + 7, y + h - 11, 2, 5, PAL.leaf);
  p.rect(x + 10, y + h - 13, 2, 7, PAL.leafHi);
  p.rect(x + 12, y + h - 10, 2, 4, PAL.moss);
}

function drawHangingHerbs(p: Painter, x: number, y: number) {
  p.hline(x, y + 4, 44, PAL.parchmentDark);
  const bunches = [PAL.leaf, PAL.moss, PAL.sage, '#a0784a', PAL.leafHi];
  bunches.forEach((c, i) => {
    const bx = x + 4 + i * 9;
    p.vline(bx + 2, y + 4, 4, PAL.parchmentDark);
    p.rect(bx, y + 8, 5, 3, c);
    p.rect(bx + 1, y + 11, 3, 4, c);
    p.px(bx + 2, y + 15, c);
    p.px(bx + 1, y + 9, PAL.leafHi);
  });
}

function drawLanternBody(p: Painter, x: number, y: number, chain: number) {
  p.vline(x + 3, y, chain, PAL.charcoal);
  const ly = y + chain;
  p.rect(x, ly, 7, 2, PAL.charcoal);
  p.rect(x + 1, ly + 2, 5, 7, PAL.amber);
  p.rect(x + 2, ly + 3, 3, 5, PAL.warm);
  p.vline(x, ly + 2, 7, PAL.charcoal);
  p.vline(x + 6, ly + 2, 7, PAL.charcoal);
  p.rect(x, ly + 9, 7, 2, PAL.charcoal);
}

/** Posições das lanternas (centro da luz) para os brilhos animados. */
export const LANTERNS = [
  { x: 107, y: 30 },
  { x: 289, y: 26 },
];

function drawForeground(p: Painter) {
  // Tapete central
  const rx = 146;
  const ry = 180;
  p.rect(rx, ry, 124, 28, PAL.terracottaDark);
  p.rect(rx + 2, ry + 2, 120, 24, PAL.terracotta);
  p.frame(rx + 4, ry + 4, 116, 20, PAL.gold);
  for (let x = rx + 10; x < rx + 116; x += 10) {
    p.px(x, ry + 13, PAL.gold);
    p.px(x - 1, ry + 14, PAL.gold);
    p.px(x + 1, ry + 14, PAL.gold);
    p.px(x, ry + 15, PAL.gold);
  }
  for (let x = rx; x < rx + 124; x += 3) {
    p.vline(x, ry - 2, 2, PAL.parchment);
    p.vline(x, ry + 28, 2, PAL.parchment);
  }

  // Caixotes à direita
  const crate = (x: number, y: number, s: number) => {
    p.rect(x, y, s, s, PAL.woodMid);
    p.frame(x, y, s, s, PAL.woodDark);
    p.hline(x + 1, y + 1, s - 2, PAL.woodHi);
    for (let i = 2; i < s - 2; i++) p.px(x + i, y + i, PAL.woodDark);
    p.hline(x + 1, y + Math.floor(s / 2), s - 2, PAL.wood);
  };
  crate(326, 182, 22);
  crate(348, 188, 16);
  crate(332, 166, 16);
  // Saco de grãos
  p.ellipse(310, 200, 8, 7, PAL.parchmentDark);
  p.ellipse(310, 199, 7, 6, PAL.parchment);
  p.rect(308, 190, 4, 3, PAL.parchmentDark);

  // Barril à esquerda
  p.rect(10, 178, 22, 30, PAL.woodMid);
  for (let x = 13; x < 30; x += 4) p.vline(x, 178, 30, PAL.wood);
  p.rect(10, 182, 22, 2, PAL.charcoal);
  p.rect(10, 200, 22, 2, PAL.charcoal);
  p.rect(10, 178, 22, 2, PAL.woodHi);
  p.frame(10, 178, 22, 30, PAL.woodDark);

  // Vaso com planta grande
  p.rect(116, 194, 14, 14, PAL.terracotta);
  p.hline(116, 194, 14, '#d06e50');
  p.rect(116, 206, 14, 2, PAL.terracottaDark);
  const leaves = [[114, 184], [120, 178], [126, 182], [110, 190], [130, 188], [122, 186]];
  leaves.forEach(([lx, ly], i) => {
    p.rect(lx, ly, 6, 3, i % 2 ? PAL.leaf : PAL.moss);
    p.hline(lx + 1, ly, 3, PAL.leafHi);
  });
  p.vline(123, 184, 10, PAL.moss);
}

// ---------------------------------------------------------------------------
// Objetos interativos
// ---------------------------------------------------------------------------

export function drawCabinet(): HTMLCanvasElement {
  const p = painter(40, 98);
  p.rect(0, 0, 40, 98, PAL.woodDark);
  p.rect(2, 4, 36, 92, PAL.woodMid);
  p.rect(0, 0, 40, 5, PAL.wood);
  p.hline(0, 0, 40, PAL.woodHi);
  p.hline(0, 5, 40, PAL.woodDeep);
  // Portas de vidro superiores
  for (const dx of [4, 21]) {
    p.rect(dx, 8, 15, 50, PAL.woodDark);
    p.rect(dx + 1, 9, 13, 48, '#2a3a3a');
    for (const sy of [24, 41]) p.rect(dx + 1, sy, 13, 2, PAL.woodLight);
  }
  // Potes de ingredientes atrás do vidro
  const jars = ['#9cc76a', '#e0a040', '#7fd6d0', '#4f8a3a', '#a39a90', '#4a6fd0', '#d0583a', '#c9e070', '#9cc76a', '#e0a040', '#7fd6d0', '#4f8a3a'];
  let j = 0;
  for (const sy of [16, 33, 50]) {
    for (const dx of [5, 10, 22, 28]) {
      const c = jars[j++ % jars.length];
      p.rect(dx, sy, 4, 7, '#c8d8d8');
      p.rect(dx, sy + 2, 4, 5, c);
      p.hline(dx, sy - 1, 4, PAL.copper);
      p.px(dx, sy + 2, '#ffffff');
    }
  }
  // Reflexos no vidro
  p.vline(6, 10, 6, '#c0e0e0');
  p.vline(23, 10, 4, '#c0e0e0');
  // Gavetas inferiores
  for (let i = 0; i < 3; i++) {
    const y = 62 + i * 11;
    p.rect(4, y, 32, 9, PAL.woodLight);
    p.frame(4, y, 32, 9, PAL.woodDark);
    p.rect(18, y + 3, 4, 2, PAL.gold);
  }
  p.rect(0, 96, 40, 2, PAL.ink);
  return p.canvas;
}

export function drawCauldron(): HTMLCanvasElement {
  const p = painter(48, 48);
  // Base de pedra (lareira)
  p.rect(2, 32, 44, 16, PAL.stoneDark);
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < 5; i++) {
      const x = 3 + i * 9 + (row % 2 ? 4 : 0);
      if (x + 8 > 46) continue;
      p.rect(x, 33 + row * 5, 8, 4, PAL.stone);
      p.hline(x, 33 + row * 5, 8, PAL.stoneHi);
    }
  }
  // Abertura da fornalha
  p.rect(16, 38, 16, 10, PAL.ink);
  p.rect(17, 44, 14, 4, '#5a2a14');
  // Pernas e corpo do caldeirão
  p.rect(10, 30, 3, 5, PAL.charcoal);
  p.rect(35, 30, 3, 5, PAL.charcoal);
  p.ellipse(24, 22, 18, 12, PAL.charcoal);
  p.ellipse(24, 21, 17, 11, '#3a3238');
  p.ellipse(19, 17, 5, 4, '#4c444a');
  p.px(14, 15, '#6a6268');
  // Borda e líquido
  p.ellipse(24, 10, 19, 4, '#4c444a');
  p.ellipse(24, 10, 16, 3, '#2f7a6a');
  p.ellipse(22, 10, 9, 2, '#46b098');
  p.px(18, 9, '#a8ecd8');
  // Alças
  p.rect(3, 14, 3, 6, PAL.charcoal);
  p.rect(42, 14, 3, 6, PAL.charcoal);
  return p.canvas;
}

export function drawShelf(): HTMLCanvasElement {
  const p = painter(56, 62);
  p.rect(0, 0, 56, 62, PAL.woodDark);
  p.rect(3, 2, 50, 58, '#4a2e1e');
  for (let x = 6; x < 52; x += 7) p.vline(x, 2, 58, PAL.woodDeep);
  p.rect(0, 0, 56, 3, PAL.woodLight);
  p.hline(0, 0, 56, PAL.woodHi);
  for (const y of SHELF_BOARDS) {
    p.rect(0, y, 56, 3, PAL.woodLight);
    p.hline(0, y, 56, PAL.woodHi);
    p.hline(0, y + 3, 56, PAL.ink);
  }
  p.vline(0, 0, 62, PAL.wood);
  p.vline(55, 0, 62, PAL.wood);
  return p.canvas;
}

/** Linhas (y relativo) das tábuas onde os frascos ficam apoiados. */
export const SHELF_BOARDS = [19, 39, 59];

export function drawBoard(): HTMLCanvasElement {
  const p = painter(36, 32);
  p.rect(0, 0, 36, 32, PAL.woodMid);
  p.frame(0, 0, 36, 32, PAL.woodDark);
  p.rect(2, 2, 32, 28, '#b07a48');
  const r = rng(3);
  for (let i = 0; i < 40; i++) p.px(2 + Math.floor(r() * 32), 2 + Math.floor(r() * 28), r() > 0.5 ? '#9a6a3c' : '#c08e5a');
  const note = (x: number, y: number, w: number, h: number, pin: string) => {
    p.rect(x, y, w, h, PAL.parchment);
    p.hline(x, y + h, w, PAL.parchmentDark);
    for (let ly = y + 3; ly < y + h - 1; ly += 2) p.hline(x + 1, ly, w - 2 - (ly % 3), PAL.parchmentDark);
    p.px(x + Math.floor(w / 2), y + 1, pin);
  };
  note(4, 4, 11, 12, PAL.terracotta);
  note(18, 6, 13, 9, PAL.teal);
  note(8, 18, 12, 9, PAL.gold);
  note(23, 18, 8, 9, PAL.violet);
  return p.canvas;
}

export function drawDoor(): HTMLCanvasElement {
  const p = painter(42, 84);
  // Batente de pedra com arco
  p.rect(0, 8, 42, 76, PAL.stone);
  p.ellipse(21, 12, 21, 12, PAL.stone);
  p.rect(0, 12, 42, 72, PAL.stone);
  for (let y = 14; y < 84; y += 8) {
    p.hline(0, y, 4, PAL.stoneDark);
    p.hline(38, y + 4, 4, PAL.stoneDark);
  }
  p.ellipse(21, 14, 17, 11, PAL.woodDeep);
  p.rect(4, 14, 34, 70, PAL.woodDeep);
  // Folha da porta
  p.ellipse(21, 15, 16, 10, PAL.woodMid);
  p.rect(5, 15, 32, 69, PAL.woodMid);
  for (let x = 9; x < 37; x += 6) p.vline(x, 8, 76, PAL.wood);
  p.vline(6, 10, 74, PAL.woodLight);
  // Janelinha redonda
  p.ellipse(21, 18, 6, 6, PAL.woodDark);
  p.ellipse(21, 18, 5, 5, '#b5dbec');
  p.rect(18, 20, 7, 3, '#d8c0a0');
  p.hline(16, 18, 11, PAL.woodDark);
  p.vline(21, 13, 11, PAL.woodDark);
  // Dobradiças e maçaneta
  for (const y of [30, 68]) {
    p.rect(5, y, 12, 3, PAL.charcoal);
    p.px(7, y + 1, PAL.stoneHi);
  }
  p.rect(32, 50, 3, 3, PAL.gold);
  p.px(32, 50, PAL.warm);
  return p.canvas;
}

/** Placa "ABERTO"/"FECHADO" pendurada na porta. */
export function drawSign(open: boolean): HTMLCanvasElement {
  const text = open ? 'ABERTO' : 'FECHADO';
  const w = textWidth(text) + 6;
  const p = painter(w, 13);
  p.vline(Math.floor(w / 2) - 3, 0, 4, PAL.charcoal);
  p.vline(Math.floor(w / 2) + 3, 0, 4, PAL.charcoal);
  p.rect(0, 3, w, 10, PAL.woodDark);
  p.rect(1, 4, w - 2, 8, open ? '#3f7a3c' : PAL.terracottaDark);
  pixelText(p, text, 3, 5, PAL.cream);
  return p.canvas;
}

export function drawCounter(): HTMLCanvasElement {
  const p = painter(116, 40);
  // Tampo
  p.rect(0, 0, 116, 8, PAL.woodHi);
  p.hline(0, 0, 116, PAL.woodDark);
  p.hline(0, 1, 116, '#d8a466');
  p.hline(0, 7, 116, PAL.woodMid);
  for (let x = 20; x < 116; x += 32) p.hline(x, 4, 10, PAL.woodLight);
  // Frente
  p.rect(2, 8, 112, 30, PAL.woodMid);
  p.hline(2, 8, 112, PAL.woodDeep);
  for (let x = 6; x < 108; x += 26) {
    p.rect(x, 12, 22, 22, PAL.wood);
    p.frame(x, 12, 22, 22, PAL.woodDark);
    p.hline(x + 1, 13, 20, PAL.woodLight);
    // Losango decorativo
    p.px(x + 11, 19, PAL.gold);
    p.hline(x + 10, 20, 3, PAL.gold);
    p.hline(x + 9, 21, 5, PAL.amber);
    p.hline(x + 10, 22, 3, PAL.gold);
    p.px(x + 11, 23, PAL.gold);
  }
  p.rect(0, 37, 116, 3, PAL.woodDeep);
  p.vline(2, 8, 30, PAL.woodLight);
  // Livro de receitas aberto e sininho sobre o tampo
  p.rect(14, -1 + 2, 18, 5, PAL.cream);
  p.vline(23, 1, 5, PAL.parchmentDark);
  p.hline(16, 3, 5, PAL.parchmentDark);
  p.hline(25, 3, 5, PAL.parchmentDark);
  p.rect(13, 6, 20, 1, PAL.terracottaDark);
  p.rect(60, 2, 5, 3, PAL.gold);
  p.hline(59, 5, 7, PAL.amber);
  p.px(62, 1, PAL.warm);
  return p.canvas;
}

export function drawRegister(): HTMLCanvasElement {
  const p = painter(22, 18);
  // Visor
  p.rect(12, 0, 8, 6, PAL.copper);
  p.rect(13, 1, 6, 3, PAL.charcoal);
  p.hline(14, 2, 3, PAL.gold);
  // Corpo
  p.rect(1, 5, 20, 9, PAL.copper);
  p.hline(1, 5, 20, PAL.copperHi);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) p.rect(3 + i * 4, 7 + j * 3, 3, 2, PAL.cream);
  // Gaveta
  p.rect(0, 14, 22, 4, '#8a4a28');
  p.hline(0, 14, 22, PAL.charcoal);
  p.rect(9, 15, 4, 1, PAL.gold);
  return p.canvas;
}

// ---------------------------------------------------------------------------
// Sprites pequenos
// ---------------------------------------------------------------------------

export function drawPotion(color: string): HTMLCanvasElement {
  const p = painter(7, 10);
  p.rect(2, 0, 3, 2, '#a0703c'); // rolha
  p.rect(2, 2, 3, 2, '#d8e8e8'); // gargalo
  p.rect(1, 4, 5, 6, '#d8e8e8');
  p.rect(0, 5, 7, 4, '#d8e8e8');
  p.rect(1, 5, 5, 4, color);
  p.rect(1, 9, 5, 1, color);
  p.px(1, 5, '#ffffff');
  p.px(2, 6, '#ffffff');
  return p.canvas;
}

/** Frasco decorativo vazio para preencher as prateleiras. */
export function drawEmptyJar(): HTMLCanvasElement {
  const p = painter(6, 8);
  p.rect(1, 0, 4, 1, PAL.copper);
  p.rect(0, 1, 6, 7, '#6a7a7a');
  p.rect(1, 2, 4, 5, '#4a5858');
  p.px(1, 2, '#9aaaaa');
  return p.canvas;
}

export function drawFire(frame: number): HTMLCanvasElement {
  const p = painter(14, 9);
  const heights = [
    [4, 7, 5, 8, 6, 4, 7],
    [6, 5, 8, 6, 7, 5, 4],
    [5, 8, 6, 5, 8, 6, 5],
  ][frame % 3];
  heights.forEach((h, i) => {
    const x = i * 2;
    p.rect(x, 9 - h, 2, h, PAL.terracotta);
    p.rect(x, 9 - Math.max(1, h - 2), 2, Math.max(1, h - 2), PAL.amber);
    p.rect(x, 9 - Math.max(1, h - 4), 2, Math.max(1, h - 4), PAL.warm);
  });
  return p.canvas;
}

/** Brilho circular quantizado (sem desfoque), usado nas lanternas e no fogo. */
export function drawGlow(radius: number, color: [number, number, number]): HTMLCanvasElement {
  const size = radius * 2;
  const p = painter(size, size);
  const img = p.ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - radius + 0.5, y - radius + 0.5) / radius;
      const level = d >= 1 ? 0 : Math.ceil((1 - d) * 4) / 4; // 4 degraus
      const i = (y * size + x) * 4;
      img.data[i] = color[0];
      img.data[i + 1] = color[1];
      img.data[i + 2] = color[2];
      img.data[i + 3] = Math.round(level * level * 110);
    }
  }
  p.ctx.putImageData(img, 0, 0);
  return p.canvas;
}

export function drawDot(size: number, color: string): HTMLCanvasElement {
  const p = painter(size, size);
  const r = size / 2;
  p.ellipse(Math.floor(r), Math.floor(r), Math.floor(r - 0.5), Math.floor(r - 0.5), color);
  return p.canvas;
}

/** Balão de pensamento com espaço para o ícone do pedido. */
export function drawBubble(): HTMLCanvasElement {
  const p = painter(17, 17);
  p.rect(2, 0, 13, 13, PAL.ink);
  p.rect(0, 2, 17, 9, PAL.ink);
  p.rect(1, 1, 15, 11, PAL.ink);
  p.rect(2, 1, 13, 11, PAL.cream);
  p.rect(1, 2, 15, 9, PAL.cream);
  p.rect(4, 13, 3, 2, PAL.ink);
  p.px(5, 13, PAL.cream);
  p.rect(2, 15, 2, 2, PAL.ink);
  return p.canvas;
}

/** Seta de seleção sobre o cliente. */
export function drawMarker(): HTMLCanvasElement {
  const p = painter(7, 5);
  p.hline(0, 0, 7, PAL.ink);
  p.hline(1, 1, 5, PAL.gold);
  p.hline(2, 2, 3, PAL.gold);
  p.px(3, 3, PAL.gold);
  p.px(0, 1, PAL.ink);
  p.px(6, 1, PAL.ink);
  p.px(1, 2, PAL.ink);
  p.px(5, 2, PAL.ink);
  p.px(2, 3, PAL.ink);
  p.px(4, 3, PAL.ink);
  p.px(3, 4, PAL.ink);
  return p.canvas;
}

export function drawCoin(): HTMLCanvasElement {
  const p = painter(7, 7);
  p.ellipse(3, 3, 3, 3, PAL.amber);
  p.ellipse(3, 3, 2, 2, PAL.gold);
  p.vline(3, 2, 3, PAL.amber);
  p.px(2, 1, PAL.warm);
  return p.canvas;
}

// ---------------------------------------------------------------------------
// Reações, efeitos e melhorias
// ---------------------------------------------------------------------------

export function drawHeart(): HTMLCanvasElement {
  const p = painter(7, 6);
  const rows = ['.xx.xx.', 'xhxxxxx', 'xxxxxxx', '.xxxxx.', '..xxx..', '...x...'];
  rows.forEach((r, y) => [...r].forEach((c, x) => c !== '.' && p.px(x, y, c === 'h' ? '#ffb0c0' : '#e0485a')));
  return p.canvas;
}

export function drawAngry(): HTMLCanvasElement {
  const p = painter(7, 7);
  const rows = ['.x...x.', 'xx...xx', '.......', '.......', '.......', 'xx...xx', '.x...x.'];
  rows.forEach((r, y) => [...r].forEach((c, x) => c !== '.' && p.px(x, y, PAL.terracotta)));
  p.px(3, 3, PAL.terracotta);
  return p.canvas;
}

export function drawSad(): HTMLCanvasElement {
  const p = painter(5, 7);
  const rows = ['..x..', '..x..', '.xxx.', '.xxx.', 'xxhxx', 'xxxxx', '.xxx.'];
  rows.forEach((r, y) => [...r].forEach((c, x) => c !== '.' && p.px(x, y, c === 'h' ? '#cfe8ff' : '#5a8ad0')));
  return p.canvas;
}

export function drawSparkle(): HTMLCanvasElement {
  const p = painter(5, 5);
  p.px(2, 0, PAL.warm);
  p.hline(1, 2, 3, PAL.warm);
  p.hline(0, 2, 5, PAL.gold);
  p.vline(2, 0, 5, PAL.gold);
  p.px(2, 2, '#ffffff');
  return p.canvas;
}

/** Superfície do líquido do caldeirão (branca, tingida pela cor da receita). */
export function drawLiquid(): HTMLCanvasElement {
  const p = painter(33, 7);
  p.ellipse(16, 3, 16, 3, '#ffffff');
  return p.canvas;
}

export function drawCauldronBands(): HTMLCanvasElement {
  const p = painter(48, 48);
  for (const y of [16, 26]) {
    for (let x = 0; x < 48; x++) {
      const dx = (x - 24) / 17.5;
      if (Math.abs(dx) > 1) continue;
      const yy = y + Math.round(Math.sqrt(1 - dx * dx) * 2);
      p.px(x, yy, PAL.copper);
      p.px(x, yy - 1, PAL.copperHi);
    }
  }
  p.rect(22, 18, 4, 4, PAL.gold);
  return p.canvas;
}

export function drawCabinetLabels(): HTMLCanvasElement {
  const p = painter(40, 98);
  for (let i = 0; i < 3; i++) {
    const y = 62 + i * 11;
    p.rect(7, y + 2, 8, 5, PAL.parchment);
    p.hline(8, y + 4, 6, PAL.parchmentDark);
    p.rect(25, y + 2, 8, 5, PAL.parchment);
    p.hline(26, y + 4, 6, PAL.parchmentDark);
  }
  for (const sy of [24, 41, 57]) {
    p.px(10, sy - 1, PAL.gold);
    p.px(30, sy - 1, PAL.gold);
  }
  return p.canvas;
}

/** Placa pintada pendurada na viga, sobre a porta. */
export function drawShopSign(): HTMLCanvasElement {
  const p = painter(40, 18);
  p.vline(6, 0, 4, PAL.charcoal);
  p.vline(33, 0, 4, PAL.charcoal);
  p.rect(0, 4, 40, 14, PAL.woodDark);
  p.rect(1, 5, 38, 12, PAL.blueDeep);
  p.frame(2, 6, 36, 10, PAL.gold);
  // Frasco estilizado no centro e estrelinhas
  p.rect(18, 7, 4, 2, PAL.cream);
  p.rect(17, 9, 6, 5, PAL.teal);
  p.px(18, 10, '#ffffff');
  for (const [x, y] of [[7, 9], [11, 12], [28, 9], [32, 12]]) p.px(x, y, PAL.gold);
  return p.canvas;
}

/** Expositor de chão (melhoria "Expositor de poções"). */
export function drawDisplayStand(): HTMLCanvasElement {
  const p = painter(44, 30);
  p.rect(0, 8, 44, 4, PAL.woodHi);
  p.hline(0, 8, 44, '#d8a466');
  p.rect(2, 12, 40, 14, PAL.woodMid);
  p.frame(2, 12, 40, 14, PAL.woodDark);
  p.rect(6, 15, 32, 8, PAL.terracotta);
  p.frame(6, 15, 32, 8, PAL.gold);
  p.rect(2, 26, 4, 4, PAL.woodDark);
  p.rect(38, 26, 4, 4, PAL.woodDark);
  return p.canvas;
}

/** Cordão de luzes (melhoria "Iluminação aconchegante"). Retorna também as posições das lâmpadas. */
export const GARLAND_BULBS: { x: number; y: number; color: string }[] = (() => {
  const colors = ['#ffd27a', '#ff9ab0', '#9ae0ff', '#c8ff9a', '#e0b0ff'];
  const out: { x: number; y: number; color: string }[] = [];
  for (let x = 28; x < 360; x += 12) {
    const t = ((x - 28) % 96) / 96;
    out.push({ x, y: 14 + Math.round(Math.sin(t * Math.PI) * 7), color: colors[out.length % colors.length] });
  }
  return out;
})();

export function drawGarland(): HTMLCanvasElement {
  const p = painter(384, 26);
  for (let x = 28; x < 356; x++) {
    const t = ((x - 28) % 96) / 96;
    p.px(x, 13 + Math.round(Math.sin(t * Math.PI) * 7), PAL.moss);
  }
  for (const b of GARLAND_BULBS) {
    p.rect(b.x - 1, b.y, 3, 3, b.color);
    p.px(b.x, b.y - 1, PAL.charcoal);
  }
  return p.canvas;
}

export function drawBadge(): HTMLCanvasElement {
  const p = painter(9, 11);
  p.ellipse(4, 4, 4, 4, PAL.ink);
  p.ellipse(4, 4, 3, 3, PAL.gold);
  p.vline(4, 2, 3, PAL.ink);
  p.px(4, 6, PAL.ink);
  p.rect(3, 8, 3, 1, PAL.ink);
  p.px(4, 9, PAL.ink);
  return p.canvas;
}
