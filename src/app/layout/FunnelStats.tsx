import { useState } from 'react';
import { funnel, type FunnelStep } from '../../analytics/funnel';
import { Icon } from '../../ui/Icon';

import { tr } from '../../i18n';
const LABEL: Record<FunnelStep, string> = {
  new_game: tr('Partida nova'), story_done: tr('Deu nome à loja'), first_sale: tr('Primeira venda'), day1_done: tr('Terminou o dia 1'),
  level_3: tr('Chegou ao nível 3'), level_5: tr('Chegou ao nível 5'), first_decor: tr('Decorou a loja'), shared_card: tr('Compartilhou o cartão'), gift_sent: tr('Mandou presente'),
};

/** "Números deste aparelho": o funil medido localmente (pacote L). Nada sai do navegador. */
export function FunnelStats() {
  const [open, setOpen] = useState(false);
  if (!open) return <button className="link-btn" onClick={() => setOpen(true)}>{tr('Números deste aparelho')}</button>;
  const f = funnel.summary();
  return (
    <div className="funnel-box">
      <p className="mini-title"><Icon e="📈" />{tr(' Números deste aparelho')}</p>
      <p className="muted small">{tr('Medidos só aqui, sem enviar nada. Servem para entender os primeiros minutos e quem volta.')}</p>
      <ul className="funnel-list">
        <li>{tr('Sessões: ')}<b>{f.sessions}</b>{tr(' · dias com jogo: ')}<b>{f.activeDays}</b></li>
        <li>{tr('Tempo até a primeira venda: ')}<b>{f.secondsToFirstSale === null ? '—' : `${f.secondsToFirstSale} s`}</b></li>
        <li>{tr('Voltou no dia seguinte (D1): ')}<b>{f.d1 ? tr('sim') : tr('ainda não')}</b>{tr(' · depois de 7 dias (D7): ')}<b>{f.d7 ? tr('sim') : tr('ainda não')}</b></li>
        {(Object.keys(LABEL) as FunnelStep[]).map((k) => (
          <li key={k} className={f.steps[k] ? 'done' : ''}>{f.steps[k] ? '✓' : '○'} {LABEL[k]}</li>
        ))}
      </ul>
      <button className="link-btn" onClick={() => setOpen(false)}>{tr('Esconder')}</button>
    </div>
  );
}
