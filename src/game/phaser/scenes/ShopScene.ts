import Phaser from 'phaser';
import { ARCHETYPES } from '../../../domain/data/customers';
import type { CustomerArchetype, GameSave } from '../../../domain/models/types';
import { CLOSE_MIN, GAME_MIN_PER_SECOND, OPEN_MIN } from '../../../domain/rules/time';
import { useGameStore } from '../../../store/gameStore';
import { LANTERNS, SHELF_BOARDS } from '../art/shop';
import { HOTSPOTS, type HotspotDef } from '../interaction/hotspots';
import { Visitor } from '../entities/Visitor';

const OUTLINE_HOVER = 0xfff2c8;
const OUTLINE_ACTIVE = 0xf2c95c;
const PRESSED_TINT = 0xffd8a0;

/** Posições no balcão onde os clientes param (mais perto da porta primeiro). */
const COUNTER_SLOTS = [224, 198, 172];
const MAX_VISITORS = COUNTER_SLOTS.length;

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
  private visitors: Visitor[] = [];
  private overlay!: Phaser.GameObjects.Rectangle;
  private glows: Phaser.GameObjects.Image[] = [];
  private sign!: Phaser.GameObjects.Image;
  private fire!: Phaser.GameObjects.Image;
  private clockAcc = 0;
  private spawnAcc = 0;
  private nextSpawnMs = 2500;
  private nightness = 0;
  private unsubscribers: (() => void)[] = [];

  constructor() {
    super('Shop');
  }

  private get store() {
    return useGameStore.getState();
  }

  private get save(): GameSave {
    return this.store.save!;
  }

  private reduceMotion = () => this.store.save?.settings.reduceMotion ?? false;

  create() {
    this.add.image(0, 0, 'room').setOrigin(0).setDepth(0);
    this.createHotspots();
    this.createCauldronFx();
    this.sign = this.add.image(321, 58, 'sign-closed').setOrigin(0.5, 0).setDepth(113);

    // Luz ambiente (manhã → tarde → noite) e brilhos que atravessam a sombra.
    this.overlay = this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0xffffff)
      .setOrigin(0)
      .setDepth(1000)
      .setBlendMode(Phaser.BlendModes.MULTIPLY);
    for (const l of LANTERNS) {
      const g = this.add.image(l.x, l.y, 'glow-warm').setDepth(1001).setBlendMode(Phaser.BlendModes.ADD);
      this.glows.push(g);
    }

    this.renderShelves(this.save);
    this.applyPhase(this.save);
    this.applyLight(this.save.clockMin);

    const sub = useGameStore.subscribe;
    this.unsubscribers.push(
      sub((s) => s.save?.potions, () => this.store.save && this.renderShelves(this.store.save)),
      sub((s) => s.save?.phase, () => this.store.save && this.applyPhase(this.store.save)),
      sub((s) => s.save?.clockMin, (m) => m !== undefined && this.applyLight(m)),
      sub((s) => s.ui.activePanel, () => this.refreshOutlines()),
      sub((s) => s.ui.paused, (p) => this.applyPause(p)),
      sub((s) => s.ui.selectedVisitor?.id, (id) => this.visitors.forEach((v) => v.setSelected(v.id === id))),
    );
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribers.forEach((u) => u());
      this.unsubscribers = [];
    });
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
      const view: HotspotView = { def, sprite, outline, hovered: false };
      this.hotspots.push(view);

      sprite.on('pointerover', () => {
        view.hovered = true;
        this.refreshOutlines();
        this.store.dispatch({
          type: 'SET_HOVER',
          hover: { id: def.id, label: def.label, x: def.x + sprite.width / 2, y: def.y },
        });
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
    const cx = 46 + 24;
    this.fire = this.add.image(cx, 176, 'fire-0').setOrigin(0.5, 1).setDepth(177);
    const fireGlow = this.add.image(cx, 168, 'glow-fire').setDepth(1001).setBlendMode(Phaser.BlendModes.ADD);
    this.glows.push(fireGlow);
    let frame = 0;
    this.time.addEvent({
      delay: 140,
      loop: true,
      callback: () => {
        frame = (frame + 1) % 3;
        this.fire.setTexture(`fire-${frame}`);
      },
    });

    // Bolhas e vapor saindo do caldeirão
    this.time.addEvent({
      delay: 700,
      loop: true,
      callback: () => {
        if (this.reduceMotion()) return;
        const x = cx - 8 + Math.floor(Math.random() * 14);
        const b = this.add.image(x, 138, 'dot-bubble').setDepth(180);
        this.tweens.add({ targets: b, y: 134, alpha: 0, duration: 600, onComplete: () => b.destroy() });
        if (Math.random() < 0.6) {
          const s = this.add.image(x, 134, 'dot-steam').setDepth(181).setAlpha(0.55);
          this.tweens.add({
            targets: s,
            y: 112,
            x: x + (Math.random() < 0.5 ? -4 : 4),
            alpha: 0,
            scale: 1.6,
            duration: 1800,
            onComplete: () => s.destroy(),
          });
        }
      },
    });
  }

  // ------------------------------------------------------------ prateleiras

  /** Mostra frascos nas prateleiras de acordo com o estoque à venda. */
  private renderShelves(save: GameSave) {
    this.shelfItems.forEach((i) => i.destroy());
    this.shelfItems = [];
    const slots: { x: number; y: number }[] = [];
    for (const shelfX of [108, 170]) {
      for (const board of SHELF_BOARDS) {
        for (let i = 0; i < 6; i++) slots.push({ x: shelfX + 6 + i * 8, y: 22 + board });
      }
    }
    const bottles: string[] = [];
    for (const stack of save.potions) {
      if (!stack.forSale) continue;
      for (let i = 0; i < stack.quantity; i++) bottles.push(`potion-${stack.recipeId}`);
    }
    slots.forEach((slot, idx) => {
      const tex = bottles[idx] ?? (idx % 5 === 3 ? 'jar' : null);
      if (!tex) return;
      const img = this.add.image(slot.x, slot.y, tex).setOrigin(0, 1).setDepth(90);
      this.shelfItems.push(img);
    });
  }

  // ------------------------------------------------------- fases e relógio

  private applyPhase(save: GameSave) {
    this.sign.setTexture(save.phase === 'expediente' ? 'sign-open' : 'sign-closed');
    if (save.phase !== 'expediente') {
      this.visitors.forEach((v) => v.leave());
      this.clockAcc = 0;
    } else {
      this.nextSpawnMs = 1500;
      this.spawnAcc = 0;
    }
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
    const a = Phaser.Display.Color.ValueToColor(c0);
    const b = Phaser.Display.Color.ValueToColor(c1);
    const c = Phaser.Display.Color.Interpolate.ColorWithColor(a, b, 100, Math.round(t * 100));
    this.overlay.setFillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b));
    this.nightness = Phaser.Math.Clamp((clockMin - 16 * 60) / (CLOSE_MIN - 16 * 60), 0, 1);
  }

  // --------------------------------------------------------------- clientes

  private spawnVisitor() {
    const taken = new Set(this.visitors.filter((v) => v.state !== 'saindo').map((v) => v.slotX));
    const slotX = COUNTER_SLOTS.find((s) => !taken.has(s));
    if (slotX === undefined) return;
    const archetypes = Object.keys(ARCHETYPES) as CustomerArchetype[];
    const archetype = Phaser.Utils.Array.GetRandom(archetypes);
    const wanted = Phaser.Utils.Array.GetRandom(ARCHETYPES[archetype].wants);
    const visitor = new Visitor(this, `v-${Date.now()}-${Math.floor(Math.random() * 1e4)}`, archetype, wanted, slotX, {
      patienceMs: 16000,
      reduceMotion: this.reduceMotion,
      onClick: (v) =>
        this.store.dispatch({
          type: 'SELECT_VISITOR',
          visitor: { id: v.id, archetype: v.archetype, wantedRecipeId: v.wantedRecipeId },
        }),
      onGone: (v) => {
        this.visitors = this.visitors.filter((x) => x !== v);
        this.store.dispatch({ type: 'VISITOR_LEFT', id: v.id });
      },
    });
    this.visitors.push(visitor);
  }

  update(time: number, delta: number) {
    const { save, ui } = this.store;
    if (!save) return;

    // Cintilar das luzes (mais forte à noite)
    const flicker = this.reduceMotion() ? 0 : Math.sin(time / 170) * 0.04 + Math.sin(time / 53) * 0.03;
    const base = 0.55 + this.nightness * 0.45;
    this.glows.forEach((g, i) => g.setAlpha(Phaser.Math.Clamp(base + flicker * (i + 1), 0, 1)));

    this.visitors.forEach((v) => v.update(time));

    if (save.phase !== 'expediente' || ui.paused) return;

    this.clockAcc += delta;
    while (this.clockAcc >= 1000) {
      this.clockAcc -= 1000;
      this.store.dispatch({ type: 'TICK', minutes: GAME_MIN_PER_SECOND });
    }

    this.spawnAcc += delta;
    if (this.spawnAcc >= this.nextSpawnMs) {
      this.spawnAcc = 0;
      this.nextSpawnMs = 7000 + Math.random() * 7000;
      if (this.visitors.filter((v) => v.state !== 'saindo').length < MAX_VISITORS) this.spawnVisitor();
    }
  }
}
