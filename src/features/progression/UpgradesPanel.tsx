import { RECIPES_BY_ID } from '../../domain/data/recipes';
import { helperRoot, UPGRADES } from '../../domain/data/upgrades';
import type { GameSave, ShopUpgrade } from '../../domain/models/types';
import { APPRENTICE, apprenticePlan, BARD, GNOME, GOLEM, golemDelayMs, helperActive, OWL, RAVEN } from '../../domain/rules/helpers';
import { gnomeGift, helperWage } from '../../domain/rules/economy';
import { pendingPerks, perkCount, staffLevel } from '../../domain/rules/evoCore';
import { EXPLORER, FAIRY, NIGHT_MANAGER, PEDDLER, peddlerPlan } from '../../domain/rules/staff';
import { SALAMANDER } from '../../domain/rules/alchemy';
import { EXPEDITIONS_BY_ID } from '../../domain/data/street';
import { INGREDIENTS_BY_ID } from '../../domain/data/ingredients';
import { useGameStore } from '../../store/gameStore';
import { SpriteIcon } from '../../ui/SpriteIcon';
import { Coins, More } from '../../ui/widgets';
import { Icon } from '../../ui/Icon';

import { tr } from '../../i18n';
const STRATEGY_LABEL = { volume: tr('vender muito'), lucro: tr('lucro alto'), fama: tr('fama na vila') } as const;
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Frase curta sobre o que o ajudante está fazendo agora. */
function helperStatus(save: GameSave, id: string): string {
  if (!helperActive(save, id)) return tr('Descansando. Ligue para voltar ao trabalho.');
  if (save.phase === 'fechamento') return tr('Loja fechada: descansando até amanhã.');
  const w = save.stats.helperWork;
  if (id === RAVEN) {
    const next = Math.max(1, Math.ceil(save.helpers.ravenInMs / 1000));
    return tr('Hoje: {0}, {1}. Confere o armário de novo em {2}s.', plural(w.deliveries, tr('viagem'), tr('viagens')), plural(w.delivered, tr('item'), tr('itens')), next);
  }
  if (id === APPRENTICE) {
    const job = save.brew ?? save.brew2;
    if (job && !apprenticePlan(save)) return tr('Mexendo o caldeirão: {0}. Hoje: {1}.', RECIPES_BY_ID[job.recipeId].shortName, plural(w.brews, tr('preparo'), tr('preparos')));
    const plan = apprenticePlan(save);
    return plan ? tr('Vai preparar {0}.', RECIPES_BY_ID[plan.recipeId].shortName) : tr('Esperando ingredientes ou espaço nas prateleiras. Hoje: {0}.', plural(w.brews, tr('preparo'), tr('preparos')));
  }
  if (id === GOLEM) {
    if (save.phase !== 'expediente') return tr('Esperando a loja abrir.');
    return tr('Atende quem espera há mais de {0}s. Hoje: {1}.', Math.round(golemDelayMs(save) / 100) / 10, plural(w.served, tr('venda'), tr('vendas')));
  }
  if (id === GNOME) {
    const gift = gnomeGift(save);
    return gift ? tr('Cuidando da estufa. Amanhã cedo traz {0}.', INGREDIENTS_BY_ID[gift].name) : tr('Cuidando da estufa.');
  }
  if (id === OWL) {
    if (save.order) return tr('De olho no pedido especial: entrega quando houver {0} {1}.', save.order.qty, RECIPES_BY_ID[save.order.recipeId].shortName);
    return tr('Esperando uma charada ou um pedido especial. Hoje: {0}.', plural((w.riddles ?? 0) + (w.orders ?? 0), tr('tarefa'), tr('tarefas')));
  }
  if (id === BARD) return save.phase === 'expediente' ? tr('Tocando na porta: mais clientes e mais paciência.') : tr('Afinando o alaúde para a loja abrir.');
  if (id === FAIRY) return tr('Cuidando dos preços ({0}). Preços travados por você: {1}.', STRATEGY_LABEL[save.evo.fairy.strategy], save.evo.fairy.locked.length);
  if (id === PEDDLER) {
    const plan = peddlerPlan(save);
    return save.phase !== 'expediente' ? tr('Engraxando a carroça para a feira.') : plan ? tr('Vai levar {0} {1} para a praça.', plan.qty, RECIPES_BY_ID[plan.recipeId].shortName) : tr('Prateleiras em ordem: nada sobrando para a praça.');
  }
  if (id === EXPLORER) {
    const ex = save.expedition;
    return ex?.byExplorer ? tr('Em expedição: {0}. Volta no dia {1}.', EXPEDITIONS_BY_ID[ex.dest]?.name ?? ex.dest, ex.returnDay) : tr('Arrumando a mochila para a próxima expedição.');
  }
  if (id === SALAMANDER) return save.brew || save.brew2 ? tr('Soprando o fogo do caldeirão.') : tr('Cochilando nas brasas.');
  if (id === NIGHT_MANAGER) return tr('Cuida da loja enquanto você está fora: até {0} vendas e {1} preparos.', 60 + 10 * perkCount(save, NIGHT_MANAGER, 'a'), 20 + 3 * perkCount(save, NIGHT_MANAGER, 'b'));
  return '';
}

function UpgradeCard({ save, u }: { save: GameSave; u: ShopUpgrade }) {
  const dispatch = useGameStore((s) => s.dispatch);
  const owned = save.upgrades.includes(u.id);
  const needs = u.requires && !save.upgrades.includes(u.requires) ? UPGRADES.find((x) => x.id === u.requires) : undefined;
  const locked = save.level < u.requiredLevel || !!needs;
  const expansion = u.category === 'expansao';
  const afford = save.coins >= u.cost;
  const helper = u.category === 'ajudante';
  const on = owned && helperActive(save, u.id);
  return (
    <li className={`card ${locked ? 'card-locked' : ''} ${owned ? 'card-owned' : ''} ${helper ? 'card-helper' : ''} ${expansion ? 'card-expansion' : ''}`}>
      <div className="card-head">
        {helper && <SpriteIcon name={`helper-${u.id}`} size={32} muted={locked} />}
        {u.category === 'treino' && helperRoot(u.id) && <SpriteIcon name={`helper-${helperRoot(u.id)}`} size={32} muted={locked} />}
        <span className="row-title">{u.name}</span>
        <span className={`tag ${u.category === 'visual' || expansion ? 'tag-gold' : ''} ${helper ? 'tag-helper' : ''}`}>{expansion ? tr('expansão') : u.category}</span>
      </div>
      {owned && helper ? <p className="helper-status small">{helperStatus(save, u.id)}</p> : !locked && <p className="card-text small">{u.effect}</p>}
      {(helper || (owned && !helper) || locked) && (
        <More label={owned ? tr('O que faz') : tr('Detalhes')}>
          <p className="card-text small">{u.effect}</p>
          {helper && <p className="card-text small muted">{tr('Salário: ')}{owned ? Math.round(helperWage(save, u.id)) : u.upkeep}{tr(' moedas por dia, pago no fechamento.')}</p>}
        </More>
      )}
      <div className="card-foot">
        <Coins n={u.cost} />
        {owned && helper && (
          <button className="link-btn small staff-link" onClick={() => dispatch({ type: 'OPEN_PANEL', panel: 'staff' })}>
            {tr('Nv {0}', staffLevel(save, u.id))}{pendingPerks(save, u.id) > 0 ? ' ✦' : ''}
          </button>
        )}
        {owned && helper ? (
          <label className="switch">
            <input type="checkbox" checked={on} onChange={(e) => dispatch({ type: 'SET_HELPER', upgradeId: u.id, on: e.target.checked })} />
            <span className="switch-track" aria-hidden />
            <span>{on ? tr('Trabalhando') : tr('Descansando')}</span>
          </label>
        ) : owned ? (
          <span className="tag tag-ok">{tr('instalada ✓')}</span>
        ) : save.level < u.requiredLevel ? (
          <span className="tag">{tr('nível ')}{u.requiredLevel}</span>
        ) : needs ? (
          <span className="tag">{tr('antes: {0}', needs.name)}</span>
        ) : (
          <button className="btn btn-small btn-primary" disabled={!afford} onClick={() => dispatch({ type: 'BUY_UPGRADE', upgradeId: u.id })}>
            {afford ? (helper ? tr('Contratar') : tr('Comprar')) : tr('Faltam {0}', u.cost - save.coins)}
          </button>
        )}
      </div>
    </li>
  );
}

export function UpgradesPanel({ save }: { save: GameSave }) {
  const helpers = UPGRADES.filter((u) => u.category === 'ajudante');
  const expansions = UPGRADES.filter((u) => u.category === 'expansao');
  const training = UPGRADES.filter((u) => u.category === 'treino');
  const others = UPGRADES.filter((u) => u.category !== 'ajudante' && u.category !== 'expansao' && u.category !== 'treino');
  const showTraining = save.level >= 13 || training.some((u) => save.upgrades.includes(u.id));
  return (
    <>
      <h3 className="mini-title">{tr('Ajudantes')}</h3>
      <ul className="list">
        {helpers.map((u) => <UpgradeCard key={u.id} save={save} u={u} />)}
      </ul>
      {showTraining && (
        <>
          <h3 className="mini-title"><Icon e="🎓" />{tr(' Treino da equipe')}</h3>
          <ul className="list">
            {training.map((u) => <UpgradeCard key={u.id} save={save} u={u} />)}
          </ul>
        </>
      )}
      <h3 className="mini-title"><Icon e="🏰" />{tr(' Expansão da loja')}</h3>
      <ol className="list expansion-track">
        {expansions.map((u) => <UpgradeCard key={u.id} save={save} u={u} />)}
      </ol>
      <h3 className="mini-title">{tr('Melhorias da loja')}</h3>
      <ul className="list">
        {others.map((u) => <UpgradeCard key={u.id} save={save} u={u} />)}
      </ul>
    </>
  );
}
