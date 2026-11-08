import { useState } from 'react';
import { INGREDIENTS_BY_ID } from '../../domain/data/ingredients';
import { RECIPES_BY_ID } from '../../domain/data/recipes';
import type { BrewJob, GameSave } from '../../domain/models/types';
import { brewDurationMs, freeCauldron, hasSecondCauldron, maxBatches, potionsPerBatch } from '../../domain/rules/alchemy';
import { recipeCost } from '../../domain/rules/economy';
import { useGameStore } from '../../store/gameStore';
import { PotionIcon } from '../../ui/SpriteIcon';
import { Meter, PotionName, Stepper } from '../../ui/widgets';

const secs = (ms: number) => `${Math.ceil(ms / 1000)}s`;
/** "Encher": o passo de lotes começa no máximo possível. */
const FILL = 99;

export function ProductionPanel({ save }: { save: GameSave }) {
  const dispatch = useGameStore((s) => s.dispatch);
  // Começa na última receita preparada e no máximo de lotes que dá: o caldeirão não fica parado à toa.
  const [selected, setSelected] = useState(save.lastBrew && save.knownRecipes.includes(save.lastBrew.recipeId) ? save.lastBrew.recipeId : save.knownRecipes[0]);
  const [batches, setBatches] = useState(FILL);
  const r = RECIPES_BY_ID[selected];
  const max = maxBatches(save, selected);
  const b = Math.max(1, Math.min(batches, Math.max(1, max)));
  const perBatch = potionsPerBatch(save);
  const slot = freeCauldron(save);

  return (
    <>
      {save.brew || save.brew2 ? (
        <div className={hasSecondCauldron(save) ? 'cauldron-pair' : ''}>
          <BrewCard job={save.brew} label={hasSecondCauldron(save) ? 'Caldeirão 1' : null} save={save} />
          {hasSecondCauldron(save) && <BrewCard job={save.brew2} label="Caldeirão 2" save={save} />}
        </div>
      ) : (
        <p className="panel-lead">Escolha uma receita. Cada lote rende {perBatch} poções.{hasSecondCauldron(save) ? ' Você tem 2 caldeirões!' : ''}</p>
      )}

      <div className="recipe-picker" role="radiogroup" aria-label="Receitas conhecidas">
        {save.knownRecipes.map((id) => {
          const can = maxBatches(save, id) > 0;
          return (
            <button
              key={id}
              role="radio"
              aria-checked={selected === id}
              className={`recipe-chip ${selected === id ? 'on' : ''} ${can ? '' : 'dim'}`}
              onClick={() => { setSelected(id); setBatches(FILL); }}
            >
              <PotionIcon recipeId={id} />
              <span>{RECIPES_BY_ID[id].shortName}</span>
              {can ? <span className="dot-ok" aria-label="pode preparar">●</span> : null}
            </button>
          );
        })}
      </div>

      <div className="card">
        <div className="card-head"><PotionName id={selected} size={20} /></div>
        <ul className="needs">
          {r.ingredients.map((i) => {
            const have = save.ingredients[i.ingredientId] ?? 0;
            const need = i.qty * b;
            return (
              <li key={i.ingredientId} className={have >= need ? '' : 'missing'}>
                {have >= need ? '✓' : '✗'} {need}× {INGREDIENTS_BY_ID[i.ingredientId].name} <span className="muted">(tem {have})</span>
              </li>
            );
          })}
        </ul>
        <div className="brew-facts">
          <span>Rende <strong>{b * perBatch}</strong></span>
          <span>Custo ≈ <strong>{recipeCost(save, selected) * b}</strong></span>
          <span>Venda ≈ <strong>{(save.prices[selected] ?? r.basePrice) * b * perBatch}</strong></span>
          <span>Tempo <strong>{secs(brewDurationMs(save, selected, b))}</strong></span>
        </div>
        <div className="card-foot sticky-actions">
          <Stepper value={b} min={1} max={Math.max(1, max)} onChange={setBatches} label="Lotes" />
          <button
            data-tut="brew"
            className="btn btn-primary"
            disabled={!slot || max < 1 || save.phase === 'fechamento'}
            onClick={() => dispatch({ type: 'START_BREW', recipeId: selected, batches: b })}
          >
            {!slot ? (hasSecondCauldron(save) ? 'Caldeirões ocupados' : 'Caldeirão ocupado') : max < 1 ? 'Faltam ingredientes' : `Preparar ${b} lote${b > 1 ? 's' : ''}${b === max && max > 1 ? ' (máx.)' : ''}${hasSecondCauldron(save) ? ` no caldeirão ${slot}` : ''}`}
          </button>
        </div>
      </div>
    </>
  );
}

function BrewCard({ job, label, save }: { job: BrewJob | null; label: string | null; save: GameSave }) {
  if (!job) {
    return (
      <div className="card brewing brewing-idle">
        <p className="row-title">{label}: livre</p>
        <p className="card-text muted small">Escolha uma receita abaixo para usar este caldeirão.</p>
      </div>
    );
  }
  return (
    <div className="card brewing">
      <div className="card-head">
        <PotionIcon recipeId={job.recipeId} size={32} />
        <span className="row-title">{label ? `${label}: ` : 'Fervendo: '}{RECIPES_BY_ID[job.recipeId].name}</span>
      </div>
      <Meter ratio={job.elapsedMs / job.totalMs} tone="potion" label="Progresso do preparo" />
      <p className="card-text muted">
        {job.batches * potionsPerBatch(save)} poções · faltam {secs(job.totalMs - job.elapsedMs)}
        {save.phase === 'preparacao' && !label ? '. Você pode abrir a loja enquanto isso.' : ''}
      </p>
    </div>
  );
}
