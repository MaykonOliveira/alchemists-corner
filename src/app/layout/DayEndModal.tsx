import { RECIPES_BY_ID } from '../../domain/data/recipes';
import { useGameStore } from '../../store/gameStore';
import { Coins } from '../../ui/widgets';

export function DayEndModal() {
  const save = useGameStore((s) => s.save)!;
  const dispatch = useGameStore((s) => s.dispatch);
  if (save.phase !== 'fechamento') return null;
  const r = save.reports.at(-1);
  if (!r) return null;
  const sales = Object.entries(r.salesByRecipe).sort((a, b) => b[1] - a[1]);
  const mood =
    r.profit > 60 ? 'Que dia! A cidade inteira está falando da loja.' :
    r.profit > 0 ? 'Um bom dia de trabalho. As lanternas se apagam com o caixa mais pesado.' :
    r.customersServed > 0 ? 'Dia apertado, mas cada cliente atendido conta. Amanhã é outro dia.' :
    'Um dia tranquilo. Que tal preparar mais poções e abrir cedo amanhã?';

  return (
    <div className="modal-backdrop">
      <div className="modal modal-report" role="dialog" aria-modal="true" aria-labelledby="day-end-title">
        <p className="modal-kicker">Fechamento</p>
        <h2 id="day-end-title">Fim do dia {r.day}</h2>
        <p className="card-text">{mood}</p>
        <table className="ledger">
          <tbody>
            <tr><td>Vendas no balcão</td><td className="pos-text">+{r.revenue}</td></tr>
            {r.orderRewards > 0 && <tr><td>Pedidos especiais</td><td className="pos-text">+{r.orderRewards}</td></tr>}
            <tr><td>Ingredientes comprados</td><td className="neg-text">−{r.ingredientCost}</td></tr>
            <tr><td>Manutenção (aluguel, lenha, velas)</td><td className="neg-text">−{r.maintenance}</td></tr>
            <tr className="ledger-total"><td>Lucro do dia</td><td className={r.profit >= 0 ? 'pos-text' : 'neg-text'}>{r.profit >= 0 ? '+' : ''}{r.profit}</td></tr>
          </tbody>
        </table>
        <div className="report-grid">
          <div><span className="muted small">Clientes atendidos</span><strong>{r.customersServed}</strong></div>
          <div><span className="muted small">Foram embora</span><strong>{r.customersLost}</strong></div>
          <div><span className="muted small">Reputação</span><strong>{r.reputationDelta >= 0 ? '+' : ''}{r.reputationDelta}</strong></div>
          <div><span className="muted small">Experiência</span><strong>+{r.xpGained}</strong></div>
        </div>
        {sales.length > 0 && (
          <p className="card-text small">
            Mais vendidas: {sales.slice(0, 3).map(([id, n]) => `${RECIPES_BY_ID[id].shortName} (${n})`).join(', ')}
          </p>
        )}
        {r.customersLost > r.customersServed && (
          <p className="tip">Dica: clientes vão embora quando falta a poção certa ou o preço está alto. Veja o que mais pediram e prepare antes de abrir.</p>
        )}
        <p className="card-text">Caixa agora: <Coins n={save.coins} /></p>
        <button className="btn btn-primary btn-big" autoFocus onClick={() => dispatch({ type: 'START_NEXT_DAY' })}>
          Começar o dia {save.day + 1}
        </button>
      </div>
    </div>
  );
}
