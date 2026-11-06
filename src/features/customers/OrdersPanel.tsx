import { DAY_EVENTS } from '../../domain/data/orders';
import { RECIPES_BY_ID } from '../../domain/data/recipes';
import type { GameSave } from '../../domain/models/types';
import { potionStock } from '../../domain/rules/economy';
import { useGameStore } from '../../store/gameStore';
import { Coins, Meter, PotionName } from '../../ui/widgets';

export function OrdersPanel({ save }: { save: GameSave }) {
  const dispatch = useGameStore((s) => s.dispatch);
  const o = save.order;
  const ev = save.event ? DAY_EVENTS[save.event] : null;
  return (
    <>
      {ev && (
        <div className="card note note-gold">
          <p className="row-title">📜 {ev.name}</p>
          <p className="card-text">{ev.text}</p>
        </div>
      )}
      {o ? (
        <div className="card note">
          <p className="muted small">Pedido especial · {o.client}</p>
          <p className="card-text">{o.text}</p>
          <div className="card-head order-line">
            <span className="row-title">{o.qty}×</span>
            <PotionName id={o.recipeId} />
          </div>
          <Meter ratio={potionStock(save, o.recipeId) / o.qty} tone="ok" label="Poções prontas para o pedido" />
          <p className="card-text small">
            Você tem {potionStock(save, o.recipeId)} de {o.qty}. Prazo: até o fim do dia {o.dueDay}
            {o.dueDay === save.day ? ' (hoje!)' : ''}.
          </p>
          <p className="card-text">
            Recompensa: <Coins n={o.rewardCoins} /> · +{o.rewardRep} reputação · +{o.rewardXp} XP
          </p>
          <button
            className="btn btn-primary"
            disabled={potionStock(save, o.recipeId) < o.qty || save.phase === 'fechamento'}
            onClick={() => dispatch({ type: 'DELIVER_ORDER' })}
          >
            Entregar {o.qty} {RECIPES_BY_ID[o.recipeId].shortName}
          </button>
        </div>
      ) : (
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
