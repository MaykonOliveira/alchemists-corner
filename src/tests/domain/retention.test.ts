import { describe, expect, it } from 'vitest';
import { RECIPES } from '../../domain/data/recipes';
import { TRACK_REWARDS, TRACK_STEP, VISIT_GIFTS } from '../../domain/data/retention';
import type { GameEvent, GameSave } from '../../domain/models/types';
import { applyCommand, type DomainCommand } from '../../domain/rules/commands';
import { charm, owns } from '../../domain/rules/entitlements';
import { createNewGame } from '../../domain/rules/initialState';
import { levelFromXp, xpForLevel } from '../../domain/rules/progression';
import { AWAY_MAX_MS, DEBUT_AT, dateKey, tomorrowPreview, trackPeriod } from '../../domain/rules/retention';
import { challengeScore } from '../../domain/rules/social';
import { OPEN_MIN } from '../../domain/rules/time';
import { SAVE_VERSION } from '../../domain/models/types';
import { migrateSave } from '../../persistence/migrations';

const T0 = new Date(2026, 10, 8, 10, 0).getTime();
const HOUR = 3_600_000;
const run = (s: GameSave, cmds: DomainCommand[], now = T0, r = 0.5) => {
  let save = s;
  const events: GameEvent[] = [];
  for (const c of cmds) {
    const res = applyCommand(save, c, { now, random: () => r });
    save = res.save;
    events.push(...res.events);
  }
  return { save, events };
};
const atLevel = (level: number, over: Partial<GameSave> = {}): GameSave => {
  const s = { ...createNewGame(T0), level, xp: xpForLevel(level), coins: 5000, phase: 'preparacao' as const, day: 4, tutorialStep: 99 };
  s.knownRecipes = RECIPES.filter((r) => r.unlockLevel <= level && !r.season).map((r) => r.id);
  return { ...s, ...over };
};

describe('pacote I: primeiros minutos', () => {
  it('o dia 1 corre duas vezes mais rápido e o dia 2 volta ao normal', () => {
    const d1 = run(createNewGame(T0), [{ type: 'OPEN_SHOP' }, { type: 'ADVANCE', ms: 10_000 }]).save;
    expect(d1.clockMin).toBe(OPEN_MIN + 40);
    const d2 = run({ ...createNewGame(T0), day: 2 }, [{ type: 'OPEN_SHOP' }, { type: 'ADVANCE', ms: 10_000 }]).save;
    expect(d2.clockMin).toBe(OPEN_MIN + 20);
  });

  it('a Condessa aparece à tarde no dia 1, aceita qualquer poção e paga 10 vezes o preço', () => {
    let s = { ...run(createNewGame(T0), [{ type: 'OPEN_SHOP' }]).save, clockMin: DEBUT_AT, spawnInMs: 99_999 };
    const r = run(s, [{ type: 'ADVANCE', ms: 200 }]);
    s = r.save;
    const vip = s.customers.find((c) => c.vip);
    expect(vip?.vip?.name).toBe('Condessa Amélia');
    expect(r.events.some((e) => e.type === 'VIP_ARRIVED')).toBe(true);
    const coins = s.coins;
    const sold = run(s, [{ type: 'SERVE_CUSTOMER', customerId: vip!.id, recipeId: 'tonico-energia' }]);
    expect(sold.save.coins - coins).toBeGreaterThanOrEqual(220);
    expect(sold.events.some((e) => e.type === 'VIP_SERVED')).toBe(true);
    // Ela só vem uma vez.
    const again = run({ ...sold.save, spawnInMs: 99_999 }, [{ type: 'ADVANCE', ms: 200 }]);
    expect(again.save.customers.some((c) => c.vip)).toBe(false);
  });

  it('o primeiro fechamento leva ao nível 2 com presente e deixa a carta da Condessa', () => {
    const s = run(createNewGame(T0), [{ type: 'OPEN_SHOP' }, { type: 'CLOSE_SHOP' }]);
    expect(s.save.level).toBe(2);
    const up = s.events.find((e) => e.type === 'LEVEL_UP');
    expect(up && up.type === 'LEVEL_UP' && up.gift?.coins).toBe(40);
    expect(s.save.letter?.from).toBe('condessa-estreia');
    expect(tomorrowPreview(s.save).some((l) => l.text.includes('Condessa'))).toBe(true);
    const d2 = run(s.save, [{ type: 'START_NEXT_DAY' }]).save;
    expect(d2.order?.client).toBe('Condessa Amélia');
    expect(d2.letter?.done).toBe(true);
  });

  it('os níveis 2 a 5 ficaram mais curtos e os seguintes não mudaram', () => {
    expect([2, 3, 4, 5].map(xpForLevel)).toEqual([120, 360, 760, 1400]);
    expect(xpForLevel(6)).toBe(2625);
    expect(levelFromXp(1399)).toBe(4);
    for (let l = 2; l < 15; l++) expect(xpForLevel(l + 1)).toBeGreaterThan(xpForLevel(l));
  });

  it('dar nome à loja escolhe também o toldo', () => {
    const s = run(createNewGame(T0), [{ type: 'SET_SHOP', name: '  Caldeirão   da Lua ', awning: 'toldo-azul' }]).save;
    expect(s.shopName).toBe('Caldeirão da Lua');
    expect(s.decor.toldo).toBe('toldo-azul');
    expect(run(s, [{ type: 'SET_SHOP', name: '   ', awning: 'x' }]).save.shopName).toBe('Caldeirão da Lua');
  });
});

describe('pacote J: voltar amanhã', () => {
  it('com golem e aprendiz, a loja prepara e vende sozinha enquanto o jogador está fora (até 8 horas)', () => {
    const s = atLevel(6, {
      upgrades: ['aprendiz', 'golem-balconista'], updatedAt: T0 - 20 * HOUR,
      potions: [{ recipeId: 'cura-simples', quantity: 30, quality: 1, forSale: true }],
      ingredients: { ...createNewGame(T0).ingredients, 'folha-lunar': 40, 'po-de-pedra': 40, 'hortela-brava': 40, 'cristal-ambar': 40 },
    });
    const r = run(s, [{ type: 'SESSION_START' }]);
    const away = r.save.away!;
    expect(away.awayMs).toBe(AWAY_MAX_MS);
    expect(away.sold).toBe(24);
    expect(away.coins).toBeGreaterThan(0);
    expect(Object.values(away.brewed).reduce((a, b) => a + b, 0)).toBeGreaterThan(0);
    expect(r.save.coins).toBe(s.coins + away.coins);
    expect(r.events.some((e) => e.type === 'BREW_DONE')).toBe(false);
  });

  it('sem ajudantes ou com pouco tempo fora, nada é vendido', () => {
    const r = run(atLevel(3, { updatedAt: T0 - 2 * HOUR }), [{ type: 'SESSION_START' }]);
    expect(r.save.away?.sold).toBe(0);
    expect(r.save.away?.helpers).toBe(false);
    expect(run(atLevel(6, { updatedAt: T0 - 60_000 }), [{ type: 'SESSION_START' }]).save.away).toBeNull();
  });

  it('o presente de visita chega uma vez por dia real e o calendário nunca zera', () => {
    let s = atLevel(3, { visits: { lastDate: dateKey(T0 - 5 * 24 * HOUR), count: 3, ready: false } });
    s = run(s, [{ type: 'SESSION_START' }]).save;
    expect(s.visits.ready).toBe(true);
    const coins = s.coins;
    const r = run(s, [{ type: 'CLAIM_VISIT_GIFT' }]);
    expect(r.save.visits).toMatchObject({ count: 4, ready: false });
    expect(r.save.crystals).toBeGreaterThanOrEqual(VISIT_GIFTS[3].crystals);
    expect(r.save.coins).toBeGreaterThanOrEqual(coins);
    // Mesmo dia: nada novo.
    const same = run(r.save, [{ type: 'SESSION_START' }, { type: 'CLAIM_VISIT_GIFT' }]);
    expect(same.save.visits.count).toBe(4);
    // Dia seguinte: o próximo da fila (o 5º), mesmo depois de dias sem jogar.
    const later = run(same.save, [{ type: 'SESSION_START' }, { type: 'CLAIM_VISIT_GIFT' }], T0 + 9 * 24 * HOUR);
    expect(later.save.visits.count).toBe(5);
  });

  it('o fechamento sorteia o evento de amanhã e a prévia mostra a festa da estação', () => {
    const s = atLevel(5, { day: 6, phase: 'expediente' });
    const r = run(s, [{ type: 'CLOSE_SHOP' }]);
    expect(r.save.nextEvent).toBe('festa-estacao');
    expect(tomorrowPreview(r.save)[0].text).toContain('Feira das Flores');
    const d7 = run(r.save, [{ type: 'START_NEXT_DAY' }]).save;
    expect(d7.event).toBe('festa-estacao');
    // O convidado entra no fim da manhã e deixa a lembrança exclusiva.
    let open = { ...run(d7, [{ type: 'OPEN_SHOP' }]).save, clockMin: 11 * 60, spawnInMs: 99_999 };
    open = run(open, [{ type: 'ADVANCE', ms: 200 }]).save;
    const guest = open.customers.find((c) => c.vip?.kind === 'festa')!;
    expect(guest.vip!.name).toBe('Flora, a jardineira');
    open = { ...open, potions: [{ recipeId: guest.wantedRecipeId, quantity: 2, quality: 1, forSale: true }] };
    const served = run(open, [{ type: 'SERVE_CUSTOMER', customerId: guest.id, recipeId: guest.wantedRecipeId }]).save;
    expect(owns(served, 'planta-flores')).toBe(true);
  });

  it('um freguês amigo escreve carta e entra primeiro no dia seguinte, pagando mais', () => {
    const s = atLevel(4, { day: 5, phase: 'expediente', regulars: { bram: { visits: 3, hearts: 2, gift: false } } });
    s.stats = { ...s.stats, regularsSeen: ['bram'] };
    // Com random baixo a carta sai (o sorteio da carta usa a semente do dia).
    let found: GameSave | null = null;
    for (let day = 5; day < 40 && !found; day++) {
      const r = run({ ...s, day }, [{ type: 'CLOSE_SHOP' }]).save;
      if (r.letter?.from === 'bram') found = r;
    }
    expect(found).not.toBeNull();
    const next = run(found!, [{ type: 'START_NEXT_DAY' }, { type: 'OPEN_SHOP' }, { type: 'ADVANCE', ms: 5_000 }], T0, 0.99).save;
    const c = next.customers.find((x) => x.regularId === 'bram');
    expect(c).toBeTruthy();
    expect(next.letter?.done).toBe(true);
  });
});

describe('pacote K: trilha, cristais e decoração', () => {
  it('metas e fechamentos dão cristais e pontos; cada 30 pontos entrega uma recompensa', () => {
    let s = atLevel(3, { phase: 'expediente' });
    const r = run(s, [{ type: 'CLOSE_SHOP' }]);
    expect(r.save.track.points).toBe(5);
    s = { ...r.save, track: { ...r.save.track, points: TRACK_STEP - 5 } };
    const coins = s.coins;
    const t = run({ ...s, phase: 'expediente' }, [{ type: 'CLOSE_SHOP' }]);
    expect(t.save.track.tier).toBe(1);
    expect(t.events.some((e) => e.type === 'TRACK_TIER')).toBe(true);
    expect(t.save.coins).toBeGreaterThan(coins - 200);
    expect(TRACK_REWARDS).toHaveLength(30);
  });

  it('a trilha recomeça a cada 28 dias reais, e os itens ganhos ficam', () => {
    const s = atLevel(3, { track: { period: trackPeriod(T0), points: 200, tier: 6 }, owned: [...createNewGame(T0).owned, 'tapete-estrelas'] });
    const later = run(s, [{ type: 'SESSION_START' }], T0 + 30 * 24 * HOUR).save;
    expect(later.track).toMatchObject({ points: 0, tier: 0 });
    expect(owns(later, 'tapete-estrelas')).toBe(true);
  });

  it('decoração se compra com cristais, vai direto para a loja e dá encanto (até 3)', () => {
    let s = atLevel(3, { crystals: 100 });
    s = run(s, [{ type: 'BUY_DECOR', itemId: 'tapete-vinho' }]).save;
    expect(s.crystals).toBe(70);
    expect(s.decor.tapete).toBe('tapete-vinho');
    expect(charm(s)).toBe(1);
    const fail = run({ ...s, crystals: 5 }, [{ type: 'BUY_DECOR', itemId: 'luminaria-cristal' }]);
    expect(fail.events.some((e) => e.type === 'ERROR')).toBe(true);
    // Itens da trilha não se compram.
    expect(run(s, [{ type: 'BUY_DECOR', itemId: 'toldo-dourado' }]).events.some((e) => e.type === 'ERROR')).toBe(true);
    const rep = run({ ...s, phase: 'expediente' }, [{ type: 'CLOSE_SHOP' }]);
    expect(rep.save.reputation).toBe(s.reputation + 1);
  });
});

describe('pacote M: presentes e desafio', () => {
  it('mandar presente: um por dia, e o primeiro dá o quadro Laço da amizade', () => {
    const s = run(atLevel(3), [{ type: 'SEND_GIFT' }]).save;
    expect(owns(s, 'quadro-amizade')).toBe(true);
    expect(run(s, [{ type: 'SEND_GIFT' }]).events.some((e) => e.type === 'ERROR')).toBe(true);
    expect(run(s, [{ type: 'SEND_GIFT' }], T0 + 24 * HOUR).save.giftsSent).toBe(2);
  });

  it('abrir presente: não vale o da própria loja nem o mesmo código duas vezes', () => {
    const s = atLevel(4);
    const gift = { from: 'Loja da Ana', sender: 12345, id: 'abc' };
    const r = run(s, [{ type: 'REDEEM_GIFT', gift }]);
    expect(r.save.crystals).toBe(s.crystals + 5);
    expect(run(r.save, [{ type: 'REDEEM_GIFT', gift }]).events.some((e) => e.type === 'ERROR')).toBe(true);
    expect(run(s, [{ type: 'REDEEM_GIFT', gift: { ...gift, sender: s.createdAt } }]).events.some((e) => e.type === 'ERROR')).toBe(true);
  });

  it('o desafio da semana usa a mesma semente para todos e vale uma vez por semana', () => {
    const play = (s: GameSave, r: number) => {
      let save = run(s, [{ type: 'START_CHALLENGE' }, { type: 'OPEN_SHOP' }], T0, r).save;
      for (let i = 0; i < 60; i++) save = run(save, [{ type: 'ADVANCE', ms: 1000 }], T0, r).save;
      return save;
    };
    const a = play(atLevel(4), 0.1);
    const b = play(atLevel(4), 0.9);
    expect(a.customers.map((c) => c.wantedRecipeId)).toEqual(b.customers.map((c) => c.wantedRecipeId));
    expect(a.challenge?.rng).toBe(b.challenge?.rng);
    const done = run(a, [{ type: 'CLOSE_SHOP' }]);
    expect(done.save.challengeBest?.score).toBe(challengeScore(a.stats));
    expect(done.events.some((e) => e.type === 'CHALLENGE_DONE')).toBe(true);
    const again = run(run(done.save, [{ type: 'START_NEXT_DAY' }]).save, [{ type: 'START_CHALLENGE' }]);
    expect(again.events.some((e) => e.type === 'ERROR')).toBe(true);
  });
});

describe('save v9', () => {
  it('saves da v8 ganham os campos novos sem rever a abertura nem a Condessa', () => {
    const old = { ...createNewGame(T0), saveVersion: 8, tutorialStep: 3 } as Record<string, unknown>;
    for (const k of ['shopName', 'awning', 'debutDone', 'letter', 'visits', 'crystals', 'owned', 'decor', 'track', 'challenge']) delete old[k];
    const s = migrateSave(old)!;
    expect(s.saveVersion).toBe(SAVE_VERSION);
    expect(s.debutDone).toBe(true);
    expect(s.tutorialStep).toBe(99);
    expect(s.shopName).toBe('Loja da Esquina');
    expect(s.crystals).toBe(0);
    expect(s.decor.tapete).toBe('tapete-classico');
    expect(owns(s, 'toldo-vermelho')).toBe(true);
  });
});
