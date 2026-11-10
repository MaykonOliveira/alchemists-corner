import { useState } from 'react';
import { DAY_EVENTS } from '../../domain/data/orders';
import type { GameSave } from '../../domain/models/types';
import { maintenanceCost } from '../../domain/rules/economy';
import { useGameStore } from '../../store/gameStore';

import { tr } from '../../i18n';
export function DoorPanel({ save }: { save: GameSave }) {
  const dispatch = useGameStore((s) => s.dispatch);
  const [confirm, setConfirm] = useState(false);
  const ev = save.event ? DAY_EVENTS[save.event] : null;
  if (save.phase === 'preparacao') {
    return (
      <>
        {ev && <p className="card-text"><strong>{ev.name}:</strong> {ev.text}</p>}
        <p className="panel-lead">{tr('A placa diz FECHADO. Abasteça as prateleiras e vire a placa quando estiver pronto.')}</p>
        <button className="btn btn-primary btn-big" onClick={() => dispatch({ type: 'OPEN_SHOP' })}>{tr('Abrir a loja')}</button>
      </>
    );
  }
  if (save.phase === 'expediente') {
    return (
      <>
        <p className="panel-lead">{tr('A loja está aberta. Ao encerrar, os clientes no balcão saem e é cobrada a manutenção de ')}{maintenanceCost(save)}{tr(' moedas.')}</p>
        {confirm ? (
          <div className="btn-row">
            <button className="btn btn-danger" onClick={() => dispatch({ type: 'CLOSE_SHOP' })}>{tr('Encerrar agora')}</button>
            <button className="btn" onClick={() => setConfirm(false)}>{tr('Continuar aberto')}</button>
          </div>
        ) : (
          <button className="btn" onClick={() => setConfirm(true)}>{tr('Encerrar o expediente')}</button>
        )}
      </>
    );
  }
  return <p className="empty">{tr('O expediente terminou.')}</p>;
}
