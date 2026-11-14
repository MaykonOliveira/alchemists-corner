// Familiares mágicos (E4): ovos ganhos jogando chocam no ninho e viram criaturinhas da loja.
import { ACTIVE_FAMILIARS, EGG_ACHIEVEMENT, EGG_EXPEDITION, FAMILIARS, FAMILIARS_BY_ID, NEST_SIZE, SHINY_CHANCE } from '../data/familiars';
import type { GameEvent } from '../models/types';
import { fail, type Draft } from './context';
import { evoRandom, famBonus } from './evoCore';

import { grantCrystals } from './entitlements';

import { tr } from '../../i18n';

/** Sorteio dos familiares: depende do save e da posição na lista de eventos (função pura). */
const roll = (d: Draft, k: number) => evoRandom(d.s, 100 + k * 7919 + d.events.length * 31 + (d.s.seq ?? 0));

/** Põe um ovo no ninho (se couber). Choca em 1 a 3 dias. */
export function grantEgg(d: Draft, source: string): boolean {
  const s = d.s;
  if (s.evo.eggs.length >= NEST_SIZE) return false;
  const days = 1 + Math.floor(roll(d, 1) * 3);
  s.evo.eggSeq += 1;
  s.evo.eggs = [...s.evo.eggs, { id: s.evo.eggSeq, hatchDay: s.day + days, source }];
  d.events.push({ type: 'EGG_FOUND', source });
  return true;
}

/** Ovos que vêm do que aconteceu no comando: expedições, recordes e conquistas. */
export function eggsFromEvents(d: Draft, events: GameEvent[]) {
  const s = d.s;
  if (!s.evo) return;
  for (const e of events) {
    if (e.type === 'EXPEDITION_BACK' && roll(d, 2) < EGG_EXPEDITION) grantEgg(d, 'expedicao');
    if (e.type === 'RECORD' && s.evo.eggDay !== s.day) {
      if (grantEgg(d, 'recorde')) s.evo.eggDay = s.day;
    }
    if (e.type === 'ACHIEVEMENT' && roll(d, 3) < EGG_ACHIEVEMENT) grantEgg(d, 'conquista');
  }
}

/** Começo do dia: os ovos maduros chocam. Primeiro saem os familiares que faltam. */
export function hatchEggs(d: Draft) {
  const s = d.s;
  const ready = s.evo.eggs.filter((e) => e.hatchDay <= s.day);
  if (!ready.length) return;
  s.evo.eggs = s.evo.eggs.filter((e) => e.hatchDay > s.day);
  for (const egg of ready) {
    const missing = FAMILIARS.filter((f) => !s.evo.familiars.includes(f.id));
    // O ovo do dragão viajante é sempre um dragãozinho (se ainda não tiver).
    const forced = egg.source === 'dragao' && missing.some((f) => f.id === 'dragaozinho') ? 'dragaozinho' : null;
    if (forced || missing.length) {
      const id = forced ?? missing[Math.floor(roll(d, 4) * missing.length)].id;
      s.evo.familiars = [...s.evo.familiars, id];
      if (s.evo.activeFamiliars.length < ACTIVE_FAMILIARS) s.evo.activeFamiliars = [...s.evo.activeFamiliars, id];
      d.events.push({ type: 'FAMILIAR_HATCHED', familiarId: id, shiny: false });
      s.evo.news = [...s.evo.news, { kind: 'hatch' as const, ref: id }].slice(-20);
      continue;
    }
    const plain = s.evo.familiars.filter((id) => !s.evo.shiny.includes(id));
    if (plain.length && roll(d, 5) < SHINY_CHANCE) {
      const id = plain[Math.floor(roll(d, 6) * plain.length)];
      s.evo.shiny = [...s.evo.shiny, id];
      d.events.push({ type: 'FAMILIAR_HATCHED', familiarId: id, shiny: true });
      s.evo.news = [...s.evo.news, { kind: 'hatch' as const, ref: id, n: 1 }].slice(-20);
    } else {
      // Ovo de quem já nasceu: vira cristal.
      grantCrystals(d, 5, 'ovo');
      d.events.push({ type: 'FAMILIAR_HATCHED', familiarId: s.evo.familiars[Math.floor(roll(d, 7) * s.evo.familiars.length)], shiny: false, crystals: 5 });
    }
  }
}

export function setFamiliar(d: Draft, id: string, on: boolean): boolean {
  const s = d.s;
  if (!FAMILIARS_BY_ID[id] || !s.evo.familiars.includes(id)) return fail(d, tr('Este familiar ainda não nasceu.'));
  const active = s.evo.activeFamiliars;
  if (active.includes(id) === on) return false;
  if (on && active.length >= ACTIVE_FAMILIARS) return fail(d, tr('Só {0} familiares ficam ativos por vez. Dispense um antes.', ACTIVE_FAMILIARS));
  s.evo.activeFamiliars = on ? [...active, id] : active.filter((x) => x !== id);
  return true;
}

/** Fechamento: a tartaruga de cristal às vezes solta uma lasca. */
export function familiarsOnClose(d: Draft) {
  const chance = famBonus(d.s, 'cristal');
  if (chance > 0 && roll(d, 8) < chance) grantCrystals(d, 1, 'tartaruga');
}
