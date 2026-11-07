// Texto pixelado dinâmico (números flutuantes como "+18").
// A arte do jogo em si vem dos spritesheets em src/assets/sprites (fontes em art/).

export interface Painter {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  rect(x: number, y: number, w: number, h: number, color: string): void;
  px(x: number, y: number, color: string): void;
  hline(x: number, y: number, len: number, color: string): void;
  vline(x: number, y: number, len: number, color: string): void;
  /** Contorno de um retângulo (1px). */
  frame(x: number, y: number, w: number, h: number, color: string): void;
  /** Elipse preenchida, desenhada linha a linha para manter pixels nítidos. */
  ellipse(cx: number, cy: number, rx: number, ry: number, color: string): void;
}

export function painter(w: number, h: number): Painter {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  const rect = (x: number, y: number, rw: number, rh: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(rw), Math.round(rh));
  };
  return {
    canvas, ctx, w, h, rect,
    px: (x, y, c) => rect(x, y, 1, 1, c),
    hline: (x, y, len, c) => rect(x, y, len, 1, c),
    vline: (x, y, len, c) => rect(x, y, 1, len, c),
    frame: (x, y, fw, fh, c) => {
      rect(x, y, fw, 1, c);
      rect(x, y + fh - 1, fw, 1, c);
      rect(x, y, 1, fh, c);
      rect(x + fw - 1, y, 1, fh, c);
    },
    ellipse: (cx, cy, rx, ry, c) => {
      for (let dy = -ry; dy <= ry; dy++) {
        const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry + 0.01))));
        rect(cx - half, cy + dy, half * 2 + 1, 1, c);
      }
    },
  };
}

// Fonte minúscula 3×5 para placas e etiquetas dentro do cenário.
const GLYPHS: Record<string, string[]> = {
  A: ['010', '101', '111', '101', '101'],
  B: ['110', '101', '110', '101', '110'],
  C: ['011', '100', '100', '100', '011'],
  D: ['110', '101', '101', '101', '110'],
  E: ['111', '100', '110', '100', '111'],
  F: ['111', '100', '110', '100', '100'],
  H: ['101', '101', '111', '101', '101'],
  O: ['010', '101', '101', '101', '010'],
  R: ['110', '101', '110', '101', '101'],
  T: ['111', '010', '010', '010', '010'],
  ' ': ['000', '000', '000', '000', '000'],
  '0': ['111', '101', '101', '101', '111'],
  '1': ['010', '110', '010', '010', '111'],
  '2': ['111', '001', '111', '100', '111'],
  '3': ['111', '001', '011', '001', '111'],
  '4': ['101', '101', '111', '001', '001'],
  '5': ['111', '100', '111', '001', '111'],
  '6': ['111', '100', '111', '101', '111'],
  '7': ['111', '001', '010', '010', '010'],
  '8': ['111', '101', '111', '101', '111'],
  '9': ['111', '101', '111', '001', '111'],
  '+': ['000', '010', '111', '010', '000'],
  '-': ['000', '000', '111', '000', '000'],
  '!': ['010', '010', '010', '000', '010'],
  '?': ['111', '001', '011', '000', '010'],
  'N': ['101', '111', '111', '101', '101'],
  'I': ['111', '010', '010', '010', '111'],
  'V': ['101', '101', '101', '101', '010'],
  'L': ['100', '100', '100', '100', '111'],
  'S': ['011', '100', '010', '001', '110'],
  'P': ['110', '101', '110', '100', '100'],
  'M': ['101', '111', '111', '101', '101'],
  'G': ['011', '100', '101', '101', '011'],
  'U': ['101', '101', '101', '101', '111'],
};

export function pixelText(p: Painter, text: string, x: number, y: number, color: string) {
  let cx = x;
  for (const ch of text.toUpperCase()) {
    const g = GLYPHS[ch] ?? GLYPHS[' '];
    g.forEach((row, ry) => [...row].forEach((bit, rx) => bit === '1' && p.px(cx + rx, y + ry, color)));
    cx += 4;
  }
}

export const textWidth = (text: string) => text.length * 4 - 1;

/** Texto pixelado com contorno escuro, para números flutuantes (+18) e avisos. */
export function outlinedText(text: string, color: string, outline = '#1c1216'): HTMLCanvasElement {
  const w = textWidth(text) + 2;
  const p = painter(w, 7);
  for (const [dx, dy] of [[0, 1], [2, 1], [1, 0], [1, 2], [0, 0], [2, 2], [0, 2], [2, 0]]) pixelText(p, text, dx, dy, outline);
  pixelText(p, text, 1, 1, color);
  return p.canvas;
}
