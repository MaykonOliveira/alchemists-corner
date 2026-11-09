import { DAY_EVENTS } from '../../domain/data/orders';
import { RECIPES_BY_ID } from '../../domain/data/recipes';
import type { GameSave } from '../../domain/models/types';
import { CONTRACT_DAYS, CONTRACT_LEVEL, contractDelivered, contractReady, contractTotal } from '../../domain/rules/contracts';
import { potionStock } from '../../domain/rules/economy';
import { INGREDIENTS_BY_ID } from '../../domain/data/ingredients';
import { FINDS_BY_ID } from '../../domain/data/street';
import { useGameStore } from '../../store/gameStore';
import { Coins, Meter, PotionName } from '../../ui/widgets';
import { Icon } from '../../ui/Icon';

export function OrdersPanel({ save }: { save: GameSave }) {
  const dispatch = useGameStore((s) => s.dispatch);
  const o = save.order;
  const ev = save.event ? DAY_EVENTS[save.event] : null;
  return (
    <>
      {ev && (
        <div className="card note note-gold">
          <p className="row-title"><Icon e="📜" /> {ev.name}</p>
          <p className="card-text">{ev.text}</p>
        </div>
      )}
      <ContractCard save={save} />
      {o ? (
        <div className={`card note ${o.visitor ? 'visitor-order' : ''}`}>
          <p className="muted small">{o.visitor ? <><Icon e="🧥" /> Pedido do dia</> : 'Pedido especial'} · {o.client}</p>
          <p className="card-text">{o.text}</p>
          <div className="card-head order-line">
            <span className="row-title">{o.qty}×</span>
            <PotionName id={o.recipeId} />
          </div>
          <Meter ratio={potionStock(save, o.recipeId) / o.qty} tone="ok" label="Poções prontas para o pedido" />
          <p className="card-text small">
            Você tem {potionStock(save, o.recipeId)} de {o.qty}. Prazo: até o fim do dia {o.dueDay}
            {o.dueDay === save.day ? ' (hoje!)' : ''}.
            {' '}<Icon e="🔒" /> Ficam guardadas: o botão Vender do balcão não usa estas poções.
          </p>
          <p className="card-text">
            Recompensa: <Coins n={o.rewardCoins} /> · +{o.rewardRep} reputação · +{o.rewardXp} XP
            {o.rewardSeal && ' · 1 Selo de Mestre'}
            {o.rewardFind && FINDS_BY_ID[o.rewardFind] && <> · achado lendário: <b><Icon e={FINDS_BY_ID[o.rewardFind].icon} /> {FINDS_BY_ID[o.rewardFind].name}</b></>}
          </p>
          <button
            className="btn btn-primary"
            disabled={potionStock(save, o.recipeId) < o.qty || save.phase === 'fechamento'}
            onClick={() => dispatch({ type: 'DELIVER_ORDER' })}
          >
            Entregar {o.qty} {RECIPES_BY_ID[o.recipeId].shortName}
          </button>
        </div>
      ) : save.contract ? null : (
        <div className="card note">
          <p className="row-title">Nada pregado no quadro hoje</p>
          <p className="card-text">
            {save.day < 2
              ? 'A cidade ainda está conhecendo a loja. Os primeiros pedidos especiais chegam amanhã.'
              : 'Novos pedidos chegam pela manhã. Eles pagam bem acima do preço de balcão.'}
          </p>
        </div>
      )}
    </>
  );
}

function ContractCard({ save }: { save: GameSave }) {
  const dispatch = useGameStore((s) => s.dispatch);
  const c = save.contract;
  if (!c) {
    if (save.level < CONTRACT_LEVEL) return null;
    return (
      <div className="card note contract contract-empty">
        <p className="row-title"><Icon e="📜" /> Contratos</p>
        <p className="card-text small">Nenhum contrato agora. Um novo chega em {Math.max(1, save.nextContractDay - save.day)} dia(s).</p>
      </div>
    );
  }
  const done = contractDelivered(c);
  const total = contractTotal(c);
  const ready = contractReady(save);
  const daysLeft = c.dueDay - save.day;
  return (
    <div className={`card contract ${c.accepted ? 'contract-active' : ''}`}>
      <div className="contract-ribbon">{c.accepted ? 'Contrato em andamento' : 'Contrato de vários dias'}</div>
      <p className="muted small">{c.client}</p>
      <p className="card-text">{c.text}</p>
      <ul className="contract-items">
        {c.items.map((it) => (
          <li key={it.recipeId} className={it.delivered >= it.qty ? 'contract-item-done' : ''}>
            <span className="contract-qty">{it.delivered}/{it.qty}</span>
            <PotionName id={it.recipeId} />
            {c.accepted && it.delivered < it.qty && <span className="muted small">estoque {potionStock(save, it.recipeId)}</span>}
          </li>
        ))}
      </ul>
      {c.accepted && <Meter ratio={done / total} tone="ok" label="Progresso do contrato" />}
      <div className="contract-reward">
        <span><Coins n={c.rewardCoins} /></span>
        <span>+{c.rewardRep} rep</span>
        <span>+{c.rewardXp} XP</span>
        {c.rewardSeal && <span className="contract-seal"><Icon e="✨" /> 1 Selo</span>}
      </div>
      <p className="card-text small">
        <Icon e="🎁" /> Baú: {c.rewardIngredients.map((r) => `${r.qty}× ${INGREDIENTS_BY_ID[r.ingredientId].name}`).join(', ')}
      </p>
      {c.accepted ? (
        <>
          <p className={`card-text small ${daysLeft <= 0 ? 'text-warn' : ''}`}>
            Prazo: fim do dia {c.dueDay} {daysLeft <= 0 ? '(hoje!)' : `(faltam ${daysLeft} dia${daysLeft > 1 ? 's' : ''})`}. Se vencer, você recebe só metade do proporcional e perde reputação.
          </p>
          <button className="btn btn-primary" disabled={ready === 0 || save.phase === 'fechamento'} onClick={() => dispatch({ type: 'DELIVER_CONTRACT' })}>
            {ready > 0 ? `Entregar ${ready} ${ready > 1 ? 'poções' : 'poção'}` : 'Nada para entregar ainda'}
          </button>
        </>
      ) : (
        <>
          <p className="card-text small">Aceite até o fim do dia {c.dueDay}. Depois de aceito, são {CONTRACT_DAYS} dias para entregar aos poucos.</p>
          <div className="row-actions">
            <button className="btn btn-primary" onClick={() => dispatch({ type: 'ACCEPT_CONTRACT' })}>Aceitar contrato</button>
            <button className="btn" onClick={() => dispatch({ type: 'DECLINE_CONTRACT' })}>Recusar</button>
          </div>
        </>
      )}
    </div>
  );
}
