import { RECIPES_BY_ID } from '../../domain/data/recipes';
import type { GameSave } from '../../domain/models/types';
import { maintenanceCost } from '../../domain/rules/economy';
import { Coins } from '../../ui/widgets';

export function ReportPanel({ save }: { save: GameSave }) {
  const st = save.stats;
  const recent = save.reports.slice(-7);
  const maxAbs = Math.max(1, ...recent.map((r) => Math.abs(r.profit)));
  const best = Object.entries(st.salesByRecipe).sort((a, b) => b[1] - a[1])[0];
  return (
    <>
      <h3 className="mini-title">Hoje (dia {save.day})</h3>
      <dl className="stats">
        <div><dt>Vendas</dt><dd><Coins n={st.revenue} /></dd></div>
        <div><dt>Ingredientes</dt><dd>−{st.ingredientCost}</dd></div>
        <div><dt>Pedidos</dt><dd>+{st.orderRewards}</dd></div>
        <div><dt>Atendidos</dt><dd>{st.served}</dd></div>
        <div><dt>Perdidos</dt><dd>{st.lost}</dd></div>
        <div><dt>Mais vendida</dt><dd className="small">{best ? RECIPES_BY_ID[best[0]].shortName : '—'}</dd></div>
      </dl>
      <p className="card-text small muted">Manutenção cobrada ao fechar: {maintenanceCost(save)} moedas (aluguel, lenha e velas).</p>

      <h3 className="mini-title">Últimos dias</h3>
      {recent.length === 0 ? (
        <p className="empty">O primeiro relatório aparece quando você fechar o dia.</p>
      ) : (
        <ul className="history">
          {recent.map((r) => (
            <li key={r.day}>
              <span className="muted">Dia {r.day}</span>
              <span className="hbar"><span className={r.profit >= 0 ? 'pos' : 'neg'} style={{ width: `${(Math.abs(r.profit) / maxAbs) * 100}%` }} /></span>
              <span className={r.profit >= 0 ? 'pos-text' : 'neg-text'}>{r.profit >= 0 ? '+' : ''}{r.profit}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
