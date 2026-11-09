import { RECIPES_BY_ID } from '../../domain/data/recipes';
import { UPGRADES } from '../../domain/data/upgrades';
import type { GameSave, ShopUpgrade } from '../../domain/models/types';
import { APPRENTICE, apprenticePlan, GOLEM, golemDelayMs, helperActive, RAVEN } from '../../domain/rules/helpers';
import { useGameStore } from '../../store/gameStore';
import { SpriteIcon } from '../../ui/SpriteIcon';
import { Coins } from '../../ui/widgets';
import { Icon } from '../../ui/Icon';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Frase curta sobre o que o ajudante está fazendo agora. */
function helperStatus(save: GameSave, id: string): string {
  if (!helperActive(save, id)) return 'Descansando. Ligue para voltar ao trabalho.';
  if (save.phase === 'fechamento') return 'Loja fechada: descansando até amanhã.';
  const w = save.stats.helperWork;
  if (id === RAVEN) {
    const next = Math.max(1, Math.ceil(save.helpers.ravenInMs / 1000));
    return `Hoje: ${plural(w.deliveries, 'viagem', 'viagens')}, ${plural(w.delivered, 'item', 'itens')}. Confere o armário de novo em ${next}s.`;
  }
  if (id === APPRENTICE) {
    const job = save.brew ?? save.brew2;
    if (job && !apprenticePlan(save)) return `Mexendo o caldeirão: ${RECIPES_BY_ID[job.recipeId].shortName}. Hoje: ${plural(w.brews, 'preparo', 'preparos')}.`;
    const plan = apprenticePlan(save);
    return plan ? `Vai preparar ${RECIPES_BY_ID[plan.recipeId].shortName}.` : `Esperando ingredientes ou espaço nas prateleiras. Hoje: ${plural(w.brews, 'preparo', 'preparos')}.`;
  }
  if (id === GOLEM) {
    if (save.phase !== 'expediente') return 'Esperando a loja abrir.';
    return `Atende quem espera há mais de ${Math.round(golemDelayMs(save) / 100) / 10}s. Hoje: ${plural(w.served, 'venda', 'vendas')}.`;
  }
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
        {u.category === 'treino' && u.requires && <SpriteIcon name={`helper-${u.requires}`} size={32} muted={locked} />}
        <span className="row-title">{u.name}</span>
        <span className={`tag ${u.category === 'visual' || expansion ? 'tag-gold' : ''} ${helper ? 'tag-helper' : ''}`}>{expansion ? 'expansão' : u.category}</span>
      </div>
      <p className="card-text small">{u.effect}</p>
      {helper && <p className="card-text small muted">Salário: {u.upkeep} moedas por dia.</p>}
      {owned && helper && <p className="helper-status small">{helperStatus(save, u.id)}</p>}
      <div className="card-foot">
        <Coins n={u.cost} />
        {owned && helper ? (
          <label className="switch">
            <input type="checkbox" checked={on} onChange={(e) => dispatch({ type: 'SET_HELPER', upgradeId: u.id, on: e.target.checked })} />
            <span className="switch-track" aria-hidden />
            <span>{on ? 'Trabalhando' : 'Descansando'}</span>
          </label>
        ) : owned ? (
          <span className="tag tag-ok">instalada ✓</span>
        ) : save.level < u.requiredLevel ? (
          <span className="tag">nível {u.requiredLevel}</span>
        ) : needs ? (
          <span className="tag">antes: {needs.name}</span>
        ) : (
          <button className="btn btn-small btn-primary" disabled={!afford} onClick={() => dispatch({ type: 'BUY_UPGRADE', upgradeId: u.id })}>
            {afford ? (helper ? 'Contratar' : 'Comprar') : `Faltam ${u.cost - save.coins}`}
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
      <p className="panel-lead">Reinvista o lucro. Cada melhoria aparece na loja.</p>
      <h3 className="mini-title">Ajudantes</h3>
      <p className="card-text small muted">Automatizam parte do trabalho. Recebem salário no fechamento, e você pode mandá-los descansar quando quiser fazer tudo sozinho.</p>
      <ul className="list">
        {helpers.map((u) => <UpgradeCard key={u.id} save={save} u={u} />)}
      </ul>
      {showTraining && (
        <>
          <h3 className="mini-title"><Icon e="🎓" /> Treino da equipe</h3>
          <p className="card-text small muted">Cada ajudante pode evoluir uma vez, no nível máximo da loja.</p>
          <ul className="list">
            {training.map((u) => <UpgradeCard key={u.id} save={save} u={u} />)}
          </ul>
        </>
      )}
      <h3 className="mini-title"><Icon e="🏰" /> Expansão da loja</h3>
      <p className="card-text small muted">Obras grandes, em etapas: cada uma abre a próxima. A loja cresce de verdade na tela.</p>
      <ol className="list expansion-track">
        {expansions.map((u) => <UpgradeCard key={u.id} save={save} u={u} />)}
      </ol>
      <h3 className="mini-title">Melhorias da loja</h3>
      <ul className="list">
        {others.map((u) => <UpgradeCard key={u.id} save={save} u={u} />)}
      </ul>
    </>
  );
}
