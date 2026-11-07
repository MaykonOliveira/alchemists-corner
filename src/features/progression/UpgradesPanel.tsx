import { RECIPES_BY_ID } from '../../domain/data/recipes';
import { UPGRADES } from '../../domain/data/upgrades';
import type { GameSave, ShopUpgrade } from '../../domain/models/types';
import { APPRENTICE, apprenticePlan, GOLEM, helperActive, RAVEN } from '../../domain/rules/helpers';
import { useGameStore } from '../../store/gameStore';
import { SpriteIcon } from '../../ui/SpriteIcon';
import { Coins } from '../../ui/widgets';

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
    if (save.brew) return `Mexendo o caldeirão: ${RECIPES_BY_ID[save.brew.recipeId].shortName}. Hoje: ${plural(w.brews, 'preparo', 'preparos')}.`;
    const plan = apprenticePlan(save);
    return plan ? `Vai preparar ${RECIPES_BY_ID[plan.recipeId].shortName}.` : `Esperando ingredientes ou espaço nas prateleiras. Hoje: ${plural(w.brews, 'preparo', 'preparos')}.`;
  }
  if (id === GOLEM) {
    if (save.phase !== 'expediente') return 'Esperando a loja abrir.';
    return `Atende quem espera há mais de 4s. Hoje: ${plural(w.served, 'venda', 'vendas')}.`;
  }
  return '';
}

function UpgradeCard({ save, u }: { save: GameSave; u: ShopUpgrade }) {
  const dispatch = useGameStore((s) => s.dispatch);
  const owned = save.upgrades.includes(u.id);
  const locked = save.level < u.requiredLevel;
  const afford = save.coins >= u.cost;
  const helper = u.category === 'ajudante';
  const on = owned && helperActive(save, u.id);
  return (
    <li className={`card ${locked ? 'card-locked' : ''} ${owned ? 'card-owned' : ''} ${helper ? 'card-helper' : ''}`}>
      <div className="card-head">
        {helper && <SpriteIcon name={`helper-${u.id}`} size={32} muted={locked} />}
        <span className="row-title">{u.name}</span>
        <span className={`tag ${u.category === 'visual' ? 'tag-gold' : ''} ${helper ? 'tag-helper' : ''}`}>{u.category}</span>
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
        ) : locked ? (
          <span className="tag">nível {u.requiredLevel}</span>
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
  const others = UPGRADES.filter((u) => u.category !== 'ajudante');
  return (
    <>
      <p className="panel-lead">Reinvista o lucro. Cada melhoria aparece na loja.</p>
      <h3 className="mini-title">Ajudantes</h3>
      <p className="card-text small muted">Automatizam parte do trabalho. Recebem salário no fechamento, e você pode mandá-los descansar quando quiser fazer tudo sozinho.</p>
      <ul className="list">
        {helpers.map((u) => <UpgradeCard key={u.id} save={save} u={u} />)}
      </ul>
      <h3 className="mini-title">Melhorias da loja</h3>
      <ul className="list">
        {others.map((u) => <UpgradeCard key={u.id} save={save} u={u} />)}
      </ul>
    </>
  );
}
