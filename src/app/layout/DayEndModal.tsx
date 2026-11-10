import { SpriteIcon } from '../../ui/SpriteIcon';
import { useEffect, useRef, useState } from 'react';
import { RECIPES_BY_ID } from '../../domain/data/recipes';
import type { DayReport } from '../../domain/models/types';
import { getPrice } from '../../domain/rules/economy';
import { askReminderPermission, remindersSupported } from '../reminders';
import { dayMedal, medalTarget, mostMissed, serviceRate } from '../../domain/rules/medals';
import { useGameStore } from '../../store/gameStore';
import { Coins } from '../../ui/widgets';
import { tomorrowPreview } from '../../domain/rules/retention';
import { charm } from '../../domain/rules/entitlements';
import { RECORD_LABEL } from '../../domain/rules/records';
import { Icon } from '../../ui/Icon';

import { tr } from '../../i18n';
const MEDAL_LABEL = { ouro: tr('Medalha de ouro'), prata: tr('Medalha de prata'), bronze: tr('Medalha de bronze') } as const;

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
    <div className="week-chart" aria-label={tr('Lucro dos últimos dias')}>
      {last.map((r, i) => (
        <div key={r.day} className={`week-col ${i === last.length - 1 ? 'today' : ''}`} title={tr('Dia {0}: {1}', r.day, r.profit)}>
          <span className={`week-bar ${r.profit >= 0 ? 'pos' : 'neg'}`} style={{ height: `${Math.max(4, (Math.abs(r.profit) / max) * 100)}%` }} />
          <span className="week-day">{r.day}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Do fim do dia 2 em diante, oferece o lembrete ali mesmo (e não escondido nas Configurações).
 * Um "Agora não" e a oferta não volta.
 */
function ReminderOffer() {
  const save = useGameStore((s) => s.save)!;
  const dispatch = useGameStore((s) => s.dispatch);
  const [asked, setAsked] = useState(false);
  if (asked || save.day < 2 || save.settings.reminders || save.tipsSeen.includes('offer:reminders')) return null;
  if (!remindersSupported() || Notification.permission === 'denied') return null;
  const no = () => { setAsked(true); dispatch({ type: 'SEE_TIP', tipId: 'offer:reminders' }); };
  const yes = async () => {
    setAsked(true);
    if (await askReminderPermission()) dispatch({ type: 'SET_SETTINGS', settings: { reminders: true } });
    dispatch({ type: 'SEE_TIP', tipId: 'offer:reminders' });
  };
  return (
    <div className="reminder-offer">
      <span><Icon e="🔔" />{tr(' Quer um aviso quando o caldeirão terminar? No máximo um por dia.')}</span>
      <span className="btn-row">
        <button className="btn btn-small btn-primary" onClick={yes}>{tr('Quero')}</button>
        <button className="btn btn-small btn-ghost" onClick={no}>{tr('Agora não')}</button>
      </span>
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
  const pendingLevel = useGameStore((s) => s.ui.levelUp);
  if (!closing) return null;
  // Ordem do fechamento: relatório, depois a festa do nível (se houve), depois o dia seguinte.
  const startDay = () => {
    if (save.tutorialStep === 6) dispatch({ type: 'NEXT_TUTORIAL' });
    dispatch({ type: 'START_NEXT_DAY' });
    if (pendingLevel) dispatch({ type: 'OPEN_MODAL', modal: 'levelup' });
  };
  const r = save.reports.at(-1);
  if (!r) return null;
  const { medal, record } = dayMedal(save.reports);
  const sales = Object.entries(r.salesByRecipe).sort((a, b) => b[1] - a[1]);
  const rate = serviceRate(r);
  const missed = mostMissed(r);
  // Quanto se deixou de vender: cada cliente perdido pela receita que queria, no preço da prateleira.
  const leftOnTable = Object.entries(r.lostByRecipe ?? {}).reduce((n, [id, q]) => n + getPrice(save, id) * q, 0);
  const mood =
    r.profit > 60 && rate >= 0.8 ? tr('Que dia! A cidade inteira está falando da loja.') :
    r.profit > 0 && rate >= 0.6 ? tr('Um bom dia de trabalho. As lanternas se apagam com o caixa mais pesado.') :
    r.profit > 0 ? tr('Deu lucro, mas {0} cliente{1} sem nada. Com mais poções prontas, o caixa enchia.', r.customersLost, r.customersLost > 1 ? tr('s saíram') : tr(' saiu')) :
    r.customersServed > 0 ? tr('Dia apertado, mas cada cliente atendido conta. Amanhã é outro dia.') :
    r.customersLost > 0 ? tr('Ninguém foi atendido hoje e {0} cliente{1} embora de mãos vazias. Amanhã, deixe poções prontas e fique de olho no balcão.', r.customersLost, r.customersLost > 1 ? tr('s foram') : tr(' foi')) :
    tr('Um dia tranquilo. Que tal preparar mais poções e abrir cedo amanhã?');

  return (
    <div className="modal-backdrop">
      <div className={`modal modal-report ${medal ? `medal-${medal}` : ''}`} role="dialog" aria-modal="true" aria-labelledby="day-end-title">
        {(medal === 'ouro' || record || !!r.records?.length) && <div className="confetti" aria-hidden />}
        <div className="report-head">
          <div>
            <p className="modal-kicker">{tr('Fechamento')}</p>
            <h2 id="day-end-title">{tr('Fim do dia ')}{r.day}</h2>
          </div>
          {medal && (
            <div className={`medal medal-${medal}`} title={MEDAL_LABEL[medal]} aria-label={MEDAL_LABEL[medal]}>
              <span>{medal === 'ouro' ? '1º' : medal === 'prata' ? '2º' : '3º'}</span>
            </div>
          )}
        </div>
        {record && <p className="record-banner">{tr('Novo recorde de lucro!')}</p>}
        {r.records?.map((k) => (
          <p key={k} className="record-banner record-personal"><Icon e="🏅" />{tr(' Recorde pessoal: ')}{RECORD_LABEL[k].toLowerCase()} ({k === 'revenue' ? tr('{0} moedas', r.revenue) : `${r.customersServed} clientes`})</p>
        ))}
        <div className={`profit-hero ${r.profit >= 0 ? 'pos' : 'neg'}`}>
          <span className="muted small">{tr('Lucro do dia')}</span>
          <strong>{r.profit >= 0 ? '+' : '−'}<CountUp value={Math.abs(r.profit)} /></strong>
          {medal && <span className="small">{MEDAL_LABEL[medal]}</span>}
          {r.level !== undefined && <span className="small muted">{tr('Ouro a partir de ')}{medalTarget(r.level)}{tr(' no nível ')}{r.level}</span>}
        </div>
        <p className="card-text">{mood}</p>
        <div className="report-grid report-grid-3">
          <div><span className="muted small">{tr('Clientes atendidos')}</span><strong>{r.customersServed}</strong></div>
          <div><span className="muted small">{tr('Experiência')}</span><strong>+{r.xpGained}</strong></div>
          <div><span className="muted small">{tr('Reputação')}</span><strong>{r.reputationDelta >= 0 ? '+' : ''}{r.reputationDelta}</strong></div>
        </div>
        {r.customersLost > 0 && (
          <p className="tip lost-line">
            {leftOnTable > 0 && <><b>{tr('Ficou na mesa: cerca de ')}{leftOnTable}{tr(' moedas')}</b>{tr(' de quem foi embora. ')}</>}
            {missed
              ? <>{tr('O que mais faltou: ')}<b>{RECIPES_BY_ID[missed.recipeId].shortName}</b> ({missed.n}{tr(' pedido')}{missed.n > 1 ? 's' : ''}{tr('). Deixe algumas prontas antes de abrir amanhã.')}</>
              : <>{tr('Clientes vão embora quando falta a poção certa ou o preço está alto.')}</>}
          </p>
        )}
        <details className="day-more">
          <summary>{tr('Ver o caixa do dia')}</summary>
        <WeekChart reports={save.reports} />
        <table className="ledger">
          <tbody>
            <tr><td>{tr('Vendas no balcão')}</td><td className="pos-text">+{r.revenue}</td></tr>
            {r.orderRewards > 0 && <tr><td>{tr('Pedidos especiais')}</td><td className="pos-text">+{r.orderRewards}</td></tr>}
            <tr><td>{tr('Ingredientes comprados')}</td><td className="neg-text">−{r.ingredientCost}</td></tr>
            <tr><td>{tr('Manutenção (aluguel, lenha, velas')}{r.wages ? tr(', salários') : ''})</td><td className="neg-text">−{r.maintenance}</td></tr>
          </tbody>
        </table>
        {r.rival && (
          <p className={`card-text small rival-line ${r.rival.result ? `rival-${r.rival.result}` : ''}`}>
            <SpriteIcon name="rival-vesper" size={16} />
            <span>{r.rival.result === 'win' ? <><b>{tr('Você venceu a semana contra a Madame Vesper!')}</b> {r.rival.me} × {r.rival.her}{tr(' moedas. Prêmio no caixa.')}</>
              : r.rival.result === 'loss' ? <>{tr('A Madame Vesper levou a semana: ')}{r.rival.her} × {r.rival.me}{tr('. Revanche começa amanhã!')}</>
              : <>{tr('Disputa da semana: você ')}{r.rival.me} × {r.rival.her}{tr(' Vesper.')}</>}</span>
          </p>
        )}
        {r.helperWork && (r.helperWork.brews + r.helperWork.served + r.helperWork.deliveries > 0) && (
          <p className="card-text small">{tr('Ajudantes: ')}{[
              r.helperWork.deliveries > 0 && tr('o corvo fez {0} entrega{1}', r.helperWork.deliveries, r.helperWork.deliveries > 1 ? 's' : ''),
              r.helperWork.brews > 0 && tr('o aprendiz cuidou de {0} preparo{1}', r.helperWork.brews, r.helperWork.brews > 1 ? 's' : ''),
              r.helperWork.served > 0 && tr('o golem vendeu {0} poç{1}', r.helperWork.served, r.helperWork.served > 1 ? tr('ões') : tr('ão')),
            ].filter(Boolean).join(', ')}{tr('. Salários: ')}{r.wages ?? 0}{tr(' moedas (já na manutenção).')}</p>
        )}
        {sales.length > 0 && (
          <p className="card-text small">{tr('Mais vendidas: ')}{sales.slice(0, 3).map(([id, n]) => `${RECIPES_BY_ID[id].shortName} (${n})`).join(', ')}
          </p>
        )}
        {save.challenge && !save.challenge.active && save.challenge.score !== null && save.reports.at(-1)?.day === r.day && (
          <p className="challenge-line"><Icon e="⚔️" />{tr(' Desafio da semana ')}{save.challenge.week}: <b>{save.challenge.score}{tr(' pontos')}</b>{save.challengeBest?.score === save.challenge.score ? tr(' · seu recorde') : ''}</p>
        )}
        {charm(save) > 0 && <p className="card-text small"><Icon e="🎀" />{tr(' A decoração encantou a freguesia: +')}{charm(save)}{tr(' de reputação.')}</p>}
        <p className="card-text">{tr('Caixa agora: ')}<Coins n={save.coins} /></p>
        <button className="btn btn-share" onClick={() => dispatch({ type: 'OPEN_MODAL', modal: 'share' })}><Icon e="📸" />{tr(' Mostrar a loja')}</button>
        </details>
        <section className="tomorrow" aria-label={tr('Amanhã na loja')}>
          <p className="tomorrow-title">{tr('Amanhã na loja')}</p>
          <ul>
            {tomorrowPreview(save).slice(0, 2).map((l) => (
              <li key={l.text} className={l.tone ? `tone-${l.tone}` : ''}><span aria-hidden><Icon e={l.icon} /></span> {l.text}</li>
            ))}
          </ul>
          <ReminderOffer />
        </section>
        {save.tutorialStep === 6 && (
          <p className="tip report-tutorial"><Icon e="📖" /> <b>{tr('Relatório do dia.')}</b>{tr(' Aqui você vê o que vendeu, o que gastou e o lucro. Use isso para decidir o que preparar amanhã.')}</p>
        )}
        <button ref={nextRef} className="btn btn-primary btn-big" onClick={startDay}>{tr('Começar o dia ')}{save.day + 1}
        </button>
      </div>
    </div>
  );
}
