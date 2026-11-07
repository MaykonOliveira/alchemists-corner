import Phaser from 'phaser';
import { RECIPES_BY_ID } from '../../../domain/data/recipes';
import type { Customer, GameEvent, GameSave } from '../../../domain/models/types';
import { CLOSE_MIN, OPEN_MIN } from '../../../domain/rules/time';
import { useGameStore } from '../../../store/gameStore';
import { gameEvents } from '../../events';
import { outlinedText } from '../art/painter';
import { GARLAND_BULBS, LANTERNS, LATEGAME, SHELF_BOARDS } from '../art/sprites';
import { HelperViews } from '../entities/Helpers';
import { Visitor, type Mood } from '../entities/Visitor';
import { HOTSPOTS, type HotspotDef } from '../interaction/hotspots';

const OUTLINE_HOVER = 0xfff2c8;
const OUTLINE_ACTIVE = 0xf2c95c;
const PRESSED_TINT = 0xffd8a0;

/** Posições no balcão onde os clientes param (mais perto da porta primeiro). */
const COUNTER_SLOTS = [224, 198, 172];
/** Envio de tempo para as regras (ms reais) — agrupado para não sobrecarregar a interface. */
const ADVANCE_STEP_MS = 200;

const CAULDRON = { x: 46, y: 128, cx: 70 };
const STAND = { x: 280, y: 150 };

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
  private badge!: Phaser.GameObjects.Image;
  private upgradeLayer: Phaser.GameObjects.GameObject[] = [];
  private helpers!: HelperViews;
  private advanceAcc = 0;
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
    this.renderUpgrades(save);
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
      sub((s) => s.save?.upgrades, () => this.store.save && this.renderUpgrades(this.store.save)),
      sub((s) => s.save?.order, (o) => this.badge.setVisible(!!o)),
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
    sprite.on('pointerover', () => {
      view.hovered = true;
      this.refreshOutlines();
      this.store.dispatch({ type: 'SET_HOVER', hover: { id: def.id, label: def.label, x: def.x + sprite.width / 2, y: def.y } });
    });
    sprite.on('pointerout', () => {
      view.hovered = false;
      this.setPressed(view, false);
      this.refreshOutlines();
      if (this.store.ui.hover?.id === def.id) this.store.dispatch({ type: 'SET_HOVER', hover: null });
    });
    sprite.on('pointerdown', () => this.setPressed(view, true));
    sprite.on('pointerup', () => {
      this.setPressed(view, false);
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
      },
    });

    // Bolhas e vapor: calmos em repouso, intensos e coloridos durante o preparo.
    this.time.addEvent({
      delay: 260,
      loop: true,
      callback: () => {
        if (this.reduceMotion()) return;
        const brew = this.store.save?.brew;
        if (!brew && Math.random() > 0.35) return;
        const color = brew ? Phaser.Display.Color.HexStringToColor(RECIPES_BY_ID[brew.recipeId].color).color : 0x8ae0c8;
        const x = cx - 10 + Math.floor(Math.random() * 18);
        const b = this.add.image(x, 138, 'dot-bubble').setDepth(180).setTint(color);
        this.tweens.add({ targets: b, y: 133, alpha: 0, duration: 600, onComplete: () => b.destroy() });
        if (Math.random() < (brew ? 0.8 : 0.5)) {
          const s = this.add.image(x, 134, 'dot-steam').setDepth(181).setAlpha(brew ? 0.7 : 0.45);
          this.tweens.add({
            targets: s, y: 108, x: x + (Math.random() < 0.5 ? -5 : 5), alpha: 0, scale: 1.8, duration: 1800,
            onComplete: () => s.destroy(),
          });
        }
      },
    });
  }

  private applyBrew(save: GameSave) {
    const brew = save.brew;
    this.liquid.setVisible(!!brew);
    if (brew) this.liquid.setTint(Phaser.Display.Color.HexStringToColor(RECIPES_BY_ID[brew.recipeId].color).color);
    this.fire.setScale(brew ? 1.25 : 1, brew ? 1.35 : 1);
    this.drawBrewBar(save);
  }

  private drawBrewBar(save: GameSave) {
    const g = this.brewBar.clear();
    const brew = save.brew;
    if (!brew) return;
    const w = 30;
    const x = CAULDRON.cx - w / 2;
    const y = CAULDRON.y - 8;
    g.fillStyle(0x1c1216, 1).fillRect(x - 1, y - 1, w + 2, 5);
    g.fillStyle(0x3e2619, 1).fillRect(x, y, w, 3);
    g.fillStyle(Phaser.Display.Color.HexStringToColor(RECIPES_BY_ID[brew.recipeId].color).color, 1)
      .fillRect(x, y, Math.max(1, Math.round((w * brew.elapsedMs) / brew.totalMs)), 3);
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
    this.hotspots = this.hotspots.filter((h) => h.def.id !== 'stand');
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
        this.coinPopup(v ? v.sprite.x : 230, v ? v.sprite.y - 30 : 110, e.price);
        return;
      }
      case 'ORDER_DONE':
        return this.coinPopup(256, 40, e.coins);
      case 'BREW_DONE':
        return this.sparkleBurst(CAULDRON.cx, CAULDRON.y + 6, 10);
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

  private coinPopup(x: number, y: number, amount: number) {
    const key = `txt-+${amount}`;
    if (!this.textures.exists(key)) this.textures.addCanvas(key, outlinedText(`+${amount}`, '#f2c95c'));
    const coin = this.add.image(x - 6, y, 'coin').setDepth(970);
    const txt = this.add.image(x + 3, y, key).setOrigin(0, 0.5).setDepth(970);
    const rise = this.reduceMotion() ? 0 : 14;
    this.tweens.add({ targets: [coin, txt], y: y - rise, duration: 900, ease: 'Cubic.Out' });
    this.tweens.add({ targets: [coin, txt], alpha: 0, delay: 900, duration: 400, onComplete: () => { coin.destroy(); txt.destroy(); } });
    // O caixa dá um pulinho
    const reg = this.hotspots.find((h) => h.def.id === 'register');
    if (reg && !this.reduceMotion()) this.tweens.add({ targets: reg.sprite, y: reg.def.y - 2, yoyo: true, duration: 90 });
    this.sparkleBurst(x, y, 5);
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

    for (const v of this.visitors.values()) v.update(time);
    this.helpers.update(time);

    if (ui.paused || ui.modal || save.phase === 'fechamento') return;
    this.advanceAcc += Math.min(delta, 250);
    if (this.advanceAcc >= ADVANCE_STEP_MS) {
      const ms = this.advanceAcc;
      this.advanceAcc = 0;
      // No modo 2× o relógio, os clientes e o caldeirão andam no dobro da velocidade.
      this.store.dispatch({ type: 'ADVANCE', ms: ms * ui.speed });
      const next = this.store.save;
      if (next?.brew) this.drawBrewBar(next);
    }
  }
}
