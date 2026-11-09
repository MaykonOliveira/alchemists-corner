import Phaser from 'phaser';
import type { CustomerArchetype } from '../../../domain/models/types';

export const DOOR_X = 321;
export const DOOR_Y = 113;
const AISLE_Y = 122;
const COUNTER_Y = 133;
const WALK_SPEED = 36; // px por segundo

export type Mood = 'feliz' | 'bravo' | 'triste' | 'neutro';

/**
 * Representação visual de um cliente. O estado real (paciência, pedido, orçamento)
 * vive no store; esta classe só anima: entrar, esperar no balcão, reagir e sair.
 */
export class Visitor {
  readonly sprite: Phaser.GameObjects.Sprite;
  private readonly bubble: Phaser.GameObjects.Container;
  private readonly bubbleIcon: Phaser.GameObjects.Image;
  private readonly marker: Phaser.GameObjects.Image;
  private readonly patience: Phaser.GameObjects.Graphics;
  private arrived = false;
  leaving = false;
  private patienceRatio = 1;
  private hasOffer = false;
  private selected = false;

  constructor(
    private readonly scene: Phaser.Scene,
    readonly id: string,
    readonly archetype: CustomerArchetype,
    private readonly wantedRecipeId: string,
    public slotX: number,
    private readonly opts: { reduceMotion: () => boolean; onClick: (v: Visitor) => void; instant?: boolean; regular?: boolean },
  ) {
    const key = `customer-${archetype}`;
    this.sprite = scene.add.sprite(DOOR_X, DOOR_Y, key, 0).setOrigin(0.5, 1).setAlpha(0);
    this.sprite.setInteractive({ useHandCursor: true, pixelPerfect: true });
    this.sprite.on('pointerup', () => !this.leaving && this.opts.onClick(this));

    const bg = scene.add.image(0, 0, 'bubble').setOrigin(0.5, 1);
    this.bubbleIcon = scene.add.image(0, -9, `potion-${wantedRecipeId}`).setOrigin(0.5, 0.5);
    this.bubble = scene.add.container(0, 0, [bg, this.bubbleIcon]).setVisible(false);
    // Freguês fiel: um coraçãozinho no canto do balão.
    if (opts.regular) this.bubble.add(scene.add.image(8, -17, 'heart').setOrigin(0.5, 0.5));
    bg.setInteractive({ useHandCursor: true }).on('pointerup', () => !this.leaving && this.opts.onClick(this));
    this.marker = scene.add.image(0, 0, 'marker').setOrigin(0.5, 1).setVisible(false);
    this.patience = scene.add.graphics().setVisible(false);

    if (opts.instant) {
      this.sprite.setPosition(slotX, COUNTER_Y).setAlpha(1);
      this.onArrive();
    } else {
      this.enter();
    }
  }

  private walkTo(points: { x: number; y: number }[], done: () => void): void {
    const [next, ...rest] = points;
    if (!next) {
      this.sprite.anims.stop();
      this.sprite.setFrame(0);
      return done();
    }
    const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, next.x, next.y);
    if (dist < 0.5) return this.walkTo(rest, done);
    this.sprite.play(`customer-${this.archetype}-walk`, true);
    this.sprite.setFlipX(next.x < this.sprite.x);
    this.scene.tweens.add({
      targets: this.sprite,
      x: next.x,
      y: next.y,
      duration: (dist / WALK_SPEED) * 1000,
      onComplete: () => this.walkTo(rest, done),
    });
  }

  private enter() {
    this.scene.tweens.add({ targets: this.sprite, alpha: 1, duration: 300 });
    this.walkTo([{ x: DOOR_X, y: AISLE_Y }, { x: this.slotX, y: AISLE_Y }, { x: this.slotX, y: COUNTER_Y }], () => this.onArrive());
  }

  private onArrive() {
    if (this.leaving) return;
    if (Math.abs(this.sprite.x - this.slotX) > 0.5) {
      this.walkTo([{ x: this.slotX, y: COUNTER_Y }], () => this.onArrive());
      return;
    }
    this.arrived = true;
    this.sprite.setFlipX(false);
    this.bubble.setVisible(true).setScale(this.opts.reduceMotion() ? 1 : 0.4);
    this.patience.setVisible(true);
    this.setSelected(this.selected);
    if (!this.opts.reduceMotion()) this.scene.tweens.add({ targets: this.bubble, scale: 1, duration: 180, ease: 'Back.Out' });
  }

  /** Move o cliente para outra posição no balcão (quando a fila anda). */
  moveToSlot(x: number) {
    if (x === this.slotX || this.leaving) return;
    this.slotX = x;
    if (!this.arrived) return; // ainda entrando: o caminho atual termina no slot antigo; ajusta ao chegar
    this.scene.tweens.killTweensOf(this.sprite);
    this.walkTo([{ x, y: COUNTER_Y }], () => this.sprite.setFlipX(false));
  }

  setPatience(ratio: number, hasOffer: boolean) {
    this.patienceRatio = Phaser.Math.Clamp(ratio, 0, 1);
    if (hasOffer !== this.hasOffer) {
      this.hasOffer = hasOffer;
      this.bubbleIcon.setTexture(hasOffer ? 'coin' : `potion-${this.wantedRecipeId}`);
    }
  }

  setSelected(selected: boolean) {
    this.selected = selected;
    // A setinha só aparece com o cliente no balcão (entrando, ela flutuava em cima do letreiro da porta).
    this.marker.setVisible(selected && this.arrived && !this.leaving);
  }

  /** Reage (coração, raiva, tristeza) e sai pela porta. */
  leave(mood: Mood, onGone: () => void) {
    if (this.leaving) return;
    this.leaving = true;
    this.bubble.setVisible(false);
    this.patience.setVisible(false);
    this.marker.setVisible(false);
    this.sprite.disableInteractive();
    this.scene.tweens.killTweensOf(this.sprite);

    const icon = { feliz: 'heart', bravo: 'angry', triste: 'sad', neutro: null }[mood];
    if (icon) {
      const r = this.scene.add.image(this.sprite.x, this.sprite.y - 42, icon).setDepth(950);
      this.scene.tweens.add({
        targets: r,
        y: r.y - (this.opts.reduceMotion() ? 0 : 10),
        alpha: { from: 1, to: 0 },
        delay: 500,
        duration: 900,
        onComplete: () => r.destroy(),
      });
    }

    const go = () =>
      this.walkTo([{ x: this.sprite.x, y: AISLE_Y }, { x: DOOR_X, y: AISLE_Y }, { x: DOOR_X, y: DOOR_Y }], () => {
        this.scene.tweens.add({ targets: this.sprite, alpha: 0, duration: 250, onComplete: () => { this.destroy(); onGone(); } });
      });
    this.scene.time.delayedCall(mood === 'feliz' ? 450 : 250, go);
  }

  update(time: number) {
    const s = this.sprite;
    s.setDepth(s.y);
    const bob = this.opts.reduceMotion() ? 0 : Math.round(Math.sin(time / 300 + s.x) * 1);
    // Humor: quando a paciência acaba, o balão alterna entre o pedido e uma carinha zangada.
    if (this.arrived && !this.leaving && !this.hasOffer) {
      const cranky = this.patienceRatio < 0.35 && Math.floor(time / 650) % 2 === 1;
      const want = cranky ? 'angry' : `potion-${this.wantedRecipeId}`;
      if (this.bubbleIcon.texture.key !== want) this.bubbleIcon.setTexture(want);
    }
    const shake = this.arrived && !this.leaving && this.patienceRatio < 0.2 && !this.opts.reduceMotion() ? Math.round(Math.sin(time / 45)) * 0.5 : 0;
    const bx = Math.round(s.x + 10 + shake);
    const by = Math.round(s.y - 38 + bob);
    this.bubble.setPosition(bx, by).setDepth(900);
    this.marker.setPosition(Math.round(s.x), Math.round(s.y - 42 + bob)).setDepth(901);
    if (this.bubble.visible) this.marker.setX(Math.round(s.x - 7));

    // Barrinha de paciência sob o balão: verde → âmbar → terracota
    const g = this.patience;
    g.clear().setDepth(902);
    if (!g.visible) return;
    const w = 13;
    const filled = Math.max(1, Math.round(w * this.patienceRatio));
    const color = this.patienceRatio > 0.5 ? 0x6fbf5a : this.patienceRatio > 0.25 ? 0xe0a040 : 0xc0503a;
    g.fillStyle(0x1c1216, 1).fillRect(bx - 7, by + 1, w + 2, 3);
    g.fillStyle(color, 1).fillRect(bx - 6, by + 2, filled, 1);
  }

  destroy() {
    this.scene.tweens.killTweensOf(this.sprite);
    this.sprite.destroy();
    this.bubble.destroy();
    this.marker.destroy();
    this.patience.destroy();
  }
}
