import Phaser from 'phaser';
import { ARCHETYPES } from '../../../domain/data/customers';
import type { CustomerArchetype } from '../../../domain/models/types';
import { CUSTOMER_FRAMES, CUSTOMER_H, CUSTOMER_URLS, CUSTOMER_W, ROOM_URL, SHOP_ATLAS } from '../art/sprites';

/**
 * Carrega os spritesheets do jogo (src/assets/sprites, gerados a partir de art/).
 * Cada quadro do atlas da loja vira uma textura com o próprio nome ('obj-cabinet', 'potion-cura-simples'…),
 * para que a cena use chaves simples.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    if (!this.textures.exists('room')) this.load.image('room', ROOM_URL);
    if (!this.textures.exists('shop-atlas')) this.load.atlas('shop-atlas', SHOP_ATLAS.url, SHOP_ATLAS.data);
    for (const id of Object.keys(ARCHETYPES) as CustomerArchetype[]) {
      const key = `customer-${id}`;
      if (!this.textures.exists(key)) {
        this.load.spritesheet(key, CUSTOMER_URLS[id], { frameWidth: CUSTOMER_W, frameHeight: CUSTOMER_H, endFrame: CUSTOMER_FRAMES - 1 });
      }
    }
  }

  create() {
    const atlas = this.textures.get('shop-atlas');
    for (const name of atlas.getFrameNames()) {
      if (this.textures.exists(name)) continue;
      const frame = atlas.get(name);
      const tex = this.textures.createCanvas(name, frame.cutWidth, frame.cutHeight)!;
      tex.drawFrame('shop-atlas', name);
      tex.refresh();
    }

    for (const id of Object.keys(ARCHETYPES) as CustomerArchetype[]) {
      const key = `customer-${id}`;
      if (!this.anims.exists(`${key}-walk`)) {
        this.anims.create({ key: `${key}-walk`, frames: [{ key, frame: 1 }, { key, frame: 0 }, { key, frame: 2 }, { key, frame: 0 }], frameRate: 8, repeat: -1 });
      }
    }

    this.scene.start('Shop');
  }
}
