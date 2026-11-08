// Cartão da loja (pacote M): uma imagem 1080×1080 com a foto da loja, o nome e os números da partida.
import { RECIPES_BY_ID } from '../../domain/data/recipes';
import type { GameSave } from '../../domain/models/types';
import { masterRank, MAX_LEVEL, reputationTitle } from '../../domain/rules/progression';
import { bestPotion } from '../../domain/rules/retention';
import { seasonOf } from '../../domain/rules/world';
import { snapshotScene } from '../../game/gameRef';
import { GAME_URL } from './giftCode';
import { AWNINGS } from '../../domain/data/catalog';

const SIZE = 1080;

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

export interface CardOptions { challenge?: { week: number; score: number } }

export async function drawShopCard(save: GameSave, opts: CardOptions = {}): Promise<HTMLCanvasElement> {
  await document.fonts?.load('40px "Pixelify Sans"').catch(() => undefined);
  const cv = document.createElement('canvas');
  cv.width = SIZE;
  cv.height = SIZE;
  const g = cv.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  const pixel = '"Pixelify Sans", monospace';
  const awning = AWNINGS.find((a) => a.id === save.awning)?.color ?? '#c8443e';

  // Fundo: noite da loja com brilho.
  const bg = g.createLinearGradient(0, 0, 0, SIZE);
  bg.addColorStop(0, '#2b2350');
  bg.addColorStop(1, '#1c1216');
  g.fillStyle = bg;
  g.fillRect(0, 0, SIZE, SIZE);
  for (let i = 0; i < 70; i++) {
    g.fillStyle = `rgba(255, 240, 200, ${0.15 + ((i * 37) % 10) / 20})`;
    g.fillRect((i * 151) % SIZE, (i * 89) % 300, 4, 4);
  }

  // Toldo listrado no topo, na cor da loja.
  for (let x = 0; x < SIZE; x += 60) {
    g.fillStyle = (x / 60) % 2 ? '#f3e6c8' : awning;
    g.fillRect(x, 0, 60, 70);
    g.beginPath();
    g.arc(x + 30, 70, 30, 0, Math.PI);
    g.fill();
  }

  // Foto da loja.
  const shot = await snapshotScene();
  const px = 60, py = 150, pw = SIZE - 120, ph = Math.round(pw * 216 / 384);
  g.fillStyle = '#3e2619';
  roundRect(g, px - 14, py - 14, pw + 28, ph + 28, 18);
  g.fill();
  if (shot) g.drawImage(shot, px, py, pw, ph);
  else {
    g.fillStyle = '#5a3822';
    g.fillRect(px, py, pw, ph);
  }
  g.strokeStyle = '#f2c95c';
  g.lineWidth = 6;
  g.strokeRect(px - 4, py - 4, pw + 8, ph + 8);

  // Nome da loja numa placa.
  g.font = `700 64px ${pixel}`;
  const name = save.shopName;
  const tw = Math.min(SIZE - 120, g.measureText(name).width + 80);
  g.fillStyle = '#3e2619';
  roundRect(g, (SIZE - tw) / 2, 92, tw, 92, 14);
  g.fill();
  g.strokeStyle = '#dc9256';
  g.lineWidth = 5;
  g.stroke();
  g.fillStyle = '#f2c95c';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(name, SIZE / 2, 140, SIZE - 160);

  // Números da partida.
  const y0 = py + ph + 60;
  const master = save.level >= MAX_LEVEL ? `Mestre ${masterRank(save.xp)}` : `Nível ${save.level}`;
  const best = bestPotion(save);
  const stats: [string, string][] = opts.challenge
    ? [['Desafio da semana', `${opts.challenge.score} pts`], ['Semana', String(opts.challenge.week)], [master, `Dia ${save.day}`]]
    : [[master, `Dia ${save.day}`], ['Reputação', reputationTitle(save.reputation)], ['Poções vendidas', String(save.lifetime.sold)]];
  stats.forEach(([label, value], i) => {
    const x = 60 + i * ((SIZE - 120) / 3);
    const w = (SIZE - 120) / 3 - 20;
    g.fillStyle = 'rgba(240, 226, 191, 0.12)';
    roundRect(g, x, y0, w, 140, 14);
    g.fill();
    g.fillStyle = '#d8d0ff';
    g.font = `500 30px ${pixel}`;
    g.fillText(label, x + w / 2, y0 + 40, w - 20);
    g.fillStyle = '#ffeab0';
    g.font = `700 46px ${pixel}`;
    g.fillText(value, x + w / 2, y0 + 96, w - 20);
  });

  g.font = `500 32px ${pixel}`;
  g.fillStyle = '#f3e6c8';
  const season = seasonOf(save.day);
  g.fillText(`${season.icon} ${season.name}${best ? ` · especialidade: ${RECIPES_BY_ID[best].name}` : ''}`, SIZE / 2, y0 + 200, SIZE - 120);

  g.fillStyle = '#f2c95c';
  g.font = `700 38px ${pixel}`;
  g.fillText("Alchemist's Corner", SIZE / 2, SIZE - 96);
  g.fillStyle = '#a9a3b8';
  g.font = `500 26px ${pixel}`;
  g.fillText(GAME_URL.replace('https://', ''), SIZE / 2, SIZE - 52);
  return cv;
}

export const canvasBlob = (cv: HTMLCanvasElement) => new Promise<Blob | null>((r) => cv.toBlob(r, 'image/png'));
