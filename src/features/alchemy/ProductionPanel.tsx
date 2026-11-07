import { useState } from 'react';
import { INGREDIENTS_BY_ID } from '../../domain/data/ingredients';
import { RECIPES_BY_ID } from '../../domain/data/recipes';
import type { GameSave } from '../../domain/models/types';
import { brewDurationMs, maxBatches, potionsPerBatch } from '../../domain/rules/alchemy';
import { recipeCost } from '../../domain/rules/economy';
import { useGameStore } from '../../store/gameStore';
import { PotionIcon } from '../../ui/SpriteIcon';
import { Meter, PotionName, Stepper } from '../../ui/widgets';

const secs = (ms: number) => `${Math.ceil(ms / 1000)}s`;

export function ProductionPanel({ save }: { save: GameSave }) {
  const dispatch = useGameStore((s) => s.dispatch);
  const [selected, setSelected] = useState(save.knownRecipes[0]);
  const [batches, setBatches] = useState(1);
  const r = RECIPES_BY_ID[selected];
  const max = maxBatches(save, selected);
  const b = Math.max(1, Math.min(batches, Math.max(1, max)));
  const perBatch = potionsPerBatch(save);

  return (
    <>
      {save.brew ? (
        <div className="card brewing">
          <div className="card-head">
            <PotionIcon recipeId={save.brew.recipeId} size={32} />
            <span className="row-title">Fervendo: {RECIPES_BY_ID[save.brew.recipeId].name}</span>
          </div>
          <Meter ratio={save.brew.elapsedMs / save.brew.totalMs} tone="potion" label="Progresso do preparo" />
          <p className="card-text muted">
            {save.brew.batches * perBatch} poções · faltam {secs(save.brew.totalMs - save.brew.elapsedMs)}
            {save.phase === 'preparacao' ? '. Você pode abrir a loja enquanto isso.' : ''}
          </p>
        </div>
      ) : (
        <p className="panel-lead">Escolha uma receita. Cada lote rende {perBatch} poções.</p>
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
              onClick={() => { setSelected(id); setBatches(1); }}
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
            className="btn btn-primary"
            disabled={!!save.brew || max < 1 || save.phase === 'fechamento'}
            onClick={() => dispatch({ type: 'START_BREW', recipeId: selected, batches: b })}
          >
            {save.brew ? 'Caldeirão ocupado' : max < 1 ? 'Faltam ingredientes' : `Preparar ${b} lote${b > 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </>
  );
}
