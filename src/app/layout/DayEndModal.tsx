import { SpriteIcon } from '../../ui/SpriteIcon';
import { useEffect, useRef, useState } from 'react';
import { RECIPES_BY_ID } from '../../domain/data/recipes';
import type { DayReport } from '../../domain/models/types';
import { dayMedal } from '../../domain/rules/medals';
import { useGameStore } from '../../store/gameStore';
import { Coins } from '../../ui/widgets';
import { tomorrowPreview } from '../../domain/rules/retention';
import { charm } from '../../domain/rules/entitlements';

const MEDAL_LABEL = { ouro: 'Medalha de ouro', prata: 'Medalha de prata', bronze: 'Medalha de bronze' } as const;

/** Número que conta do zero até o valor ao abrir o fechamento. */
function CountUp({ value, ms = 900 }: { value: number; ms?: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / ms);
      setN(Math.round(value * (1 - (1 - k) ** 3)));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, ms]);
  return <>{n}</>;
}

/** Lucro dos últimos 7 dias, com hoje em destaque. */
function WeekChart({ reports }: { reports: DayReport[] }) {
  const last = reports.slice(-7);
  if (last.length < 2) return null;
  const max = Math.max(1, ...last.map((r) => Math.abs(r.profit)));
  return (
    <div className="week-chart" aria-label="Lucro dos últimos dias">
      {last.map((r, i) => (
        <div key={r.day} className={`week-col ${i === last.length - 1 ? 'today' : ''}`} title={`Dia ${r.day}: ${r.profit}`}>
          <span className={`week-bar ${r.profit >= 0 ? 'pos' : 'neg'}`} style={{ height: `${Math.max(4, (Math.abs(r.profit) / max) * 100)}%` }} />
          <span className="week-day">{r.day}</span>
        </div>
      ))}
    </div>
  );
}

export function DayEndModal() {
  const save = useGameStore((s) => s.save)!;
  const dispatch = useGameStore((s) => s.dispatch);
  const nextRef = useRef<HTMLButtonElement>(null);
  const closing = save.phase === 'fechamento';
  // Foca o botão sem rolar o fechamento até o fim (o topo, com a medalha, fica visível).
  useEffect(() => { if (closing) nextRef.current?.focus({ preventScroll: true }); }, [closing, save.day]);
  if (!closing) return null;
  const r = save.reports.at(-1);
  if (!r) return null;
  const { medal, record } = dayMedal(save.reports);
  const sales = Object.entries(r.salesByRecipe).sort((a, b) => b[1] - a[1]);
  const mood =
    r.profit > 60 ? 'Que dia! A cidade inteira está falando da loja.' :
    r.profit > 0 ? 'Um bom dia de trabalho. As lanternas se apagam com o caixa mais pesado.' :
    r.customersServed > 0 ? 'Dia apertado, mas cada cliente atendido conta. Amanhã é outro dia.' :
    'Um dia tranquilo. Que tal preparar mais poções e abrir cedo amanhã?';

  return (
    <div className="modal-backdrop">
      <div className={`modal modal-report ${medal ? `medal-${medal}` : ''}`} role="dialog" aria-modal="true" aria-labelledby="day-end-title">
        {(medal === 'ouro' || record) && <div className="confetti" aria-hidden />}
        <div className="report-head">
          <div>
            <p className="modal-kicker">Fechamento</p>
            <h2 id="day-end-title">Fim do dia {r.day}</h2>
          </div>
          {medal && (
            <div className={`medal medal-${medal}`} title={MEDAL_LABEL[medal]} aria-label={MEDAL_LABEL[medal]}>
              <span>{medal === 'ouro' ? '1º' : medal === 'prata' ? '2º' : '3º'}</span>
            </div>
          )}
        </div>
        {record && <p className="record-banner">Novo recorde de lucro!</p>}
        <div className={`profit-hero ${r.profit >= 0 ? 'pos' : 'neg'}`}>
          <span className="muted small">Lucro do dia</span>
          <strong>{r.profit >= 0 ? '+' : '−'}<CountUp value={Math.abs(r.profit)} /></strong>
          {medal && <span className="small">{MEDAL_LABEL[medal]}</span>}
        </div>
        <WeekChart reports={save.reports} />
        <p className="card-text">{mood}</p>
        <table className="ledger">
          <tbody>
            <tr><td>Vendas no balcão</td><td className="pos-text">+{r.revenue}</td></tr>
            {r.orderRewards > 0 && <tr><td>Pedidos especiais</td><td className="pos-text">+{r.orderRewards}</td></tr>}
            <tr><td>Ingredientes comprados</td><td className="neg-text">−{r.ingredientCost}</td></tr>
            <tr><td>Manutenção (aluguel, lenha, velas{r.wages ? ', salários' : ''})</td><td className="neg-text">−{r.maintenance}</td></tr>
          </tbody>
        </table>
        <div className="report-grid">
          <div><span className="muted small">Clientes atendidos</span><strong>{r.customersServed}</strong></div>
          <div><span className="muted small">Foram embora</span><strong>{r.customersLost}</strong></div>
          <div><span className="muted small">Reputação</span><strong>{r.reputationDelta >= 0 ? '+' : ''}{r.reputationDelta}</strong></div>
          <div><span className="muted small">Experiência</span><strong>+{r.xpGained}</strong></div>
        </div>
        {r.rival && (
          <p className={`card-text small rival-line ${r.rival.result ? `rival-${r.rival.result}` : ''}`}>
            <SpriteIcon name="rival-vesper" size={16} />
            <span>{r.rival.result === 'win' ? <><b>Você venceu a semana contra a Madame Vesper!</b> {r.rival.me} × {r.rival.her} moedas. Prêmio no caixa.</>
              : r.rival.result === 'loss' ? <>A Madame Vesper levou a semana: {r.rival.her} × {r.rival.me}. Revanche começa amanhã!</>
              : <>Disputa da semana: você {r.rival.me} × {r.rival.her} Vesper.</>}</span>
          </p>
        )}
        {r.helperWork && (r.helperWork.brews + r.helperWork.served + r.helperWork.deliveries > 0) && (
          <p className="card-text small">
            Ajudantes: {[
              r.helperWork.deliveries > 0 && `o corvo fez ${r.helperWork.deliveries} entrega${r.helperWork.deliveries > 1 ? 's' : ''}`,
              r.helperWork.brews > 0 && `o aprendiz cuidou de ${r.helperWork.brews} preparo${r.helperWork.brews > 1 ? 's' : ''}`,
              r.helperWork.served > 0 && `o golem vendeu ${r.helperWork.served} poç${r.helperWork.served > 1 ? 'ões' : 'ão'}`,
            ].filter(Boolean).join(', ')}. Salários: {r.wages ?? 0} moedas (já na manutenção).
          </p>
        )}
        {sales.length > 0 && (
          <p className="card-text small">
            Mais vendidas: {sales.slice(0, 3).map(([id, n]) => `${RECIPES_BY_ID[id].shortName} (${n})`).join(', ')}
          </p>
        )}
        {r.customersLost > r.customersServed && (
          <p className="tip">Dica: clientes vão embora quando falta a poção certa ou o preço está alto. Veja o que mais pediram e prepare antes de abrir.</p>
        )}
        {save.challenge && !save.challenge.active && save.challenge.score !== null && save.reports.at(-1)?.day === r.day && (
          <p className="challenge-line">⚔️ Desafio da semana {save.challenge.week}: <b>{save.challenge.score} pontos</b>{save.challengeBest?.score === save.challenge.score ? ' · seu recorde' : ''}</p>
        )}
        {charm(save) > 0 && <p className="card-text small">🎀 A decoração encantou a freguesia: +{charm(save)} de reputação.</p>}
        <section className="tomorrow" aria-label="Amanhã na loja">
          <p className="tomorrow-title">Amanhã na loja</p>
          <ul>
            {tomorrowPreview(save).map((l) => (
              <li key={l.text} className={l.tone ? `tone-${l.tone}` : ''}><span aria-hidden>{l.icon}</span> {l.text}</li>
            ))}
          </ul>
        </section>
        <p className="card-text">Caixa agora: <Coins n={save.coins} /></p>
        <button className="btn btn-share" onClick={() => dispatch({ type: 'OPEN_MODAL', modal: 'share' })}>📸 Mostrar a loja</button>
        <button ref={nextRef} className="btn btn-primary btn-big" onClick={() => dispatch({ type: 'START_NEXT_DAY' })}>
          Começar o dia {save.day + 1}
        </button>
      </div>
    </div>
  );
}
