import { useState } from 'react';
import { funnel, type FunnelStep } from '../../analytics/funnel';

const LABEL: Record<FunnelStep, string> = {
  new_game: 'Partida nova', story_done: 'Deu nome à loja', first_sale: 'Primeira venda', day1_done: 'Terminou o dia 1',
  level_3: 'Chegou ao nível 3', level_5: 'Chegou ao nível 5', first_decor: 'Decorou a loja', shared_card: 'Compartilhou o cartão', gift_sent: 'Mandou presente',
};

/** "Números deste aparelho": o funil medido localmente (pacote L). Nada sai do navegador. */
export function FunnelStats() {
  const [open, setOpen] = useState(false);
  if (!open) return <button className="link-btn" onClick={() => setOpen(true)}>Números deste aparelho</button>;
  const f = funnel.summary();
  return (
    <div className="funnel-box">
      <p className="mini-title">📈 Números deste aparelho</p>
      <p className="muted small">Medidos só aqui, sem enviar nada. Servem para entender os primeiros minutos e quem volta.</p>
      <ul className="funnel-list">
        <li>Sessões: <b>{f.sessions}</b> · dias com jogo: <b>{f.activeDays}</b></li>
        <li>Tempo até a primeira venda: <b>{f.secondsToFirstSale === null ? '—' : `${f.secondsToFirstSale} s`}</b></li>
        <li>Voltou no dia seguinte (D1): <b>{f.d1 ? 'sim' : 'ainda não'}</b> · depois de 7 dias (D7): <b>{f.d7 ? 'sim' : 'ainda não'}</b></li>
        {(Object.keys(LABEL) as FunnelStep[]).map((k) => (
          <li key={k} className={f.steps[k] ? 'done' : ''}>{f.steps[k] ? '✓' : '○'} {LABEL[k]}</li>
        ))}
      </ul>
      <button className="link-btn" onClick={() => setOpen(false)}>Esconder</button>
    </div>
  );
}
