import { useState } from 'react';
import { INGREDIENTS_BY_ID } from '../../domain/data/ingredients';
import { RECIPES_BY_ID } from '../../domain/data/recipes';
import type { BrewJob, GameSave } from '../../domain/models/types';
import { brewDurationMs, brewLimits, freeCauldron, hasSecondCauldron, maxBatches, potionsPerBatch } from '../../domain/rules/alchemy';
import { missingPurchase, recipeCost, shelfPerRecipe } from '../../domain/rules/economy';
import { useGameStore } from '../../store/gameStore';
import { PotionIcon } from '../../ui/SpriteIcon';
import { Coins, Meter, PotionName, Stepper } from '../../ui/widgets';
import { StirGame } from './StirGame';
import { Icon } from '../../ui/Icon';

import { tr } from '../../i18n';
const secs = (ms: number) => `${Math.ceil(ms / 1000)}s`;

export function ProductionPanel({ save }: { save: GameSave }) {
  const dispatch = useGameStore((s) => s.dispatch);
  // Começa na última receita preparada e no máximo de lotes que dá: o caldeirão não fica parado à toa.
  const [selected, setSelected] = useState(save.lastBrew && save.knownRecipes.includes(save.lastBrew.recipeId) ? save.lastBrew.recipeId : save.knownRecipes[0]);
  // null = "encher": o máximo que os ingredientes deixam. Escolher mais lotes mostra o que falta comprar.
  const [batches, setBatches] = useState<number | null>(null);
  const r = RECIPES_BY_ID[selected];
  const max = maxBatches(save, selected);
  const lim = brewLimits(save, selected);
  const roomMax = Math.max(1, Math.min(lim.cap, lim.bySpace));
  const b = batches === null ? Math.max(1, max) : Math.max(1, Math.min(batches, roomMax));
  const perBatch = potionsPerBatch(save);
  const slot = freeCauldron(save);
  const closing = save.phase === 'fechamento';
  const noSpace = lim.bySpace < 1;
  const short = !noSpace && b > lim.byIngredients;
  const buy = short ? missingPurchase(save, selected, b) : null;
  const canBrew = !!slot && !closing && !noSpace && !short;
  const busy = [save.brew, save.brew2].filter((j): j is BrewJob => !!j).sort((a, c) => (a.totalMs - a.elapsedMs) - (c.totalMs - c.elapsedMs))[0];
  const label = closing ? tr('A loja está fechando')
    : noSpace ? (lim.shelfFull ? tr('Prateleira desta poção cheia') : tr('Prateleiras cheias'))
    : short ? tr('Faltam ingredientes')
    : !slot ? (hasSecondCauldron(save) ? tr('Caldeirões ocupados') : tr('Caldeirão ocupado'))
    : tr('Preparar {0} {1}{2}{3}', b, b > 1 ? tr('lotes') : tr('lote'), b === max && max > 1 ? tr(' (máx.)') : '', hasSecondCauldron(save) ? tr(' no caldeirão {0}', slot) : '');

  return (
    <>
      {save.brew || save.brew2 ? (
        <div className={hasSecondCauldron(save) ? 'cauldron-pair' : ''}>
          <BrewCard job={save.brew} slot={1} label={hasSecondCauldron(save) ? tr('Caldeirão 1') : null} save={save} />
          {hasSecondCauldron(save) && <BrewCard job={save.brew2} slot={2} label={tr('Caldeirão 2')} save={save} />}
        </div>
      ) : null}
      {save.brew && <StirGame key={`1-${save.brew.recipeId}-${save.brew.totalMs}`} save={save} job={save.brew} slot={1} label={hasSecondCauldron(save) ? tr('Caldeirão 1') : undefined} />}
      {save.brew2 && hasSecondCauldron(save) && <StirGame key={`2-${save.brew2.recipeId}-${save.brew2.totalMs}`} save={save} job={save.brew2} slot={2} label={tr('Caldeirão 2')} />}
      {save.brew || save.brew2 ? null : (
        <p className="panel-lead small">{tr('Cada lote rende ')}{perBatch}{tr(' poções.')}</p>
      )}

      <div className="recipe-picker" role="radiogroup" aria-label={tr('Receitas conhecidas')}>
        {save.knownRecipes.map((id) => {
          const can = maxBatches(save, id) > 0;
          return (
            <button
              key={id}
              role="radio"
              aria-checked={selected === id}
              className={`recipe-chip ${selected === id ? 'on' : ''} ${can ? '' : 'dim'}`}
              onClick={() => { setSelected(id); setBatches(null); }}
              title={can ? undefined : tr('Faltam ingredientes ou espaço')}
            >
              <PotionIcon recipeId={id} />
              <span>{RECIPES_BY_ID[id].shortName}</span>
              {save.trend?.includes(id) && <span className="trend-tag" title={tr('Procurada hoje')}>{tr('em alta')}</span>}
              {can ? <span className="dot-ok" aria-label="pode preparar">●</span> : <span className="dot-miss" aria-label="falta ingrediente">✗</span>}
            </button>
          );
        })}
      </div>

      <div className="card">
        <div className="card-head"><PotionName id={selected} size={20} /></div>
        {noSpace && !closing && (
          <div className="brew-block brew-block-space" role="status">
            {lim.shelfFull ? (
              <>
                <p className="row-title"><Icon e="🧪" />{tr(' Prateleira de ')}{r.shortName}{tr(' cheia')}</p>
                <p className="card-text small">{tr('Cabem ')}{shelfPerRecipe(save)}{tr(' poções de cada receita. Use o caldeirão para outra poção.')}</p>
              </>
            ) : (
              <>
                <p className="row-title"><Icon e="🧪" />{tr(' Prateleiras cheias')}</p>
                <p className="card-text small">{tr('Não cabe mais nenhuma poção. Venda no balcão ou entregue um pedido para liberar espaço.')}</p>
              </>
            )}
          </div>
        )}
        {short && buy && (
          <div className="brew-block" role="status">
            <p className="row-title"><Icon e="🌿" />{tr(' Faltam ingredientes para ')}{b}{b > 1 ? tr(' lotes') : tr(' lote')}</p>
            <p className="card-text small">
              {buy.items.map((m) => `${m.qty}× ${INGREDIENTS_BY_ID[m.ingredientId].name}`).join(', ')}
              {max > 0 && <>{tr(' · com o que você tem dá para ')}{max}{max > 1 ? tr(' lotes') : tr(' lote')}.</>}
            </p>
            {max > 0 && <div className="row-actions"><button className="btn btn-small" onClick={() => setBatches(max)}>{tr('Fazer só ')}{max}{max > 1 ? tr(' lotes') : tr(' lote')}</button></div>}
            {buy.error && <p className="card-text small text-warn">{buy.error}</p>}
          </div>
        )}
        {!slot && !closing && busy && (
          <p className="card-text small muted brew-wait">
            <Icon e="⏳" /> {hasSecondCauldron(save) ? tr('Os dois caldeirões estão ocupados') : tr('O caldeirão está ocupado')}{tr(': libera em ')}{secs(busy.totalMs - busy.elapsedMs)}.
            {short ? tr(' Dá para comprar os ingredientes enquanto isso.') : ''}
          </p>
        )}
        <ul className="needs">
          {r.ingredients.map((i) => {
            const have = save.ingredients[i.ingredientId] ?? 0;
            const need = i.qty * b;
            return (
              <li key={i.ingredientId} className={have >= need ? '' : 'missing'}>
                {have >= need ? '✓' : '✗'} {need}× {INGREDIENTS_BY_ID[i.ingredientId].name} <span className="muted">{tr('(tem ')}{have})</span>
              </li>
            );
          })}
        </ul>
        <div className="brew-facts">
          <span>{tr('Rende ')}<strong>{b * perBatch}</strong></span>
          <span>{tr('Custo ≈ ')}<strong>{recipeCost(save, selected) * b}</strong></span>
          <span>{tr('Venda ≈ ')}<strong>{(save.prices[selected] ?? r.basePrice) * b * perBatch}</strong></span>
          <span>{tr('Tempo ')}<strong>{secs(brewDurationMs(save, selected, b))}</strong></span>
        </div>
        <div className="card-foot sticky-actions">
          <Stepper value={b} min={1} max={roomMax} onChange={setBatches} label={tr('Lotes')} />
          {short && buy && !buy.error ? (
            <button
              data-tut="buy-missing"
              className="btn btn-primary btn-buy"
              onClick={() => dispatch({ type: 'BUY_MISSING', recipeId: selected, batches: b })}
            >
              <Icon e="🛒" />{tr(' Comprar o que falta · ')}<Coins n={buy.cost} />
            </button>
          ) : (
            <button
              data-tut="brew"
              className="btn btn-primary"
              disabled={!canBrew}
              onClick={() => dispatch({ type: 'START_BREW', recipeId: selected, batches: b })}
            >
              {label}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

function BrewCard({ job, label, save }: { job: BrewJob | null; label: string | null; save: GameSave; slot: 1 | 2 }) {
  if (!job) {
    return (
      <div className="card brewing brewing-idle">
        <p className="row-title">{label}{tr(': livre')}</p>
        <p className="card-text muted small">{tr('Escolha uma receita abaixo para usar este caldeirão.')}</p>
      </div>
    );
  }
  return (
    <div className="card brewing">
      <div className="card-head">
        <PotionIcon recipeId={job.recipeId} size={32} />
        <span className="row-title">{label ? `${label}: ` : tr('Fervendo: ')}{RECIPES_BY_ID[job.recipeId].name}</span>
      </div>
      <Meter ratio={job.elapsedMs / job.totalMs} tone="potion" label={tr('Progresso do preparo')} />
      <p className="card-text muted">
        {job.batches * potionsPerBatch(save)}{tr(' poções · faltam ')}{secs(job.totalMs - job.elapsedMs)}
        {save.phase === 'preparacao' && !label ? tr('. Você pode abrir a loja enquanto isso.') : ''}
      </p>
    </div>
  );
}
