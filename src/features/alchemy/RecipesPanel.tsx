import { INGREDIENTS_BY_ID } from '../../domain/data/ingredients';
import { RECIPES } from '../../domain/data/recipes';
import type { GameSave } from '../../domain/models/types';
import { FlaskIcon } from '../../ui/icons';

export function RecipesPanel({ save }: { save: GameSave }) {
  return (
    <>
      <p className="panel-lead">O livro herdado ainda tem páginas em branco.</p>
      <ul className="list">
        {RECIPES.map((r) => {
          const known = save.knownRecipes.includes(r.id);
          return (
            <li key={r.id} className={`card ${known ? '' : 'card-locked'}`}>
              <div className="card-head">
                <FlaskIcon color={known ? r.color : '#5c5458'} size={20} />
                <span className="row-title">{known ? r.name : '??? — página em branco'}</span>
              </div>
              {known ? (
                <>
                  <p className="card-text">{r.need}. Procurada por: {r.customerProfile.toLowerCase()}.</p>
                  <p className="card-text muted">
                    {r.ingredients.map((i) => `${i.qty}× ${INGREDIENTS_BY_ID[i.ingredientId].name}`).join(' + ')} · preço-base {r.basePrice}
                  </p>
                </>
              ) : (
                <p className="card-text muted">Pista: “{r.hint}” · nível {r.unlockLevel}</p>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
