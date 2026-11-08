import Phaser from 'phaser';
import { CUSTOMER_URLS } from '../art/sprites';
import { RECIPES_BY_ID } from '../../../domain/data/recipes';
import type { Customer, GameEvent, GameSave } from '../../../domain/models/types';
import { CLOSE_MIN, OPEN_MIN } from '../../../domain/rules/time';
import { useGameStore } from '../../../store/gameStore';
import { seasonOf } from '../../../domain/rules/world';
import { gameEvents } from '../../events';
import { outlinedText } from '../art/painter';
import { DECOR_POS, EXPANSION, GARLAND_BULBS, LANTERNS, LATEGAME, SHELF_BOARDS } from '../art/sprites';
import { decorAt } from '../../../domain/rules/entitlements';
import { CatView } from '../entities/Cat';
import { HelperViews } from '../entities/Helpers';
import { Visitor, type Mood } from '../entities/Visitor';
import { HOTSPOTS, type HotspotDef } from '../interaction/hotspots';

const OUTLINE_HOVER = 0xfff2c8;
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
  [OPEN_MIN, 0xfff1dc],
  [11 * 60, 0xffffff],
  [15 * 60, 0xfff0d8],
  [17 * 60, 0xffd6a8],
  [18.5 * 60, 0xc8a0a8],
  [CLOSE_MIN, 0x7c76b4],
];

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
  private helpers!: HelperViews;
  private cat!: CatView;
  private advanceAcc = 0;
  private seasonFxAt = 0;
  private passerbyAt = 4000;
  private rareSky: Phaser.GameObjects.Graphics | null = null;
  private rareSkyEvent: string | null = null;
  private nightness = 0;
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

    this.helpers = new HelperViews(this, this.reduceMotion);
    this.cat = new CatView(this, this.reduceMotion);
    this.renderUpgrades(save);
    this.renderDecor(save);
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
    const W = { x0: 55, x1: 99, top: 26, bottom: 47 };
    const x = Phaser.Math.Between(W.x0, W.x1);
    const look = {
      primavera: { tint: [0xf8b8d0, 0xffd8e8], rise: false, drift: 10 },
      verao: { tint: [0xffe890, 0xfff4c0], rise: true, drift: 3 },
      outono: { tint: [0xe08a3a, 0xc8602a, 0xf0b040], rise: false, drift: 8 },
      inverno: { tint: [0xffffff, 0xe0f0ff], rise: false, drift: 4 },
    }[season];
    const p = this.add.image(x, look.rise ? W.bottom - 4 : W.top, 'px').setDepth(1.5)
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
    const W = { x0: 55, x1: 100, top: 26, bottom: 48 };
    const kinds = Object.keys(CUSTOMER_URLS) as (keyof typeof CUSTOMER_URLS)[];
    const key = `customer-${kinds[Phaser.Math.Between(0, kinds.length - 1)]}`;
    if (!this.textures.exists(key)) return;
    const rtl = Math.random() < 0.5;
    const mask = this.make.graphics({}, false).fillRect(W.x0, W.top, W.x1 - W.x0, W.bottom - W.top).createGeometryMask();
    // Só a parte de cima aparece na janela; um pouco mais escuro, como quem está do lado de fora.
    const p = this.add.sprite(rtl ? W.x1 + 8 : W.x0 - 8, W.bottom + 12, key, 0).setOrigin(0.5, 1)
      .setDepth(1.45).setTint(0xb8a890).setAlpha(0.9).setFlipX(rtl).setMask(mask);
    if (this.anims.exists(`${key}-walk`)) p.play(`${key}-walk`);
    this.tweens.add({
      targets: p, x: rtl ? W.x0 - 8 : W.x1 + 8, duration: 3800 + Math.random() * 1800,
      onComplete: () => { p.destroy(); mask.geometryMask.destroy(); mask.destroy(); },
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
        const g = this.add.graphics().setDepth(1.4);
        const W = { x: 55, y: 26, w: 45, h: 22 };
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
    this.drawBrewBar(save);
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
    const bottles: string[] = [];
    for (const stack of save.potions) {
      if (!stack.forSale) continue;
      for (let i = 0; i < stack.quantity; i++) bottles.push(`potion-${stack.recipeId}`);
    }
    slots.forEach((slot, idx) => {
      const tex = bottles[idx] ?? (idx % 5 === 3 && slot.depth === 90 ? 'jar' : null);
      if (!tex) return;
      this.shelfItems.push(this.add.image(slot.x, slot.y, tex).setOrigin(0, 1).setDepth(slot.depth));
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
      const sign = this.add.image(321, 9, 'shop-sign').setOrigin(0.5, 0).setDepth(115);
      this.upgradeLayer.push(sign);
      if (!this.reduceMotion()) this.tweens.add({ targets: sign, angle: { from: -1.5, to: 1.5 }, yoyo: true, repeat: -1, duration: 1600, ease: 'Sine.InOut' });
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
      const g = this.add.image(p.x, p.y, 'greenhouse').setOrigin(0).setDepth(21);
      this.upgradeLayer.push(g);
      if (!this.reduceMotion()) this.tweens.add({ targets: g, scaleY: { from: 1, to: 1.03 }, y: p.y - 0.5, yoyo: true, repeat: -1, duration: 2200, ease: 'Sine.InOut' });
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
      if (!this.reduceMotion()) {
        this.tweens.add({ targets: a, angle: { from: -4, to: 4 }, yoyo: true, repeat: -1, duration: 2400, ease: 'Sine.InOut' });
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
      if (!this.reduceMotion()) this.tweens.add({ targets: img, angle: { from: -2, to: 2 }, yoyo: true, repeat: -1, duration: 2000, ease: 'Sine.InOut' });
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
        v = new Visitor(this, c.id, c.archetype, c.wantedRecipeId, slotX, {
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

    // Cintilar das luzes (mais forte à noite)
    const flicker = this.reduceMotion() ? 0 : Math.sin(time / 170) * 0.04 + Math.sin(time / 53) * 0.03;
    const base = 0.55 + this.nightness * 0.45;
    this.glows.forEach((g, i) => g.setAlpha(Phaser.Math.Clamp(base + flicker * (i + 1), 0, 1)));
    this.bulbGlows.forEach((g, i) => g.setAlpha(0.5 + this.nightness * 0.5 + (this.reduceMotion() ? 0 : Math.sin(time / 400 + i) * 0.15)));
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
      this.store.dispatch({ type: 'ADVANCE', ms: ms * ui.speed });
      const next = this.store.save;
      if (next?.brew || next?.brew2) this.drawBrewBar(next);
    }
  }
}
