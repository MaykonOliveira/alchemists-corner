import villageUrl from '../../assets/sprites/village.png';
import sheet from '../../assets/sprites/village.json';
import { RECIPES_BY_ID } from '../../domain/data/recipes';
import { STAGE_NAMES, VILLAGE, VILLAGE_LEVEL } from '../../domain/data/village';
import type { GameSave } from '../../domain/models/types';
import { potionStock } from '../../domain/rules/economy';
import { villageBlocker, villageProgress, villageStage } from '../../domain/rules/village';
import { useGameStore } from '../../store/gameStore';
import { Coins, Meter } from '../../ui/widgets';
import { Icon } from '../../ui/Icon';

/** Uma obra no estado atual (terreno, fundação, paredes ou pronta), recortada de village.png. */
export function Building({ id, stage, scale = 2 }: { id: string; stage: number; scale?: number }) {
  const row = sheet.rows.indexOf(id);
  const size = `${sheet.w * sheet.cols * scale}px ${sheet.h * sheet.rows.length * scale}px`;
  const at = (col: number) => `-${col * sheet.w * scale}px -${row * sheet.h * scale}px`;
  // Terreno vazio ou só a fundação: a planta da casa pronta aparece desenhada por cima (revisão visual V5).
  const plan = stage <= 1;
  return (
    <span
      className={`building ${stage >= 3 ? 'done' : ''} ${plan ? 'building-plan' : ''}`}
      aria-hidden
      style={{
        width: sheet.w * scale, height: sheet.h * scale,
        backgroundImage: plan ? `url(${villageUrl}), url(${villageUrl})` : `url(${villageUrl})`,
        backgroundSize: plan ? `${size}, ${size}` : size,
        backgroundPosition: plan ? `${at(4)}, ${at(stage)}` : at(stage),
      }}
    />
  );
}

/** Reconstruir a vila: seis obras grandes, em etapas, cada uma com um bônus permanente. */
export function VillagePanel({ save }: { save: GameSave }) {
  const dispatch = useGameStore((s) => s.dispatch);
  const progress = villageProgress(save);
  const locked = save.level < VILLAGE_LEVEL;
  return (
    <>
      <div className="village-hero">
        <div className="village-panorama" aria-label="A vila">
          {VILLAGE.map((p) => <Building key={p.id} id={p.id} stage={villageStage(save, p.id)} scale={1} />)}
        </div>
        <div className="village-progress">
          <span>Vila reconstruída</span>
          <strong>{Math.round(progress * 100)}%</strong>
        </div>
        <Meter ratio={progress} tone="gold" label="Vila reconstruída" />
      </div>
      <p className="panel-lead">
        {locked
          ? `A prefeitura aceita ajuda a partir do nível ${VILLAGE_LEVEL}. Guarde moedas: as obras são grandes.`
          : 'A vila cresce com as suas moedas. Cada obra tem três etapas e, inaugurada, ajuda a loja para sempre.'}
      </p>
      <ul className="list">
        {VILLAGE.map((p) => {
          const stage = villageStage(save, p.id);
          const done = stage >= 3;
          const blocker = villageBlocker(save, p.id);
          const cost = done ? 0 : p.stages[stage];
          const needsDonation = stage === 2 && p.donation;
          return (
            <li key={p.id} className={`card village-card ${done ? 'card-owned' : ''} ${locked ? 'card-locked' : ''}`}>
              <div className="village-row">
                <Building id={p.id} stage={stage} scale={2} />
                <div className="row-main">
                  <div className="card-head">
                    <span className="row-title"><Icon e={p.icon} /> {p.name}</span>
                    <span className="stage-pips" aria-label={`Etapa ${stage} de 3`}>
                      {STAGE_NAMES.map((n, i) => <span key={n} className={i < stage ? 'pip on' : 'pip'} title={n} />)}
                    </span>
                  </div>
                  <p className="card-text small">{p.text}</p>
                  <p className="card-text small"><b>{done ? 'Bônus ativo:' : 'Ao inaugurar:'}</b> {p.bonusText}</p>
                </div>
              </div>
              {!done && (
                <div className="card-foot">
                  <span className="small">
                    {STAGE_NAMES[stage]}: <Coins n={cost} />
                    {needsDonation && <> + {p.donation!.qty}× {RECIPES_BY_ID[p.donation!.recipeId].shortName} <span className="muted">({potionStock(save, p.donation!.recipeId)})</span></>}
                  </span>
                  {locked ? <span className="tag">nível {VILLAGE_LEVEL}</span> : (
                    <button className="btn btn-small btn-primary" disabled={!!blocker} title={blocker ?? undefined} onClick={() => dispatch({ type: 'BUILD_VILLAGE', projectId: p.id })}>
                      {blocker && save.coins < cost ? `Faltam ${cost - save.coins}` : stage === 2 ? 'Inaugurar' : 'Construir'}
                    </button>
                  )}
                </div>
              )}
              {!done && blocker && save.coins >= cost && !locked && <p className="card-text small muted">{blocker}</p>}
            </li>
          );
        })}
      </ul>
    </>
  );
}
