import { SAVE_VERSION, type GameSave } from '../domain/models/types';
import { ensureGoals } from '../domain/rules/goals';
import { createNewGame } from '../domain/rules/initialState';
import { MAX_LEVEL, SEAL_CRYSTALS, sealsEarned, sealsUnspentLegacy, unlockRecipesUpTo, xpForLevel } from '../domain/rules/progression';
import { DAY_EVENTS } from '../domain/data/orders';
import { RECIPES_BY_ID } from '../domain/data/recipes';
import { ROYAL_CHAPTERS } from '../domain/data/royal';
import { recordsFromReports } from '../domain/rules/records';
import type { DayReport } from '../domain/models/types';

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
const bool = (v: unknown, fallback: boolean) => (typeof v === 'boolean' ? v : fallback);
const arr = <T,>(v: unknown, fallback: T[]): T[] => (Array.isArray(v) ? (v as T[]) : fallback);
const numRecord = (v: unknown, base: Record<string, number>) => {
  const out = { ...base };
  if (isObj(v)) for (const [k, x] of Object.entries(v)) out[k] = Math.max(0, num(x, out[k] ?? 0));
  return out;
};

/** Saves antigos (até a v5) não tinham totais: estimamos pelos relatórios guardados. */
function lifetimeFromReports(reports: unknown[]) {
  let sold = 0;
  let earned = 0;
  for (const r of reports) {
    if (!isObj(r)) continue;
    earned += Math.max(0, num(r.revenue, 0));
    if (isObj(r.salesByRecipe)) for (const v of Object.values(r.salesByRecipe)) sold += Math.max(0, num(v, 0));
  }
  return { sold, earned };
}

function migrateRoyal(v: unknown): GameSave['royal'] {
  if (!isObj(v)) return null;
  const chapter = Math.max(0, Math.min(ROYAL_CHAPTERS.length, Math.floor(num(v.chapter, 0))));
  return {
    chapter,
    progress: Math.max(0, Math.floor(num(v.progress, 0))),
    delivered: numRecord(v.delivered, {}),
    dueDay: Math.max(0, Math.floor(num(v.dueDay, 0))),
    seen: Math.max(-1, Math.min(chapter, Math.floor(num(v.seen, -1)))),
    retries: Math.max(0, Math.floor(num(v.retries, 0))),
  };
}

/**
 * Valida e migra um save lido do armazenamento.
 * Campos ausentes ou inválidos recebem os valores padrão de uma partida nova.
 * Retorna null quando o dado não é um save reconhecível.
 */
export function migrateSave(raw: unknown): GameSave | null {
  if (!isObj(raw) || typeof raw.saveVersion !== 'number') return null;
  if (raw.saveVersion > SAVE_VERSION || raw.saveVersion < 1) return null;

  // v1 → v2: entraram preços, clientes, caldeirão, fornecedor, pedidos e tutorial.
  // v2 → v3: entraram os ajudantes automáticos (helpers) e o trabalho deles no relatório.
  // v3 → v4: late game (níveis 11 a 15, maestria das receitas e talentos do Grimório do Mestre).
  // v4 → v5: contratos de vários dias e expansão da loja (segundo caldeirão).
  // v5 → v6: fregueses fiéis, estações, álbum de conquistas e o gato da loja.
  // v6 → v7: ingredientes e poções da estação, rival da rua, eventos raros e expedições.
  // v7 → v8: metas do dia, baú da semana, dicas de contexto e história de abertura.
  // v8 → v9: nome da loja, cartas, livro do caixa, presentes de visita, cristais, decoração,
  //          trilha da temporada, presentes entre amigos e desafio da semana.
  // Os campos novos recebem os valores padrão abaixo.

  const base = createNewGame(num(raw.createdAt, Date.now()));
  const level = Math.max(1, num(raw.level, base.level));
  const phase = raw.phase === 'preparacao' || raw.phase === 'expediente' || raw.phase === 'fechamento' ? raw.phase : base.phase;
  const settings = isObj(raw.settings) ? raw.settings : {};
  const supplier: GameSave['supplier'] = { ...base.supplier };
  if (isObj(raw.supplier)) for (const [k, v] of Object.entries(raw.supplier)) supplier[k] = v === null ? null : Math.max(0, num(v, 0));

  // Até a v3 o nível máximo era 10 e a XP seguia acumulando sem efeito. Ela fica guardada até a
  // porta do nível 11, para a próxima venda já subir de nível.
  let xp = Math.max(xpForLevel(level), num(raw.xp, base.xp));
  if (raw.saveVersion < 4 && level < MAX_LEVEL) xp = Math.min(xp, xpForLevel(level + 1) - 1);

  // Maestria inicial para saves antigos: estimada pelas vendas dos relatórios guardados.
  const mastery: Record<string, number> = {};
  if (isObj(raw.mastery)) for (const [k, v] of Object.entries(raw.mastery)) mastery[k] = Math.max(0, Math.floor(num(v, 0)));
  else if (Array.isArray(raw.reports)) {
    for (const r of raw.reports) {
      if (!isObj(r) || !isObj(r.salesByRecipe)) continue;
      for (const [k, v] of Object.entries(r.salesByRecipe)) mastery[k] = (mastery[k] ?? 0) + Math.max(0, Math.floor(num(v, 0)));
    }
  }
  const talents: Record<string, number> = {};
  if (isObj(raw.talents)) for (const [k, v] of Object.entries(raw.talents)) talents[k] = Math.max(0, Math.floor(num(v, 0)));

  const save: GameSave = {
    saveVersion: SAVE_VERSION,
    createdAt: base.createdAt,
    updatedAt: num(raw.updatedAt, base.updatedAt),
    day: Math.max(1, Math.floor(num(raw.day, base.day))),
    phase,
    clockMin: num(raw.clockMin, base.clockMin),
    coins: Math.max(0, num(raw.coins, base.coins)),
    reputation: Math.max(0, num(raw.reputation, base.reputation)),
    level,
    // A curva de XP mudou no rebalanceamento: saves antigos mantêm o nível e começam no piso dele.
    xp,
    ingredients: numRecord(raw.ingredients, base.ingredients),
    potions: arr(raw.potions, base.potions).filter((p) => isObj(p) && typeof p.recipeId === 'string' && num(p.quantity, 0) > 0),
    prices: numRecord(raw.prices, base.prices),
    knownRecipes: arr(raw.knownRecipes, base.knownRecipes),
    upgrades: arr(raw.upgrades, base.upgrades),
    helpers: {
      off: isObj(raw.helpers) ? arr<string>(raw.helpers.off, []).filter((x) => typeof x === 'string') : [],
      ravenInMs: isObj(raw.helpers) ? num(raw.helpers.ravenInMs, base.helpers.ravenInMs) : base.helpers.ravenInMs,
      golemInMs: isObj(raw.helpers) ? num(raw.helpers.golemInMs, 0) : 0,
    },
    brew: isObj(raw.brew) ? (raw.brew as unknown as GameSave['brew']) : null,
    brew2: isObj(raw.brew2) ? (raw.brew2 as unknown as GameSave['brew2']) : null,
    customers: arr(raw.customers, []),
    spawnInMs: num(raw.spawnInMs, base.spawnInMs),
    supplier,
    order: isObj(raw.order) ? (raw.order as unknown as GameSave['order']) : null,
    contract: isObj(raw.contract) && Array.isArray(raw.contract.items) ? (raw.contract as unknown as GameSave['contract']) : null,
    nextContractDay: num(raw.nextContractDay, 1),
    contractsDone: Math.max(0, Math.floor(num(raw.contractsDone, 0))),
    contractSeals: Math.max(0, Math.floor(num(raw.contractSeals, 0))),
    event: typeof raw.event === 'string' && raw.event in DAY_EVENTS ? (raw.event as GameSave['event']) : null,
    stats: isObj(raw.stats)
      ? { ...base.stats, ...(raw.stats as object), helperWork: { ...base.stats.helperWork, ...(isObj(raw.stats.helperWork) ? raw.stats.helperWork : {}) } }
      : base.stats,
    reports: arr(raw.reports, base.reports),
    researchPoints: num(raw.researchPoints, 0),
    recipeHints: arr<string>(raw.recipeHints, []).filter((id) => typeof id === 'string' && id in RECIPES_BY_ID),
    mastery,
    talents,
    sealsBought: Math.max(0, Math.floor(num(raw.sealsBought, 0))),
    festivalSponsored: bool(raw.festivalSponsored, false),
    regulars: isObj(raw.regulars) ? (raw.regulars as unknown as GameSave['regulars']) : {},
    achievements: arr<string>(raw.achievements, []).filter((x) => typeof x === 'string'),
    lifetime: isObj(raw.lifetime)
      ? { sold: num(raw.lifetime.sold, 0), earned: num(raw.lifetime.earned, 0) }
      : lifetimeFromReports(arr(raw.reports, [])),
    petCount: Math.max(0, Math.floor(num(raw.petCount, 0))),
    petDay: num(raw.petDay, 0),
    rival: isObj(raw.rival)
      ? {
          week: Math.max(0, Math.floor(num(raw.rival.week, 0))),
          me: Math.max(0, num(raw.rival.me, 0)),
          her: Math.max(0, num(raw.rival.her, 0)),
          wins: Math.max(0, Math.floor(num(raw.rival.wins, 0))),
          losses: Math.max(0, Math.floor(num(raw.rival.losses, 0))),
        }
      : base.rival,
    expedition: isObj(raw.expedition) && typeof raw.expedition.dest === 'string'
      ? { dest: raw.expedition.dest, returnDay: num(raw.expedition.returnDay, 0) }
      : null,
    expeditionsDone: Math.max(0, Math.floor(num(raw.expeditionsDone, 0))),
    finds: arr<string>(raw.finds, []).filter((x) => typeof x === 'string'),
    goals: isObj(raw.goals) && Array.isArray(raw.goals.list)
      ? {
          day: num(raw.goals.day, 0),
          list: (raw.goals.list as unknown[]).filter((g): g is GameSave['goals']['list'][number] => isObj(g) && typeof g.kind === 'string' && typeof g.id === 'string'),
          week: Math.max(0, Math.floor(num(raw.goals.week, 0))),
          weekDone: Math.max(0, Math.floor(num(raw.goals.weekDone, 0))),
          chestClaimed: bool(raw.goals.chestClaimed, false),
        }
      : { ...base.goals, day: 0 },
    tipsSeen: arr<string>(raw.tipsSeen, []).filter((x) => typeof x === 'string'),
    // Quem já tinha uma partida não precisa ver a história de abertura.
    storySeen: raw.saveVersion < 8 ? true : bool(raw.storySeen, false),
    // O tutorial mudou de ordem na v9 (agora começa vendendo): quem estava no meio dele pula para o fim.
    tutorialStep: raw.saveVersion < 9 && num(raw.tutorialStep, 99) < 7 ? 99 : num(raw.tutorialStep, raw.saveVersion === 1 ? 99 : 0),
    shopName: typeof raw.shopName === 'string' && raw.shopName.trim() ? raw.shopName.slice(0, 28) : base.shopName,
    awning: typeof raw.awning === 'string' ? raw.awning : base.awning,
    // Partidas antigas já passaram do dia 1: a Condessa da estreia não volta.
    debutDone: raw.saveVersion < 9 ? true : bool(raw.debutDone, false),
    letter: isObj(raw.letter) && typeof raw.letter.from === 'string'
      ? { from: raw.letter.from, text: String(raw.letter.text ?? ''), day: num(raw.letter.day, 0), done: bool(raw.letter.done, false) }
      : null,
    ...(bool(raw.debutServed, false) ? { debutServed: true } : {}),
    trend: arr<string>(raw.trend, []).filter((id) => typeof id === 'string' && id in RECIPES_BY_ID),
    nextTrend: arr<string>(raw.nextTrend, []).filter((id) => typeof id === 'string' && id in RECIPES_BY_ID),
    nextEvent: typeof raw.nextEvent === 'string' && raw.nextEvent in DAY_EVENTS ? (raw.nextEvent as GameSave['nextEvent']) : null,
    away: null,
    visits: isObj(raw.visits)
      ? { lastDate: String(raw.visits.lastDate ?? ''), count: Math.max(0, Math.floor(num(raw.visits.count, 0))), ready: bool(raw.visits.ready, false) }
      : { lastDate: '', count: 0, ready: false },
    crystals: Math.max(0, Math.floor(num(raw.crystals, 0))),
    owned: [...new Set([...base.owned, ...arr<string>(raw.owned, []).filter((x) => typeof x === 'string')])],
    decor: isObj(raw.decor) ? { ...base.decor, ...(raw.decor as Record<string, string>) } : { ...base.decor },
    track: isObj(raw.track)
      ? { period: num(raw.track.period, base.track.period), points: Math.max(0, num(raw.track.points, 0)), tier: Math.max(0, Math.floor(num(raw.track.tier, 0))) }
      : base.track,
    festsDone: arr<number>(raw.festsDone, []).filter((x) => typeof x === 'number'),
    giftsRedeemed: arr<string>(raw.giftsRedeemed, []).filter((x) => typeof x === 'string'),
    giftSentDate: typeof raw.giftSentDate === 'string' ? raw.giftSentDate : '',
    giftsSent: Math.max(0, Math.floor(num(raw.giftsSent, 0))),
    challenge: isObj(raw.challenge) && typeof raw.challenge.week === 'number'
      ? { week: raw.challenge.week, active: bool(raw.challenge.active, false), rng: num(raw.challenge.rng, 1) >>> 0, score: typeof raw.challenge.score === 'number' ? raw.challenge.score : null }
      : null,
    challengeBest: isObj(raw.challengeBest) && typeof raw.challengeBest.week === 'number'
      ? { week: raw.challengeBest.week, score: num(raw.challengeBest.score, 0) }
      : null,
    royal: migrateRoyal(raw.royal),
    village: numRecord(raw.village, {}),
    pages: numRecord(raw.pages, {}),
    // Saves antigos: os recordes começam dos melhores dias guardados nos relatórios.
    records: isObj(raw.records)
      ? { revenue: Math.max(0, num(raw.records.revenue, 0)), served: Math.max(0, num(raw.records.served, 0)), bestSale: Math.max(0, num(raw.records.bestSale, 0)) }
      : recordsFromReports(arr<DayReport>(raw.reports, []).filter(isObj) as DayReport[]),
    seq: num(raw.seq, 0),
    settings: {
      volume: num(settings.volume, base.settings.volume),
      muted: bool(settings.muted, base.settings.muted),
      music: bool(settings.music, base.settings.music),
      reduceMotion: bool(settings.reduceMotion, base.settings.reduceMotion),
      musicVolume: Math.min(1, Math.max(0, num(settings.musicVolume, base.settings.musicVolume))),
      sfxVolume: Math.min(1, Math.max(0, num(settings.sfxVolume, base.settings.sfxVolume))),
      ambienceVolume: Math.min(1, Math.max(0, num(settings.ambienceVolume, base.settings.ambienceVolume))),
      vibration: bool(settings.vibration, base.settings.vibration),
      reminders: bool(settings.reminders, false),
    },
  };
  // Receitas de níveis que o jogador já alcançou (as novas dos níveis 6 a 10 entram direto).
  unlockRecipesUpTo(save, save.level);
  ensureGoals(save);
  // Auditoria P1.1: Selos e cristais viraram uma moeda só. Na primeira carga depois da troca,
  // os Selos que estavam guardados entram como cristais (os já gastos em talentos ficam onde estão).
  if (typeof raw.fameOverflow === 'number') save.fameOverflow = Math.max(0, Math.floor(raw.fameOverflow));
  if (typeof raw.sealsPaid === 'number') save.sealsPaid = Math.max(0, Math.floor(raw.sealsPaid));
  else {
    save.crystals += sealsUnspentLegacy(save) * SEAL_CRYSTALS;
    save.sealsPaid = sealsEarned(save);
  }
  return save;
}
