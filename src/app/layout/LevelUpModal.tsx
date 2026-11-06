import { INGREDIENTS } from '../../domain/data/ingredients';
import { RECIPES_BY_ID } from '../../domain/data/recipes';
import { UPGRADES } from '../../domain/data/upgrades';
import { useGameStore } from '../../store/gameStore';
import { PotionName } from '../../ui/widgets';

export function LevelUpModal() {
  const ui = useGameStore((s) => s.ui);
  const dispatch = useGameStore((s) => s.dispatch);
  if (ui.modal !== 'levelup' || !ui.levelUp) return null;
  const { level, recipes } = ui.levelUp;
  const ups = UPGRADES.filter((u) => u.requiredLevel === level);
  const ings = INGREDIENTS.filter((i) => i.supplierLevel === level);
  return (
    <div className="modal-backdrop">
      <div className="modal modal-levelup" role="dialog" aria-modal="true" aria-labelledby="lvl-title">
        <div className="burst" aria-hidden />
        <p className="modal-kicker">A loja cresceu!</p>
        <h2 id="lvl-title">Nível {level}</h2>
        <ul className="unlocks">
          {recipes.map((id) => <li key={id}>Nova receita: <PotionName id={id} /></li>)}
          {ings.map((i) => <li key={i.id}>O fornecedor agora traz <strong>{i.name}</strong></li>)}
          {ups.map((u) => <li key={u.id}>Melhoria disponível: <strong>{u.name}</strong></li>)}
          {recipes.length + ings.length + ups.length === 0 && <li>Clientes confiam mais em você e pedidos maiores chegam.</li>}
        </ul>
        {recipes.length > 0 && <p className="card-text small muted">{RECIPES_BY_ID[recipes[0]].need}: novos clientes vão procurar por isso.</p>}
        <button className="btn btn-primary btn-big" autoFocus onClick={() => dispatch({ type: 'OPEN_MODAL', modal: null })}>Que maravilha!</button>
      </div>
    </div>
  );
}
