import { useState } from 'react';
import { INGREDIENTS, INGREDIENTS_BY_ID } from '../../domain/data/ingredients';
import { RECIPES } from '../../domain/data/recipes';
import type { GameSave } from '../../domain/models/types';
import { useGameStore } from '../../store/gameStore';
import { IngredientIcon, PotionIcon } from '../../ui/SpriteIcon';

export function RecipesPanel({ save }: { save: GameSave }) {
  const known = RECIPES.filter((r) => save.knownRecipes.includes(r.id)).length;
  return (
    <>
      <p className="panel-lead">{known} de {RECIPES.length} receitas anotadas. Novas páginas se revelam com o nível da loja ou por experimentos.</p>
      <ul className="list">
        {RECIPES.map((r) => {
          const isKnown = save.knownRecipes.includes(r.id);
          return (
            <li key={r.id} className={`card ${isKnown ? '' : 'card-locked'}`}>
              <div className="card-head">
                <PotionIcon recipeId={r.id} size={32} muted={!isKnown} />
                <span className="row-title">{isKnown ? r.name : '??? — página em branco'}</span>
              </div>
              {isKnown ? (
                <>
                  <p className="card-text">{r.need}. Procurada por {r.customerProfile.toLowerCase()}.</p>
                  <p className="card-text muted small">
                    {r.ingredients.map((i) => `${i.qty}× ${INGREDIENTS_BY_ID[i.ingredientId].name}`).join(' + ')} · preço-base {r.basePrice}
                  </p>
                </>
              ) : (
                <p className="card-text muted small">Pista: “{r.hint}” · aprendida no nível {r.unlockLevel}</p>
              )}
            </li>
          );
        })}
      </ul>
      <Experiment save={save} />
    </>
  );
}

function Experiment({ save }: { save: GameSave }) {
  const dispatch = useGameStore((s) => s.dispatch);
  const hint = useGameStore((s) => s.ui.lastHint);
  const [picked, setPicked] = useState<string[]>([]);
  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 3 ? p : [...p, id]));
  const valid = picked.length >= 2 && picked.every((id) => (save.ingredients[id] ?? 0) > 0);

  return (
    <section className="group experiment">
      <h3>Bancada de experimentos</h3>
      <p className="card-text small">Misture 2 ou 3 ingredientes. Se der certo, a receita entra no livro. Se não, você perde só 1 ingrediente e ganha uma pista.</p>
      <div className="chips">
        {INGREDIENTS.map((i) => {
          const have = save.ingredients[i.id] ?? 0;
          return (
            <button key={i.id} className={`chip ${picked.includes(i.id) ? 'on' : ''}`} disabled={have === 0 && !picked.includes(i.id)} onClick={() => toggle(i.id)} aria-pressed={picked.includes(i.id)}>
              <IngredientIcon ingredientId={i.id} /> {i.name} <span className="muted">({have})</span>
            </button>
          );
        })}
      </div>
      <button
        className="btn btn-primary"
        disabled={!valid || save.phase === 'fechamento'}
        onClick={() => {
          dispatch({ type: 'EXPERIMENT', ingredientIds: picked });
          setPicked([]);
        }}
      >
        Misturar {picked.length > 0 ? `(${picked.length})` : ''}
      </button>
      {hint && <p className="hint-note" role="status">{hint}</p>}
    </section>
  );
}
