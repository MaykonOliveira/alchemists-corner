import { useState } from 'react';
import { INGREDIENTS, INGREDIENTS_BY_ID } from '../../domain/data/ingredients';
import { RECIPES } from '../../domain/data/recipes';
import type { GameSave } from '../../domain/models/types';
import { useGameStore } from '../../store/gameStore';
import { IngredientIcon, PotionIcon } from '../../ui/SpriteIcon';
import { masteryStars } from '../../domain/rules/mastery';
import { Stars } from '../../ui/Stars';
import { LEGEND_LEVEL, LEGENDS, legendKnown, pagesFor } from '../../domain/rules/legends';
import { Icon } from '../../ui/Icon';
import { More } from '../../ui/widgets';

/** Lendas do grimório (pacote U): seis receitas fora do livro, montadas com páginas rasgadas e experimentos. */
function Legends({ save }: { save: GameSave }) {
  const anyPage = LEGENDS.some((r) => pagesFor(save, r.id) > 0 || save.knownRecipes.includes(r.id));
  if (save.level < LEGEND_LEVEL && !anyPage) return null;
  return (
    <section className="group legends">
      <h3><Icon e="📜" /> Lendas perdidas <span className="muted small">{legendKnown(save)} de {LEGENDS.length}</span></h3>
      <p className="card-text small">Seis receitas que nenhum livro guarda. Páginas rasgadas aparecem no baú da semana, nos contratos, na vitória sobre a Vesper e no Concurso Real. Cada página revela um ingrediente: junte os três na bancada.</p>
      <ul className="legend-grid">
        {LEGENDS.map((r) => {
          const known = save.knownRecipes.includes(r.id);
          const pages = pagesFor(save, r.id);
          return (
            <li key={r.id} className={`legend-card ${known ? 'legend-known' : ''}`}>
              <PotionIcon recipeId={r.id} size={32} muted={!known} />
              <span className="row-title">{known ? r.name : pages ? `Lenda de ${r.category}` : '??? lenda perdida'}</span>
              <span className="legend-pages" aria-label={`${pages} de ${r.ingredients.length} páginas`}>
                {r.ingredients.map((i, k) => (k < pages || known
                  ? <span key={k} className="legend-slot on" title={INGREDIENTS_BY_ID[i.ingredientId].name}><IngredientIcon ingredientId={i.ingredientId} /></span>
                  : <span key={k} className="legend-slot">?</span>))}
              </span>
              <span className="small muted">{known ? `preço-base ${r.basePrice}` : pages >= r.ingredients.length ? 'Receita completa: misture na bancada!' : `${pages}/${r.ingredients.length} páginas`}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function RecipesPanel({ save }: { save: GameSave }) {
  // A Poção da Coroa só aparece no livro depois que o Concurso Real a ensina.
  // Pistas em aberto vêm primeiro: é o que o jogador veio fazer aqui.
  const rank = (id: string) => (save.recipeHints?.includes(id) ? 0 : save.knownRecipes.includes(id) ? 1 : 2);
  const book = RECIPES.filter((r) => !r.legend && (!r.secret || save.knownRecipes.includes(r.id))).sort((a, b) => rank(a.id) - rank(b.id));
  const known = book.filter((r) => save.knownRecipes.includes(r.id)).length;
  return (
    <>
      <p className="panel-lead small">{known} de {book.length} receitas anotadas.</p>
      {(save.recipeHints?.length ?? 0) > 0 && (
        <p className="tip report-tutorial">
          <Icon e="📜" /> {save.recipeHints!.length === 1 ? 'Uma receita nova espera' : `${save.recipeHints!.length} receitas novas esperam`} por você. Leia a pista e acerte a mistura na bancada, lá embaixo.
        </p>
      )}
      <ul className="list">
        {book.map((r) => {
          const isKnown = save.knownRecipes.includes(r.id);
          const hinted = !isKnown && !!save.recipeHints?.includes(r.id);
          return (
            <li key={r.id} className={`card ${isKnown ? '' : hinted ? 'card-hint' : 'card-locked'}`}>
              <div className="card-head">
                <PotionIcon recipeId={r.id} size={32} muted={!isKnown} />
                <span className="row-title">{isKnown || hinted ? r.name : '??? — página em branco'}</span>
                {hinted && <span className="trend-tag">pista nova</span>}
                {isKnown && <Stars n={masteryStars(save, r.id)} />}
              </div>
              {isKnown ? (
                <>
                  <p className="card-text muted small">
                    {r.ingredients.map((i) => `${i.qty}× ${INGREDIENTS_BY_ID[i.ingredientId].name}`).join(' + ')} · preço-base {r.basePrice}
                  </p>
                  <More label="Quem procura"><p className="card-text small">{r.need}. Procurada por {r.customerProfile.toLowerCase()}.</p></More>
                </>
              ) : (
                hinted ? (
                  <p className="card-text small">Pista: “{r.hint}” · leva {r.ingredients.length} ingredientes diferentes. Misture na bancada.</p>
                ) : (
                  <p className="card-text muted small">Pista: “{r.hint}” · a pista chega no nível {r.unlockLevel}</p>
                )
              )}
            </li>
          );
        })}
      </ul>
      <Legends save={save} />
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
