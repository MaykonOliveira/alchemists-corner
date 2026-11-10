import { DAY_EVENTS } from '../../domain/data/orders';
import { INGREDIENTS_BY_ID } from '../../domain/data/ingredients';
import { RECIPES } from '../../domain/data/recipes';
import { EXPEDITIONS, FINDS, FINDS_BY_ID, RIVAL, RIVAL_LINES } from '../../domain/data/street';
import type { GameSave } from '../../domain/models/types';
import {
  canExplore, inSeason, rivalActive, rivalDaysLeft, rivalPrize, seasonalIngredient, seasonalRecipe, weekOf,
} from '../../domain/rules/street';
import { currentSeason } from '../../domain/rules/world';
import { useGameStore } from '../../store/gameStore';
import { SpriteIcon } from '../../ui/SpriteIcon';
import { Coins, PotionName } from '../../ui/widgets';
import { Icon } from '../../ui/Icon';

import { tr } from '../../i18n';
/** A rua da loja: evento especial, poção da estação, a rival e as expedições do corvo. */
export function StreetPanel({ save }: { save: GameSave }) {
  const dispatch = useGameStore((s) => s.dispatch);
  const ev = save.event ? DAY_EVENTS[save.event] : null;
  const season = currentSeason(save);
  const special = seasonalRecipe(save);
  const sea = seasonalIngredient(save);

  return (
    <>
      {ev?.rare && (
        <div className={`card rare-event rare-${ev.id}`}>
          <p className="rare-kicker">{tr('Evento raro de hoje')}</p>
          <p className="row-title"><Icon e={ev.id === 'eclipse' ? '🌑' : ev.id === 'lua-cheia' ? '🌕' : '🧥'} /> {ev.name}</p>
          <p className="card-text small">{ev.text}</p>
          {ev.id === 'visitante' && <p className="card-text small"><b>{tr('Veja o pedido no quadro de avisos.')}</b>{tr(' Ele some quando a loja fechar.')}</p>}
        </div>
      )}

      <h3 className="mini-title">{tr('Poção da estação · ')}<Icon e={season.icon} /> {season.name}</h3>
      {special && save.level >= special.unlockLevel ? (
        <div className={`card season-special season-${season.id}`}>
          <div className="card-head">
            <PotionName id={special.id} />
            <span className="tag tag-gold">{tr('só ')}{season.name.toLowerCase()}</span>
          </div>
          <p className="card-text small">{tr('Ingrediente: ')}{sea && <><SpriteIcon name={`ingredient-${sea.id}`} size={16} /> <b>{sea.name}</b></>}{tr(' no fornecedor só nesta estação')}{save.ingredients[sea?.id ?? ''] ? tr(' (você tem {0})', save.ingredients[sea!.id]) : ''}{tr('. Depois que você prepara a primeira, ela vira a sensação da rua.')}</p>
          <ul className="season-strip" aria-label={tr('Poções das quatro estações')}>
            {RECIPES.filter((r) => r.season).map((r) => (
              <li key={r.id} className={inSeason(save, r) ? 'on' : ''} title={r.name}>
                <SpriteIcon name={`potion-${r.id}`} size={32} muted={!inSeason(save, r)} />
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="card-text small muted">{tr('Abre no nível 5.')}</p>
      )}

      <h3 className="mini-title">{tr('A rival: ')}{RIVAL.shop}</h3>
      <RivalCard save={save} />

      <h3 className="mini-title">{tr('Expedições do corvo')}</h3>
      {!canExplore(save) ? (
        <p className="card-text small muted">{tr('Precisa do corvo entregador (Melhorias, nível 3).')}</p>
      ) : save.expedition ? (
        <div className="card expedition-away">
          <p className="row-title"><Icon e="🐦‍⬛" />{tr(' O corvo está em ')}{EXPEDITIONS.find((e) => e.id === save.expedition!.dest)?.name}</p>
          <p className="card-text small">{tr('Volta ')}{save.expedition.returnDay - save.day <= 1 ? tr('amanhã cedo') : tr('em {0} dias', save.expedition.returnDay - save.day)}{tr('. Enquanto isso ele não faz as entregas do fornecedor.')}</p>
        </div>
      ) : null}
      <ul className="list expeditions">
        {EXPEDITIONS.map((x) => {
          const locked = save.level < x.minLevel;
          const busy = !!save.expedition || !canExplore(save) || save.phase === 'fechamento';
          return (
            <li key={x.id} className={`card expedition ${locked ? 'card-locked' : ''}`}>
              <div className="card-head">
                <span className="expedition-icon" aria-hidden><Icon e={x.icon} size={32} /></span>
                <span className="row-title">{x.name}</span>
                <span className="tag">{x.days}{tr(' dia')}{x.days > 1 ? 's' : ''}</span>
              </div>
              <p className="card-text small">{x.text}</p>
              <p className="loot-row" aria-label={tr('Pode trazer')}>
                {x.loot.filter(([, , , lvl]) => save.level >= lvl).map(([id]) => (
                  <SpriteIcon key={id} name={`ingredient-${id}`} size={16} title={INGREDIENTS_BY_ID[id].name} />
                ))}
                {x.id === 'floresta' && sea && save.level >= sea.supplierLevel && <SpriteIcon name={`ingredient-${sea.id}`} size={16} title={sea.name} />}
                <span className="muted small">{tr(' + achados raros')}</span>
              </p>
              <div className="card-foot">
                <Coins n={x.cost} />
                {locked ? (
                  <span className="muted small">{tr('Nível ')}{x.minLevel}</span>
                ) : (
                  <button className="btn btn-small btn-primary" disabled={busy || save.coins < x.cost}
                    onClick={() => dispatch({ type: 'SEND_EXPEDITION', dest: x.id })}>{tr('Mandar o corvo')}</button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <h3 className="mini-title">{tr('Gabinete de achados · ')}{save.finds.length}/{FINDS.length}</h3>
      <ul className="finds">
        {FINDS.map((f) => {
          const got = save.finds.includes(f.id);
          return (
            <li key={f.id} className={`find ${got ? 'find-on' : ''}`} title={got ? f.text : tr('Ainda não encontrado')}>
              <span className="find-icon" aria-hidden><Icon e={got ? f.icon : '❔'} size={32} /></span>
              <span className="find-name">{got ? f.name : '???'}</span>
            </li>
          );
        })}
      </ul>
      {save.finds.length > 0 && <p className="card-text small muted">{tr('Último achado: ')}{FINDS_BY_ID[save.finds[save.finds.length - 1]]?.text}</p>}
    </>
  );
}

function RivalCard({ save }: { save: GameSave }) {
  if (!rivalActive(save)) {
    return (
      <div className="card rival rival-locked">
        <div className="rival-portrait"><SpriteIcon name="rival-vesper" size={48} muted /></div>
        <p className="card-text small">{tr('Uma loja nova está sendo montada do outro lado da rua… A disputa começa no nível ')}{RIVAL.minLevel}{tr(', a partir do dia ')}{RIVAL.minDay}.</p>
      </div>
    );
  }
  const sameWeek = save.rival.week === weekOf(save.day);
  const me = sameWeek ? save.rival.me : 0;
  const her = sameWeek ? save.rival.her : 0;
  const max = Math.max(1, me, her);
  const ahead = me >= her;
  const lines = ahead ? RIVAL_LINES.behind : RIVAL_LINES.ahead;
  const line = lines[save.day % lines.length];
  const left = rivalDaysLeft(save.day);
  return (
    <div className={`card rival ${ahead ? 'rival-me-ahead' : 'rival-her-ahead'}`}>
      <div className="rival-top">
        <div className="rival-portrait"><SpriteIcon name="rival-vesper" size={48} /></div>
        <div>
          <p className="row-title">{RIVAL.name}</p>
          <p className="speech rival-speech">“{me === 0 && her === 0 ? tr('Vamos ver quem vende mais esta semana, vizinha.') : line}”</p>
        </div>
      </div>
      <div className="duel" aria-label={tr('Placar da semana')}>
        <div className="duel-row"><span>{tr('Você')}</span><span className="duel-bar"><span className="duel-me" style={{ width: `${(me / max) * 100}%` }} /></span><Coins n={Math.round(me)} /></div>
        <div className="duel-row"><span>{tr('Vesper')}</span><span className="duel-bar"><span className="duel-her" style={{ width: `${(her / max) * 100}%` }} /></span><Coins n={Math.round(her)} /></div>
      </div>
      <p className="card-text small muted">{tr('O placar soma vendas e pedidos até o fechamento. ')}{left === 1 ? tr('A disputa termina hoje no fechamento.') : tr('Termina em {0} dias.', left)}{tr(' Prêmio: ')}<Coins n={rivalPrize(save)} />{tr(' e ingredientes raros.')}{' '}{tr('Placar geral: ')}{save.rival.wins}{tr(' vitória')}{save.rival.wins === 1 ? '' : 's'} · {save.rival.losses}{tr(' derrota')}{save.rival.losses === 1 ? '' : 's'}.
      </p>
    </div>
  );
}
