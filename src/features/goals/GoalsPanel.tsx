import type { GameSave } from '../../domain/models/types';
import { CHEST_GOAL, chestPrize, chestReady, GOAL_ICON, goalText } from '../../domain/rules/goals';
import { INGREDIENTS_BY_ID } from '../../domain/data/ingredients';
import { rivalDaysLeft } from '../../domain/rules/street';
import { useGameStore } from '../../store/gameStore';
import { SpriteIcon } from '../../ui/SpriteIcon';
import { Coins } from '../../ui/widgets';
import { Icon } from '../../ui/Icon';
import { Track } from '../season/SeasonPanel';

import { tr } from '../../i18n';
/** As três metas do dia, com barra de progresso e prêmio. */
export function GoalsList({ save, compact = false }: { save: GameSave; compact?: boolean }) {
  const list = save.goals?.day === save.day ? save.goals.list : [];
  if (!list.length) return null;
  const done = list.filter((g) => g.done).length;
  return (
    <div className={`goals ${compact ? 'goals-compact' : ''}`}>
      {compact && <h3 className="mini-title">{tr('Metas do dia · ')}{done}/{list.length}</h3>}
      <ul className="goal-list">
        {list.map((g) => compact ? (
          // Início: uma linha fina por meta (nome e quanto falta). Prêmio e barra ficam no painel de Metas.
          <li key={g.id} className={`goal goal-line ${g.done ? 'goal-done' : ''}`}>
            <span className="goal-icon" aria-hidden><Icon e={g.done ? '✅' : GOAL_ICON[g.kind]} /></span>
            <span className="goal-text">{goalText(g)}</span>
            <span className="goal-count">{g.done ? 'feito' : `${g.progress}/${g.target}`}</span>
          </li>
        ) : (
          <li key={g.id} className={`goal ${g.done ? 'goal-done' : ''}`}>
            <span className="goal-icon" aria-hidden><Icon e={g.done ? '✅' : GOAL_ICON[g.kind]} /></span>
            <span className="goal-body">
              <span className="goal-text">{goalText(g)}</span>
              <span className="goal-bar" aria-label={tr('{0} de {1}', g.progress, g.target)}>
                <span style={{ width: `${(g.progress / g.target) * 100}%` }} />
              </span>
            </span>
            <span className="goal-reward">
              {g.done ? <span className="goal-check">{tr('feito')}</span> : <><Coins n={g.coins} /><span className="goal-xp">+{g.xp} XP</span></>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Diário da loja (auditoria P1.1): metas do dia, baú da semana e trilha da temporada num lugar só.
 * São três prazos (dia, semana, temporada) do mesmo hábito: cumprir as metas.
 */
export function GoalsPanel({ save }: { save: GameSave }) {
  const dispatch = useGameStore((s) => s.dispatch);
  const weekDone = save.goals?.weekDone ?? 0;
  const ready = chestReady(save);
  const claimed = !!save.goals?.chestClaimed;
  const prize = chestPrize(save);
  const left = rivalDaysLeft(save.day);
  return (
    <>
      <h3 className="mini-title">{tr('Hoje')}</h3>
      <GoalsList save={save} />
      <h3 className="mini-title">{tr('Esta semana')}</h3>
      <div className={`card chest ${ready ? 'chest-ready' : ''} ${claimed ? 'chest-open' : ''}`}>
        <div className="chest-top">
          <span className="chest-icon" aria-hidden><Icon e={claimed ? '📭' : '🎁'} size={32} /></span>
          <div>
            <p className="row-title">{claimed ? tr('Baú aberto nesta semana') : ready ? tr('O baú está pronto!') : tr('Cumpra {0} metas na semana', CHEST_GOAL)}</p>
            <p className="card-text small muted">
              {claimed ? tr('Um novo baú aparece na semana que vem.') : tr('{0}/{1} metas · a semana vira {2}.', Math.min(weekDone, CHEST_GOAL), CHEST_GOAL, left === 1 ? tr('amanhã') : tr('em {0} dias', left))}
            </p>
          </div>
        </div>
        {!claimed && (
          <span className="goal-bar chest-bar"><span style={{ width: `${Math.min(1, weekDone / CHEST_GOAL) * 100}%` }} /></span>
        )}
        <p className="loot-row" aria-label={tr('Prêmio do baú')}>
          <Coins n={prize.coins} />
          {prize.items.map((i) => (
            <span key={i.ingredientId} className="loot-item">
              <SpriteIcon name={`ingredient-${i.ingredientId}`} size={16} title={INGREDIENTS_BY_ID[i.ingredientId]?.name} /> ×{i.qty}
            </span>
          ))}
        </p>
        {ready && <button className="btn btn-primary btn-glow" onClick={() => dispatch({ type: 'CLAIM_CHEST' })}>{tr('Abrir o baú')}</button>}
      </div>
      {save.day >= 3 && <><h3 className="mini-title">{tr('Esta temporada')}</h3><Track save={save} /></>}
      {save.reports.length > 0 && (
        <button className="link-btn panel-link" onClick={() => dispatch({ type: 'OPEN_PANEL', panel: 'report' })}><Icon e="📊" />{tr(' Ver o caixa e o relatório dos dias')}</button>
      )}
    </>
  );
}
