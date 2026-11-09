import { ARCHETYPES } from '../../domain/data/customers';
import { MAX_HEARTS } from '../../domain/data/world';
import { regularOf, regularState } from '../../domain/rules/world';
import { RECIPES_BY_ID } from '../../domain/data/recipes';
import type { Customer, GameSave } from '../../domain/models/types';
import { suits } from '../../domain/rules/customers';
import { getPrice } from '../../domain/rules/economy';
import { useGameStore } from '../../store/gameStore';
import { CoinIcon } from '../../ui/icons';
import { PotionIcon } from '../../ui/SpriteIcon';
import { Meter } from '../../ui/widgets';
import { Icon } from '../../ui/Icon';

/** Quão "cheio" parece o bolso do cliente (dica, não o valor exato). */
function wallet(c: Customer) {
  return c.budgetFactor >= 1.22 ? 3 : c.budgetFactor >= 1.08 ? 2 : 1;
}

export function CounterPanel({ save }: { save: GameSave }) {
  const selectedId = useGameStore((s) => s.ui.selectedCustomerId);
  const dispatch = useGameStore((s) => s.dispatch);

  if (save.phase !== 'expediente') {
    return <p className="empty">A loja está fechada. Abra a porta para receber clientes.</p>;
  }
  if (save.customers.length === 0) {
    return <p className="empty">Ninguém no balcão agora. Logo alguém entra pela porta…</p>;
  }
  const selected = save.customers.find((c) => c.id === selectedId) ?? null;

  return (
    <>
      <div className="queue" role="listbox" aria-label="Clientes no balcão">
        {save.customers.map((c) => {
          const r = RECIPES_BY_ID[c.wantedRecipeId];
          const left = 1 - c.waitedMs / c.patienceMs;
          return (
            <button
              key={c.id}
              role="option"
              aria-selected={selected?.id === c.id}
              className={`queue-item ${selected?.id === c.id ? 'on' : ''}`}
              onClick={() => dispatch({ type: 'SELECT_CUSTOMER', id: c.id })}
            >
              <span className="row-title">{c.mystery ? 'Viajante encapuzado' : regularOf(c)?.name.split(',')[0] ?? ARCHETYPES[c.archetype].label}{regularOf(c) ? ' ♥\uFE0E' : ''}</span>
              <span className="queue-want">{c.mystery ? <><Icon e="❓" /> charada</> : c.symptom && !c.offer ? <><Icon e="🤒" /> conta o problema</> : <><PotionIcon recipeId={r.id} /> {r.shortName}{c.offer ? ' · negociando' : ''}</>}</span>
              <Meter ratio={left} tone={left > 0.5 ? 'ok' : left > 0.25 ? 'gold' : 'warn'} label="Paciência" />
            </button>
          );
        })}
      </div>
      {selected ? <Serve save={save} c={selected} /> : <p className="empty">Toque em um cliente para atender.</p>}
    </>
  );
}

function Serve({ save, c }: { save: GameSave; c: Customer }) {
  const dispatch = useGameStore((s) => s.dispatch);
  const a = ARCHETYPES[c.archetype];
  const reg = regularOf(c);
  const wanted = RECIPES_BY_ID[c.wantedRecipeId];
  const options = save.potions.filter((p) => p.forSale && p.quantity > 0);
  // Charada e sintoma: a lista não entrega a resposta.
  const hidden = c.mystery || c.symptom;
  const sorted = hidden ? options : [...options].sort((x, y) => Number(y.recipeId === c.wantedRecipeId) - Number(x.recipeId === c.wantedRecipeId));

  return (
    <div className="card serve">
      <div className="card-head">
        <span className="row-title">
          {reg ? reg.name : a.label}
          {reg && <span className="serve-hearts"> {'♥\uFE0E'.repeat(regularState(save, reg.id).hearts)}{'♡'.repeat(MAX_HEARTS - regularState(save, reg.id).hearts)}</span>}
        </span>
        <span className="wallet" title="Disposição para pagar" aria-label={`Bolso: ${wallet(c)} de 3`}>
          {Array.from({ length: 3 }, (_, i) => (
            <span key={i} className={i < wallet(c) ? '' : 'faded'}><CoinIcon size={12} /></span>
          ))}
        </span>
      </div>
      <p className="speech">“{c.remark ?? wanted.request}”</p>
      <p className="card-text small">
        {c.mystery ? <>Cliente misterioso: decifre a charada. Acertar paga <strong>3× o preço</strong> e deixa cristais.</> : c.symptom ? <>Conta o problema: escolha a poção certa. Acertar em cheio rende <strong>gorjeta</strong>; uma parecida paga menos.</> : <>Quer: <strong>{wanted.name}</strong> · {a.description}</>}
      </p>

      {c.offer ? (
        <div className="offer">
          <p className="card-text">
            Contraproposta: <strong>{c.offer.price} moedas</strong> por {RECIPES_BY_ID[c.offer.recipeId].name}
          </p>
          <div className="btn-row">
            <button className="btn btn-primary" onClick={() => dispatch({ type: 'ACCEPT_OFFER', customerId: c.id })}>Aceitar {c.offer.price}</button>
            <button className="btn" onClick={() => dispatch({ type: 'DECLINE_OFFER', customerId: c.id })}>Recusar</button>
          </div>
        </div>
      ) : (
        <>
          <h3 className="mini-title">Oferecer</h3>
          {sorted.length === 0 ? (
            <p className="empty">Nada nas prateleiras. Prepare poções no caldeirão.</p>
          ) : (
            <ul className="offer-list">
              {sorted.map((p) => {
                const r = RECIPES_BY_ID[p.recipeId];
                const exact = !hidden && p.recipeId === c.wantedRecipeId;
                const ok = !hidden && suits(c, p.recipeId);
                return (
                  <li key={p.recipeId}>
                    <button
                      className={`offer-btn ${hidden ? 'similar' : exact ? 'exact' : ok ? 'similar' : 'nope'}`}
                      onClick={() => dispatch({ type: 'SERVE_CUSTOMER', customerId: c.id, recipeId: p.recipeId })}
                    >
                      <PotionIcon recipeId={r.id} />
                      <span className="offer-name">{r.name} <span className="muted">×{p.quantity}</span></span>
                      <span className="offer-tag">{hidden ? 'arriscar' : exact ? 'o pedido' : ok ? 'parecida' : 'não serve'}</span>
                      <span className="offer-price"><CoinIcon size={12} /> {getPrice(save, p.recipeId)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <button className="btn btn-ghost-dark btn-small" onClick={() => dispatch({ type: 'DISMISS_CUSTOMER', customerId: c.id })}>
            Hoje não tenho (dispensar com educação)
          </button>
        </>
      )}
    </div>
  );
}
