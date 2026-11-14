// Apoio ao visual vetorial: texturas em alta resolução usadas nas mesmas medidas lógicas do pixel art.
import Phaser from 'phaser';
import { VECTOR } from '../../../app/skin';
import { ART_SCALE } from './sprites';

let renderScale = 1;
/** Pixels do canvas por unidade do mundo (definido ao criar o jogo). */
export const setRenderScale = (r: number) => { renderScale = r; };
export const getRenderScale = () => renderScale;

/**
 * Faz uma textura de `scale`× se comportar como se tivesse o tamanho lógico: os quadros passam a medir
 * largura/scale × altura/scale (posição, origem e escala dos objetos não mudam) e continuam cobrindo a imagem inteira.
 * Vale para o renderizador WebGL, que desenha pelo tamanho do quadro e pelas coordenadas de textura.
 */
export function logicalize(tex: Phaser.Textures.Texture, scale = ART_SCALE) {
  const data = tex.customData as { logical?: boolean };
  if (scale === 1 || data.logical) return;
  for (const src of tex.source) {
    src.width /= scale;
    src.height /= scale;
  }
  for (const frame of Object.values(tex.frames)) {
    frame.setSize(frame.cutWidth / scale, frame.cutHeight / scale, frame.cutX / scale, frame.cutY / scale);
  }
  data.logical = true;
}

/** Opções de toque de um objeto da cena: no pixel art o toque é pixel a pixel; no vetor, pelo desenho em alta resolução. */
export function touchable(scene: Phaser.Scene, key: string): Phaser.Types.Input.InputConfiguration {
  if (!VECTOR) return { useHandCursor: true, pixelPerfect: true };
  const alpha = alphaMap(scene, key);
  return {
    useHandCursor: true,
    hitArea: {},
    hitAreaCallback: (_area: unknown, x: number, y: number, go: Phaser.GameObjects.GameObject) => {
      const img = go as Phaser.GameObjects.Image;
      const a = img.texture.key === key ? alpha : alphaMap(scene, img.texture.key);
      if (!a) return x >= 0 && y >= 0 && x <= img.width && y <= img.height;
      const px = Math.floor((x + img.frame.cutX) * a.s);
      const py = Math.floor((y + img.frame.cutY) * a.s);
      if (px < 0 || py < 0 || px >= a.w || py >= a.h) return false;
      return a.data[(py * a.w + px) * 4 + 3] > 24;
    },
  };
}

interface Alpha { data: Uint8ClampedArray; w: number; h: number; s: number }
const alphaCache = new Map<string, Alpha | null>();

function alphaMap(scene: Phaser.Scene, key: string): Alpha | null {
  if (alphaCache.has(key)) return alphaCache.get(key)!;
  let out: Alpha | null = null;
  const img = scene.textures.get(key).getSourceImage() as HTMLCanvasElement | HTMLImageElement;
  try {
    const w = img.width;
    const h = img.height;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(img, 0, 0);
    out = { data: ctx.getImageData(0, 0, w, h).data, w, h, s: ART_SCALE };
  } catch { /* sem leitura de pixels: o toque vale no retângulo do desenho */ }
  alphaCache.set(key, out);
  return out;
}

/** Texto dos avisos flutuantes ("+18", "-1 REP") no visual vetorial: letra arredondada com contorno, em alta resolução. */
export function roundText(text: string, color: string, outline = '#3a2233'): HTMLCanvasElement {
  const s = ART_SCALE;
  const size = 8 * s;
  const font = `800 ${size}px "Baloo 2", "Nunito", system-ui, sans-serif`;
  const c = document.createElement('canvas');
  let ctx = c.getContext('2d')!;
  ctx.font = font;
  const w = Math.ceil(ctx.measureText(text).width / s) + 3;
  c.width = w * s;
  c.height = 11 * s;
  ctx = c.getContext('2d')!;
  ctx.font = font;
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 2.2 * s;
  ctx.strokeStyle = outline;
  ctx.strokeText(text, 1.5 * s, 5.8 * s);
  ctx.fillStyle = color;
  ctx.fillText(text, 1.5 * s, 5.8 * s);
  return c;
}
