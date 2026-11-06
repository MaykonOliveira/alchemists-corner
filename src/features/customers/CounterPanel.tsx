import { ARCHETYPES } from '../../domain/data/customers';
import { RECIPES_BY_ID } from '../../domain/data/recipes';
import type { GameSave } from '../../domain/models/types';
import { useGameStore } from '../../store/gameStore';
import { FlaskIcon } from '../../ui/icons';

export function CounterPanel({ save }: { save: GameSave }) {
  const visitor = useGameStore((s) => s.ui.selectedVisitor);
  if (!visitor) {
    return (
      <p className="empty">
        {save.phase === 'expediente'
          ? 'Clique em um cliente no balcão para ver o pedido.'
          : 'A loja está fechada. Abra a porta para receber clientes.'}
      </p>
    );
  }
  const a = ARCHETYPES[visitor.archetype];
  const r = RECIPES_BY_ID[visitor.wantedRecipeId];
  const stock = save.potions.find((p) => p.recipeId === r.id && p.forSale)?.quantity ?? 0;
  return (
    <div className="card">
      <div className="card-head">
        <span className="row-title">{a.label}</span>
        <span className="tag">{a.description}</span>
      </div>
      <p className="card-text">
        Procura: <FlaskIcon color={r.color} size={14} /> <strong>{r.name}</strong> — {r.need.toLowerCase()}.
      </p>
      <p className="card-text muted">Você tem {stock} na prateleira.</p>
      <div className="card-foot">
        <span className="muted">O atendimento chega na Fase 3.</span>
        <button className="btn btn-small" disabled>Vender</button>
      </div>
    </div>
  );
}
