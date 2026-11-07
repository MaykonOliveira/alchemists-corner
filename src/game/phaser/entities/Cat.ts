import Phaser from 'phaser';
import { useGameStore } from '../../../store/gameStore';

/** Lugares do chão onde o gato gosta de parar (pés do sprite, mundo lógico 384×216). */
const SPOTS = [
  { x: 150, y: 208 }, { x: 196, y: 212 }, { x: 250, y: 206 }, { x: 290, y: 212 }, { x: 340, y: 210 }, { x: 118, y: 212 },
];
/** Cantinho do tapete onde ele dorme. */
const BED = { x: 212, y: 204 };

type Mode = 'sit' | 'walk' | 'sleep';

/**
 * O gato da loja: passeia pelo chão, senta, pisca e dorme à noite.
 * Um toque faz carinho (comando PET_CAT); a sorte do dia é regra do domínio.
 */
export class CatView {
  private sprite: Phaser.GameObjects.Image;
  private outline: Phaser.GameObjects.Image;
  private zz: Phaser.GameObjects.Image;
  private mode: Mode = 'sit';
  private nextAt = 0;
  private happyUntil = 0;
  private walkTween: Phaser.Tweens.Tween | null = null;
  private spot = SPOTS[2];

  constructor(private readonly scene: Phaser.Scene, private readonly reduceMotion: () => boolean) {
    this.outline = scene.add.image(0, 0, 'cat-sit-0-outline').setOrigin(0.5, 1).setVisible(false);
    this.sprite = scene.add.image(0, 0, 'cat-sit-0').setOrigin(0.5, 1);
    this.zz = scene.add.image(0, 0, 'zz').setDepth(980).setVisible(false);
    this.place(this.spot.x, this.spot.y);
    this.sprite.setInteractive({ useHandCursor: true, pixelPerfect: true });
    this.sprite.on('pointerover', () => {
      this.outline.setVisible(true);
      this.store.dispatch({ type: 'SET_HOVER', hover: { id: 'cat', label: 'Gato da loja (faça carinho)', x: this.sprite.x, y: this.sprite.y - this.sprite.height } });
    });
    this.sprite.on('pointerout', () => {
      this.outline.setVisible(false);
      if (this.store.ui.hover?.id === 'cat') this.store.dispatch({ type: 'SET_HOVER', hover: null });
    });
    this.sprite.on('pointerup', () => this.pet());
  }

  private get store() {
    return useGameStore.getState();
  }

  private place(x: number, y: number) {
    this.sprite.setPosition(x, y).setDepth(y + 0.3);
    this.outline.setPosition(x, y + 1).setDepth(y + 0.2);
    this.zz.setPosition(x + 8, y - 12);
  }

  private setFrame(tex: string) {
    if (this.sprite.texture.key !== tex) {
      this.sprite.setTexture(tex);
      this.outline.setTexture(`${tex}-outline`);
    }
    this.outline.setFlipX(this.sprite.flipX);
  }

  private pet() {
    this.store.dispatch({ type: 'PET_CAT' });
    this.walkTween?.stop();
    this.walkTween = null;
    this.mode = 'sit';
    this.happyUntil = this.scene.game.loop.time + 1400;
    this.nextAt = this.scene.game.loop.time + 3000;
    if (this.reduceMotion()) return;
    for (let i = 0; i < 3; i++) {
      const h = this.scene.add.image(this.sprite.x + Phaser.Math.Between(-6, 6), this.sprite.y - 14, 'heart').setDepth(985);
      this.scene.tweens.add({ targets: h, y: h.y - 16 - i * 4, alpha: 0, delay: i * 140, duration: 900, ease: 'Sine.Out', onComplete: () => h.destroy() });
    }
    this.scene.tweens.add({ targets: this.sprite, scaleY: { from: 0.9, to: 1 }, duration: 220, ease: 'Back.Out' });
  }

  private walkTo(to: { x: number; y: number }) {
    const from = { x: this.sprite.x, y: this.sprite.y };
    const dist = Phaser.Math.Distance.Between(from.x, from.y, to.x, to.y);
    if (dist < 4) return;
    this.mode = 'walk';
    this.sprite.setFlipX(to.x < from.x);
    this.walkTween = this.scene.tweens.add({
      targets: from, x: to.x, y: to.y, duration: dist * 45, ease: 'Linear',
      onUpdate: () => this.place(from.x, from.y),
      onComplete: () => {
        this.mode = 'sit';
        this.walkTween = null;
        this.spot = to;
      },
    });
  }

  update(time: number) {
    const save = this.store.save;
    if (!save) return;
    const night = save.phase === 'fechamento';
    // À noite (loja fechada) ele vai para o tapete e dorme.
    if (night && this.mode !== 'sleep') {
      if (this.mode !== 'walk') {
        if (Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, BED.x, BED.y) < 4) this.mode = 'sleep';
        else if (this.reduceMotion()) { this.place(BED.x, BED.y); this.mode = 'sleep'; }
        else this.walkTo(BED);
      }
    } else if (!night && this.mode === 'sleep') {
      this.mode = 'sit';
      this.nextAt = time + 2000;
    }

    if (this.mode === 'walk') this.setFrame(`cat-walk-${Math.floor(time / 160) % 2}`);
    else if (this.mode === 'sleep') this.setFrame('cat-sleep');
    else {
      const blink = time < this.happyUntil || time % 3200 < 180;
      this.setFrame(blink ? 'cat-sit-1' : 'cat-sit-0');
    }
    this.zz.setVisible(this.mode === 'sleep');
    if (this.mode === 'sleep' && !this.reduceMotion()) this.zz.setY(this.sprite.y - 12 - Math.sin(time / 500) * 2);

    // De dia, de vez em quando ele muda de lugar (ou tira um cochilo curto).
    if (!night && this.mode === 'sit' && time > this.nextAt && !this.reduceMotion()) {
      this.nextAt = time + Phaser.Math.Between(6000, 12000);
      const options = SPOTS.filter((p) => p !== this.spot);
      this.walkTo(options[Phaser.Math.Between(0, options.length - 1)]);
    }
  }
}
