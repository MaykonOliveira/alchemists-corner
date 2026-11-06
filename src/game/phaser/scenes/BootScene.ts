import Phaser from 'phaser';
import { ARCHETYPES } from '../../../domain/data/customers';
import { RECIPES } from '../../../domain/data/recipes';
import type { CustomerArchetype } from '../../../domain/models/types';
import { CUSTOMER_FRAMES, CUSTOMER_H, CUSTOMER_W, drawCustomerSheet } from '../art/customers';
import { outlineOf } from '../art/painter';
import {
  drawBoard, drawBubble, drawCabinet, drawCauldron, drawCoin, drawCounter, drawDoor, drawDot, drawEmptyJar,
  drawFire, drawGlow, drawMarker, drawPotion, drawRegister, drawRoom, drawShelf, drawSign,
} from '../art/shop';

/**
 * Gera as texturas do jogo. Nesta fase toda a arte é desenhada em código;
 * quando houver spritesheets do Aseprite, eles serão carregados aqui com this.load.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    const add = (key: string, canvas: HTMLCanvasElement, outline = false) => {
      if (this.textures.exists(key)) return;
      this.textures.addCanvas(key, canvas);
      if (outline) this.textures.addCanvas(`${key}-outline`, outlineOf(canvas));
    };

    add('room', drawRoom());
    add('obj-cabinet', drawCabinet(), true);
    add('obj-cauldron', drawCauldron(), true);
    add('obj-shelf', drawShelf(), true);
    add('obj-board', drawBoard(), true);
    add('obj-door', drawDoor(), true);
    add('obj-counter', drawCounter(), true);
    add('obj-register', drawRegister(), true);
    add('sign-open', drawSign(true));
    add('sign-closed', drawSign(false));
    add('jar', drawEmptyJar());
    add('bubble', drawBubble());
    add('marker', drawMarker());
    add('coin', drawCoin());
    add('glow-warm', drawGlow(24, [255, 200, 110]));
    add('glow-fire', drawGlow(18, [255, 140, 60]));
    add('dot-bubble', drawDot(3, '#8ae0c8'));
    add('dot-steam', drawDot(5, '#f3e6c8'));
    for (let f = 0; f < 3; f++) add(`fire-${f}`, drawFire(f));
    for (const r of RECIPES) add(`potion-${r.id}`, drawPotion(r.color));

    for (const id of Object.keys(ARCHETYPES) as CustomerArchetype[]) {
      const key = `customer-${id}`;
      if (!this.textures.exists(key)) {
        const tex = this.textures.addCanvas(key, drawCustomerSheet(id))!;
        for (let f = 0; f < CUSTOMER_FRAMES; f++) tex.add(f, 0, f * CUSTOMER_W, 0, CUSTOMER_W, CUSTOMER_H);
      }
      if (!this.anims.exists(`${key}-walk`)) {
        this.anims.create({ key: `${key}-walk`, frames: [{ key, frame: 1 }, { key, frame: 0 }, { key, frame: 2 }, { key, frame: 0 }], frameRate: 8, repeat: -1 });
      }
    }

    this.scene.start('Shop');
  }
}
