import { RECIPES, RECIPES_BY_ID } from '../../domain/data/recipes';
import { ENDLESS_TALENT_LEVEL, TALENTS } from '../../domain/data/talents';
import type { GameSave } from '../../domain/models/types';
import {
  MASTERY_STEPS, MAX_STARS, masteredRecipes, masteryCount, masteryProgress, masteryStars, talentCrystals, talentRank,
} from '../../domain/rules/mastery';
import {
  grimoireAwake, levelProgress, MASTER_STEP_XP, masterRank, MAX_LEVEL, SEAL_CRYSTALS, SEAL_LEVEL, sealPrice,
} from '../../domain/rules/progression';
import { DAY_EVENTS } from '../../domain/data/orders';
import { festivalPrice } from '../../domain/rules/day';
import { Coins, More } from '../../ui/widgets';
import { useGameStore } from '../../store/gameStore';
import { PotionIcon } from '../../ui/SpriteIcon';
import { Stars } from '../../ui/Stars';
import { Meter } from '../../ui/widgets';
import { Icon } from '../../ui/Icon';

import { tr } from '../../i18n';
/** Uma moeda de prestígio só (auditoria P1.1): o Grimório mostra os mesmos cristais do topo da tela. */
function CrystalBadge({ n }: { n: number }) {
  return (
    <span className="seal-badge" aria-label={tr('{0} Cristais de luar', n)}>
      <Icon e="🌙" />
      {n}
    </span>
  );
}

export function GrimoirePanel({ save }: { save: GameSave }) {
  const dispatch = useGameStore((s) => s.dispatch);
  const free = save.crystals;
  const rank = masterRank(save.xp);
  const awake = grimoireAwake(save);
  const fromLevels = Math.max(0, save.level - SEAL_LEVEL + 1);
  const mastered = masteredRecipes(save);

  return (
    <>
      <div className={`grimoire-hero ${awake ? 'awake' : ''}`}>
        <div>
          <p className="grimoire-kicker">{save.level >= MAX_LEVEL ? tr('Mestre alquimista · grau {0}', rank) : tr('Nível {0} de {1}', save.level, MAX_LEVEL)}</p>
          {!awake && <p className="card-text small">{tr('O Grimório desperta no nível ')}{SEAL_LEVEL}{tr(', ou antes, quando você dominar uma receita (')}{MAX_STARS}{tr(' estrelas).')}</p>}
          <p className="card-text small">{tr('Talentos custam Cristais de luar, os mesmos da decoração: deixar a loja mais forte ou mais bonita é escolha sua.')}</p>
        </div>
        <CrystalBadge n={free} />
      </div>
      <p className="muted small">{tr('Cada uma destas conquistas rende {0} cristais:', SEAL_CRYSTALS)}</p>
      <ul className="seal-sources small">
        <li>{tr('Níveis ')}{SEAL_LEVEL}+: <strong>{fromLevels}</strong></li>
        <li>{tr('Graus de Mestre: ')}<strong>{rank}</strong></li>
        <li>{tr('Receitas dominadas: ')}<strong>{mastered}</strong></li>
        {save.sealsBought > 0 && <li>{tr('Doações: ')}<strong>{save.sealsBought}</strong></li>}
      </ul>
      {save.level >= MAX_LEVEL && (
        <div className="grimoire-progress">
          <span className="small">{tr('Próximo grau de Mestre (')}{MASTER_STEP_XP}{tr(' XP por grau)')}</span>
          <Meter ratio={levelProgress(save.xp)} tone="gold" label={tr('Progresso do grau de Mestre')} />
        </div>
      )}

      <h3 className="mini-title">{tr('Talentos')}</h3>
      <ul className="list">
        {TALENTS.filter((t) => !t.endless).map((t) => {
          const r = talentRank(save, t.id);
          const maxed = r >= t.max;
          const cost = talentCrystals(r);
          return (
            <li key={t.id} className={`card talent ${maxed ? 'card-owned' : ''}`}>
              <div className="card-head">
                <span className="talent-icon" aria-hidden><Icon e={t.icon} /></span>
                <span className="row-title">{t.name}</span>
                <span className="pips" aria-label={tr('Grau {0} de {1}', r, t.max)}>
                  {Array.from({ length: t.max }, (_, i) => <span key={i} className={i < r ? 'pip on' : 'pip'} />)}
                </span>
              </div>
              <p className="card-text small">{t.perRank} <span className="muted">{tr('(por grau)')}</span></p>
              <div className="card-foot">
                <span className="muted small">{maxed ? tr('Grau máximo') : tr('Próximo grau: {0} cristais', cost)}</span>
                {maxed ? (
                  <span className="tag tag-ok">{tr('completo ✓')}</span>
                ) : (
                  <button className="btn btn-small btn-primary" disabled={!awake || free < cost} onClick={() => dispatch({ type: 'LEARN_TALENT', talentId: t.id })}>
                    {free >= cost ? tr('Aprender') : tr('Faltam {0}', cost - free)}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <h3 className="mini-title">{tr('Talentos sem fim')}</h3>
      <More label={tr('Como funcionam')}><p className="card-text small">{tr('Sem grau máximo: cada grau custa 10 cristais a mais que o anterior. ')}{save.level < ENDLESS_TALENT_LEVEL ? tr('Abrem no nível {0}.', ENDLESS_TALENT_LEVEL) : tr('Seus cristais nunca ficam parados.')}</p></More>
      <ul className="list">
        {TALENTS.filter((t) => t.endless).map((t) => {
          const r = talentRank(save, t.id);
          const cost = talentCrystals(r);
          const locked = save.level < ENDLESS_TALENT_LEVEL;
          return (
            <li key={t.id} className={`card talent talent-endless ${locked ? 'card-locked' : ''}`}>
              <div className="card-head">
                <span className="talent-icon" aria-hidden><Icon e={t.icon} /></span>
                <span className="row-title">{t.name}</span>
                <span className="tag tag-gold">{tr('grau ')}{r}</span>
              </div>
              <p className="card-text small">{t.perRank} <span className="muted">{tr('(por grau; agora ')}{Math.round(r * t.value * 100)}%)</span></p>
              <div className="card-foot">
                <span className="muted small">{tr('Próximo grau: ')}{cost}{tr(' cristais')}</span>
                {locked ? <span className="tag">{tr('nível ')}{ENDLESS_TALENT_LEVEL}</span> : (
                  <button className="btn btn-small btn-primary" disabled={!awake || free < cost} onClick={() => dispatch({ type: 'LEARN_TALENT', talentId: t.id })}>
                    {free >= cost ? tr('Aprender') : tr('Faltam {0}', cost - free)}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <h3 className="mini-title">{tr('Investimentos de mestre')}</h3>
      <ul className="list">
        <li className={`card ${save.level < SEAL_LEVEL ? 'card-locked' : ''}`}>
          <div className="card-head"><span className="talent-icon" aria-hidden><Icon e="🏛️" /></span><span className="row-title">{tr('Doação à Guilda dos Alquimistas')}</span></div>
          <p className="card-text small">{tr('A Guilda retribui cada doação com ')}{SEAL_CRYSTALS}{tr(' Cristais de luar. O valor sobe a cada doação.')}</p>
          <div className="card-foot">
            <Coins n={sealPrice(save)} />
            {save.level < SEAL_LEVEL ? <span className="tag">{tr('nível ')}{SEAL_LEVEL}</span> : (
              <button className="btn btn-small btn-primary" disabled={save.coins < sealPrice(save)} onClick={() => dispatch({ type: 'BUY_SEAL' })}>
                {save.coins >= sealPrice(save) ? tr('Doar') : tr('Faltam {0}', sealPrice(save) - save.coins)}
              </button>
            )}
          </div>
        </li>
        <li className={`card ${save.level < (DAY_EVENTS.festival.minLevel ?? 1) ? 'card-locked' : ''}`}>
          <div className="card-head"><span className="talent-icon" aria-hidden><Icon e="🏮" /></span><span className="row-title">{tr('Patrocinar o Festival das Lanternas')}</span></div>
          <p className="card-text small">{tr('Garante o festival no próximo dia: muito mais movimento, nobres na rua e clientes pagando melhor.')}</p>
          <div className="card-foot">
            <Coins n={festivalPrice(save)} />
            {save.level < (DAY_EVENTS.festival.minLevel ?? 1) ? <span className="tag">{tr('nível ')}{DAY_EVENTS.festival.minLevel}</span>
              : save.festivalSponsored ? <span className="tag tag-ok">{tr('amanhã tem festa ✓')}</span> : (
                <button className="btn btn-small btn-primary" disabled={save.coins < festivalPrice(save)} onClick={() => dispatch({ type: 'SPONSOR_FESTIVAL' })}>
                  {save.coins >= festivalPrice(save) ? tr('Patrocinar') : tr('Faltam {0}', festivalPrice(save) - save.coins)}
                </button>
              )}
          </div>
        </li>
      </ul>

      <h3 className="mini-title">{tr('Maestria das receitas')}</h3>
      <More label={tr('Como funciona')}><p className="card-text small">{tr('Cada poção que sai do caldeirão conta. Estrelas em ')}{MASTERY_STEPS.join(', ')}{tr(' preparos: cada uma faz o cliente aceitar pagar 4% a mais, sobe o teto de preço e dá XP extra por venda.')}</p></More>
      <ul className="list mastery-list">
        {RECIPES.filter((r) => save.knownRecipes.includes(r.id)).map((r) => {
          const stars = masteryStars(save, r.id);
          const n = masteryCount(save, r.id);
          return (
            <li key={r.id} className="mastery-row">
              <PotionIcon recipeId={r.id} size={32} />
              <div className="row-main">
                <span className="row-title">{RECIPES_BY_ID[r.id].shortName} <Stars n={stars} showEmpty /></span>
                <Meter ratio={masteryProgress(save, r.id)} tone={stars >= MAX_STARS ? 'ok' : 'potion'} label={tr('Maestria de {0}', r.name)} />
                <span className="row-sub">{stars >= MAX_STARS ? tr('Dominada! {0} preparadas', n) : tr('{0}/{1} para a próxima estrela', n, MASTERY_STEPS[stars])}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
