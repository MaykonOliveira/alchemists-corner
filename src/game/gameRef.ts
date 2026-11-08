import type Phaser from 'phaser';

/** Jogo do Phaser em execução (para tirar a foto da loja no cartão de compartilhar). */
let current: Phaser.Game | null = null;
export const setCurrentGame = (g: Phaser.Game | null) => { current = g; };

/** Foto da cena atual como imagem (ou null se o jogo não estiver na tela). */
export function snapshotScene(): Promise<HTMLImageElement | null> {
  const g = current;
  if (!g) return Promise.resolve(null);
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), 1500);
    g.renderer.snapshot((img) => {
      clearTimeout(timer);
      resolve(img instanceof HTMLImageElement ? img : null);
    });
  });
}
