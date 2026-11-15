import Phaser from 'phaser';
import { WORLD_H, WORLD_W } from './art/sprites';
import { BootScene } from './scenes/BootScene';
import { ShopScene } from './scenes/ShopScene';
import { VECTOR } from '../../app/skin';

/**
 * `res` = pixels do canvas por unidade do mundo. No pixel art é 1 (o canvas tem 384×216 e o navegador amplia);
 * no visual vetorial o canvas é maior e a câmera da cena aproxima `res` vezes, para as formas saírem lisas.
 */
export function createGameConfig(parent: HTMLElement, zoom: number, res = 1): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: WORLD_W * res,
    height: WORLD_H * res,
    zoom: zoom / res,
    pixelArt: !VECTOR, // pixel art: sem suavização, pixels nítidos em escala inteira
    antialias: VECTOR,
    roundPixels: !VECTOR,
    backgroundColor: '#1c1216',
    banner: false,
    audio: { noAudio: true },
    scale: { mode: Phaser.Scale.NONE },
    // Só toques no próprio canvas contam (cliques em janelas e cartões por cima da cena não acionam objetos).
    input: { windowEvents: false },
    scene: [BootScene, ShopScene],
  };
}
