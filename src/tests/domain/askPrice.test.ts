import { describe, expect, it } from 'vitest';
import type { Customer, GameSave } from '../../domain/models/types';
import { applyCommand, type DomainCommand } from '../../domain/rules/commands';
import { askOptions } from '../../domain/rules/customers';
import { createNewGame } from '../../domain/rules/initialState';

const ctx = { now: 0, random: () => 0.5 };
const run = (s: GameSave, c: DomainCommand) => applyCommand(s, c, ctx);
const customer = (over: Partial<Customer> = {}): Customer => ({
  id: 'c-x', archetype: 'morador', wantedRecipeId: 'cura-simples', budgetFactor: 1, patienceMs: 30000,
  waitedMs: 0, offer: null, remark: null, ...over,
});
const open = (c: Customer): GameSave => ({ ...createNewGame(0), phase: 'expediente', spawnInMs: 99999, reputation: 0, customers: [c] });
const serve = (s: GameSave, price?: number) =>
  run(s, { type: 'SERVE_CUSTOMER', customerId: 'c-x', recipeId: 'cura-simples', ...(price !== undefined ? { price } : {}) });

describe('preço que depende de quem compra (auditoria P0.3)', () => {
  it('oferece desconto, etiqueta e um pedido mais alto', () => {
    const o = askOptions(createNewGame(0), 'cura-simples');
    expect(o.discount).toBeLessThan(o.tag);
    expect(o.high).toBeGreaterThan(o.tag);
  });

  it('a nobre paga o pedido alto; o viajante pechincha bravo; o morador vai embora', () => {
    const s = createNewGame(0);
    const { high } = askOptions(s, 'cura-simples');
    const nobre = serve(open(customer({ archetype: 'nobre', budgetFactor: 1.4 })), high);
    expect(nobre.events).toContainEqual(expect.objectContaining({ type: 'SALE', price: high }));
    const viajante = serve(open(customer({ archetype: 'viajante', budgetFactor: 1.12 })), high);
    expect(viajante.save.customers[0].offer).not.toBeNull();
    expect(viajante.save.reputation).toBe(0); // -1, mas a reputação não fica negativa
    const morador = serve(open(customer()), high);
    expect(morador.events.find((e) => e.type === 'SALE')).toBeUndefined();
    expect(morador.save.customers).toHaveLength(0);
  });

  it('reputação vem de atender bem: a poção certa, rápido, e um agrado no preço', () => {
    const quick = serve(open(customer()));
    expect(quick.save.reputation).toBe(2); // certa + rápida
    const slow = serve(open(customer({ waitedMs: 20000 })));
    expect(slow.save.reputation).toBe(1); // só a certa
    const { discount } = askOptions(createNewGame(0), 'cura-simples');
    const kind = serve(open(customer()), discount);
    expect(kind.save.reputation).toBe(3);
    expect(kind.events).toContainEqual(expect.objectContaining({ type: 'SALE', price: discount }));
  });

  it('o pedido fica dentro da faixa da receita', () => {
    const r = serve(open(customer({ archetype: 'nobre', budgetFactor: 5 })), 9999);
    const sale = r.events.find((e) => e.type === 'SALE') as { price: number };
    expect(sale.price).toBeLessThanOrEqual(askOptions(createNewGame(0), 'cura-simples').high + 20);
  });

  it('o morador nunca paga acima da etiqueta, mesmo com dinheiro no bolso', () => {
    const { high } = askOptions(createNewGame(0), 'cura-simples');
    const rico = serve({ ...open(customer({ budgetFactor: 2 })), reputation: 10 }, high);
    expect(rico.events.find((e) => e.type === 'SALE')).toBeUndefined();
    expect(rico.save.customers).toHaveLength(0);
    expect(rico.save.reputation).toBe(8);
  });

  it('o freguês fiel contrapropõe o preço de sempre e a loja perde reputação', () => {
    const { high, tag } = askOptions(createNewGame(0), 'cura-simples');
    const r = serve({ ...open(customer({ archetype: 'viajante', regularId: 'tobias', budgetFactor: 2 })), reputation: 10 }, high);
    expect(r.save.customers[0].offer).toEqual({ recipeId: 'cura-simples', price: tag });
    expect(r.save.reputation).toBe(9);
  });
});
