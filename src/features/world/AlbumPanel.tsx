import { MAX_HEARTS, REGULARS, TIP_HEARTS } from '../../domain/data/world';
import type { CustomerArchetype, GameSave } from '../../domain/models/types';
import { ACHIEVEMENTS, currentSeason, daysToNextSeason, giftLabel, regularState, SEASON_START_DAY } from '../../domain/rules/world';
import { PotionName } from '../../ui/widgets';
import { Icon } from '../../ui/Icon';

const FACE: Record<CustomerArchetype, string> = { morador: '🧺', aventureiro: '⚔️', estudioso: '📚', viajante: '🎒', nobre: '👑' };

function Hearts({ n }: { n: number }) {
  return (
    <span className="hearts" aria-label={`${n} de ${MAX_HEARTS} corações`}>
      {Array.from({ length: MAX_HEARTS }, (_, i) => <span key={i} className={i < n ? 'heart-on' : 'heart-off'}>{i < n ? '♥\uFE0E' : '♡'}</span>)}
    </span>
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
            {save.day >= SEASON_START_DAY ? season.text : 'A cidade ainda está conhecendo a loja. A partir do dia 3, cada estação muda o que vende mais.'}
          </p>
          <p className="muted small">{left === 1 ? 'Muda amanhã.' : `Faltam ${left} dias para a próxima estação.`}</p>
        </div>
      </div>

      <h3 className="mini-title">Fregueses fiéis</h3>
      <p className="card-text small muted">
        Eles voltam sempre pedindo o de sempre. Cada vez que você entrega a favorita, ganham um coração. Com {TIP_HEARTS} corações deixam gorjeta;
        com {MAX_HEARTS} viram amigos e trazem um presente.
      </p>
      <ul className="list regulars">
        {REGULARS.map((r) => {
          const st = regularState(save, r.id);
          const locked = save.level < r.minLevel;
          return (
            <li key={r.id} className={`card regular ${locked ? 'card-locked' : ''} ${st.hearts >= MAX_HEARTS ? 'regular-friend' : ''}`}>
              <div className="regular-face" aria-hidden><Icon e={locked ? '❔' : FACE[r.archetype]} size={32} /></div>
              <div className="regular-body">
                <p className="row-title">{locked ? '???' : r.name}</p>
                {locked ? (
                  <p className="card-text small muted">Aparece a partir do nível {r.minLevel}.</p>
                ) : (
                  <>
                    <p className="card-text small">Sempre pede: <PotionName id={r.favorite} /></p>
                    <p className="card-text small"><Hearts n={st.hearts} /> <span className="muted">· {st.visits} visita{st.visits === 1 ? '' : 's'}</span></p>
                    {st.gift && <p className="card-text small regular-gift"><Icon e="🎁" /> Presenteou: {giftLabel(r)}</p>}
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <h3 className="mini-title">Conquistas · {got.size}/{ACHIEVEMENTS.length}</h3>
      <ul className="achievements">
        {ACHIEVEMENTS.map((a) => (
          <li key={a.id} className={`achievement ${got.has(a.id) ? 'achievement-on' : ''}`} title={a.text}>
            <span className="achievement-icon" aria-hidden><Icon e={got.has(a.id) ? a.icon : '🔒'} size={32} /></span>
            <span className="achievement-name">{a.name}</span>
            <span className="achievement-text">{a.text}</span>
          </li>
        ))}
      </ul>

      <p className="card-text small muted album-cat"><Icon e="🐈" /> Carinhos no gato da loja: {save.petCount}. Ele dá sorte uma vez por dia.</p>
    </>
  );
}
