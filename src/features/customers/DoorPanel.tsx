import type { GameSave } from '../../domain/models/types';
import { useGameStore } from '../../store/gameStore';

export function DoorPanel({ save }: { save: GameSave }) {
  const dispatch = useGameStore((s) => s.dispatch);
  if (save.phase === 'preparacao') {
    return (
      <>
        <p className="panel-lead">A placa diz FECHADO. Quando estiver pronto, vire a placa e comece o expediente.</p>
        <button className="btn btn-primary" onClick={() => dispatch({ type: 'OPEN_SHOP' })}>Abrir a loja</button>
      </>
    );
  }
  if (save.phase === 'expediente') {
    return (
      <>
        <p className="panel-lead">A loja está aberta. Clientes entram por esta porta.</p>
        <button className="btn" onClick={() => dispatch({ type: 'CLOSE_SHOP' })}>Encerrar o expediente</button>
      </>
    );
  }
  return <p className="empty">O expediente terminou.</p>;
}
