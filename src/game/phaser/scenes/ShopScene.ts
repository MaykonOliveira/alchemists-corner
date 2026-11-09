import Phaser from 'phaser';
import { CUSTOMER_URLS } from '../art/sprites';
import { RECIPES_BY_ID } from '../../../domain/data/recipes';
import type { Customer, GameEvent, GameSave } from '../../../domain/models/types';
import { CLOSE_MIN, OPEN_MIN } from '../../../domain/rules/time';
import { autoFast, useGameStore } from '../../../store/gameStore';
import { seasonOf } from '../../../domain/rules/world';
import { gameEvents } from '../../events';
import { outlinedText } from '../art/painter';
import { DECOR_POS, EXPANSION, GARLAND_BULBS, LANTERNS, LATEGAME, ROYAL_POS, SHELF_BOARDS, WINDOW } from '../art/sprites';
import { decorAt } from '../../../domain/rules/entitlements';
import { CatView } from '../entities/Cat';
import { HelperViews } from '../entities/Helpers';
import { Visitor, type Mood } from '../entities/Visitor';
import { HOTSPOTS, type HotspotDef } from '../interaction/hotspots';

const OUTLINE_HOVER = 0xfff2c8;
/** Vidro da janela (onde se vê a rua) e chão da rua, onde pisa quem passa. */
const GLASS = WINDOW.glass;
const STREET_Y = GLASS.y + GLASS.h - 2;
/** Camadas da janela: céu dos eventos < clima < quem passa < frente da janela (moldura, cortinas, vasos). */
const DEPTH_WINDOW_SKY = 1.4;
const DEPTH_WINDOW_FX = 1.42;
const DEPTH_PASSERBY = 1.44;
const DEPTH_WINDOW_FRONT = 1.46;
const OUTLINE_ACTIVE = 0xf2c95c;
const PRESSED_TINT = 0xffd8a0;

/** Posições no balcão onde os clientes param (mais perto da porta primeiro). */
const COUNTER_SLOTS = [224, 198, 172, 146];
/** Envio de tempo para as regras (ms reais) — agrupado para não sobrecarregar a interface. */
const ADVANCE_STEP_MS = 200;

const CAULDRON = { x: 46, y: 128, cx: 70 };
const STAND = { x: 280, y: 150 };
/** Segundo caldeirão (expansão "Sala dos fundos"): mesmo desenho, então os deslocamentos são os mesmos. */
const CAULDRON2 = { x: EXPANSION['cauldron-2'].x, y: EXPANSION['cauldron-2'].y, cx: EXPANSION['cauldron-2'].x + 24 };

/** Cor da luz ambiente ao longo do dia (multiplicada sobre o cenário). */
const LIGHT_KEYS: [number, number][] = [
  [OPEN_MIN, 0xffeed4],
  [11 * 60, 0xffffff],
  [15 * 60, 0xffe8c4],
  [17 * 60, 0xffc88c],
  [18.5 * 60, 0xb894b4],
  [CLOSE_MIN, 0x6a68b0],
];

/** Sobe de 0 a 1 entre a e b, fica em 1 até c e desce até d (horas em minutos). */
const ramp = (m: number, a: number, b: number, c: number, d: number) =>
  m <= a || m >= d ? 0 : m < b ? (m - a) / (b - a) : m <= c ? 1 : (d - m) / (d - c);

interface HotspotView {
  def: HotspotDef;
  sprite: Phaser.GameObjects.Image;
  outline: Phaser.GameObjects.Image;
  hovered: boolean;
}

export class ShopScene extends Phaser.Scene {
  private hotspots: HotspotView[] = [];
  private shelfItems: Phaser.GameObjects.Image[] = [];
  private visitors = new Map<string, Visitor>();
  private leaveReasons = new Map<string, Mood>();
  private overlay!: Phaser.GameObjects.Rectangle;
  private glows: Phaser.GameObjects.Image[] = [];
  private bulbGlows: Phaser.GameObjects.Image[] = [];
  /** Brilhos mágicos (runas, vitral) que ficam mais fortes à noite. */
  private magicGlows: Phaser.GameObjects.Image[] = [];
  private bell: Phaser.GameObjects.Image | null = null;
  private sign!: Phaser.GameObjects.Image;
  private fire!: Phaser.GameObjects.Image;
  private liquid!: Phaser.GameObjects.Image;
  private brewBar!: Phaser.GameObjects.Graphics;
  /** Peças do 2º caldeirão (só existem com a expansão). */
  private liquid2: Phaser.GameObjects.Image | null = null;
  private fire2: Phaser.GameObjects.Image | null = null;
  private astroTimer: Phaser.Time.TimerEvent | null = null;
  private badge!: Phaser.GameObjects.Image;
  private upgradeLayer: Phaser.GameObjects.GameObject[] = [];
  private decorLayer: Phaser.GameObjects.GameObject[] = [];
  private decorGlows: Phaser.GameObjects.Image[] = [];
  private royalLayer: Phaser.GameObjects.GameObject[] = [];
  private helpers!: HelperViews;
  private cat!: CatView;
  private advanceAcc = 0;
  private seasonFxAt = 0;
  private passerbyAt = 4000;
  /** Recorte do vidro da janela, compartilhado por todos que passam na rua. */
  private windowMask!: Phaser.Display.Masks.GeometryMask;
  private rareSky: Phaser.GameObjects.Graphics | null = null;
  private rareSkyEvent: string | null = null;
  private nightness = 0;
  /** Revisão visual V4: raio de sol da janela, sombra nos cantos à noite e brilho dos caldeirões. */
  private sunbeam!: Phaser.GameObjects.Image;
  private vignette!: Phaser.GameObjects.Image;
  private brewGlows: (Phaser.GameObjects.Image | null)[] = [null, null];
  private primeSparkles: Phaser.GameObjects.Image[] = [];
  private unsubscribers: (() => void)[] = [];

  constructor() {
    super('Shop');
  }

  private get store() {
    return useGameStore.getState();
  }

  private reduceMotion = () => this.store.save?.settings.reduceMotion ?? false;

  create() {
    const save = this.store.save!;
    this.add.image(0, 0, 'room').setOrigin(0).setDepth(0);
    // A moldura da janela já está na sala; esta cópia fica por cima de quem passa na rua.
    this.add.image(WINDOW.front.x, WINDOW.front.y, 'window-front').setOrigin(0).setDepth(DEPTH_WINDOW_FRONT);
    this.windowMask = this.make.graphics({}, false).fillRect(GLASS.x, GLASS.y, GLASS.w, GLASS.h).createGeometryMask();
    this.createHotspots();
    this.createCauldronFx();
    this.sign = this.add.image(321, 58, 'sign-closed').setOrigin(0.5, 0).setDepth(113);
    this.badge = this.add.image(256, 30, 'badge').setOrigin(0.5, 1).setDepth(120).setVisible(false);
    if (!this.reduceMotion()) this.tweens.add({ targets: this.badge, y: 27, yoyo: true, repeat: -1, duration: 500, ease: 'Sine.InOut' });

    // Luz ambiente (manhã → tarde → noite) e brilhos que atravessam a sombra.
    this.overlay = this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0xffffff)
      .setOrigin(0)
      .setDepth(1000)
      .setBlendMode(Phaser.BlendModes.MULTIPLY);
    for (const l of LANTERNS) {
      this.glows.push(this.add.image(l.x, l.y, 'glow-warm').setDepth(1001).setBlendMode(Phaser.BlendModes.ADD));
    }
    this.createLightFx();

    this.helpers = new HelperViews(this, this.reduceMotion);
    this.cat = new CatView(this, this.reduceMotion);
    this.renderUpgrades(save);
    this.renderDecor(save);
    this.renderRoyal(save);
    this.renderShelves(save);
    this.applyPhase(save);
    this.applyLight(save.clockMin);
    this.applyBrew(save);
    this.syncCustomers(save.customers, true);
    this.badge.setVisible(!!save.order);

    const sub = useGameStore.subscribe;
    this.unsubscribers.push(
      sub((s) => s.save?.potions, () => this.store.save && this.renderShelves(this.store.save)),
      sub((s) => s.save?.phase, () => this.store.save && this.applyPhase(this.store.save)),
      sub((s) => s.save?.clockMin, (m) => m !== undefined && this.applyLight(m)),
      sub((s) => s.save?.brew, () => this.store.save && this.applyBrew(this.store.save)),
      sub((s) => s.save?.brew2, () => this.store.save && this.applyBrew(this.store.save)),
      sub((s) => s.save?.upgrades, () => this.store.save && this.renderUpgrades(this.store.save)),
      sub((s) => s.save?.order, (o) => this.badge.setVisible(!!o)),
      sub((s) => s.save?.decor, () => this.store.save && this.renderDecor(this.store.save)),
      sub((s) => s.save?.royal?.chapter, () => this.store.save && this.renderRoyal(this.store.save)),
      sub((s) => s.save?.upgrades.includes('letreiro-novo'), () => this.store.save && this.renderRoyal(this.store.save)),
      sub((s) => s.save?.event, () => this.store.save && this.renderDecor(this.store.save)),
      sub(
        (s) => s.save?.customers,
        (c) => queueMicrotask(() => c && this.syncCustomers(this.store.save?.customers ?? [], false)),
      ),
      sub((s) => s.ui.activePanel, () => this.refreshOutlines()),
      sub((s) => s.ui.paused, (p) => this.applyPause(p)),
      sub((s) => s.ui.selectedCustomerId, (id) => this.visitors.forEach((v) => v.setSelected(v.id === id))),
      gameEvents.on((e) => this.onGameEvent(e)),
    );
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribers.forEach((u) => u());
      this.unsubscribers = [];
    });
    this.applyPause(this.store.ui.paused);
  }

  // ---------------------------------------------------------------- hotspots

  private createHotspots() {
    for (const def of HOTSPOTS) {
      const outline = this.add.image(def.x - 1, def.y - 1, `${def.texture}-outline`).setOrigin(0).setVisible(false);
      const sprite = this.add.image(def.x, def.y, def.texture).setOrigin(0);
      const depth = def.depth ?? def.y + sprite.height;
      outline.setDepth(depth - 0.5);
      sprite.setDepth(depth);
      sprite.setInteractive({ useHandCursor: true, pixelPerfect: true });
      this.bindHotspot({ def, sprite, outline, hovered: false });
    }
  }

  private bindHotspot(view: HotspotView) {
    const { def, sprite } = view;
    this.hotspots.push(view);
    let pressed = false;
    sprite.on('pointerover', () => {
      view.hovered = true;
      this.refreshOutlines();
      this.store.dispatch({ type: 'SET_HOVER', hover: { id: def.id, label: def.label, x: def.x + sprite.width / 2, y: def.y } });
    });
    sprite.on('pointerout', () => {
      pressed = false;
      view.hovered = false;
      this.setPressed(view, false);
      this.refreshOutlines();
      if (this.store.ui.hover?.id === def.id) this.store.dispatch({ type: 'SET_HOVER', hover: null });
    });
    sprite.on('pointerdown', () => { pressed = true; this.setPressed(view, true); });
    sprite.on('pointerup', () => {
      this.setPressed(view, false);
      // Só conta o toque que começou no objeto (um clique numa janela por cima do canvas não abre o painel).
      if (!pressed) return;
      pressed = false;
      this.store.dispatch({ type: 'TOGGLE_PANEL', panel: def.panel });
    });
  }

  private setPressed(view: HotspotView, pressed: boolean) {
    view.sprite.setY(view.def.y + (pressed ? 1 : 0));
    view.outline.setY(view.def.y - 1 + (pressed ? 1 : 0));
    if (pressed) view.sprite.setTint(PRESSED_TINT);
    else view.sprite.clearTint();
  }

  /** Três estados visuais: normal, hover (contorno claro) e acionado (contorno dourado). */
  private refreshOutlines() {
    const active = this.store.ui.activePanel;
    for (const v of this.hotspots) {
      const isActive = v.def.panel === active;
      v.outline.setVisible(v.hovered || isActive);
      v.outline.setTint(isActive ? OUTLINE_ACTIVE : OUTLINE_HOVER);
    }
  }

  // --------------------------------------------------------------- estações

  /** Clima da estação visto pela janela: pétalas, brilho de sol, folhas ou neve. */
  private seasonFx(time: number) {
    if (this.reduceMotion() || time < this.seasonFxAt) return;
    const save = this.store.save;
    if (!save) return;
    const season = seasonOf(save.day).id;
    this.seasonFxAt = time + (season === 'inverno' ? 260 : 420);
    const W = { x0: GLASS.x + 2, x1: GLASS.x + GLASS.w - 3, top: GLASS.y + 1, bottom: STREET_Y - 2 };
    const x = Phaser.Math.Between(W.x0, W.x1);
    const look = {
      primavera: { tint: [0xf8b8d0, 0xffd8e8], rise: false, drift: 10 },
      verao: { tint: [0xffe890, 0xfff4c0], rise: true, drift: 3 },
      outono: { tint: [0xe08a3a, 0xc8602a, 0xf0b040], rise: false, drift: 8 },
      inverno: { tint: [0xffffff, 0xe0f0ff], rise: false, drift: 4 },
    }[season];
    const p = this.add.image(x, look.rise ? W.bottom - 4 : W.top, 'px').setDepth(DEPTH_WINDOW_FX).setMask(this.windowMask)
      .setTint(look.tint[Phaser.Math.Between(0, look.tint.length - 1)]).setAlpha(0.9).setScale(1.5);
    if (season === 'outono') p.setScale(2, 1.2);
    const tx = Phaser.Math.Clamp(x + Phaser.Math.Between(-look.drift, look.drift), W.x0, W.x1);
    this.tweens.add({
      targets: p, x: tx, y: look.rise ? W.top + 6 : W.bottom, angle: season === 'outono' ? 180 : 0,
      alpha: { from: 0.9, to: 0 }, duration: look.rise ? 2600 : 2200 + Phaser.Math.Between(0, 800), ease: 'Sine.InOut',
      onComplete: () => p.destroy(),
    });
  }

  /**
   * Gente passando na rua, vista pela janela: a loja parece parte de uma cidade viva,
   * mesmo quando ninguém entrou ainda. Mais movimento em dia de feira, menos à noite.
   */
  private passerby(time: number) {
    if (this.reduceMotion() || time < this.passerbyAt) return;
    const save = this.store.save;
    const busy = save?.event === 'feira' ? 0.5 : save && save.clockMin >= 18 * 60 ? 1.8 : 1;
    this.passerbyAt = time + (3500 + Math.random() * 5000) * busy;
    const kinds = Object.keys(CUSTOMER_URLS) as (keyof typeof CUSTOMER_URLS)[];
    const key = `customer-${kinds[Phaser.Math.Between(0, kinds.length - 1)]}`;
    if (!this.textures.exists(key)) return;
    const rtl = Math.random() < 0.5;
    // Corpo inteiro, com os pés na calçada lá fora: a cabeça passa no vidro de cima e as pernas no de baixo.
    // Fica atrás da moldura, dos montantes e dos vasos; um pouco mais escuro, como quem está do lado de fora.
    const x0 = GLASS.x - 10;
    const x1 = GLASS.x + GLASS.w + 10;
    const p = this.add.sprite(rtl ? x1 : x0, STREET_Y, key, 0).setOrigin(0.5, 1)
      .setDepth(DEPTH_PASSERBY).setTint(0xb8a890).setFlipX(rtl).setMask(this.windowMask);
    if (this.anims.exists(`${key}-walk`)) p.play(`${key}-walk`);
    this.tweens.add({
      targets: p, x: rtl ? x0 : x1, duration: 4200 + Math.random() * 1800,
      onComplete: () => p.destroy(),
    });
  }

  /** Eventos raros vistos pela janela: o eclipse escurece o céu e a lua cheia aparece grande. */
  private rareWindow(time: number) {
    const save = this.store.save;
    const ev = save?.event === 'eclipse' || save?.event === 'lua-cheia' || save?.event === 'visitante' ? save.event : null;
    if (ev !== this.rareSkyEvent) {
      this.rareSkyEvent = ev;
      this.rareSky?.destroy();
      this.rareSky = null;
      if (ev) {
        const g = this.add.graphics().setDepth(DEPTH_WINDOW_SKY);
        const W = GLASS;
        if (ev === 'eclipse') {
          g.fillStyle(0x24163a, 0.55).fillRect(W.x, W.y, W.w, W.h);
          g.fillStyle(0xf2c95c, 1).fillCircle(86, 33, 6);
          g.fillStyle(0x18141a, 1).fillCircle(86, 33, 5);
        } else if (ev === 'lua-cheia') {
          g.fillStyle(0x1a2440, 0.5).fillRect(W.x, W.y, W.w, W.h);
          g.fillStyle(0xffeaa0, 0.35).fillCircle(84, 34, 8);
          g.fillStyle(0xfff8dc, 1).fillCircle(84, 34, 5);
          g.fillStyle(0xe0cb98, 1).fillRect(82, 33, 1, 1).fillRect(85, 35, 2, 1);
        } else {
          g.fillStyle(0x3e2662, 0.35).fillRect(W.x, W.y, W.w, W.h);
        }
        this.rareSky = g;
      }
    }
    if (this.rareSky && !this.reduceMotion()) this.rareSky.setAlpha(0.85 + Math.sin(time / 700) * 0.15);
  }

  // ------------------------------------------------------------- caldeirão

  private createCauldronFx() {
    const cx = CAULDRON.cx;
    this.liquid = this.add.image(CAULDRON.x + 8, CAULDRON.y + 7, 'liquid').setOrigin(0).setDepth(CAULDRON.y + 48.2).setVisible(false);
    this.fire = this.add.image(cx, 176, 'fire-0').setOrigin(0.5, 1).setDepth(177);
    const fireGlow = this.add.image(cx, 168, 'glow-fire').setDepth(1001).setBlendMode(Phaser.BlendModes.ADD);
    this.glows.push(fireGlow);
    this.brewBar = this.add.graphics().setDepth(960);
    let frame = 0;
    this.time.addEvent({
      delay: 140,
      loop: true,
      callback: () => {
        frame = (frame + 1) % 3;
        this.fire.setTexture(`fire-${frame}`);
        this.fire2?.setTexture(`fire-${(frame + 1) % 3}`);
      },
    });

    // Bolhas e vapor: calmos em repouso, intensos e coloridos durante o preparo.
    this.time.addEvent({
      delay: 260,
      loop: true,
      callback: () => {
        if (this.reduceMotion()) return;
        this.bubble(cx, CAULDRON.y, this.store.save?.brew ?? null);
        if (this.fire2) this.bubble(CAULDRON2.cx, CAULDRON2.y, this.store.save?.brew2 ?? null);
      },
    });
  }

  /** Bolhas e vapor de um caldeirão (y = topo do sprite). */
  private bubble(cx: number, top: number, brew: { recipeId: string } | null) {
    if (!brew && Math.random() > 0.35) return;
    const color = brew ? Phaser.Display.Color.HexStringToColor(RECIPES_BY_ID[brew.recipeId].color).color : 0x8ae0c8;
    const x = cx - 10 + Math.floor(Math.random() * 18);
    const b = this.add.image(x, top + 10, 'dot-bubble').setDepth(top + 52).setTint(color);
    this.tweens.add({ targets: b, y: top + 5, alpha: 0, duration: 600, onComplete: () => b.destroy() });
    if (Math.random() < (brew ? 0.8 : 0.5)) {
      const s = this.add.image(x, top + 6, 'dot-steam').setDepth(top + 53).setAlpha(brew ? 0.7 : 0.45);
      this.tweens.add({
        targets: s, y: top - 20, x: x + (Math.random() < 0.5 ? -5 : 5), alpha: 0, scale: 1.8, duration: 1800,
        onComplete: () => s.destroy(),
      });
    }
  }

  private applyBrew(save: GameSave) {
    const tint = (b: { recipeId: string }) => Phaser.Display.Color.HexStringToColor(RECIPES_BY_ID[b.recipeId].color).color;
    const brew = save.brew;
    this.liquid.setVisible(!!brew);
    if (brew) this.liquid.setTint(tint(brew));
    this.fire.setScale(brew ? 1.25 : 1, brew ? 1.35 : 1);
    const brew2 = save.brew2;
    this.liquid2?.setVisible(!!brew2);
    if (brew2) this.liquid2?.setTint(tint(brew2));
    this.fire2?.setScale(brew2 ? 1.25 : 1, brew2 ? 1.35 : 1);
    this.syncBrewGlow(0, brew ? tint(brew) : null, CAULDRON.cx, CAULDRON.y + 8);
    this.syncBrewGlow(1, brew2 && this.fire2 ? tint(brew2) : null, CAULDRON2.cx, CAULDRON2.y + 10);
    this.drawBrewBar(save);
  }

  /** Brilho da cor da poção saindo da boca do caldeirão enquanto ela ferve. */
  private syncBrewGlow(i: number, color: number | null, cx: number, y: number) {
    const cur = this.brewGlows[i];
    if (color === null) {
      if (cur) this.tweens.killTweensOf(cur);
      cur?.destroy();
      this.brewGlows[i] = null;
      return;
    }
    const g = cur ?? this.add.image(cx, y, 'glow-violet').setDepth(1002).setBlendMode(Phaser.BlendModes.ADD).setScale(1.6, 1.1);
    g.setTint(color);
    if (!cur) {
      this.brewGlows[i] = g;
      if (!this.reduceMotion()) this.tweens.add({ targets: g, alpha: { from: 0.55, to: 1 }, scaleX: 1.9, yoyo: true, repeat: -1, duration: 900, ease: 'Sine.InOut' });
    }
  }

  private drawBrewBar(save: GameSave) {
    const g = this.brewBar.clear();
    const bar = (brew: GameSave['brew'], cx: number, top: number) => {
      if (!brew) return;
      const w = 30;
      const x = cx - w / 2;
      const y = top - 8;
      g.fillStyle(0x1c1216, 1).fillRect(x - 1, y - 1, w + 2, 5);
      g.fillStyle(0x3e2619, 1).fillRect(x, y, w, 3);
      g.fillStyle(Phaser.Display.Color.HexStringToColor(RECIPES_BY_ID[brew.recipeId].color).color, 1)
        .fillRect(x, y, Math.max(1, Math.round((w * brew.elapsedMs) / brew.totalMs)), 3);
    };
    bar(save.brew, CAULDRON.cx, CAULDRON.y);
    if (this.fire2) bar(save.brew2, CAULDRON2.cx, CAULDRON2.y + 4);
  }

  // ------------------------------------------------------------ prateleiras

  /** Frascos nas prateleiras (e no expositor, se comprado) de acordo com o estoque à venda. */
  private renderShelves(save: GameSave) {
    this.tweens.killTweensOf(this.primeSparkles);
    this.shelfItems.forEach((i) => i.destroy());
    this.shelfItems = [];
    const slots: { x: number; y: number; depth: number }[] = [];
    for (const shelfX of [108, 170]) {
      for (const board of SHELF_BOARDS) {
        for (let i = 0; i < 6; i++) slots.push({ x: shelfX + 6 + i * 8, y: 22 + board, depth: 90 });
      }
    }
    if (save.upgrades.includes('prateleira-extra')) {
      for (let i = 0; i < 5; i++) slots.splice(i * 2, 0, { x: STAND.x + 4 + i * 8, y: STAND.y + 8, depth: STAND.y + 31 });
    }
    this.primeSparkles = [];
    const bottles: { tex: string; prime: boolean }[] = [];
    for (const stack of save.potions) {
      if (!stack.forSale) continue;
      // As Primorosas vêm primeiro na pilha, para aparecerem na prateleira com o brilho dourado.
      for (let i = 0; i < stack.quantity; i++) bottles.push({ tex: `potion-${stack.recipeId}`, prime: i < (stack.prime ?? 0) });
    }
    slots.forEach((slot, idx) => {
      const b = bottles[idx];
      const tex = b?.tex ?? (idx % 5 === 3 && slot.depth === 90 ? 'jar' : null);
      if (!tex) return;
      const img = this.add.image(slot.x, slot.y, tex).setOrigin(0, 1).setDepth(slot.depth);
      this.shelfItems.push(img);
      if (!b?.prime) return;
      const halo = this.add.image(slot.x + img.width / 2, slot.y - img.height / 2, 'glow-small').setDepth(1002)
        .setBlendMode(Phaser.BlendModes.ADD).setTint(0xffd860).setAlpha(0.8);
      const spark = this.add.image(slot.x + img.width - 1, slot.y - img.height + 1, 'sparkle').setDepth(1003).setScale(0.5).setTint(0xfff0a0);
      this.shelfItems.push(halo, spark);
      this.primeSparkles.push(spark);
      if (!this.reduceMotion()) {
        this.tweens.add({ targets: spark, alpha: { from: 0, to: 1 }, scale: 0.8, yoyo: true, repeat: -1, duration: 700, delay: (idx * 233) % 1400, repeatDelay: 1200 + ((idx * 97) % 900) });
      }
    });
  }

  // --------------------------------------------------------------- melhorias

  private renderUpgrades(save: GameSave) {
    this.helpers.sync(save);
    this.upgradeLayer.forEach((o) => o.destroy());
    this.upgradeLayer = [];
    this.bulbGlows = [];
    this.magicGlows = [];
    this.bell = null;
    this.hotspots = this.hotspots.filter((h) => h.def.id !== 'stand' && h.def.id !== 'cauldron-2');
    this.liquid2 = null;
    this.fire2 = null;
    this.astroTimer?.remove();
    this.astroTimer = null;
    const has = (id: string) => save.upgrades.includes(id);

    if (has('caldeirao-reforcado')) this.upgradeLayer.push(this.add.image(CAULDRON.x, CAULDRON.y, 'cauldron-bands').setOrigin(0).setDepth(CAULDRON.y + 48.1));
    if (has('armario-organizado')) this.upgradeLayer.push(this.add.image(2, 38, 'cabinet-labels').setOrigin(0).setDepth(136.1));
    if (has('letreiro-novo')) {
      // Sem girar: pixel art girada em ângulo quebrado "rasga" e cintila a cada quadro.
      this.upgradeLayer.push(this.add.image(321, 9, 'shop-sign').setOrigin(0.5, 0).setDepth(115));
    }
    if (has('prateleira-extra')) {
      const def: HotspotDef = { id: 'stand', label: 'Expositor de poções', panel: 'shelves', texture: 'display-stand', x: STAND.x, y: STAND.y };
      const outline = this.add.image(def.x - 1, def.y - 1, 'display-stand-outline').setOrigin(0).setDepth(STAND.y + 29.5).setVisible(false);
      const sprite = this.add.image(def.x, def.y, 'display-stand').setOrigin(0).setDepth(STAND.y + 30);
      sprite.setInteractive({ useHandCursor: true, pixelPerfect: true });
      this.bindHotspot({ def, sprite, outline, hovered: false });
      this.upgradeLayer.push(outline, sprite);
    }
    // ---- late game
    if (has('estufa')) {
      const p = LATEGAME.greenhouse;
      // Escala fixa: esticar 3% fazia uma linha de pixels aparecer e sumir sem parar.
      this.upgradeLayer.push(this.add.image(p.x, p.y, 'greenhouse').setOrigin(0).setDepth(21));
    }
    if (has('alambique-prata')) {
      const p = LATEGAME.alembic;
      this.upgradeLayer.push(this.add.image(p.x, p.y, 'alembic').setOrigin(0).setDepth(p.y + 44));
    }
    if (has('despensa-encantada')) {
      const p = LATEGAME['cabinet-runes'];
      this.upgradeLayer.push(this.add.image(p.x, p.y, 'cabinet-runes').setOrigin(0).setDepth(136.2));
      for (const [dx, dy] of [[4, 3], [35, 3], [3, 61], [36, 61], [19, 93]]) {
        const g = this.add.image(p.x + dx, p.y + dy, 'glow-violet').setDepth(1002).setBlendMode(Phaser.BlendModes.ADD);
        this.magicGlows.push(g);
        this.upgradeLayer.push(g);
      }
    }
    if (has('vitral-arcano')) {
      const p = LATEGAME.vitral;
      this.upgradeLayer.push(this.add.image(p.x, p.y, 'vitral').setOrigin(0).setDepth(2));
      for (const dx of [11, 35]) {
        const g = this.add.image(p.x + dx, p.y + 14, 'glow-vitral').setDepth(1002).setBlendMode(Phaser.BlendModes.ADD);
        this.magicGlows.push(g);
        this.upgradeLayer.push(g);
      }
    }
    if (has('sino-encantado')) {
      const p = LATEGAME.bell;
      this.bell = this.add.image(p.x, p.y, 'bell-0').setOrigin(0).setDepth(116);
      this.upgradeLayer.push(this.bell);
    }
    // ---- expansões
    if (has('sala-dos-fundos')) {
      const p = CAULDRON2;
      const def: HotspotDef = { id: 'cauldron-2', label: 'Segundo caldeirão', panel: 'production', texture: 'cauldron-2', x: p.x, y: p.y };
      const outline = this.add.image(p.x - 1, p.y - 1, 'cauldron-2-outline').setOrigin(0).setDepth(p.y + 47.5).setVisible(false);
      const sprite = this.add.image(p.x, p.y, 'cauldron-2').setOrigin(0).setDepth(p.y + 48);
      sprite.setInteractive({ useHandCursor: true, pixelPerfect: true });
      this.bindHotspot({ def, sprite, outline, hovered: false });
      this.liquid2 = this.add.image(p.x + 8, p.y + 7, 'liquid').setOrigin(0).setDepth(p.y + 48.2).setVisible(false);
      this.fire2 = this.add.image(p.cx, p.y + 48, 'fire-0').setOrigin(0.5, 1).setDepth(p.y + 48.1);
      const glow = this.add.image(p.cx, p.y + 42, 'glow-fire').setDepth(1001).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.45);
      this.upgradeLayer.push(outline, sprite, this.liquid2, this.fire2, glow);
      this.applyBrew(save);
    }
    if (has('balcao-duplo')) {
      const p = EXPANSION['counter-wing'];
      this.upgradeLayer.push(this.add.image(p.x, p.y, 'counter-wing').setOrigin(0).setDepth(p.y + 51.5));
    }
    if (has('torre-alquimista')) {
      const p = EXPANSION.astrolabe;
      const a = this.add.image(p.x + 11, p.y, 'astrolabe-0').setOrigin(0.5, 0).setDepth(119);
      const glow = this.add.image(p.x + 11, p.y + 21, 'glow-violet').setDepth(1002).setBlendMode(Phaser.BlendModes.ADD).setScale(1.4);
      this.magicGlows.push(glow);
      this.upgradeLayer.push(a, glow);
      // Só troca de quadro (sem girar o sprite, que deixava os anéis serrilhados e tremendo).
      if (!this.reduceMotion()) {
        this.astroTimer = this.time.addEvent({ delay: 700, loop: true, callback: () => a.setTexture(a.texture.key === 'astrolabe-0' ? 'astrolabe-1' : 'astrolabe-0') });
      }
    }
    if (has('iluminacao-aconchegante')) {
      this.upgradeLayer.push(this.add.image(0, 0, 'garland').setOrigin(0).setDepth(20));
      for (const b of GARLAND_BULBS) {
        const g = this.add.image(b.x, b.y + 1, 'glow-small').setDepth(1002).setBlendMode(Phaser.BlendModes.ADD)
          .setTint(Phaser.Display.Color.HexStringToColor(b.color).color);
        this.bulbGlows.push(g);
        this.upgradeLayer.push(g);
      }
    }
  }

  // -------------------------------------------------------------- Concurso Real

  /** Troféus do Concurso Real na estante embaixo do quadro, e a coroa na fachada para quem venceu. */
  private renderRoyal(save: GameSave) {
    this.royalLayer.forEach((o) => o.destroy());
    this.royalLayer = [];
    const won = Math.min(5, save.royal?.chapter ?? 0);
    if (!save.royal) return;
    const p = ROYAL_POS['trophy-shelf'];
    this.royalLayer.push(this.add.image(p.x, p.y, 'trophy-shelf').setOrigin(0).setDepth(30));
    for (let i = 0; i < won; i++) {
      this.royalLayer.push(this.add.image(p.x + 2 + i * 8, p.y + 1, `trophy-${i}`).setOrigin(0, 1).setDepth(31));
    }
    if (won >= 5) {
      // Placa nova: a coroa vai em cima dela; sem placa, fica sobre a porta.
      const y = save.upgrades.includes('letreiro-novo') ? 1 : 20;
      const c = this.add.image(321, y, 'crown').setOrigin(0.5, 0).setDepth(118);
      const glow = this.add.image(321, y + 4, 'glow-warm').setDepth(1002).setBlendMode(Phaser.BlendModes.ADD).setScale(0.6).setAlpha(0.7);
      this.royalLayer.push(c, glow);
      if (!this.reduceMotion()) this.tweens.add({ targets: c, y: y - 1, yoyo: true, repeat: -1, duration: 900, ease: 'Sine.InOut' });
    }
  }

  // -------------------------------------------------------------- decoração

  /** Decoração escolhida pelo jogador (fase 3) e bandeirinhas na festa da estação. */
  private renderDecor(save: GameSave) {
    this.decorLayer.forEach((o) => o.destroy());
    this.decorLayer = [];
    this.decorGlows = [];
    const rug = decorAt(save, 'tapete');
    if (rug.look) this.decorLayer.push(this.add.image(DECOR_POS.rug.x, DECOR_POS.rug.y, rug.look).setOrigin(0).setDepth(2.5));
    const frame = decorAt(save, 'quadro');
    if (frame.look) this.decorLayer.push(this.add.image(DECOR_POS.frame.x, DECOR_POS.frame.y, frame.look).setOrigin(0).setDepth(2.6));
    const awning = decorAt(save, 'toldo');
    this.decorLayer.push(
      this.add.image(DECOR_POS.awning.x, DECOR_POS.awning.y, 'awning').setOrigin(0).setDepth(2.7)
        .setTint(Phaser.Display.Color.HexStringToColor(awning.look || '#c8443e').color),
    );
    const lamp = decorAt(save, 'luminaria');
    if (lamp.look) {
      const img = this.add.image(DECOR_POS.lamp.x, DECOR_POS.lamp.y, lamp.look).setOrigin(0).setDepth(114);
      const glow = this.add.image(img.x + img.width / 2, img.y + img.height - 8, 'glow-warm').setDepth(1002)
        .setBlendMode(Phaser.BlendModes.ADD).setScale(0.6).setTint(lamp.id === 'luminaria-cristal' ? 0xc8e8ff : lamp.id === 'luminaria-lua' ? 0xfff0b0 : 0xffb050);
      this.decorGlows.push(glow);
      this.decorLayer.push(img, glow);
    }
    const plant = decorAt(save, 'planta');
    if (plant.look) {
      const img = this.add.image(DECOR_POS.plant.x, DECOR_POS.plant.y, plant.look).setOrigin(0);
      img.setDepth(img.y + img.height);
      this.decorLayer.push(img);
    }
    if (save.event === 'festa-estacao') this.decorLayer.push(this.bunting(seasonOf(save.day).id));
    this.applyLight(save.clockMin);
  }

  private bunting(season: string) {
    const colors: Record<string, number[]> = {
      primavera: [0xf070a8, 0xffd8e8, 0x9cc75a], verao: [0xf6cf5e, 0xff9a28, 0x4f86d8],
      outono: [0xd0842e, 0x9a2e2e, 0xe8a840], inverno: [0x86c0f0, 0xffffff, 0x5ad8c0],
    };
    const g = this.add.graphics().setDepth(21);
    g.lineStyle(1, 0x3e2619, 1);
    g.beginPath(); g.moveTo(120, 11); g.lineTo(270, 11); g.strokePath();
    const pal = colors[season] ?? colors.primavera;
    for (let i = 0, x = 122; x < 266; i++, x += 8) {
      g.fillStyle(pal[i % pal.length], 1);
      g.fillTriangle(x, 11, x + 6, 11, x + 3, 17);
    }
    return g;
  }

  // ------------------------------------------------------- fases e relógio

  private applyPhase(save: GameSave) {
    this.sign.setTexture(save.phase === 'expediente' ? 'sign-open' : 'sign-closed');
    if (save.phase !== 'expediente') this.advanceAcc = 0;
  }

  private applyPause(paused: boolean) {
    this.time.paused = paused;
    if (paused) {
      this.tweens.pauseAll();
      this.anims.pauseAll();
    } else {
      this.tweens.resumeAll();
      this.anims.resumeAll();
    }
  }

  private applyLight(clockMin: number) {
    let i = 0;
    while (i < LIGHT_KEYS.length - 2 && clockMin >= LIGHT_KEYS[i + 1][0]) i++;
    const [t0, c0] = LIGHT_KEYS[i];
    const [t1, c1] = LIGHT_KEYS[i + 1];
    const t = Phaser.Math.Clamp((clockMin - t0) / (t1 - t0), 0, 1);
    const c = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(c0), Phaser.Display.Color.ValueToColor(c1), 100, Math.round(t * 100));
    this.overlay.setFillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b));
    this.nightness = Phaser.Math.Clamp((clockMin - 16 * 60) / (CLOSE_MIN - 16 * 60), 0, 1);
    // Manhã: raio claro pela janela. Fim de tarde: o mesmo raio, dourado e mais comprido. Noite: cantos azulados.
    const morning = ramp(clockMin, 6 * 60, 7.5 * 60, 10 * 60, 13 * 60);
    const golden = ramp(clockMin, 14.5 * 60, 16.5 * 60, 17.5 * 60, 18.75 * 60);
    this.sunbeam.setAlpha(0.32 * morning + 0.42 * golden).setTint(golden > morning ? 0xffb860 : 0xfff2c8);
    this.vignette.setAlpha(Phaser.Math.Clamp((clockMin - 17.5 * 60) / (CLOSE_MIN - 17.5 * 60), 0, 1) * 0.75);
  }

  /** Texturas da luz desenhadas na hora (raio de sol em faixas e sombra dos cantos). */
  private createLightFx() {
    const W = this.scale.width;
    const H = this.scale.height;
    if (!this.textures.exists('fx-sunbeam')) {
      const t = this.textures.createCanvas('fx-sunbeam', W, H)!;
      const ctx = t.getContext();
      // Faixas inclinadas saindo da janela (50,22 a ~100,62) até o piso, mais fracas longe dela.
      const stripes: [number, number, number][] = [[54, 66, 0.9], [70, 80, 0.7], [84, 98, 0.55]];
      for (const [x0, x1, a] of stripes) {
        const g = ctx.createLinearGradient(0, 40, 0, H);
        g.addColorStop(0, `rgba(255,255,255,${a})`);
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(x0, 44); ctx.lineTo(x1, 44);
        ctx.lineTo(x1 + 120, H); ctx.lineTo(x0 + 120, H);
        ctx.closePath(); ctx.fill();
      }
      t.refresh();
    }
    if (!this.textures.exists('fx-vignette')) {
      const t = this.textures.createCanvas('fx-vignette', W, H)!;
      const ctx = t.getContext();
      const g = ctx.createRadialGradient(W / 2, H * 0.55, H * 0.35, W / 2, H * 0.55, W * 0.62);
      g.addColorStop(0, 'rgba(14,12,40,0)');
      g.addColorStop(1, 'rgba(14,12,40,0.85)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      t.refresh();
    }
    this.sunbeam = this.add.image(0, 0, 'fx-sunbeam').setOrigin(0).setDepth(1.5).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
    this.vignette = this.add.image(0, 0, 'fx-vignette').setOrigin(0).setDepth(1000.5).setAlpha(0);
  }

  // --------------------------------------------------------------- clientes

  private syncCustomers(customers: Customer[], instant: boolean) {
    const ids = new Set(customers.map((c) => c.id));
    // Saídas
    for (const [id, v] of this.visitors) {
      if (ids.has(id) || v.leaving) continue;
      const mood = this.leaveReasons.get(id) ?? 'neutro';
      this.leaveReasons.delete(id);
      v.leave(mood, () => this.visitors.delete(id));
    }
    // Chegadas e posições
    customers.forEach((c, idx) => {
      const slotX = COUNTER_SLOTS[idx] ?? COUNTER_SLOTS[COUNTER_SLOTS.length - 1];
      let v = this.visitors.get(c.id);
      if (!v) {
        v = new Visitor(this, c.id, c.archetype, c.mystery ? 'misterio' : c.wantedRecipeId, slotX, {
          instant,
          regular: !!c.regularId,
          reduceMotion: this.reduceMotion,
          onClick: (vis) => this.store.dispatch({ type: 'SELECT_CUSTOMER', id: vis.id }),
        });
        this.visitors.set(c.id, v);
        v.setSelected(this.store.ui.selectedCustomerId === c.id);
      } else {
        v.moveToSlot(slotX);
      }
      v.setPatience(1 - c.waitedMs / c.patienceMs, !!c.offer);
    });
  }

  private onGameEvent(e: GameEvent) {
    this.helpers.onEvent(e);
    switch (e.type) {
      case 'GOLEM_DISMISSED':
        this.leaveReasons.set(e.customerId, 'neutro');
        return;
      case 'CUSTOMER_LEFT': {
        const moods: Record<typeof e.reason, Mood> = { atendido: 'feliz', paciencia: 'triste', preco: 'bravo', 'recusou-oferta': 'bravo', fechou: 'neutro' };
        this.leaveReasons.set(e.customerId, moods[e.reason]);
        return;
      }
      case 'CUSTOMER_ARRIVED':
        return this.ringBell();
      case 'SALE': {
        const v = this.visitors.get(e.customerId);
        const x = v ? v.sprite.x : 230;
        const y = v ? v.sprite.y - 30 : 110;
        const bonus = e.price > RECIPES_BY_ID[e.recipeId].basePrice;
        this.coinPopup(x, y, e.price, bonus);
        this.coinRain(x, y + 10, Math.min(6, 2 + Math.floor(e.price / 25)));
        return;
      }
      case 'ORDER_DONE':
        return this.coinPopup(256, 40, e.coins);
      case 'BREW_DONE': {
        const c = e.slot === 2 && this.fire2 ? CAULDRON2 : CAULDRON;
        this.sparkleBurst(c.cx, c.y + 6, 10);
        return this.brewDoneFx(e.recipeId, e.qty, c.cx, c.y);
      }
      case 'ROYAL_CHAPTER_DONE': {
        const p = ROYAL_POS['trophy-shelf'];
        this.sparkleBurst(p.x + 5 + e.chapter * 8, p.y - 4, 18);
        return this.coinPopup(256, 60, e.coins);
      }
      case 'ROYAL_WON':
        return this.sparkleBurst(321, 12, 28);
      case 'UPGRADE_BOUGHT':
      case 'LEVEL_UP':
      case 'DISCOVERY':
        return this.sparkleBurst(192, 90, 16);
    }
  }

  /** O sino encantado balança quando alguém entra. */
  private ringBell() {
    const bell = this.bell;
    if (!bell || this.reduceMotion()) return;
    let n = 0;
    this.time.addEvent({
      delay: 120, repeat: 5,
      callback: () => bell.active && bell.setTexture(++n % 2 ? 'bell-1' : 'bell-0'),
    });
  }

  /** Textura branca simples para partículas (tingida na hora). */
  private fxTexture(key: 'fx-dot' | 'fx-puff') {
    if (this.textures.exists(key)) return key;
    const size = key === 'fx-dot' ? 2 : 5;
    const tex = this.textures.createCanvas(key, size, size)!;
    const ctx = tex.getContext();
    ctx.fillStyle = '#ffffff';
    if (key === 'fx-dot') ctx.fillRect(0, 0, 2, 2);
    else { ctx.fillRect(1, 0, 3, 5); ctx.fillRect(0, 1, 5, 3); }
    tex.refresh();
    return key;
  }

  /** Moedas saltam do cliente e caem no caixa, uma atrás da outra. */
  private coinRain(x: number, y: number, n: number) {
    if (this.reduceMotion()) return;
    const reg = this.hotspots.find((h) => h.def.id === 'register');
    const tx = reg ? reg.def.x + 9 : 252;
    const ty = reg ? reg.def.y + 4 : 121;
    for (let i = 0; i < n; i++) {
      const c = this.add.image(x + Phaser.Math.Between(-4, 4), y, 'coin').setDepth(972);
      const peak = y - 18 - Phaser.Math.Between(0, 8);
      const start = { x: c.x, y: c.y };
      this.tweens.addCounter({
        from: 0, to: 1, delay: i * 70, duration: 520, ease: 'Sine.In',
        onUpdate: (tw) => {
          const k = tw.getValue() ?? 0;
          c.x = Phaser.Math.Linear(start.x, tx, k);
          c.y = Phaser.Math.Linear(start.y, ty, k) + (peak - (start.y + ty) / 2) * 4 * k * (1 - k) * 0.5;
        },
        onComplete: () => {
          c.destroy();
          if (reg) this.tweens.add({ targets: reg.sprite, y: reg.def.y - 1, yoyo: true, duration: 60 });
        },
      });
    }
  }

  /** Fumaça colorida ao terminar o preparo e frascos voando até as prateleiras. */
  private brewDoneFx(recipeId: string, qty: number, cx: number, top: number) {
    if (this.reduceMotion()) return;
    const color = Phaser.Display.Color.HexStringToColor(RECIPES_BY_ID[recipeId].color).color;
    const puff = this.fxTexture('fx-puff');
    for (let i = 0; i < 12; i++) {
      const p = this.add.image(cx + Phaser.Math.Between(-8, 8), top + 6, puff).setDepth(982).setTint(color).setAlpha(0.9);
      this.tweens.add({
        targets: p, x: p.x + Phaser.Math.Between(-14, 14), y: top + 6 - Phaser.Math.Between(14, 30),
        scale: Phaser.Math.FloatBetween(1.6, 2.6), alpha: 0, duration: 900 + Phaser.Math.Between(0, 400), ease: 'Cubic.Out',
        onComplete: () => p.destroy(),
      });
    }
    for (let i = 0; i < Math.min(qty, 4); i++) {
      const f = this.add.image(cx, top, `potion-${recipeId}`).setDepth(983).setScale(0.6);
      const tx = 114 + Phaser.Math.Between(0, 100);
      const ty = 40 + Phaser.Math.Between(0, 30);
      this.tweens.add({ targets: f, x: tx, duration: 700, delay: 150 + i * 120, ease: 'Sine.InOut' });
      this.tweens.add({ targets: f, y: { from: top, to: ty }, scale: 1, duration: 700, delay: 150 + i * 120, ease: 'Back.Out' });
      this.tweens.add({ targets: f, alpha: 0, delay: 850 + i * 120, duration: 250, onComplete: () => { this.sparkleBurst(tx, ty, 4); f.destroy(); } });
    }
  }

  private coinPopup(x: number, y: number, amount: number, bonus = false) {
    const key = `txt-+${amount}${bonus ? '!' : ''}`;
    if (!this.textures.exists(key)) this.textures.addCanvas(key, outlinedText(`+${amount}${bonus ? '!' : ''}`, bonus ? '#fff3a0' : '#f2c95c'));
    const coin = this.add.image(x - 6, y, 'coin').setDepth(970);
    const txt = this.add.image(x + 3, y, key).setOrigin(0, 0.5).setDepth(970);
    const rise = this.reduceMotion() ? 0 : 14;
    this.tweens.add({ targets: [coin, txt], y: y - rise, duration: 900, ease: 'Cubic.Out' });
    this.tweens.add({ targets: [coin, txt], alpha: 0, delay: 900, duration: 400, onComplete: () => { coin.destroy(); txt.destroy(); } });
    // O caixa dá um pulinho
    const reg = this.hotspots.find((h) => h.def.id === 'register');
    if (reg && !this.reduceMotion()) this.tweens.add({ targets: reg.sprite, y: reg.def.y - 2, yoyo: true, duration: 90 });
    this.sparkleBurst(x, y, bonus ? 12 : 5);
    if (bonus && !this.reduceMotion()) {
      const ring = this.add.image(x, y, 'glow-warm').setDepth(969).setBlendMode(Phaser.BlendModes.ADD).setScale(0.3).setAlpha(0.9);
      this.tweens.add({ targets: ring, scale: 1.1, alpha: 0, duration: 650, ease: 'Cubic.Out', onComplete: () => ring.destroy() });
    }
  }

  private sparkleBurst(x: number, y: number, n: number) {
    if (this.reduceMotion()) return;
    for (let i = 0; i < n; i++) {
      const s = this.add.image(x, y, 'sparkle').setDepth(975);
      const a = (Math.PI * 2 * i) / n + Math.random() * 0.4;
      const r = 10 + Math.random() * 14;
      this.tweens.add({
        targets: s, x: x + Math.cos(a) * r, y: y + Math.sin(a) * r - 4, alpha: 0, scale: 0.4,
        duration: 600 + Math.random() * 300, ease: 'Cubic.Out', onComplete: () => s.destroy(),
      });
    }
  }

  // ------------------------------------------------------------------ loop

  update(time: number, delta: number) {
    const { save, ui } = this.store;
    if (!save) return;

    // Chama das lanternas e do fogo: oscilação lenta e pequena, com fase própria para cada luz.
    // (Antes a amplitude crescia com a posição na lista e mudava a cada ~50 ms, e as luzes pareciam piscar.)
    const still = this.reduceMotion();
    const base = 0.55 + this.nightness * 0.45;
    this.glows.forEach((g, i) => {
      const flicker = still ? 0 : Math.sin(time / 700 + i * 2.3) * 0.035 + Math.sin(time / 260 + i * 1.1) * 0.015;
      g.setAlpha(Phaser.Math.Clamp(base + flicker, 0, 1));
    });
    this.bulbGlows.forEach((g, i) => g.setAlpha(Phaser.Math.Clamp(0.5 + this.nightness * 0.5 + (still ? 0 : Math.sin(time / 900 + i * 1.7) * 0.08), 0, 1)));
    this.magicGlows.forEach((g, i) => g.setAlpha(0.35 + this.nightness * 0.65 + (this.reduceMotion() ? 0 : Math.sin(time / 600 + i * 1.7) * 0.2)));
    this.decorGlows.forEach((g) => g.setAlpha(0.15 + this.nightness * 0.85));

    for (const v of this.visitors.values()) v.update(time);
    this.helpers.update(time);
    this.cat.update(time);
    this.seasonFx(time);
    this.rareWindow(time);
    this.passerby(time);

    if (ui.paused || ui.modal || save.phase === 'fechamento') return;
    this.advanceAcc += Math.min(delta, 250);
    if (this.advanceAcc >= ADVANCE_STEP_MS) {
      const ms = this.advanceAcc;
      this.advanceAcc = 0;
      // No modo 2× o relógio, os clientes e o caldeirão andam no dobro da velocidade.
      // Loja vazia anda em 2× sozinha (autoFast).
      this.store.dispatch({ type: 'ADVANCE', ms: ms * (autoFast(save, ui) ? 2 : ui.speed) });
      const next = this.store.save;
      if (next?.brew || next?.brew2) this.drawBrewBar(next);
    }
  }
}
