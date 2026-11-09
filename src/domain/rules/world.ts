import { INGREDIENTS_BY_ID } from '../data/ingredients';
import { RECIPES } from '../data/recipes';
import {
  MAX_HEARTS, REGULARS, REGULARS_BY_ID, SEASON_DAYS, SEASONS, TIP_HEARTS, TIP_RATE, type RegularInfo, type SeasonInfo,
} from '../data/world';
import type { Customer, GameSave, RegularState } from '../models/types';
import type { Draft } from './context';
import { countIngredients, has, ingredientCapacity } from './economy';
import { APPRENTICE, GOLEM, RAVEN } from './helpers';
import { masteredRecipes } from './mastery';
import { gainReputation, masterRank } from './progression';
import { TALENTS } from '../data/talents';

// ------------------------------------------------------------------ estações

/** Estação do dia: cada uma dura 7 dias, começando pela primavera. */
export const seasonOf = (day: number): SeasonInfo => SEASONS[Math.floor((Math.max(1, day) - 1) / SEASON_DAYS) % SEASONS.length];
export const currentSeason = (s: GameSave) => seasonOf(s.day);
/** Dia a partir do qual a estação mexe na procura e nos preços (os primeiros dias são de aprendizado). */
export const SEASON_START_DAY = 3;
/** Categoria em alta hoje, ou null nos primeiros dias. */
export const seasonCategory = (s: GameSave) => (s.day >= SEASON_START_DAY ? currentSeason(s).category : null);
/** Dias até a próxima estação (1 = amanhã muda). */
export const daysToNextSeason = (day: number) => SEASON_DAYS - ((Math.max(1, day) - 1) % SEASON_DAYS);

// --------------------------------------------------------------- fregueses

export const regularState = (s: GameSave, id: string): RegularState => s.regulars[id] ?? { visits: 0, hearts: 0, gift: false };

/** Fregueses que já podem aparecer e não estão no balcão agora. */
export function availableRegulars(s: GameSave): RegularInfo[] {
  const here = new Set(s.customers.map((c) => c.regularId).filter(Boolean));
  return REGULARS.filter((r) => s.level >= r.minLevel && !here.has(r.id));
}

/** Chance de o próximo cliente ser um freguês fiel. */
export const REGULAR_CHANCE = 0.22;

/** Depois de uma venda a um freguês: corações, gorjeta e, na amizade completa, o presente. Devolve a gorjeta. */
export function befriend(d: Draft, c: Customer, recipeId: string, price: number): number {
  if (!c.regularId || !REGULARS_BY_ID[c.regularId]) return 0;
  const s = d.s;
  const info = REGULARS_BY_ID[c.regularId];
  const st = { ...regularState(s, info.id) };
  st.visits += 1;
  // Gorjeta só para quem já é chegado (antes de ganhar o coração desta visita).
  const tip = st.hearts >= TIP_HEARTS ? Math.max(1, Math.round(price * TIP_RATE)) : 0;
  // O coração vem de acertar o que ele pediu: o capítulo da história ou, depois de amigo, o de sempre.
  const heart = recipeId === c.wantedRecipeId && st.hearts < MAX_HEARTS;
  if (heart) st.hearts += 1;
  s.regulars = { ...s.regulars, [info.id]: st };
  if (!(s.stats.regularsSeen ?? []).includes(info.id)) s.stats.regularsSeen = [...(s.stats.regularsSeen ?? []), info.id];
  if (tip) {
    s.coins += tip;
    s.stats.revenue += tip;
  }
  d.events.push({ type: 'REGULAR_HEART', regularId: info.id, hearts: st.hearts, tip, ...(heart && c.chapter !== undefined ? { chapter: c.chapter } : {}) });
  if (st.hearts >= MAX_HEARTS && !st.gift) {
    st.gift = true;
    const room = Math.max(0, ingredientCapacity(s) - countIngredients(s));
    const qty = Math.min(info.gift.qty, room);
    if (qty > 0) s.ingredients[info.gift.ingredientId] = (s.ingredients[info.gift.ingredientId] ?? 0) + qty;
    gainReputation(d, 5);
    d.events.push({ type: 'REGULAR_GIFT', regularId: info.id });
  }
  return tip;
}

/** Nome para mostrar: o do freguês fiel, ou o tipo de cliente. */
export const regularOf = (c: Customer) => (c.regularId ? REGULARS_BY_ID[c.regularId] ?? null : null);

export const giftLabel = (r: RegularInfo) => `${r.gift.qty}× ${INGREDIENTS_BY_ID[r.gift.ingredientId].name}`;

// ------------------------------------------------------------------- gato

/** Carinho no gato da loja: sempre ronrona; uma vez por dia dá sorte (+1 reputação). */
export function petCat(d: Draft): boolean {
  const s = d.s;
  s.petCount += 1;
  const lucky = s.petDay !== s.day;
  if (lucky) {
    s.petDay = s.day;
    gainReputation(d, 1);
  }
  d.events.push({ type: 'CAT_PETTED', lucky });
  return true;
}

// ------------------------------------------------------------------ álbum

export interface Achievement {
  id: string;
  name: string;
  icon: string;
  text: string;
  done: (s: GameSave) => boolean;
}

const friends = (s: GameSave) => REGULARS.filter((r) => regularState(s, r.id).hearts >= MAX_HEARTS).length;

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'primeira-venda', name: 'Porta aberta', icon: '🚪', text: 'Venda a primeira poção.', done: (s) => s.lifetime.sold >= 1 },
  { id: 'cem-vendas', name: 'Freguesia', icon: '🧪', text: 'Venda 100 poções.', done: (s) => s.lifetime.sold >= 100 },
  { id: 'mil-vendas', name: 'Fábrica de milagres', icon: '⚗️', text: 'Venda 1.000 poções.', done: (s) => s.lifetime.sold >= 1000 },
  { id: 'mil-moedas', name: 'Primeiro cofre', icon: '🪙', text: 'Fature 1.000 moedas.', done: (s) => s.lifetime.earned >= 1000 },
  { id: 'cinquenta-mil', name: 'Tesouro do reino', icon: '💰', text: 'Fature 50.000 moedas.', done: (s) => s.lifetime.earned >= 50000 },
  { id: 'nivel-5', name: 'Loja conhecida', icon: '⭐', text: 'Chegue ao nível 5.', done: (s) => s.level >= 5 },
  { id: 'nivel-10', name: 'Loja famosa', icon: '🌟', text: 'Chegue ao nível 10.', done: (s) => s.level >= 10 },
  { id: 'nivel-15', name: 'Lenda da cidade', icon: '👑', text: 'Chegue ao nível 15.', done: (s) => s.level >= 15 },
  { id: 'todas-receitas', name: 'Livro completo', icon: '📖', text: 'Conheça todas as receitas.', done: (s) => RECIPES.every((r) => r.secret || r.legend || s.knownRecipes.includes(r.id)) },
  { id: 'lendas', name: 'Guardião das lendas', icon: '📜', text: 'Descubra as seis receitas lendárias.', done: (s) => RECIPES.filter((r) => r.legend).every((r) => s.knownRecipes.includes(r.id)) },
  { id: 'maestria', name: 'Mão de mestre', icon: '✨', text: 'Domine uma receita (5 estrelas).', done: (s) => masteredRecipes(s) >= 1 },
  { id: 'equipe', name: 'Equipe completa', icon: '🐦', text: 'Contrate o corvo, o aprendiz e o golem.', done: (s) => [RAVEN, APPRENTICE, GOLEM].every((id) => has(s, id)) },
  { id: 'primeiro-contrato', name: 'Palavra cumprida', icon: '📜', text: 'Cumpra um contrato.', done: (s) => s.contractsDone >= 1 },
  { id: 'dez-contratos', name: 'Fornecedor real', icon: '🏰', text: 'Cumpra 10 contratos.', done: (s) => s.contractsDone >= 10 },
  { id: 'torre', name: 'Torre de pedra', icon: '🔭', text: 'Conclua a expansão da loja.', done: (s) => has(s, 'torre-alquimista') },
  { id: 'amigo', name: 'Amizade', icon: '💛', text: 'Faça um freguês virar amigo (5 corações).', done: (s) => friends(s) >= 1 },
  { id: 'todos-amigos', name: 'Coração da cidade', icon: '💞', text: 'Seja amigo de todos os fregueses.', done: (s) => friends(s) >= REGULARS.length },
  { id: 'um-ano', name: 'Um ano de loja', icon: '🍂', text: 'Passe pelas quatro estações.', done: (s) => s.day > SEASON_DAYS * 4 },
  { id: 'gato', name: 'Melhor amigo', icon: '🐈', text: 'Faça 20 carinhos no gato da loja.', done: (s) => s.petCount >= 20 },
  // Pacote E
  { id: 'sabor-estacao', name: 'Sabor da estação', icon: '🌸', text: 'Prepare as quatro poções da estação.',
    done: (s) => RECIPES.filter((r) => r.season).every((r) => (s.mastery[r.id] ?? 0) > 0) },
  { id: 'rival-vencida', name: 'Vizinha derrotada', icon: '🏆', text: 'Vença uma semana de disputa contra a Madame Vesper.', done: (s) => s.rival.wins >= 1 },
  { id: 'rainha-da-rua', name: 'Rainha da rua', icon: '👑', text: 'Vença 5 semanas contra a Madame Vesper.', done: (s) => s.rival.wins >= 5 },
  { id: 'explorador', name: 'Asas longas', icon: '🗺️', text: 'Complete 5 expedições com o corvo.', done: (s) => s.expeditionsDone >= 5 },
  { id: 'colecionador', name: 'Gabinete de curiosidades', icon: '🔮', text: 'Reúna 6 achados raros.', done: (s) => s.finds.length >= 6 },
  // Conquistas de Mestre (pacote X)
  { id: 'concurso-1', name: 'Convidada da Coroa', icon: '📯', text: 'Vença a primeira prova do Concurso Real.', done: (s) => (s.royal?.chapter ?? 0) >= 1 },
  { id: 'grao-alquimista', name: 'Grão-Alquimista', icon: '👑', text: 'Vença o Concurso Real de Alquimia.', done: (s) => (s.royal?.chapter ?? 0) >= 5 },
  { id: 'cinco-mil-vendas', name: 'Rio de poções', icon: '🌊', text: 'Venda 5.000 poções.', done: (s) => s.lifetime.sold >= 5000 },
  { id: 'fortuna', name: 'Fortuna lendária', icon: '💎', text: 'Fature 250.000 moedas.', done: (s) => s.lifetime.earned >= 250000 },
  { id: 'cinco-dominadas', name: 'Mãos de ouro', icon: '🌟', text: 'Domine 5 receitas (5 estrelas).', done: (s) => masteredRecipes(s) >= 5 },
  { id: 'grau-10', name: 'Mestre dos mestres', icon: '🧙', text: 'Alcance o grau de Mestre 10.', done: (s) => masterRank(s.xp) >= 10 },
  { id: 'dia-de-ouro', name: 'Dia de ouro', icon: '📈', text: 'Fature 5.000 moedas num só dia.', done: (s) => s.records.revenue >= 5000 },
  { id: 'vila-nova', name: 'Vila renascida', icon: '🏘️', text: 'Inaugure as seis obras da vila.', done: (s) => Object.values(s.village ?? {}).filter((n) => n >= 3).length >= 6 },
  { id: 'sem-fim', name: 'Estudo sem fim', icon: '📚', text: 'Leve um talento sem fim ao grau 5.',
    done: (s) => TALENTS.some((t) => t.endless && (s.talents[t.id] ?? 0) >= 5) },
];

/** Confere o álbum e anuncia o que acabou de ser conquistado. */
export function checkAchievements(d: Draft) {
  const s = d.s;
  const have = new Set(s.achievements);
  for (const a of ACHIEVEMENTS) {
    if (have.has(a.id) || !a.done(s)) continue;
    s.achievements = [...s.achievements, a.id];
    d.events.push({ type: 'ACHIEVEMENT', id: a.id });
  }
}
