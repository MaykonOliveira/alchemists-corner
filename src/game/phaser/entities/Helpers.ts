import Phaser from 'phaser';
import { touchable } from '../art/hires';
import type { GameEvent, GameSave } from '../../../domain/models/types';
import { APPRENTICE, BARD, GNOME, GOLEM, OWL, RAVEN, helperActive } from '../../../domain/rules/helpers';
import { SALAMANDER } from '../../../domain/rules/alchemy';
import { staffTier } from '../../../domain/rules/evoCore';
import { decorAt } from '../../../domain/rules/entitlements';
import { EXPLORER, FAIRY, NIGHT_MANAGER, PEDDLER, staffName } from '../../../domain/rules/staff';
import { useGameStore } from '../../../store/gameStore';
import { HEADS } from '../art/sprites';

import { tr } from '../../../i18n';
/** Onde cada ajudante fica na loja (mundo lógico 384×216). */
const PERCH = { x: 4, y: 33 };
const RAVEN_POS = { x: 6, y: 21 };
const WINDOW = { x: 76, y: 46 };
const APPRENTICE_POS = { x: 82, y: 116, depth: 175 };
/** Entre o caldeirão e o balcão, virado para os clientes (o desenho olha para a esquerda e é espelhado). */
const GOLEM_POS = { x: 118, y: 120, depth: 154 };
/** Coruja na prateleirinha embaixo do quadro de avisos. */
const OWL_POS = { x: 250, y: 62, depth: 141 };
/** Gnomo ao lado do vaso, regando (o regador fica à esquerda). */
const GNOME_POS = { x: 128, y: 181, depth: 200 };
/** Bardo à direita da porta. */
const BARD_POS = { x: 340, y: 92, depth: 150 };
/** Fada contadora voando ao lado da caixa registradora. */
const FAIRY_POS = { x: 266, y: 102, depth: 160 };
/** Salamandra deitada nas pedras quentes, ao pé do caldeirão de baixo. */
const SALAMANDER_POS = { x: 96, y: 198, depth: 205 };
/** Mascate perto dos caixotes, com a mochila de frascos. */
const PEDDLER_POS = { x: 356, y: 146, depth: 182 };
/** Exploradora encostada embaixo do armário, de lampião na mão. */
const EXPLORER_POS = { x: 10, y: 150, depth: 182 };
/** Gerente noturno flutuando perto do teto, entre as estantes. */
const GHOST_POS = { x: 214, y: 20, depth: 145 };

/** Quadro base de cada ajudante (o nome do quadro parado também indexa HEADS). */
const BASE: Record<string, string> = {
  [RAVEN]: 'raven-0', [APPRENTICE]: 'apprentice-idle-0', [GOLEM]: 'golem-idle-0', [OWL]: 'owl-0', [GNOME]: 'gnome-idle-0',
  [BARD]: 'bard-0', [FAIRY]: 'fairy-0', [SALAMANDER]: 'salamander-0', [PEDDLER]: 'peddler-0', [EXPLORER]: 'explorer-0',
  [NIGHT_MANAGER]: 'ghost-0',
};
/** Ajustes finos de onde fica a cabeça (o topo do desenho às vezes é uma pena ou a cauda). */
const HEAD_FIX: Record<string, { x?: number; y?: number }> = { [BARD]: { x: 11, y: 1 }, [SALAMANDER]: { x: 17, y: 4 }, [PEDDLER]: { x: 14 } };

const LABELS: Record<string, string> = {
  [RAVEN]: tr('Corvo entregador'),
  [APPRENTICE]: tr('Aprendiz de alquimia'),
  [GOLEM]: tr('Golem balconista'),
  [OWL]: tr('Coruja sábia'),
  [GNOME]: tr('Gnomo jardineiro'),
  [BARD]: tr('Bardo da porta'),
  [FAIRY]: tr('Fada contadora'),
  [SALAMANDER]: tr('Salamandra do forno'),
  [PEDDLER]: tr('Mascate'),
  [EXPLORER]: tr('Exploradora'),
  [NIGHT_MANAGER]: tr('Gerente noturno'),
};

interface HelperSprite {
  id: string;
  sprite: Phaser.GameObjects.Image;
  outline: Phaser.GameObjects.Image;
  zz: Phaser.GameObjects.Image;
  /** Insígnia de nível (bronze, prata, ouro) e chapéu do uniforme. */
  pin: Phaser.GameObjects.Image;
  hat: Phaser.GameObjects.Image;
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
  private noteAt = 0;

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
      [OWL, OWL_POS, OWL_POS.depth, 'owl-0'],
      [GNOME, GNOME_POS, GNOME_POS.depth, 'gnome-idle-0'],
      [BARD, BARD_POS, BARD_POS.depth, 'bard-0'],
      [FAIRY, FAIRY_POS, FAIRY_POS.depth, 'fairy-0'],
      [SALAMANDER, SALAMANDER_POS, SALAMANDER_POS.depth, 'salamander-0'],
      [PEDDLER, PEDDLER_POS, PEDDLER_POS.depth, 'peddler-0'],
      [EXPLORER, EXPLORER_POS, EXPLORER_POS.depth, 'explorer-0'],
      [NIGHT_MANAGER, GHOST_POS, GHOST_POS.depth, 'ghost-0'],
    ];
    for (const [id, pos, depth, tex] of wanted) {
      const owned = save.upgrades.includes(id);
      const view = this.views.get(id);
      if (owned && !view) this.views.set(id, this.create(id, pos, depth, tex));
      if (!owned && view) {
        view.sprite.destroy(); view.outline.destroy(); view.zz.destroy(); view.pin.destroy(); view.hat.destroy();
        this.views.delete(id);
      }
    }
    const hasRaven = save.upgrades.includes(RAVEN);
    if (hasRaven && !this.perch) this.perch = this.scene.add.image(PERCH.x, PERCH.y, 'perch').setOrigin(0).setDepth(140);
    if (!hasRaven && this.perch) {
      this.perch.destroy();
      this.perch = null;
    }
    this.dress(save);
  }

  /** Insígnias de nível e chapéus do uniforme (vitrine E6) sobre a cabeça de cada um. */
  dress(save: GameSave) {
    const hat = decorAt(save, 'uniforme').look;
    for (const view of this.views.values()) {
      const tier = staffTier(save, view.id);
      view.pin.setVisible(tier > 0 && view.sprite.visible);
      if (tier > 0) view.pin.setTexture(`pin-${tier}`);
      view.hat.setVisible(!!hat && view.sprite.visible);
      if (hat) view.hat.setTexture(hat);
      this.placeDress(view);
    }
  }

  private placeDress(view: HelperSprite) {
    const head = HEADS[BASE[view.id]] ?? { x: view.sprite.width / 2, y: 0, w: view.sprite.width };
    const fix = HEAD_FIX[view.id] ?? {};
    const hx = view.sprite.flipX ? head.w - 1 - (fix.x ?? head.x) : (fix.x ?? head.x);
    const hy = fix.y ?? head.y;
    const x = view.sprite.x + hx;
    const y = view.sprite.y + hy;
    view.hat.setPosition(x, y + 3).setDepth(view.sprite.depth + 0.2);
    view.pin.setPosition(x + 7, y + 1).setDepth(view.sprite.depth + 0.3);
  }

  private create(id: string, pos: { x: number; y: number }, depth: number, tex: string): HelperSprite {
    const outline = this.scene.add.image(pos.x - 1, pos.y - 1, `${tex}-outline`).setOrigin(0).setDepth(depth - 0.5).setVisible(false);
    const sprite = this.scene.add.image(pos.x, pos.y, tex).setOrigin(0).setDepth(depth);
    const zz = this.scene.add.image(pos.x + sprite.width - 4, pos.y - 2, 'zz').setDepth(980).setVisible(false);
    if (id === GOLEM) {
      sprite.setFlipX(true);
      outline.setFlipX(true);
    }
    const pin = this.scene.add.image(0, 0, 'pin-1').setVisible(false);
    const hat = this.scene.add.image(0, 0, 'hat-gorro').setOrigin(0.5, 1).setVisible(false);
    const view: HelperSprite = { id, sprite, outline, zz, pin, hat, hovered: false };
    sprite.setInteractive(touchable(this.scene, sprite.texture.key));
    sprite.on('pointerover', () => {
      view.hovered = true;
      outline.setVisible(true);
      const save = this.store.save;
      const label = save && save.evo.staff[id]?.name ? `${staffName(save, id)} · ${LABELS[id]}` : LABELS[id];
      this.store.dispatch({ type: 'SET_HOVER', hover: { id: `helper-${id}`, label, x: sprite.x + sprite.width / 2, y: sprite.y } });
    });
    sprite.on('pointerout', () => {
      view.hovered = false;
      outline.setVisible(false);
      if (this.store.ui.hover?.id === `helper-${id}`) this.store.dispatch({ type: 'SET_HOVER', hover: null });
    });
    sprite.on('pointerup', () => this.store.dispatch({ type: 'OPEN_PANEL', panel: 'staff' }));
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
    if (e.type === 'STAFF_LEVEL') this.celebrate(e.staffId);
    if (e.type === 'STAFF_TIP') this.coinPop(this.views.get(GOLEM));
    if (e.type === 'PEDDLER_SALE') this.coinPop(this.views.get(PEDDLER));
    if (e.type === 'PRICE_TUNED') this.sparkleOn(this.views.get(FAIRY));
  }

  /** Subiu de nível: chuva de brilhos e a insígnia pula. */
  private celebrate(id: string) {
    const view = this.views.get(id);
    if (!view || !view.sprite.visible) return;
    const save = this.store.save;
    if (save) this.dress(save);
    const x = view.sprite.x + view.sprite.width / 2;
    const y = view.sprite.y;
    this.sparkle(x, y + 4);
    if (this.reduceMotion()) return;
    const star = this.scene.add.image(x, y, 'sparkle').setDepth(990).setScale(2);
    this.scene.tweens.add({ targets: star, y: y - 16, alpha: 0, scale: 0.5, duration: 1200, ease: 'Sine.Out', onComplete: () => star.destroy() });
    this.scene.tweens.add({ targets: view.sprite, y: view.sprite.y - 4, yoyo: true, repeat: 1, duration: 140, ease: 'Quad.Out' });
  }

  private coinPop(view: HelperSprite | undefined) {
    if (!view || !view.sprite.visible || this.reduceMotion()) return;
    const x = view.sprite.x + view.sprite.width / 2;
    const c = this.scene.add.image(x, view.sprite.y, 'coin').setDepth(990);
    this.scene.tweens.add({ targets: c, y: view.sprite.y - 14, alpha: 0, duration: 900, ease: 'Quad.Out', onComplete: () => c.destroy() });
  }

  private sparkleOn(view: HelperSprite | undefined) {
    if (view?.sprite.visible) this.sparkle(view.sprite.x + view.sprite.width / 2, view.sprite.y + 6);
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

  /** Nota musical que sobe do alaúde e some. */
  private floatNote(x: number, y: number, frame: number) {
    const n = this.scene.add.image(x, y, `note-${frame}`).setDepth(985);
    this.scene.tweens.add({ targets: n, y: y - 18, x: x - 6 + frame * 12, alpha: 0, duration: 1600, ease: 'Sine.Out', onComplete: () => n.destroy() });
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
      // Em expedição o poleiro fica vazio (ou a exploradora some, quando é ela quem viajou).
      if ((view.id === RAVEN && !this.ravenAway) || view.id === EXPLORER) {
        const away = view.id === RAVEN ? !!save.expedition && !save.expedition.byExplorer : !!save.expedition?.byExplorer;
        view.sprite.setVisible(!away);
        if (away) { view.zz.setVisible(false); view.outline.setVisible(false); view.pin.setVisible(false); view.hat.setVisible(false); continue; }
        if (!view.pin.visible && staffTier(save, view.id) > 0) view.pin.setVisible(true);
        if (!view.hat.visible && decorAt(save, 'uniforme').look) view.hat.setVisible(true);
      }
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
      } else if (view.id === OWL) {
        // Com um Cliente misterioso na loja, a coruja fica pensando na charada.
        if (sleeping) this.setFrame(view, 'owl-nap');
        else if (save.customers.some((c) => c.mystery)) this.setFrame(view, 'owl-think');
        else this.setFrame(view, !calm && time % 3600 < 180 ? 'owl-1' : 'owl-0');
      } else if (view.id === GNOME) {
        if (sleeping) this.setFrame(view, 'gnome-nap');
        else if (!calm && time % 7000 < 2400) this.setFrame(view, `gnome-water-${Math.floor(time / 250) % 2}`);
        else this.setFrame(view, !calm && time % 3100 < 160 ? 'gnome-idle-1' : 'gnome-idle-0');
      } else if (view.id === BARD) {
        const playing = !sleeping && save.phase === 'expediente';
        if (sleeping) this.setFrame(view, 'bard-nap');
        else this.setFrame(view, playing && !calm ? `bard-${Math.floor(time / 320) % 2}` : 'bard-0');
        if (playing && !calm && time > this.noteAt) {
          this.noteAt = time + 1400;
          this.floatNote(view.sprite.x + 4, view.sprite.y + 14, Math.floor(time / 1400) % 2);
        }
      } else if (view.id === FAIRY) {
        if (sleeping) this.setFrame(view, 'fairy-nap');
        else this.setFrame(view, calm ? 'fairy-0' : `fairy-${Math.floor(time / 160) % 2}`);
        view.sprite.setY(FAIRY_POS.y + (sleeping || calm ? 2 : Math.round(Math.sin(time / 420) * 2)));
        view.outline.setY(view.sprite.y - 1);
        this.placeDress(view);
      } else if (view.id === SALAMANDER) {
        if (sleeping) this.setFrame(view, 'salamander-nap');
        else this.setFrame(view, !calm && (save.brew || save.brew2) ? `salamander-${Math.floor(time / 220) % 2}` : 'salamander-0');
      } else if (view.id === PEDDLER) {
        if (sleeping) this.setFrame(view, 'peddler-nap');
        else this.setFrame(view, !calm && time % 2600 < 900 ? `peddler-${Math.floor(time / 300) % 2}` : 'peddler-0');
      } else if (view.id === EXPLORER) {
        if (sleeping) this.setFrame(view, 'explorer-nap');
        else this.setFrame(view, !calm && time % 4200 < 1200 ? `explorer-${Math.floor(time / 400) % 2}` : 'explorer-0');
      } else if (view.id === NIGHT_MANAGER) {
        // O gerente noturno trabalha quando a loja está fechada: de dia ele cochila flutuando.
        const night = save.phase === 'fechamento' || save.clockMin >= 18 * 60;
        this.setFrame(view, !on ? 'ghost-nap' : calm ? 'ghost-0' : `ghost-${Math.floor(time / 500) % 2}`);
        view.zz.setVisible(!night && view.sprite.visible);
        view.sprite.setAlpha(night ? 1 : 0.75);
        view.sprite.setY(GHOST_POS.y + (calm ? 0 : Math.round(Math.sin(time / 700) * 2)));
        view.outline.setY(view.sprite.y - 1);
        this.placeDress(view);
      }
    }
  }
}
