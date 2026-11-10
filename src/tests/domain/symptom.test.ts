import { describe, expect, it } from 'vitest';
import { SYMPTOMS } from '../../domain/data/symptoms';
import { RECIPES } from '../../domain/data/recipes';
import type { Customer, GameSave } from '../../domain/models/types';
import { applyCommand, type DomainCommand } from '../../domain/rules/commands';
import { bestOffer, DIAGNOSIS_LEARN, DIAGNOSIS_TIP, WRONG_GUESS_PATIENCE } from '../../domain/rules/customers';
import { createNewGame } from '../../domain/rules/initialState';

const run = (s: GameSave, c: DomainCommand, random = () => 0.5) => applyCommand(s, c, { now: 0, random });
const customer = (over: Partial<Customer> = {}): Customer => ({
  id: 'c-x', archetype: 'morador', wantedRecipeId: 'cura-simples', budgetFactor: 1, patienceMs: 30000,
  waitedMs: 0, offer: null, remark: SYMPTOMS['cura-simples'][0], symptom: true, ...over,
});
const open = (c: Customer, over: Partial<GameSave> = {}): GameSave => ({
  ...createNewGame(0), phase: 'expediente', spawnInMs: 99999, reputation: 0, customers: [c],
  potions: [
    { recipeId: 'cura-simples', quantity: 3, quality: 1, forSale: true },
    { recipeId: 'balsamo-calmante', quantity: 3, quality: 1, forSale: true },
    { recipeId: 'tonico-energia', quantity: 3, quality: 1, forSale: true },
  ],
  knownRecipes: ['cura-simples', 'tonico-energia', 'elixir-concentracao', 'balsamo-calmante'],
  ...over,
});
const serve = (s: GameSave, recipeId: string) => run(s, { type: 'SERVE_CUSTOMER', customerId: 'c-x', recipeId });

describe('pedido por sintoma (auditoria P0.2)', () => {
  it('toda receita comum tem três pistas', () => {
    for (const r of RECIPES.filter((x) => !x.legend && !x.secret)) expect(SYMPTOMS[r.id]?.length, r.id).toBe(3);
  });

  it('a partir do dia 2, uma boa parte conta o problema (mas não quase todos); no dia 1, todo mundo diz o nome', () => {
    const count = (day: number) => {
      let seed = 7;
      const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      let n = 0;
      let total = 0;
      for (let i = 0; i < 200; i++) {
        const s: GameSave = { ...createNewGame(0), day, level: 3, phase: 'expediente', spawnInMs: 0, customers: [], stats: { ...createNewGame(0).stats, served: 5 } };
        const c = run(s, { type: 'ADVANCE', ms: 200 }, random).save.customers[0];
        if (!c || c.regularId || c.vip) continue;
        total++;
        if (c.symptom) n++;
      }
      return n / total;
    };
    expect(count(1)).toBe(0);
    // Diagnóstico é o desafio do balcão, mas a rotina precisa existir para o golem (era 70% e o golem ficava sem trabalho).
    expect(count(3)).toBeGreaterThan(0.3);
    expect(count(3)).toBeLessThan(0.6);
  });

  it('o atendimento rápido não entrega a resposta', () => {
    const s = open(customer());
    expect(bestOffer(s, s.customers[0])).toBeNull();
  });

  it('acerto em cheio paga gorjeta e dá reputação a mais', () => {
    const { save, events } = serve(open(customer()), 'cura-simples');
    expect(events).toContainEqual(expect.objectContaining({ type: 'SALE', price: 18 + Math.round(18 * DIAGNOSIS_TIP), diagnosed: true }));
    expect(save.reputation).toBe(3); // certa + rápida + diagnóstico
  });

  it('a parecida da mesma categoria paga sem gorjeta', () => {
    const { events } = serve(open(customer({ budgetFactor: 2 })), 'balsamo-calmante');
    const sale = events.find((e) => e.type === 'SALE') as { diagnosed?: boolean; substitute: boolean };
    expect(sale.substitute).toBe(true);
    expect(sale.diagnosed).toBeUndefined();
  });

  it('errou: o cliente explica melhor e perde um pouco da paciência', () => {
    const { save, events } = serve(open(customer()), 'tonico-energia');
    expect(events).toContainEqual({ type: 'SYMPTOM_WRONG', customerId: 'c-x' });
    const c = save.customers[0];
    expect(c.remark).toContain('recuperação de ferimentos');
    expect(c.waitedMs).toBe(30000 * WRONG_GUESS_PATIENCE);
    expect(save.potions.find((p) => p.recipeId === 'tonico-energia')!.quantity).toBe(3);
  });
});

describe('caderno de diagnósticos', () => {
  it('cada acerto do jogador entra no caderno; no terceiro, a loja passa a reconhecer o problema', () => {
    let s = open(customer(), { diagnoses: { 'cura-simples': DIAGNOSIS_LEARN - 2 } });
    let r = serve(s, 'cura-simples');
    expect(r.save.diagnoses['cura-simples']).toBe(DIAGNOSIS_LEARN - 1);
    expect(r.events.find((e) => e.type === 'DIAGNOSIS_LEARNED')).toBeUndefined();
    s = { ...r.save, customers: [customer()] };
    r = serve(s, 'cura-simples');
    expect(r.save.diagnoses['cura-simples']).toBe(DIAGNOSIS_LEARN);
    expect(r.events).toContainEqual({ type: 'DIAGNOSIS_LEARNED', recipeId: 'cura-simples' });
  });

  it('a parecida não conta como diagnóstico', () => {
    const { save } = serve(open(customer({ budgetFactor: 2 })), 'balsamo-calmante');
    expect(save.diagnoses['cura-simples'] ?? 0).toBe(0);
  });

  it('sintoma do caderno vira atendimento de um toque (só a poção exata)', () => {
    const s = open(customer(), { diagnoses: { 'cura-simples': DIAGNOSIS_LEARN } });
    expect(bestOffer(s, s.customers[0])).toBe('cura-simples');
    const out = open(customer(), { diagnoses: { 'cura-simples': DIAGNOSIS_LEARN }, potions: [{ recipeId: 'balsamo-calmante', quantity: 3, quality: 1, forSale: true }] });
    expect(bestOffer(out, out.customers[0])).toBeNull();
  });

  it('capítulo da história do freguês continua sendo do jogador', () => {
    const s = open(customer({ regularId: 'celia', chapter: 1 }), { diagnoses: { 'cura-simples': DIAGNOSIS_LEARN } });
    expect(bestOffer(s, s.customers[0])).toBeNull();
  });
});
