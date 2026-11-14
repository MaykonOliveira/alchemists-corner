import { SpriteIcon } from '../../ui/SpriteIcon';
import { REGULAR_STORIES } from '../../domain/data/stories';
import { MAX_HEARTS, REGULARS, TIP_HEARTS } from '../../domain/data/world';
import type { GameSave } from '../../domain/models/types';
import { ACHIEVEMENTS, currentSeason, daysToNextSeason, giftLabel, regularState, SEASON_START_DAY } from '../../domain/rules/world';
import { PotionName } from '../../ui/widgets';
import { Icon } from '../../ui/Icon';
import { FAMILIARS } from '../../domain/data/familiars';
import { useGameStore } from '../../store/gameStore';


import { tr } from '../../i18n';
function Hearts({ n }: { n: number }) {
  return (
    <span className="hearts" aria-label={tr('{0} de {1} corações', n, MAX_HEARTS)}>
      {Array.from({ length: MAX_HEARTS }, (_, i) => <span key={i} className={i < n ? 'heart-on' : 'heart-off'}>{i < n ? '♥\uFE0E' : '♡'}</span>)}
    </span>
  );
}

/** Familiares mágicos (pacote E4): o ninho, os que já nasceram e as silhuetas dos que faltam. */
function Familiars({ save }: { save: GameSave }) {
  const dispatch = useGameStore((s) => s.dispatch);
  const evo = save.evo;
  if (!evo.familiars.length && !evo.eggs.length && save.day < 4) return null;
  return (
    <>
      <h3 className="mini-title"><Icon e="🥚" />{tr(' Familiares mágicos')}</h3>
      <p className="card-text small muted">{tr('Ovos aparecem em expedições, recordes, conquistas e na visita do dragão viajante. Chocam no ninho da loja. Dois familiares ficam ativos por vez, cada um com um bônus.')}</p>
      {evo.eggs.length > 0 && (
        <p className="card nest small">
          <Icon e="🪺" /> {tr('No ninho: ')}
          {evo.eggs.map((e, i) => <span key={e.id}>{i > 0 && ' · '}{e.hatchDay <= save.day + 1 ? tr('choca amanhã') : tr('choca em {0} dias', e.hatchDay - save.day)}</span>)}
        </p>
      )}
      <ul className="familiar-grid">
        {FAMILIARS.map((f) => {
          const have = evo.familiars.includes(f.id);
          const shiny = evo.shiny.includes(f.id);
          const active = evo.activeFamiliars.includes(f.id);
          return (
            <li key={f.id} className={`card familiar ${have ? '' : 'card-locked'} ${active ? 'familiar-active' : ''} ${shiny ? 'familiar-shiny' : ''}`}>
              <SpriteIcon name={`fam-${f.id}${shiny ? '-shiny' : ''}`} size={32} muted={!have} />
              <span className="familiar-body">
                <b>{have ? f.name : '???'}</b>{shiny && <span className="charm">{tr(' ✦ brilhante')}</span>}
                <span className="small muted">{have ? f.text : f.hint}</span>
              </span>
              {have && (
                <button className={`btn btn-small ${active ? '' : 'btn-primary'}`} onClick={() => dispatch({ type: 'SET_FAMILIAR', familiarId: f.id, on: !active })}>
                  {active ? tr('Descansar') : tr('Ativar')}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

/** Álbum do mundo da loja: estação, fregueses fiéis, conquistas e o gato. */
export function AlbumPanel({ save }: { save: GameSave }) {
  const season = currentSeason(save);
  const left = daysToNextSeason(save.day);
  const got = new Set(save.achievements);
  return (
    <>
      <div className={`card season-card season-${season.id}`}>
        <div className="season-icon" aria-hidden><Icon e={season.icon} size={32} /></div>
        <div>
          <p className="row-title">{season.name}</p>
          <p className="card-text small">
            {save.day >= SEASON_START_DAY ? season.text : tr('A cidade ainda está conhecendo a loja. A partir do dia 3, cada estação muda o que vende mais.')}
          </p>
          <p className="muted small">{left === 1 ? tr('Muda amanhã.') : tr('Faltam {0} dias para a próxima estação.', left)}</p>
        </div>
      </div>

      <Familiars save={save} />

      <h3 className="mini-title">{tr('Fregueses fiéis')}</h3>
      <p className="card-text small muted">{tr('Eles voltam sempre pedindo o de sempre. Cada vez que você entrega a favorita, ganham um coração. Com ')}{TIP_HEARTS}{tr(' corações deixam gorjeta; com ')}{MAX_HEARTS}{tr(' viram amigos e trazem um presente.')}</p>
      <ul className="list regulars">
        {REGULARS.map((r) => {
          const st = regularState(save, r.id);
          const locked = save.level < r.minLevel;
          return (
            <li key={r.id} className={`card regular ${locked ? 'card-locked' : ''} ${st.hearts >= MAX_HEARTS ? 'regular-friend' : ''}`}>
              <div className="regular-face" aria-hidden>{locked ? <Icon e="❔" size={32} /> : <SpriteIcon name={`face-${r.id}-${st.hearts >= MAX_HEARTS ? 'feliz' : 'neutro'}`} size={32} />}</div>
              <div className="regular-body">
                <p className="row-title">{locked ? '???' : r.name}</p>
                {locked ? (
                  <p className="card-text small muted">{tr('Aparece a partir do nível ')}{r.minLevel}.</p>
                ) : (
                  <>
                    <p className="card-text small">{tr('Sempre pede: ')}<PotionName id={r.favorite} /></p>
                    <p className="card-text small"><Hearts n={st.hearts} /> <span className="muted">· {st.visits}{tr(' visita')}{st.visits === 1 ? '' : 's'}</span></p>
                    {st.gift && <p className="card-text small regular-gift"><Icon e="🎁" />{tr(' Presenteou: ')}{giftLabel(r)}</p>}
                    <Story id={r.id} read={Math.min(st.hearts, REGULAR_STORIES[r.id]?.length ?? 0)} />
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <h3 className="mini-title">{tr('Conquistas · ')}{got.size}/{ACHIEVEMENTS.length}</h3>
      <ul className="achievements">
        {ACHIEVEMENTS.map((a) => (
          <li key={a.id} className={`achievement ${got.has(a.id) ? 'achievement-on' : ''}`} title={a.text}>
            <span className="achievement-icon" aria-hidden><Icon e={got.has(a.id) ? a.icon : '🔒'} size={32} /></span>
            <span className="achievement-name">{a.name}</span>
            <span className="achievement-text">{a.text}</span>
          </li>
        ))}
      </ul>

      <p className="card-text small muted album-cat"><Icon e="🐈" />{tr(' Carinhos no gato da loja: ')}{save.petCount}{tr('. Ele dá sorte uma vez por dia.')}</p>
    </>
  );
}

/** Capítulos da história do freguês (auditoria P1.6): cada coração abre um. */
function Story({ id, read }: { id: string; read: number }) {
  const story = REGULAR_STORIES[id];
  if (!story) return null;
  return (
    <details className="regular-story">
      <summary>{tr('História · ')}{read}/{story.length}{tr(' capítulos')}</summary>
      <ol>
        {story.map((ch, i) => (
          <li key={ch.title} className={i < read ? '' : 'muted'}>
            {i < read ? <><strong>{ch.title}.</strong> {ch.opening} <em>“{ch.closing}”</em></> : i === read ? tr('Próximo capítulo na próxima visita: atenda o que ele contar.') : '???'}
          </li>
        ))}
      </ol>
    </details>
  );
}
