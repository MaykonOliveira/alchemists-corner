import Phaser from 'phaser';
import type { CustomerArchetype } from '../../../domain/models/types';

export const DOOR_X = 321;
export const DOOR_Y = 113;
const AISLE_Y = 122;
const COUNTER_Y = 133;
const WALK_SPEED = 32; // px por segundo

export type VisitorState = 'entrando' | 'esperando' | 'saindo' | 'removido';

/**
 * Cliente visual: entra pela porta, vai até o balcão, mostra o pedido e sai.
 * Não altera regras de economia; apenas emite callbacks para a cena.
 */
export class Visitor {
  readonly sprite: Phaser.GameObjects.Sprite;
  private readonly bubble: Phaser.GameObjects.Container;
  private readonly marker: Phaser.GameObjects.Image;
  state: VisitorState = 'entrando';
  private waitTimer?: Phaser.Time.TimerEvent;

  constructor(
    private readonly scene: Phaser.Scene,
    readonly id: string,
    readonly archetype: CustomerArchetype,
    readonly wantedRecipeId: string,
    readonly slotX: number,
    private readonly opts: { patienceMs: number; reduceMotion: () => boolean; onClick: (v: Visitor) => void; onGone: (v: Visitor) => void },
  ) {
    const key = `customer-${archetype}`;
    this.sprite = scene.add.sprite(DOOR_X, DOOR_Y, key, 0).setOrigin(0.5, 1).setAlpha(0);
    this.sprite.setInteractive({ useHandCursor: true, pixelPerfect: true });
    this.sprite.on('pointerup', () => this.opts.onClick(this));

    const bg = scene.add.image(0, 0, 'bubble').setOrigin(0.5, 1);
    const icon = scene.add.image(0, -9, `potion-${wantedRecipeId}`).setOrigin(0.5, 0.5);
    this.bubble = scene.add.container(0, 0, [bg, icon]).setVisible(false);
    this.marker = scene.add.image(0, 0, 'marker').setOrigin(0.5, 1).setVisible(false);

    this.enter();
  }

  private walkTo(points: { x: number; y: number }[], done: () => void) {
    const [next, ...rest] = points;
    if (!next) {
      this.sprite.anims.stop();
      this.sprite.setFrame(0);
      return done();
    }
    const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, next.x, next.y);
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
    this.walkTo(
      [{ x: DOOR_X, y: AISLE_Y }, { x: this.slotX, y: AISLE_Y }, { x: this.slotX, y: COUNTER_Y }],
      () => {
        this.state = 'esperando';
        this.sprite.setFlipX(false);
        this.bubble.setVisible(true).setScale(this.opts.reduceMotion() ? 1 : 0.4);
        if (!this.opts.reduceMotion()) this.scene.tweens.add({ targets: this.bubble, scale: 1, duration: 180, ease: 'Back.Out' });
        this.waitTimer = this.scene.time.delayedCall(this.opts.patienceMs, () => this.leave());
      },
    );
  }

  leave() {
    if (this.state === 'saindo' || this.state === 'removido') return;
    this.state = 'saindo';
    this.waitTimer?.remove();
    this.bubble.setVisible(false);
    this.setSelected(false);
    this.walkTo([{ x: this.slotX, y: AISLE_Y }, { x: DOOR_X, y: AISLE_Y }, { x: DOOR_X, y: DOOR_Y }], () => {
      this.scene.tweens.add({
        targets: this.sprite,
        alpha: 0,
        duration: 250,
        onComplete: () => this.destroy(),
      });
    });
  }

  setSelected(selected: boolean) {
    this.marker.setVisible(selected);
  }

  update(time: number) {
    const s = this.sprite;
    s.setDepth(s.y);
    const bob = this.opts.reduceMotion() ? 0 : Math.round(Math.sin(time / 300) * 1);
    this.bubble.setPosition(Math.round(s.x + 10), Math.round(s.y - 34 + bob)).setDepth(900);
    this.marker.setPosition(Math.round(s.x), Math.round(s.y - 36 + bob)).setDepth(901);
    if (this.bubble.visible) this.marker.setX(Math.round(s.x - 6));
  }

  destroy() {
    if (this.state === 'removido') return;
    this.state = 'removido';
    this.waitTimer?.remove();
    this.scene.tweens.killTweensOf(this.sprite);
    this.sprite.destroy();
    this.bubble.destroy();
    this.marker.destroy();
    this.opts.onGone(this);
  }
}
