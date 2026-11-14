// Primeira página da Gazeta da Vila (pacote E5) como imagem 1080×1350, para mandar a amigos.
import type { GameSave } from '../../domain/models/types';
import { snapshotScene } from '../../game/gameRef';
import { GAME_URL } from '../share/giftCode';
import type { GazetteStory } from './GazettePanel';

import { GAME_NAME, tr } from '../../i18n';

const W = 1080;
const H = 1350;

/** Quebra o texto em linhas que cabem na largura. */
function wrap(g: CanvasRenderingContext2D, text: string, width: number): string[] {
  const out: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (g.measureText(next).width > width && line) {
      out.push(line);
      line = word;
    } else line = next;
  }
  if (line) out.push(line);
  return out;
}

export async function drawGazette(save: GameSave, headline: GazetteStory, stories: GazetteStory[], day: number): Promise<Blob | null> {
  await document.fonts?.load('40px "Pixelify Sans"').catch(() => undefined);
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const g = cv.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  const pixel = '"Pixelify Sans", monospace';
  const serif = 'Georgia, "Times New Roman", serif';
  const ink = '#2b1d14';

  // Papel de jornal envelhecido.
  g.fillStyle = '#f1e4c4';
  g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(160, 120, 70, 0.08)';
  for (let i = 0; i < 400; i++) g.fillRect((i * 263) % W, (i * 149) % H, 3, 3);

  // Cabeçalho.
  g.fillStyle = ink;
  g.textAlign = 'center';
  g.font = `72px ${pixel}`;
  g.fillText(tr('Gazeta da Vila'), W / 2, 110);
  g.font = `26px ${serif}`;
  g.fillText(tr('Edição do dia {0}', day + 1) + ' · ' + save.shopName, W / 2, 156);
  g.fillRect(60, 178, W - 120, 6);
  g.fillRect(60, 190, W - 120, 2);

  // Manchete.
  g.font = `bold 54px ${serif}`;
  let y = 262;
  for (const l of wrap(g, headline.title, W - 140)) {
    g.fillText(l, W / 2, y);
    y += 62;
  }

  // Foto da loja em sépia leve.
  const shot = await snapshotScene();
  const pw = W - 160;
  const ph = Math.round((pw * 216) / 384);
  if (shot) {
    g.drawImage(shot, 80, y, pw, ph);
    g.fillStyle = 'rgba(200, 160, 90, 0.18)';
    g.fillRect(80, y, pw, ph);
  }
  g.strokeStyle = ink;
  g.lineWidth = 4;
  g.strokeRect(80, y, pw, ph);
  y += ph + 50;

  g.fillStyle = ink;
  g.textAlign = 'left';
  g.font = `28px ${serif}`;
  for (const l of wrap(g, headline.text, W - 160)) {
    g.fillText(l, 80, y);
    y += 36;
  }
  y += 14;

  // Notícias em duas colunas.
  const colW = (W - 200) / 2;
  let col = 0;
  let cy = y;
  for (const st of stories.slice(0, 4)) {
    const x = 80 + col * (colW + 40);
    g.font = `bold 28px ${serif}`;
    let yy = cy;
    for (const l of wrap(g, st.title, colW)) {
      g.fillText(l, x, yy);
      yy += 34;
    }
    g.font = `22px ${serif}`;
    for (const l of wrap(g, st.text, colW).slice(0, 3)) {
      g.fillText(l, x, yy);
      yy += 28;
    }
    if (col === 1) cy = Math.max(cy, yy) + 24;
    col = 1 - col;
  }

  g.textAlign = 'center';
  g.font = `24px ${pixel}`;
  g.fillText(`${GAME_NAME} · ${GAME_URL}`, W / 2, H - 50);
  return new Promise((ok) => cv.toBlob((b) => ok(b), 'image/png'));
}
