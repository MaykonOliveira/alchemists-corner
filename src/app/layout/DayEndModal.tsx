import { useGameStore } from '../../store/gameStore';

export function DayEndModal() {
  const save = useGameStore((s) => s.save)!;
  const dispatch = useGameStore((s) => s.dispatch);
  if (save.phase !== 'fechamento') return null;
  return (
    <div className="modal-backdrop">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="day-end-title">
        <h2 id="day-end-title">Fim do dia {save.day}</h2>
        <p>As lanternas se apagam e a placa volta para FECHADO.</p>
        <p className="muted">O relatório completo (receita, custos e lucro) chega na Fase 3.</p>
        <button className="btn btn-primary" autoFocus onClick={() => dispatch({ type: 'START_NEXT_DAY' })}>
          Começar o dia {save.day + 1}
        </button>
      </div>
    </div>
  );
}
