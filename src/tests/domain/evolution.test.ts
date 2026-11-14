import { describe, expect, it } from 'vitest';
import type { GameEvent, GameSave } from '../../domain/models/types';
import { applyCommand, type DomainCommand } from '../../domain/rules/commands';
import { createNewGame } from '../../domain/rules/initialState';
import { famBonus, pendingPerks, staffLevel, staffSpeed, staffXpFor } from '../../domain/rules/evoCore';
import { helperWages, potionCapacity } from '../../domain/rules/economy';
import { brewDurationMs } from '../../domain/rules/alchemy';
import { fairyPrice, FAIRY, peddlerPlan, PEDDLER, EXPLORER, NIGHT_MANAGER, PEDDLER_INTERVAL_MS, FAIRY_INTERVAL_MS } from '../../domain/rules/staff';
import { branchCost, branchIncome, KINGDOM_LEVEL } from '../../domain/rules/kingdom';
import { simulateAway } from '../../domain/rules/retention';
import { COURSE_COST, STAFF_ROLES } from '../../domain/data/staff';
import { CITIES } from '../../domain/data/kingdom';
import { FAMILIARS } from '../../domain/data/familiars';
import { HELPER_IDS } from '../../domain/data/upgrades';
import { MOMENT_MS } from '../../domain/rules/gazette';
import { migrateSave } from '../../persistence/migrations';
import { emptyEvo } from '../../domain/rules/evoCore';
import { priceRange } from '../../domain/rules/economy';

const ctx = { now: 0, random: () => 0.5 };
const run = (s: GameSave, ...cmds: DomainCommand[]) => {
  let save = s;
  const events: GameEvent[] = [];
  for (const c of cmds) {
    const r = applyCommand(save, c, ctx);
    save = r.save;
    events.push(...r.events);
  }
  return { save, events };
};
const game = (over: Partial<GameSave> = {}): GameSave => ({ ...createNewGame(0), level: 15, coins: 500000, ...over });
const withStaff = (s: GameSave, id: string, xp: number, cap = 5, perks: ('a' | 'b')[] = []): GameSave =>
  ({ ...s, evo: { ...s.evo, staff: { ...s.evo.staff, [id]: { xp, cap, perks } } } });

describe('E1 equipe que sobe de nível', () => {
  it('todo ajudante tem carreira com dois caminhos', () => {
    expect(new Set(STAFF_ROLES.map((r) => r.id))).toEqual(new Set(HELPER_IDS));
  });

  it('o golem ganha experiência atendendo e sobe de nível com festa', () => {
    const s = withStaff(game({ upgrades: ['golem-balconista'] }), 'golem-balconista', staffXpFor(2) - 1);
    const { save, events } = run(s, { type: 'OPEN_SHOP' }, { type: 'CLOSE_SHOP' });
    expect(staffLevel(save, 'golem-balconista')).toBe(2);
    expect(events.some((e) => e.type === 'STAFF_LEVEL' && e.staffId === 'golem-balconista' && e.level === 2)).toBe(true);
    expect(save.evo.news.some((n) => n.kind === 'staff-level')).toBe(true);
  });

  it('no nível 3 abre uma escolha de caminho, e a rapidez acelera o golem', () => {
    const s = withStaff(game({ upgrades: ['golem-balconista'] }), 'golem-balconista', staffXpFor(3));
    expect(pendingPerks(s, 'golem-balconista')).toBe(1);
    const { save } = run(s, { type: 'CHOOSE_PERK', staffId: 'golem-balconista', side: 'a' });
    expect(pendingPerks(save, 'golem-balconista')).toBe(0);
    expect(staffSpeed(save, 'golem-balconista')).toBeCloseTo(1.15);
    // Sem escolha em aberto, não aceita outra.
    expect(run(save, { type: 'CHOOSE_PERK', staffId: 'golem-balconista', side: 'b' }).save.evo.staff['golem-balconista'].perks).toEqual(['a']);
  });

  it('acima do nível 5 precisa de curso na Guilda, que custa moedas', () => {
    const s = withStaff(game({ upgrades: ['aprendiz'] }), 'aprendiz', staffXpFor(7));
    expect(staffLevel(s, 'aprendiz')).toBe(5);
    const { save, events } = run(s, { type: 'BUY_COURSE', staffId: 'aprendiz' });
    expect(save.coins).toBe(s.coins - COURSE_COST[6]);
    expect(staffLevel(save, 'aprendiz')).toBe(6);
    expect(events.some((e) => e.type === 'STAFF_LEVEL' && e.level === 6 && e.perk)).toBe(true);
  });

  it('o salário sobe 10% por nível do funcionário', () => {
    const s = game({ upgrades: ['golem-balconista'] });
    const raised = withStaff(s, 'golem-balconista', staffXpFor(5));
    expect(helperWages(raised)).toBe(Math.round(helperWages(s) * 1.4));
  });

  it('dá para dar nome ao funcionário e o funcionário do dia sai no relatório', () => {
    let s = game({ upgrades: ['golem-balconista'] });
    s = run(s, { type: 'RENAME_STAFF', staffId: 'golem-balconista', name: '  Pedrão  ' }).save;
    expect(s.evo.staff['golem-balconista'].name).toBe('Pedrão');
    s = { ...s, phase: 'expediente', evo: { ...s.evo, dayWork: { 'golem-balconista': 30 } } };
    const report = run(s, { type: 'CLOSE_SHOP' }).save.reports.at(-1)!;
    expect(report.staffOfDay?.id).toBe('golem-balconista');
  });
});

describe('E2 funcionários novos', () => {
  it('a fada ajusta os preços pela estratégia e respeita o preço travado', () => {
    let s = game({ upgrades: [FAIRY], knownRecipes: ['cura-simples', 'tonico-energia'], phase: 'preparacao' });
    s = run(s, { type: 'LOCK_PRICE', recipeId: 'tonico-energia', locked: true }).save;
    const before = s.prices['tonico-energia'];
    const { save, events } = run(s, { type: 'ADVANCE', ms: FAIRY_INTERVAL_MS });
    expect(events.some((e) => e.type === 'PRICE_TUNED')).toBe(true);
    expect(save.prices['cura-simples']).toBe(fairyPrice(save, 'cura-simples'));
    expect(save.prices['tonico-energia']).toBe(before);
    const fama = run(save, { type: 'SET_STRATEGY', strategy: 'fama' }).save;
    expect(fairyPrice(fama, 'cura-simples')).toBe(priceRange(fama, 'cura-simples').base);
  });

  it('preço mexido à mão com a fada na loja fica travado', () => {
    const s = game({ upgrades: [FAIRY], knownRecipes: ['cura-simples'] });
    const { save } = run(s, { type: 'SET_PRICE', recipeId: 'cura-simples', price: 20 });
    expect(save.evo.fairy.locked).toContain('cura-simples');
  });

  it('o mascate vende o excesso da prateleira na praça', () => {
    const s = game({
      upgrades: [PEDDLER], phase: 'expediente', spawnInMs: 999999,
      potions: [{ recipeId: 'cura-simples', quantity: 14, quality: 1, forSale: true }],
    });
    expect(peddlerPlan(s)?.qty).toBeGreaterThan(0);
    const { save, events } = run(s, { type: 'ADVANCE', ms: PEDDLER_INTERVAL_MS });
    const sale = events.find((e) => e.type === 'PEDDLER_SALE');
    expect(sale).toBeTruthy();
    expect(save.potions[0].quantity).toBeLessThan(14);
    expect(save.coins).toBeGreaterThan(s.coins);
  });

  it('a exploradora parte sozinha e o corvo continua em casa', () => {
    const s = game({ upgrades: ['corvo-entregador', EXPLORER], phase: 'preparacao' });
    const { save, events } = run(s, { type: 'ADVANCE', ms: 100 });
    expect(save.expedition?.byExplorer).toBe(true);
    expect(events.some((e) => e.type === 'EXPEDITION_SENT' && e.byExplorer)).toBe(true);
    // Na volta, a exploradora ganha experiência.
    const back = run({ ...save, phase: 'fechamento', day: save.expedition!.returnDay - 1 }, { type: 'START_NEXT_DAY' });
    expect(back.events.some((e) => e.type === 'EXPEDITION_BACK' && e.byExplorer)).toBe(true);
    expect(back.save.evo.staff[EXPLORER]?.xp).toBeGreaterThan(0);
  });

  it('a salamandra acelera o caldeirão e o aprendiz sai Fino', () => {
    const s = game({ knownRecipes: ['cura-simples'] });
    const hot = { ...s, upgrades: ['salamandra'] };
    expect(brewDurationMs(hot, 'cura-simples', 1)).toBeLessThan(brewDurationMs(s, 'cura-simples', 1));
    const brewing = run({ ...hot, upgrades: ['salamandra', 'aprendiz'], ingredients: { 'folha-lunar': 20, 'po-de-pedra': 20 }, potions: [] }, { type: 'ADVANCE', ms: 100 }).save;
    expect(brewing.brew?.hits).toBeGreaterThanOrEqual(2);
  });

  it('o gerente noturno faz a loja vender bem mais enquanto você está fora', () => {
    const stock = [{ recipeId: 'cura-simples', quantity: 200, quality: 1, forSale: true }];
    const base = game({ upgrades: ['golem-balconista'], potions: stock });
    const d1 = { s: structuredClone(base), events: [], ctx };
    const d2 = { s: structuredClone({ ...base, upgrades: ['golem-balconista', NIGHT_MANAGER] }), events: [], ctx };
    const plain = simulateAway(d1, 8 * 3_600_000)!;
    const night = simulateAway(d2, 8 * 3_600_000)!;
    expect(plain.sold).toBe(24);
    expect(night.sold).toBe(60);
  });
});

describe('E3 filiais pelo reino', () => {
  it('abrir, crescer e supervisionar uma filial', () => {
    const city = CITIES[0];
    let s = game({ upgrades: ['golem-balconista'] });
    s = withStaff(s, 'golem-balconista', staffXpFor(5));
    s = run(s, { type: 'OPEN_BRANCH', cityId: city.id }).save;
    expect(s.evo.branches[city.id].size).toBe(1);
    expect(s.coins).toBe(500000 - branchCost(city.id, 1));
    const plain = branchIncome(s, city.id);
    s = run(s, { type: 'SET_MANAGER', cityId: city.id, staffId: 'golem-balconista' }).save;
    expect(branchIncome(s, city.id)).toBeGreaterThan(plain);
    s = run(s, { type: 'GROW_BRANCH', cityId: city.id }).save;
    expect(s.evo.branches[city.id].size).toBe(2);
  });

  it('funcionário abaixo do nível 5 não supervisiona', () => {
    let s = game({ upgrades: ['golem-balconista'] });
    s = run(s, { type: 'OPEN_BRANCH', cityId: CITIES[0].id }).save;
    expect(run(s, { type: 'SET_MANAGER', cityId: CITIES[0].id, staffId: 'golem-balconista' }).save.evo.branches[CITIES[0].id].manager).toBeNull();
  });

  it('cidade só abre no nível dela', () => {
    const s = game({ level: KINGDOM_LEVEL });
    expect(run(s, { type: 'OPEN_BRANCH', cityId: 'capital' }).save.evo.branches.capital).toBeUndefined();
  });

  it('no fechamento as filiais pagam o lucro e levam a remessa das favoritas', () => {
    let s = game({ phase: 'expediente', potions: [{ recipeId: 'cura-simples', quantity: 10, quality: 1, forSale: true }] });
    s = run(s, { type: 'OPEN_BRANCH', cityId: 'porto-sereias' }).save;
    const { save, events } = run(s, { type: 'CLOSE_SHOP' });
    const inc = events.find((e) => e.type === 'BRANCH_INCOME');
    expect(inc && inc.type === 'BRANCH_INCOME' && inc.shipped).toBe(3);
    expect(save.potions[0].quantity).toBe(7);
    expect(save.reports.at(-1)!.branches).toBeGreaterThan(0);
  });
});

describe('E4 familiares', () => {
  it('ovo choca no ninho e o familiar entra ativo', () => {
    let s = game({ phase: 'fechamento' });
    s = { ...s, evo: { ...s.evo, eggs: [{ id: 1, hatchDay: s.day + 1, source: 'expedicao' }] } };
    const { save, events } = run(s, { type: 'START_NEXT_DAY' });
    expect(save.evo.familiars).toHaveLength(1);
    expect(save.evo.activeFamiliars).toEqual(save.evo.familiars);
    expect(events.some((e) => e.type === 'FAMILIAR_HATCHED')).toBe(true);
  });

  it('só dois ficam ativos, e o bônus aparece nas contas', () => {
    let s = game();
    s = { ...s, evo: { ...s.evo, familiars: ['fadinha', 'slime', 'sapo-dourado'], activeFamiliars: ['fadinha', 'slime'] } };
    expect(potionCapacity(s)).toBe(potionCapacity({ ...s, evo: emptyEvo() }) + 4);
    expect(run(s, { type: 'SET_FAMILIAR', familiarId: 'sapo-dourado', on: true }).save.evo.activeFamiliars).toHaveLength(2);
    const shiny = { ...s, evo: { ...s.evo, shiny: ['slime'] } };
    expect(famBonus(shiny, 'paciencia')).toBeCloseTo(0.15);
  });

  it('todos os familiares têm bônus diferente', () => {
    expect(new Set(FAMILIARS.map((f) => f.bonus)).size).toBe(FAMILIARS.length);
  });
});

describe('E5 Gazeta e momentos', () => {
  it('as notícias do dia viram a Gazeta da manhã', () => {
    let s = game({ phase: 'fechamento' });
    s = { ...s, evo: { ...s.evo, news: [{ kind: 'record', ref: 'revenue' }] } };
    const { save } = run(s, { type: 'START_NEXT_DAY' });
    expect(save.evo.gazette?.items).toHaveLength(1);
    expect(save.evo.gazette?.read).toBe(false);
    expect(run(save, { type: 'READ_GAZETTE' }).save.evo.gazette?.read).toBe(true);
  });

  it('momento aparece na hora sorteada; tocar dá prêmio, ignorar não tira nada', () => {
    let s = game({ phase: 'expediente', spawnInMs: 999999, clockMin: 600 });
    s = { ...s, evo: { ...s.evo, momentAt: 600 } };
    const started = run(s, { type: 'ADVANCE', ms: 100 });
    expect(started.save.evo.moment).not.toBeNull();
    const kind = started.save.evo.moment!.kind;
    const caught = run(started.save, { type: 'CATCH_MOMENT' });
    expect(caught.events.some((e) => e.type === 'MOMENT_CAUGHT' && e.kind === kind)).toBe(true);
    const gone = run(started.save, { type: 'ADVANCE', ms: MOMENT_MS + 10 });
    expect(gone.save.evo.moment).toBeNull();
    expect(gone.save.coins).toBeGreaterThanOrEqual(started.save.coins);
  });
});

describe('save v11', () => {
  it('save antigo ganha as evoluções vazias', () => {
    const old = { ...createNewGame(0), saveVersion: 10 } as unknown as Record<string, unknown>;
    delete old.evo;
    const s = migrateSave(old)!;
    expect(s.evo).toEqual(emptyEvo());
  });

  it('save com evoluções volta igual', () => {
    let s = game({ upgrades: ['golem-balconista'] });
    s = withStaff(s, 'golem-balconista', 300, 7, ['a']);
    s = { ...s, evo: { ...s.evo, familiars: ['slime'], activeFamiliars: ['slime'], branches: { 'porto-sereias': { size: 2, manager: null, earned: 10 } } } };
    const back = migrateSave(JSON.parse(JSON.stringify(s)))!;
    expect(back.evo.staff).toEqual(s.evo.staff);
    expect(back.evo.branches).toEqual(s.evo.branches);
    expect(back.evo.activeFamiliars).toEqual(['slime']);
  });
});
