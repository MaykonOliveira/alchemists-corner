import { RECIPES, RECIPES_BY_ID } from '../../domain/data/recipes';
import { TALENTS, talentCost } from '../../domain/data/talents';
import type { GameSave } from '../../domain/models/types';
import {
  MASTERY_STEPS, MAX_STARS, masteredRecipes, masteryCount, masteryProgress, masteryStars, talentRank,
} from '../../domain/rules/mastery';
import {
  levelProgress, MASTER_STEP_XP, masterRank, MAX_LEVEL, SEAL_LEVEL, sealPrice, sealsAvailable, sealsEarned,
} from '../../domain/rules/progression';
import { DAY_EVENTS } from '../../domain/data/orders';
import { festivalPrice } from '../../domain/rules/day';
import { Coins } from '../../ui/widgets';
import { useGameStore } from '../../store/gameStore';
import { PotionIcon } from '../../ui/SpriteIcon';
import { Stars } from '../../ui/Stars';
import { Meter } from '../../ui/widgets';

function SealBadge({ n }: { n: number }) {
  return (
    <span className="seal-badge" aria-label={`${n} Selos de Mestre`}>
      <span className="seal-icon" aria-hidden>✦</span>
      {n}
    </span>
  );
}

export function GrimoirePanel({ save }: { save: GameSave }) {
  const dispatch = useGameStore((s) => s.dispatch);
  const free = sealsAvailable(save);
  const rank = masterRank(save.xp);
  const awake = save.level >= SEAL_LEVEL || sealsEarned(save) > 0;
  const fromLevels = Math.max(0, save.level - SEAL_LEVEL + 1);
  const mastered = masteredRecipes(save);

  return (
    <>
      <div className={`grimoire-hero ${awake ? 'awake' : ''}`}>
        <div>
          <p className="grimoire-kicker">{save.level >= MAX_LEVEL ? `Mestre alquimista · grau ${rank}` : `Nível ${save.level} de ${MAX_LEVEL}`}</p>
          <p className="card-text small">
            {awake
              ? 'Selos de Mestre compram talentos permanentes. Ganhe mais subindo de nível, alcançando graus de Mestre e dominando receitas.'
              : `O Grimório desperta no nível ${SEAL_LEVEL}. Enquanto isso, domine receitas: cada uma com ${MAX_STARS} estrelas já rende 1 Selo.`}
          </p>
        </div>
        <SealBadge n={free} />
      </div>
      <ul className="seal-sources small">
        <li>Níveis {SEAL_LEVEL}+: <strong>{fromLevels}</strong></li>
        <li>Graus de Mestre: <strong>{rank}</strong></li>
        <li>Receitas dominadas: <strong>{mastered}</strong></li>
        {save.sealsBought > 0 && <li>Doações: <strong>{save.sealsBought}</strong></li>}
      </ul>
      {save.level >= MAX_LEVEL && (
        <div className="grimoire-progress">
          <span className="small">Próximo grau de Mestre ({MASTER_STEP_XP} XP por grau)</span>
          <Meter ratio={levelProgress(save.xp)} tone="gold" label="Progresso do grau de Mestre" />
        </div>
      )}

      <h3 className="mini-title">Talentos</h3>
      <ul className="list">
        {TALENTS.map((t) => {
          const r = talentRank(save, t.id);
          const maxed = r >= t.max;
          const cost = talentCost(r);
          return (
            <li key={t.id} className={`card talent ${maxed ? 'card-owned' : ''}`}>
              <div className="card-head">
                <span className="talent-icon" aria-hidden>{t.icon}</span>
                <span className="row-title">{t.name}</span>
                <span className="pips" aria-label={`Grau ${r} de ${t.max}`}>
                  {Array.from({ length: t.max }, (_, i) => <span key={i} className={i < r ? 'pip on' : 'pip'} />)}
                </span>
              </div>
              <p className="card-text small">{t.perRank} <span className="muted">(por grau)</span></p>
              <div className="card-foot">
                <span className="muted small">{maxed ? 'Grau máximo' : `Próximo grau: ${cost} selo${cost > 1 ? 's' : ''}`}</span>
                {maxed ? (
                  <span className="tag tag-ok">completo ✓</span>
                ) : (
                  <button className="btn btn-small btn-primary" disabled={free < cost} onClick={() => dispatch({ type: 'LEARN_TALENT', talentId: t.id })}>
                    {free >= cost ? 'Aprender' : `Faltam ${cost - free}`}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <h3 className="mini-title">Investimentos de mestre</h3>
      <ul className="list">
        <li className={`card ${save.level < SEAL_LEVEL ? 'card-locked' : ''}`}>
          <div className="card-head"><span className="talent-icon" aria-hidden>🏛️</span><span className="row-title">Doação à Guilda dos Alquimistas</span></div>
          <p className="card-text small">A Guilda retribui cada doação com 1 Selo de Mestre. O valor sobe a cada doação.</p>
          <div className="card-foot">
            <Coins n={sealPrice(save)} />
            {save.level < SEAL_LEVEL ? <span className="tag">nível {SEAL_LEVEL}</span> : (
              <button className="btn btn-small btn-primary" disabled={save.coins < sealPrice(save)} onClick={() => dispatch({ type: 'BUY_SEAL' })}>
                {save.coins >= sealPrice(save) ? 'Doar' : `Faltam ${sealPrice(save) - save.coins}`}
              </button>
            )}
          </div>
        </li>
        <li className={`card ${save.level < (DAY_EVENTS.festival.minLevel ?? 1) ? 'card-locked' : ''}`}>
          <div className="card-head"><span className="talent-icon" aria-hidden>🏮</span><span className="row-title">Patrocinar o Festival das Lanternas</span></div>
          <p className="card-text small">Garante o festival no próximo dia: muito mais movimento, nobres na rua e clientes pagando melhor.</p>
          <div className="card-foot">
            <Coins n={festivalPrice(save)} />
            {save.level < (DAY_EVENTS.festival.minLevel ?? 1) ? <span className="tag">nível {DAY_EVENTS.festival.minLevel}</span>
              : save.festivalSponsored ? <span className="tag tag-ok">amanhã tem festa ✓</span> : (
                <button className="btn btn-small btn-primary" disabled={save.coins < festivalPrice(save)} onClick={() => dispatch({ type: 'SPONSOR_FESTIVAL' })}>
                  {save.coins >= festivalPrice(save) ? 'Patrocinar' : `Faltam ${festivalPrice(save) - save.coins}`}
                </button>
              )}
          </div>
        </li>
      </ul>

      <h3 className="mini-title">Maestria das receitas</h3>
      <p className="card-text small muted">
        Cada poção que sai do caldeirão conta. Estrelas em {MASTERY_STEPS.join(', ')} preparos: cada uma faz o cliente aceitar pagar 4% a mais, sobe o teto de preço e dá XP extra por venda.
      </p>
      <ul className="list mastery-list">
        {RECIPES.filter((r) => save.knownRecipes.includes(r.id)).map((r) => {
          const stars = masteryStars(save, r.id);
          const n = masteryCount(save, r.id);
          return (
            <li key={r.id} className="mastery-row">
              <PotionIcon recipeId={r.id} size={32} />
              <div className="row-main">
                <span className="row-title">{RECIPES_BY_ID[r.id].shortName} <Stars n={stars} showEmpty /></span>
                <Meter ratio={masteryProgress(save, r.id)} tone={stars >= MAX_STARS ? 'ok' : 'potion'} label={`Maestria de ${r.name}`} />
                <span className="row-sub">{stars >= MAX_STARS ? `Dominada! ${n} preparadas` : `${n}/${MASTERY_STEPS[stars]} para a próxima estrela`}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
