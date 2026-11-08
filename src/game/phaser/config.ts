import Phaser from 'phaser';
import { WORLD_H, WORLD_W } from './art/sprites';
import { BootScene } from './scenes/BootScene';
import { ShopScene } from './scenes/ShopScene';

export function createGameConfig(parent: HTMLElement, zoom: number): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: WORLD_W,
    height: WORLD_H,
    zoom,
    pixelArt: true, // sem suavização: pixels nítidos em escala inteira
    roundPixels: true,
    backgroundColor: '#1c1216',
    banner: false,
    audio: { noAudio: true },
    scale: { mode: Phaser.Scale.NONE },
    // Só toques no próprio canvas contam (cliques em janelas e cartões por cima da cena não acionam objetos).
    input: { windowEvents: false },
    scene: [BootScene, ShopScene],
  };
}
