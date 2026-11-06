import { INGREDIENTS_BY_ID } from '../../domain/data/ingredients';
import { RECIPES_BY_ID } from '../../domain/data/recipes';
import type { GameSave } from '../../domain/models/types';
import { FlaskIcon } from '../../ui/icons';

export function ProductionPanel({ save }: { save: GameSave }) {
  return (
    <>
      <p className="panel-lead">Escolha uma receita conhecida. O preparo em lotes chega na próxima fase.</p>
      <ul className="list">
        {save.knownRecipes.map((id) => {
          const r = RECIPES_BY_ID[id];
          const canBrew = r.ingredients.every((i) => (save.ingredients[i.ingredientId] ?? 0) >= i.qty);
          return (
            <li key={id} className="card">
              <div className="card-head">
                <FlaskIcon color={r.color} size={20} />
                <span className="row-title">{r.name}</span>
                <span className={`tag ${canBrew ? 'tag-ok' : 'tag-warn'}`}>{canBrew ? 'pode preparar' : 'faltam ingredientes'}</span>
              </div>
              <ul className="needs">
                {r.ingredients.map((i) => {
                  const have = save.ingredients[i.ingredientId] ?? 0;
                  return (
                    <li key={i.ingredientId} className={have >= i.qty ? '' : 'missing'}>
                      {have >= i.qty ? '✓' : '✗'} {i.qty}× {INGREDIENTS_BY_ID[i.ingredientId].name}{' '}
                      <span className="muted">(tem {have})</span>
                    </li>
                  );
                })}
              </ul>
              <div className="card-foot">
                <span className="muted">{r.durationMin} min de preparo</span>
                <button className="btn btn-small" disabled title="Disponível na Fase 2">Preparar</button>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
