import type { GameSave } from '../../domain/models/types';

export function ReportPanel({ save }: { save: GameSave }) {
  const last = save.reports.at(-1);
  return (
    <>
      <dl className="stats">
        <div><dt>Caixa</dt><dd>{save.coins} moedas</dd></div>
        <div><dt>Dia</dt><dd>{save.day}</dd></div>
        <div><dt>Reputação</dt><dd>{save.reputation}</dd></div>
      </dl>
      {last ? (
        <p className="card-text">Último fechamento: dia {last.day}, lucro de {last.profit} moedas.</p>
      ) : (
        <p className="empty">Ainda não há relatórios. O primeiro aparece ao fechar o dia.</p>
      )}
    </>
  );
}
