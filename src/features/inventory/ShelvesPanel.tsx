import { RECIPES_BY_ID } from '../../domain/data/recipes';
import type { GameSave } from '../../domain/models/types';
import { FlaskIcon } from '../../ui/icons';

export const SHELF_CAPACITY = 36;

export function ShelvesPanel({ save }: { save: GameSave }) {
  const total = save.potions.reduce((n, p) => n + p.quantity, 0);
  return (
    <>
      <p className="panel-lead">
        Poções prontas para venda: <strong>{total}</strong> de {SHELF_CAPACITY} lugares.
      </p>
      {save.potions.length === 0 ? (
        <p className="empty">As prateleiras estão vazias. Prepare poções no caldeirão.</p>
      ) : (
        <ul className="list">
          {save.potions.map((stack) => {
            const r = RECIPES_BY_ID[stack.recipeId];
            return (
              <li key={stack.recipeId} className="row">
                <FlaskIcon color={r.color} size={18} />
                <div className="row-main">
                  <span className="row-title">{r.name}</span>
                  <span className="row-sub">Preço-base {r.basePrice} moedas</span>
                </div>
                <span className="qty">
                  {stack.quantity}
                  <span className={`tag ${stack.forSale ? 'tag-ok' : ''}`}>{stack.forSale ? 'à venda' : 'guardada'}</span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
