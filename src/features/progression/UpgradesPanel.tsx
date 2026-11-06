import { UPGRADES } from '../../domain/data/upgrades';
import type { GameSave } from '../../domain/models/types';
import { useGameStore } from '../../store/gameStore';
import { Coins } from '../../ui/widgets';

export function UpgradesPanel({ save }: { save: GameSave }) {
  const dispatch = useGameStore((s) => s.dispatch);
  return (
    <>
      <p className="panel-lead">Reinvista o lucro. Cada melhoria aparece na loja.</p>
      <ul className="list">
        {UPGRADES.map((u) => {
          const owned = save.upgrades.includes(u.id);
          const locked = save.level < u.requiredLevel;
          const afford = save.coins >= u.cost;
          return (
            <li key={u.id} className={`card ${locked ? 'card-locked' : ''} ${owned ? 'card-owned' : ''}`}>
              <div className="card-head">
                <span className="row-title">{u.name}</span>
                <span className={`tag ${u.category === 'visual' ? 'tag-gold' : ''}`}>{u.category}</span>
              </div>
              <p className="card-text small">{u.effect}</p>
              <div className="card-foot">
                <Coins n={u.cost} />
                {owned ? (
                  <span className="tag tag-ok">instalada ✓</span>
                ) : locked ? (
                  <span className="tag">nível {u.requiredLevel}</span>
                ) : (
                  <button className="btn btn-small btn-primary" disabled={!afford} onClick={() => dispatch({ type: 'BUY_UPGRADE', upgradeId: u.id })}>
                    {afford ? 'Comprar' : `Faltam ${u.cost - save.coins}`}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
