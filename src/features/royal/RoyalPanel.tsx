import { RECIPES_BY_ID } from '../../domain/data/recipes';
import { QUEEN, ROYAL_CHAPTERS, ROYAL_TITLE } from '../../domain/data/royal';
import type { GameSave } from '../../domain/models/types';
import { potionStock } from '../../domain/rules/economy';
import { masteryStars } from '../../domain/rules/mastery';
import {
  royalChapter, royalDaysLeft, royalDeliverable, royalGoal, royalStarsMissing, royalWon,
} from '../../domain/rules/royal';
import { CATEGORY_LABEL } from '../../domain/data/world';
import { useGameStore } from '../../store/gameStore';
import { PotionIcon, SpriteIcon } from '../../ui/SpriteIcon';
import { Coins, Meter } from '../../ui/widgets';
import { Icon } from '../../ui/Icon';

import { tr } from '../../i18n';
/** Os cinco troféus: conquistados brilham, os outros aparecem apagados. */
export function TrophyRow({ save, size = 32 }: { save: GameSave; size?: number }) {
  const won = Math.min(5, save.royal?.chapter ?? 0);
  return (
    <div className="trophy-row" aria-label={tr('{0} de 5 troféus', won)}>
      {ROYAL_CHAPTERS.map((c, i) => (
        <span key={c.id} className={`trophy ${i < won ? 'on' : ''}`} title={i < won ? c.trophy : tr('{0} (capítulo {1})', c.trophy, i + 1)}>
          <SpriteIcon name={`trophy-${i}`} size={size} muted={i >= won} />
        </span>
      ))}
    </div>
  );
}

export function RoyalPanel({ save }: { save: GameSave }) {
  const dispatch = useGameStore((s) => s.dispatch);
  const r = save.royal;
  if (!r) return <p className="panel-lead">{tr('O Concurso Real abre quando a loja chega ao nível 15.')}</p>;

  if (royalWon(save)) {
    return (
      <>
        <div className="royal-hero won">
          <p className="royal-kicker">{tr('Concurso vencido')}</p>
          <h3 className="royal-title"><Icon e="👑" /> {ROYAL_TITLE}</h3>
          <p className="card-text">A {QUEEN}{tr(' provou a Poção da Coroa e entregou a coroa à sua loja. A fachada agora brilha e a nobreza procura a Poção da Coroa no balcão.')}</p>
          <TrophyRow save={save} size={48} />
        </div>
        <ul className="list">
          {ROYAL_CHAPTERS.map((c) => (
            <li key={c.id} className="card card-owned"><span className="row-title"><Icon e={c.icon} /> {c.title}</span> <span className="tag tag-ok">{c.trophy} ✓</span></li>
          ))}
        </ul>
        <button className="btn btn-primary" onClick={() => dispatch({ type: 'OPEN_MODAL', modal: 'royal' })}>{tr('Rever a cerimônia')}</button>
      </>
    );
  }

  const ch = royalChapter(save)!;
  const goal = royalGoal(save);
  const left = royalDaysLeft(save);
  const deliverable = royalDeliverable(save);
  const stars = royalStarsMissing(save);
  const unseen = r.seen < r.chapter;

  return (
    <>
      <div className="royal-hero">
        <p className="royal-kicker">{tr('Capítulo ')}{r.chapter + 1}{tr(' de ')}{ROYAL_CHAPTERS.length}</p>
        <h3 className="royal-title"><Icon e={ch.icon} /> {ch.title}</h3>
        <p className="card-text">{ch.task}</p>
        <Meter ratio={goal.total ? goal.done / goal.total : 0} tone="gold" label={tr('Progresso do capítulo')} />
        <div className="royal-stats">
          <strong>{goal.done}/{goal.total}</strong>
          {left !== null && <span className={left <= 1 ? 'neg-text' : ''}>{left === 0 ? tr('último dia!') : left === 1 ? tr('termina hoje') : tr('{0} dias', left)}</span>}
          <span>{tr('Prêmio: ')}<Coins n={ch.reward.coins} /> + {ch.reward.crystals} <Icon e="🌙" /></span>
        </div>
        {unseen && <button className="btn btn-primary btn-glow" onClick={() => dispatch({ type: 'OPEN_MODAL', modal: 'royal' })}>{tr('Ler o capítulo')}</button>}
      </div>

      {ch.goal.kind === 'entregar' && (
        <section className="royal-deliver">
          <h3 className="mini-title">{tr('Entrega')}</h3>
          <ul className="list">
            {ch.goal.items.map((i) => {
              const sent = r.delivered[i.recipeId] ?? 0;
              return (
                <li key={i.recipeId} className={`mastery-row ${sent >= i.qty ? 'done' : ''}`}>
                  <PotionIcon recipeId={i.recipeId} size={32} />
                  <div className="row-main">
                    <span className="row-title">{RECIPES_BY_ID[i.recipeId].name}</span>
                    <Meter ratio={sent / i.qty} tone={sent >= i.qty ? 'ok' : 'potion'} />
                    <span className="row-sub">{tr('Entregues ')}{sent}/{i.qty}{tr(' · nas prateleiras: ')}{potionStock(save, i.recipeId)}</span>
                  </div>
                </li>
              );
            })}
          </ul>
          {stars && (
            <p className="hint-note">{tr('Os astrônomos pedem ')}{stars.n}{tr(' estrelas de maestria no ')}{RECIPES_BY_ID[stars.recipeId].shortName}{tr('. Você tem ')}{masteryStars(save, stars.recipeId)}{tr(': continue preparando.')}</p>
          )}
          <button className="btn btn-primary btn-big" disabled={!deliverable.length || !!stars || unseen} onClick={() => dispatch({ type: 'DELIVER_ROYAL' })}>
            {deliverable.length ? tr('Entregar {0} poções', deliverable.reduce((n, i) => n + i.qty, 0)) : tr('Prepare as poções para entregar')}
          </button>
        </section>
      )}
      {ch.goal.kind === 'vender' && <p className="card-text small">{tr('Toda venda de poção de ')}{CATEGORY_LABEL[ch.goal.category]}{tr(' conta, inclusive as do golem.')}</p>}
      {ch.goal.kind === 'nobres' && <p className="card-text small">{tr('Atenda rápido: se um nobre for embora sem comprar, a contagem volta a zero. Tenha Brilho, Sorte, Pena-leve, Estelar e Fênix nas prateleiras.')}</p>}

      <h3 className="mini-title">{tr('Troféus')}</h3>
      <TrophyRow save={save} />
      {r.retries > 0 && <p className="card-text small muted">{tr('O prazo já foi renovado ')}{r.retries}{r.retries > 1 ? tr(' vezes') : tr(' vez')}{tr('. Sem pressa: o concurso espera você.')}</p>}
    </>
  );
}
