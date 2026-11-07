import Phaser from 'phaser';
import type { GameEvent, GameSave } from '../../../domain/models/types';
import { APPRENTICE, GOLEM, RAVEN, helperActive } from '../../../domain/rules/helpers';
import { useGameStore } from '../../../store/gameStore';

/** Onde cada ajudante fica na loja (mundo lógico 384×216). */
const PERCH = { x: 4, y: 33 };
const RAVEN_POS = { x: 6, y: 21 };
const WINDOW = { x: 76, y: 46 };
const APPRENTICE_POS = { x: 82, y: 116, depth: 175 };
/** Entre o caldeirão e o balcão, virado para os clientes (o desenho olha para a esquerda e é espelhado). */
const GOLEM_POS = { x: 118, y: 120, depth: 154 };

const LABELS: Record<string, string> = {
  [RAVEN]: 'Corvo entregador',
  [APPRENTICE]: 'Aprendiz de alquimia',
  [GOLEM]: 'Golem balconista',
};

interface HelperSprite {
  id: string;
  sprite: Phaser.GameObjects.Image;
  outline: Phaser.GameObjects.Image;
  zz: Phaser.GameObjects.Image;
  hovered: boolean;
}

/**
 * Representação dos ajudantes automáticos. Só anima: as regras (comprar, preparar, atender)
 * vivem no domínio e chegam aqui como estado do store e eventos.
 */
export class HelperViews {
  private views = new Map<string, HelperSprite>();
  private perch: Phaser.GameObjects.Image | null = null;
  private ravenAway = false;
  private golemServeUntil = 0;
  private hopUntil = 0;

  constructor(private readonly scene: Phaser.Scene, private readonly reduceMotion: () => boolean) {}

  private get store() {
    return useGameStore.getState();
  }

  /** Cria ou remove os sprites de acordo com os ajudantes contratados. */
  sync(save: GameSave) {
    const wanted: [string, { x: number; y: number }, number, string][] = [
      [RAVEN, RAVEN_POS, 141, 'raven-0'],
      [APPRENTICE, APPRENTICE_POS, APPRENTICE_POS.depth, 'apprentice-idle-0'],
      [GOLEM, GOLEM_POS, GOLEM_POS.depth, 'golem-idle-0'],
    ];
    for (const [id, pos, depth, tex] of wanted) {
      const owned = save.upgrades.includes(id);
      const view = this.views.get(id);
      if (owned && !view) this.views.set(id, this.create(id, pos, depth, tex));
      if (!owned && view) {
        view.sprite.destroy(); view.outline.destroy(); view.zz.destroy();
        this.views.delete(id);
      }
    }
    const hasRaven = save.upgrades.includes(RAVEN);
    if (hasRaven && !this.perch) this.perch = this.scene.add.image(PERCH.x, PERCH.y, 'perch').setOrigin(0).setDepth(140);
    if (!hasRaven && this.perch) {
      this.perch.destroy();
      this.perch = null;
    }
  }

  private create(id: string, pos: { x: number; y: number }, depth: number, tex: string): HelperSprite {
    const outline = this.scene.add.image(pos.x - 1, pos.y - 1, `${tex}-outline`).setOrigin(0).setDepth(depth - 0.5).setVisible(false);
    const sprite = this.scene.add.image(pos.x, pos.y, tex).setOrigin(0).setDepth(depth);
    const zz = this.scene.add.image(pos.x + sprite.width - 4, pos.y - 2, 'zz').setDepth(980).setVisible(false);
    if (id === GOLEM) {
      sprite.setFlipX(true);
      outline.setFlipX(true);
    }
    const view: HelperSprite = { id, sprite, outline, zz, hovered: false };
    sprite.setInteractive({ useHandCursor: true, pixelPerfect: true });
    sprite.on('pointerover', () => {
      view.hovered = true;
      outline.setVisible(true);
      this.store.dispatch({ type: 'SET_HOVER', hover: { id: `helper-${id}`, label: LABELS[id], x: sprite.x + sprite.width / 2, y: sprite.y } });
    });
    sprite.on('pointerout', () => {
      view.hovered = false;
      outline.setVisible(false);
      if (this.store.ui.hover?.id === `helper-${id}`) this.store.dispatch({ type: 'SET_HOVER', hover: null });
    });
    sprite.on('pointerup', () => this.store.dispatch({ type: 'OPEN_PANEL', panel: 'upgrades' }));
    // Chegada: um brilho rápido
    if (!this.reduceMotion()) {
      sprite.setAlpha(0);
      this.scene.tweens.add({ targets: sprite, alpha: 1, duration: 500 });
    }
    return view;
  }

  private setFrame(view: HelperSprite, tex: string) {
    if (view.sprite.texture.key === tex) return;
    view.sprite.setTexture(tex);
    view.outline.setTexture(`${tex}-outline`);
  }

  onEvent(e: GameEvent) {
    if (e.type === 'RAVEN_DELIVERY') this.deliver();
    if (e.type === 'SALE' && e.by === 'golem') this.golemServeUntil = this.scene.game.loop.time + 700;
    if (e.type === 'GOLEM_DISMISSED') this.golemServeUntil = 0;
  }

  /** O corvo sai pela janela e volta com uma trouxinha, que cai dentro do armário. */
  private deliver() {
    const view = this.views.get(RAVEN);
    if (!view || this.ravenAway) return;
    if (this.reduceMotion()) return this.sparkle(22, 60);
    this.ravenAway = true;
    view.sprite.setVisible(false);
    view.outline.setVisible(false);
    const bird = this.scene.add.image(RAVEN_POS.x + 8, RAVEN_POS.y + 6, 'raven-fly-0').setDepth(990).setFlipX(false);
    let f = 0;
    const flap = this.scene.time.addEvent({
      delay: 120, loop: true,
      callback: () => {
        f = 1 - f;
        bird.setTexture(`${bird.getData('carry') ? 'raven-carry' : 'raven-fly'}-${f}`);
      },
    });
    this.scene.tweens.chain({
      targets: bird,
      tweens: [
        { x: WINDOW.x, y: WINDOW.y, duration: 700, ease: 'Sine.InOut' },
        { scale: 0.4, alpha: 0, duration: 300 },
        { delay: 900, scale: 1, alpha: 1, duration: 300, onStart: () => { bird.setData('carry', true); bird.setFlipX(true); } },
        { x: RAVEN_POS.x + 8, y: RAVEN_POS.y + 4, duration: 800, ease: 'Sine.InOut' },
      ],
      onComplete: () => {
        flap.remove();
        bird.destroy();
        view.sprite.setVisible(true);
        this.ravenAway = false;
        this.hopUntil = this.scene.game.loop.time + 400;
        const box = this.scene.add.image(22, 40, 'parcel').setDepth(989);
        this.scene.tweens.add({
          targets: box, y: 70, alpha: 0, duration: 600, ease: 'Quad.In',
          onComplete: () => { box.destroy(); this.sparkle(22, 70); },
        });
      },
    });
  }

  private sparkle(x: number, y: number) {
    if (this.reduceMotion()) return;
    for (let i = 0; i < 8; i++) {
      const s = this.scene.add.image(x, y, 'sparkle').setDepth(975);
      const a = (Math.PI * 2 * i) / 8;
      this.scene.tweens.add({ targets: s, x: x + Math.cos(a) * 12, y: y + Math.sin(a) * 12, alpha: 0, scale: 0.4, duration: 600, onComplete: () => s.destroy() });
    }
  }

  update(time: number) {
    const save = this.store.save;
    if (!save) return;
    const calm = this.reduceMotion();
    for (const view of this.views.values()) {
      const on = helperActive(save, view.id);
      const sleeping = !on || save.phase === 'fechamento';
      view.zz.setVisible(sleeping && view.sprite.visible);
      if (sleeping && !calm) view.zz.setY(view.sprite.y - 2 - ((time / 120) % 6));
      if (view.id === RAVEN) {
        if (sleeping) this.setFrame(view, 'raven-1');
        else if (time < this.hopUntil) this.setFrame(view, 'raven-2');
        else this.setFrame(view, !calm && time % 3200 < 160 ? 'raven-1' : !calm && time % 5000 > 4700 ? 'raven-2' : 'raven-0');
      } else if (view.id === APPRENTICE) {
        if (sleeping) this.setFrame(view, 'apprentice-nap');
        else if (save.brew) this.setFrame(view, `apprentice-stir-${calm ? 0 : [0, 1, 2, 1][Math.floor(time / 200) % 4]}`);
        else this.setFrame(view, !calm && time % 2800 < 150 ? 'apprentice-idle-1' : 'apprentice-idle-0');
      } else if (view.id === GOLEM) {
        if (sleeping) this.setFrame(view, 'golem-nap');
        else if (time < this.golemServeUntil) this.setFrame(view, 'golem-serve');
        else this.setFrame(view, !calm && Math.floor(time / 800) % 2 ? 'golem-idle-1' : 'golem-idle-0');
      }
    }
  }
}
