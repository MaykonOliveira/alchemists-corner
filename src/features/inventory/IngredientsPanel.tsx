import { useState } from 'react';
import { FAMILY_LABEL, INGREDIENTS } from '../../domain/data/ingredients';
import type { GameSave } from '../../domain/models/types';
import { countIngredients, ingredientCapacity, ingredientPrice } from '../../domain/rules/economy';
import { useGameStore } from '../../store/gameStore';
import { IngredientIcon } from '../../ui/SpriteIcon';
import { Coins, Meter, More, Stepper } from '../../ui/widgets';
import { Icon } from '../../ui/Icon';

import { tr } from '../../i18n';
const LOW_STOCK = 2;
const SEASON_NAME = { primavera: tr('na primavera'), verao: tr('no verão'), outono: tr('no outono'), inverno: tr('no inverno') } as const;

/**
 * Armário e fornecedor numa lista só: cada ingrediente mostra quanto você tem e o preço para comprar mais.
 * Os que ainda não chegaram ficam juntos numa linha no fim, em vez de um cartão cada.
 */
export function IngredientsPanel({ save }: { save: GameSave }) {
  const used = countIngredients(save);
  const cap = ingredientCapacity(save);
  const room = cap - used;
  const open = INGREDIENTS.filter((i) => save.level >= i.supplierLevel);
  const later = INGREDIENTS.filter((i) => save.level < i.supplierLevel);
  return (
    <>
      <div className="capacity">
        <span>{tr('Armário: ')}{used}/{cap}</span>
        <Meter ratio={used / cap} tone={used / cap > 0.85 ? 'warn' : 'ok'} label={tr('Ocupação do armário')} />
      </div>
      <ul className="list">
        {open.map((ing) => <SupplierRow key={ing.id} save={save} id={ing.id} room={room} />)}
      </ul>
      {later.length > 0 && (
        <More label={tr('Chegam nos próximos níveis ({0})', later.length)}>
          <ul className="list-plain">
            {later.map((ing) => (
              <li key={ing.id}><IngredientIcon ingredientId={ing.id} size={16} muted /> {ing.name}{tr(': nível ')}{ing.supplierLevel}{ing.season ? tr(', só {0}', SEASON_NAME[ing.season]) : ''}</li>
            ))}
          </ul>
        </More>
      )}
    </>
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
          <span className={`row-sub ${have <= LOW_STOCK ? 'qty-low' : ''}`}>{tr('Você tem ')}{have}{have === 0 ? tr(' · acabou') : have <= LOW_STOCK ? tr(' · baixo') : ''}</span>
        </div>
        <Coins n={price} />
      </div>
      {locked ? (
        <p className="card-text muted">{tr('O fornecedor traz este item a partir do nível ')}{ing.supplierLevel}{ing.season ? tr(', só {0}', SEASON_NAME[ing.season]) : ''}.</p>
      ) : ing.season && !maxByStock ? (
        <p className="card-text muted small"><Icon e="🌸" />{tr(' Só ')}{SEASON_NAME[ing.season]}{save.event === 'lua-cheia' ? '' : tr(' (ou no Mercado da Lua Cheia)')}.</p>
      ) : (
        <>
          <div className="card-foot">
            <Stepper value={q} min={1} max={max} onChange={setQty} label={tr('Quantidade de {0}', ing.name)} />
            <button data-tut="buy" className="btn btn-small btn-primary" disabled={!canBuy} onClick={() => dispatch({ type: 'BUY_INGREDIENT', ingredientId: id, qty: q })}>{tr('Comprar · ')}{cost}
            </button>
          </div>
          <More label={left !== null && left !== undefined ? tr('Restam {0} hoje · sobre', left) : tr('Sobre')}>
            <p className="card-text small">{ing.season && <span className="tag tag-gold">{tr('da estação')}</span>} {FAMILY_LABEL[ing.family]}. {ing.description}</p>
          </More>
        </>
      )}
    </li>
  );
}
