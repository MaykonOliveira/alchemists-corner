import Phaser from 'phaser';
import { touchable } from '../art/hires';
import type { GameEvent, GameSave, MomentKind } from '../../../domain/models/types';
import { FAMILIARS_BY_ID } from '../../../domain/data/familiars';
import { decorAt } from '../../../domain/rules/entitlements';
import { useGameStore } from '../../../store/gameStore';
import { WINDOW, WORLD_H, WORLD_W } from '../art/sprites';

import { tr } from '../../../i18n';

/** Onde os familiares ativos ficam: no tapete, um de cada lado. */
const FAM_SPOTS = [{ x: 178, y: 190 }, { x: 236, y: 192 }];
/** Ninho na prateleirinha dos livros, à direita do quadro de avisos. */
const NEST_POS = { x: 296, y: 50 };
/** Onde o dragão viajante pousa: na ponta do balcão. */
const DRAGON_POS = { x: 150, y: 110 };

const MOMENT_LABEL: Record<MomentKind, string> = {
  estrela: tr('Estrela cadente! Toque para fazer um pedido'),
  dragao: tr('Dragão viajante! Toque para cumprimentar'),
  borboleta: tr('Borboleta arco-íris! Toque para pegar'),
};

interface FamView {
  id: string;
  shiny: boolean;
  sprite: Phaser.GameObjects.Image;
  home: { x: number; y: number };
}

/**
 * Evoluções na cena (E3 a E6): familiares, ninho com ovos, momentos raros clicáveis e o tema da loja.
 * Só desenha: as regras vivem no domínio.
 */
export class EvoViews {
  private fams: FamView[] = [];
  private nest: Phaser.GameObjects.Image | null = null;
  private eggs: Phaser.GameObjects.Image[] = [];
  private moment: { kind: MomentKind; sprite: Phaser.GameObjects.Image; outline: Phaser.GameObjects.Image; glow: Phaser.GameObjects.Image; born: number } | null = null;
  private theme = '';
  private themeLayer: Phaser.GameObjects.GameObject[] = [];
  private fxAt = 0;
  private batAt = 0;

  constructor(private readonly scene: Phaser.Scene, private readonly reduceMotion: () => boolean) {}

  private get store() {
    return useGameStore.getState();
  }

  sync(save: GameSave) {
    this.syncFamiliars(save);
    this.syncNest(save);
    this.syncMoment(save);
    this.syncTheme(save);
  }

  // ---------------------------------------------------------------- familiares

  private syncFamiliars(save: GameSave) {
    const want = save.evo.activeFamiliars.filter((id) => FAMILIARS_BY_ID[id]).slice(0, FAM_SPOTS.length);
    const same = want.length === this.fams.length && want.every((id, i) => this.fams[i].id === id && this.fams[i].shiny === save.evo.shiny.includes(id));
    if (same) return;
    this.fams.forEach((f) => f.sprite.destroy());
    this.fams = want.map((id, i) => {
      const shiny = save.evo.shiny.includes(id);
      const home = FAM_SPOTS[i];
      const sprite = this.scene.add.image(home.x, home.y, `fam-${id}${shiny ? '-shiny' : ''}-0`).setOrigin(0.5, 1).setDepth(home.y + 10);
      sprite.setInteractive(touchable(this.scene, sprite.texture.key));
      const label = `${FAMILIARS_BY_ID[id].name}${shiny ? ` · ${tr('brilhante')}` : ''}`;
      sprite.on('pointerover', () => this.store.dispatch({ type: 'SET_HOVER', hover: { id: `fam-${id}`, label, x: sprite.x, y: sprite.y - sprite.height } }));
      sprite.on('pointerout', () => { if (this.store.ui.hover?.id === `fam-${id}`) this.store.dispatch({ type: 'SET_HOVER', hover: null }); });
      sprite.on('pointerup', () => this.store.dispatch({ type: 'OPEN_PANEL', panel: 'album' }));
      if (!this.reduceMotion()) {
        sprite.setScale(0);
        this.scene.tweens.add({ targets: sprite, scale: 1, duration: 400, ease: 'Back.Out' });
      }
      return { id, shiny, sprite, home };
    });
  }

  // ---------------------------------------------------------------- ninho

  private syncNest(save: GameSave) {
    const show = save.evo.eggs.length > 0 || save.evo.familiars.length > 0;
    if (show && !this.nest) {
      this.nest = this.scene.add.image(NEST_POS.x, NEST_POS.y, 'nest').setOrigin(0.5, 1).setDepth(142);
      this.nest.setInteractive({ useHandCursor: true, pixelPerfect: false });
      this.nest.on('pointerover', () => this.store.dispatch({ type: 'SET_HOVER', hover: { id: 'nest', label: tr('Ninho dos familiares'), x: NEST_POS.x, y: NEST_POS.y - 8 } }));
      this.nest.on('pointerout', () => { if (this.store.ui.hover?.id === 'nest') this.store.dispatch({ type: 'SET_HOVER', hover: null }); });
      this.nest.on('pointerup', () => this.store.dispatch({ type: 'OPEN_PANEL', panel: 'album' }));
    }
    if (!show && this.nest) {
      this.nest.destroy();
      this.nest = null;
    }
    const n = show ? save.evo.eggs.length : 0;
    if (n === this.eggs.length) return;
    this.eggs.forEach((e) => e.destroy());
    this.eggs = Array.from({ length: n }, (_, i) =>
      this.scene.add.image(NEST_POS.x - 5 + i * 5, NEST_POS.y - 3, i === 0 ? 'egg-shine' : 'egg').setOrigin(0.5, 1).setDepth(141.5));
  }

  // ---------------------------------------------------------------- momentos

  private syncMoment(save: GameSave) {
    const kind = save.evo.moment?.kind ?? null;
    if (this.moment && this.moment.kind === kind) return;
    if (this.moment) this.dropMoment(false);
    if (!kind) return;
    const start = kind === 'estrela' ? { x: WINDOW.glass.x + 4, y: WINDOW.glass.y + 8 } : kind === 'dragao' ? DRAGON_POS : { x: 60, y: 90 };
    const outline = this.scene.add.image(start.x, start.y, `moment-${kind}-0-outline`).setDepth(994).setTint(0xf6cf5e);
    const sprite = this.scene.add.image(start.x, start.y, `moment-${kind}-0`).setDepth(995);
    // Halo que chama o olho para o momento (some com ele).
    const glow = this.scene.add.image(start.x, start.y, 'glow-warm').setDepth(993).setBlendMode(Phaser.BlendModes.ADD).setScale(0.9);
    sprite.setInteractive({ useHandCursor: true, pixelPerfect: false });
    sprite.on('pointerover', () => this.store.dispatch({ type: 'SET_HOVER', hover: { id: 'moment', label: MOMENT_LABEL[kind], x: sprite.x, y: sprite.y - 10 } }));
    sprite.on('pointerout', () => { if (this.store.ui.hover?.id === 'moment') this.store.dispatch({ type: 'SET_HOVER', hover: null }); });
    sprite.on('pointerup', () => this.store.dispatch({ type: 'CATCH_MOMENT' }));
    this.moment = { kind, sprite, outline, glow, born: this.scene.game.loop.time };
    if (!this.reduceMotion()) {
      sprite.setAlpha(0);
      this.scene.tweens.add({ targets: sprite, alpha: 1, duration: 400 });
    }
  }

  private dropMoment(caught: boolean) {
    const m = this.moment;
    if (!m) return;
    this.moment = null;
    if (this.store.ui.hover?.id === 'moment') this.store.dispatch({ type: 'SET_HOVER', hover: null });
    m.outline.destroy();
    m.glow.destroy();
    if (caught) this.burst(m.sprite.x, m.sprite.y);
    if (this.reduceMotion()) return void m.sprite.destroy();
    m.sprite.disableInteractive();
    this.scene.tweens.add({ targets: m.sprite, alpha: 0, y: m.sprite.y - (caught ? 12 : 0), scale: caught ? 1.6 : 1, duration: 500, onComplete: () => m.sprite.destroy() });
  }

  private burst(x: number, y: number) {
    if (this.reduceMotion()) return;
    for (let i = 0; i < 14; i++) {
      const s = this.scene.add.image(x, y, i % 2 ? 'sparkle' : 'fx-gold').setDepth(996);
      const a = (Math.PI * 2 * i) / 14;
      this.scene.tweens.add({ targets: s, x: x + Math.cos(a) * 20, y: y + Math.sin(a) * 16, alpha: 0, duration: 800, ease: 'Cubic.Out', onComplete: () => s.destroy() });
    }
  }

  onEvent(e: GameEvent) {
    if (e.type === 'MOMENT_CAUGHT') this.dropMoment(true);
    if (e.type === 'MOMENT_GONE') this.dropMoment(false);
    if (e.type === 'FAMILIAR_HATCHED' && this.nest) this.burst(this.nest.x, this.nest.y - 4);
  }

  // ---------------------------------------------------------------- tema da loja

  private syncTheme(save: GameSave) {
    const look = decorAt(save, 'tema').look;
    if (look === this.theme) return;
    this.theme = look;
    this.themeLayer.forEach((o) => o.destroy());
    this.themeLayer = [];
    const add = <T extends Phaser.GameObjects.GameObject>(o: T) => { this.themeLayer.push(o); return o; };
    const TINT: Record<string, [number, number]> = {
      'theme-inverno': [0x86c0f0, 0.12], 'theme-bruxas': [0x8a62c0, 0.14], 'theme-cerejeira': [0xf8d4e8, 0.12], 'theme-dourado': [0xf6cf5e, 0.12],
    };
    const t = TINT[look];
    if (t) add(this.scene.add.rectangle(0, 0, WORLD_W, WORLD_H, t[0], t[1]).setOrigin(0).setDepth(999).setBlendMode(Phaser.BlendModes.SCREEN));
    if (look === 'theme-inverno') {
      for (let x = 0; x < WORLD_W; x += 64) add(this.scene.add.image(x, 6, 'icicles').setOrigin(0).setDepth(116));
    } else if (look === 'theme-bruxas') {
      add(this.scene.add.image(36, 212, 'pumpkin').setOrigin(0.5, 1).setDepth(214));
      add(this.scene.add.image(300, 214, 'pumpkin').setOrigin(0.5, 1).setDepth(214).setFlipX(true));
      add(this.scene.add.image(128, 132, 'pumpkin').setOrigin(0.5, 1).setDepth(150).setScale(0.8));
    } else if (look === 'theme-cerejeira') {
      for (let x = 0; x < WORLD_W; x += 64) add(this.scene.add.image(x, 4, 'blossom').setOrigin(0).setDepth(116).setFlipX((x / 64) % 2 === 1));
    }
  }

  /** Partículas do tema (neve, pétalas, faíscas) e morcegos que cruzam a loja. */
  private themeFx(time: number) {
    if (!this.theme || this.reduceMotion() || time < this.fxAt) return;
    const kind = { 'theme-inverno': 'fx-snowflake', 'theme-cerejeira': 'fx-petal', 'theme-dourado': 'fx-gold', 'theme-bruxas': '' }[this.theme];
    this.fxAt = time + (this.theme === 'theme-dourado' ? 500 : 380);
    if (kind) {
      const x = Phaser.Math.Between(0, WORLD_W);
      const p = this.scene.add.image(x, -4, kind).setDepth(997).setAlpha(0.9);
      const fall = kind === 'fx-gold';
      if (fall) p.setPosition(x, Phaser.Math.Between(20, 200)).setAlpha(0);
      this.scene.tweens.add({
        targets: p,
        ...(fall
          ? { alpha: { from: 0, to: 1 }, yoyo: true, y: p.y - 6, duration: 700 }
          : { y: WORLD_H + 4, x: x + Phaser.Math.Between(-40, 40), angle: kind === 'fx-petal' ? 360 : 0, duration: 5200 + Phaser.Math.Between(0, 2200) }),
        ease: 'Sine.InOut',
        onComplete: () => p.destroy(),
      });
    }
    if (this.theme === 'theme-bruxas' && time > this.batAt) {
      this.batAt = time + 5000 + Phaser.Math.Between(0, 4000);
      const left = Math.random() < 0.5;
      const y = Phaser.Math.Between(16, 60);
      const bat = this.scene.add.image(left ? -10 : WORLD_W + 10, y, 'fx-bat-0').setDepth(997).setFlipX(!left);
      let f = 0;
      const flap = this.scene.time.addEvent({ delay: 140, loop: true, callback: () => { f = 1 - f; bat.setTexture(`fx-bat-${f}`); } });
      this.scene.tweens.add({ targets: bat, x: left ? WORLD_W + 10 : -10, y: y + 20, duration: 4200, ease: 'Sine.InOut', onComplete: () => { flap.remove(); bat.destroy(); } });
    }
  }

  update(time: number) {
    const save = this.store.save;
    if (!save) return;
    const calm = this.reduceMotion();
    // Familiares: respiram e passeiam um pouquinho perto do lugar deles.
    this.fams.forEach((f, i) => {
      const frame = calm ? 0 : Math.floor(time / 450 + i) % 2;
      f.sprite.setTexture(`fam-${f.id}${f.shiny ? '-shiny' : ''}-${frame}`);
      if (!calm) f.sprite.setX(f.home.x + Math.round(Math.sin(time / 2400 + i * 2) * 10));
      f.sprite.setFlipX(!calm && Math.cos(time / 2400 + i * 2) < 0);
    });
    const m = this.moment;
    if (m) {
      const t = time - m.born;
      const frame = calm ? 0 : Math.floor(time / 180) % 2;
      m.sprite.setTexture(`moment-${m.kind}-${frame}`);
      m.outline.setTexture(`moment-${m.kind}-${frame}-outline`);
      if (!calm) {
        if (m.kind === 'estrela') {
          // Cruza o vidro da janela devagar, ida e volta, para dar tempo de tocar.
          const g = WINDOW.glass;
          const k = (Math.sin(t / 1800) + 1) / 2;
          m.sprite.setPosition(g.x + 8 + k * (g.w - 16), g.y + 10 + Math.sin(t / 500) * 3);
        } else if (m.kind === 'dragao') {
          m.sprite.setY(DRAGON_POS.y + Math.round(Math.sin(t / 300) * 1.5));
        } else {
          m.sprite.setPosition(150 + Math.sin(t / 1300) * 110, 90 + Math.sin(t / 700) * 40);
        }
      }
      m.outline.setPosition(m.sprite.x, m.sprite.y).setAlpha(0.5 + Math.sin(time / 200) * 0.4);
      m.glow.setPosition(m.sprite.x, m.sprite.y).setAlpha(0.7 + Math.sin(time / 300) * 0.3);
    }
    this.themeFx(time);
  }
}
