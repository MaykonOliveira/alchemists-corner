import { useState } from 'react';
import { FAMILY_LABEL, INGREDIENTS } from '../../domain/data/ingredients';
import type { GameSave } from '../../domain/models/types';
import { countIngredients, ingredientCapacity, ingredientPrice } from '../../domain/rules/economy';
import { useGameStore } from '../../store/gameStore';
import { IngredientIcon } from '../../ui/SpriteIcon';
import { Coins, Meter, Stepper } from '../../ui/widgets';

const LOW_STOCK = 2;
const SEASON_NAME = { primavera: 'na primavera', verao: 'no verão', outono: 'no outono', inverno: 'no inverno' } as const;

export function IngredientsPanel({ save }: { save: GameSave }) {
  const [tab, setTab] = useState<'fornecedor' | 'estoque'>('fornecedor');
  const used = countIngredients(save);
  const cap = ingredientCapacity(save);
  return (
    <>
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'fornecedor'} className={`tabchip ${tab === 'fornecedor' ? 'on' : ''}`} onClick={() => setTab('fornecedor')}>Fornecedor</button>
        <button role="tab" aria-selected={tab === 'estoque'} className={`tabchip ${tab === 'estoque' ? 'on' : ''}`} onClick={() => setTab('estoque')}>Meu estoque</button>
      </div>
      <div className="capacity">
        <span>Armário: {used}/{cap}</span>
        <Meter ratio={used / cap} tone={used / cap > 0.85 ? 'warn' : 'ok'} label="Ocupação do armário" />
      </div>
      {tab === 'fornecedor' ? <Supplier save={save} room={cap - used} /> : <Stock save={save} />}
    </>
  );
}

function Supplier({ save, room }: { save: GameSave; room: number }) {
  return (
    <ul className="list">
      {INGREDIENTS.map((ing) => (
        <SupplierRow key={ing.id} save={save} id={ing.id} room={room} />
      ))}
    </ul>
  );
}

function SupplierRow({ save, id, room }: { save: GameSave; id: string; room: number }) {
  const dispatch = useGameStore((s) => s.dispatch);
  const ing = INGREDIENTS.find((i) => i.id === id)!;
  const [qty, setQty] = useState(ing.rarity === 'raro' ? 1 : 4);
  const locked = save.level < ing.supplierLevel;
  const left = save.supplier[id];
  const maxByStock = left === null || left === undefined ? 99 : left;
  const price = ingredientPrice(save, id);
  const max = Math.max(1, Math.min(maxByStock, room, Math.floor(save.coins / price), 30));
  const q = Math.min(qty, max);
  const cost = q * price;
  const canBuy = !locked && maxByStock > 0 && room > 0 && save.coins >= price && save.phase !== 'fechamento';
  const have = save.ingredients[id] ?? 0;

  return (
    <li className={`card ${locked ? 'card-locked' : ''}`}>
      <div className="card-head">
        <IngredientIcon ingredientId={ing.id} size={32} muted={locked} />
        <div className="row-main">
          <span className="row-title">{ing.name}</span>
          <span className="row-sub">{FAMILY_LABEL[ing.family]} · você tem {have}</span>
        </div>
        <Coins n={price} />
      </div>
      {locked ? (
        <p className="card-text muted">O fornecedor traz este item a partir do nível {ing.supplierLevel}{ing.season ? `, só ${SEASON_NAME[ing.season]}` : ''}.</p>
      ) : ing.season && !maxByStock ? (
        <p className="card-text muted small">🌸 Ingrediente da estação: o fornecedor só traz {SEASON_NAME[ing.season]}{save.event === 'lua-cheia' ? '' : ' (ou no Mercado da Lua Cheia)'}. A floresta das expedições também tem.</p>
      ) : (
        <>
          <p className="card-text muted small">
            {ing.season && <span className="tag tag-gold">da estação</span>} {ing.description}{left !== null && left !== undefined ? ` Restam ${left} hoje.` : ''}
          </p>
          <div className="card-foot">
            <Stepper value={q} min={1} max={max} onChange={setQty} label={`Quantidade de ${ing.name}`} />
            <button data-tut="buy" className="btn btn-small btn-primary" disabled={!canBuy} onClick={() => dispatch({ type: 'BUY_INGREDIENT', ingredientId: id, qty: q })}>
              Comprar · {cost}
            </button>
          </div>
        </>
      )}
    </li>
  );
}

function Stock({ save }: { save: GameSave }) {
  const families = Object.keys(FAMILY_LABEL) as (keyof typeof FAMILY_LABEL)[];
  return (
    <>
      {families.map((fam) => (
        <section key={fam} className="group">
          <h3>{FAMILY_LABEL[fam]}</h3>
          <ul className="list">
            {INGREDIENTS.filter((i) => i.family === fam).map((ing) => {
              const qty = save.ingredients[ing.id] ?? 0;
              return (
                <li key={ing.id} className="row">
                  <IngredientIcon ingredientId={ing.id} />
                  <div className="row-main">
                    <span className="row-title">{ing.name}</span>
                  </div>
                  <span className={`qty ${qty <= LOW_STOCK ? 'qty-low' : ''}`}>
                    {qty}
                    {qty === 0 ? <span className="tag tag-warn">sem estoque</span> : qty <= LOW_STOCK ? <span className="tag tag-warn">baixo</span> : null}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </>
  );
}
