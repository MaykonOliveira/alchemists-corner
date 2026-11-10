import { RECIPES_BY_ID } from '../../domain/data/recipes';
import { countPotions, potionStock } from '../../domain/rules/economy';
import { useGameStore, type PanelId } from '../../store/gameStore';
import { CoinIcon } from '../../ui/icons';
import { visitGift } from '../../domain/rules/retention';
import { VISIT_GIFTS } from '../../domain/data/retention';
import { REGULARS_BY_ID } from '../../domain/data/world';
import { useStageCards } from './stage';
import type { AwayReport } from '../../domain/models/types';
import { Icon } from '../../ui/Icon';

import { tr } from '../../i18n';
const hoursLabel = (ms: number) => {
  const m = Math.round(ms / 60000);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, '0') : ''}`;
};

/** Livro do caixa: o que a loja fez enquanto o jogador esteve fora. */
function AwayBook({ away }: { away: AwayReport }) {
  const brewed = Object.entries(away.brewed);
  return (
    <div className="away-book">
      <p className="away-title"><Icon e="📖" />{tr(' Livro do caixa · ')}{hoursLabel(away.awayMs)}{tr(' fora')}</p>
      {away.sold > 0 && <p className="away-line">{tr('O golem vendeu ')}<b>{away.sold}</b>{tr(' poç')}{away.sold > 1 ? tr('ões') : tr('ão')}{tr(' pela janela: ')}<b className="pos-text">+{away.coins}</b> <CoinIcon size={12} /> e +{away.xp}{tr(' XP.')}</p>}
      {brewed.length > 0 && <p className="away-line">{tr('Saíram do caldeirão: ')}{brewed.map(([id, n]) => `${n}× ${RECIPES_BY_ID[id].shortName}`).join(', ')}.</p>}
      {away.sold === 0 && brewed.length === 0 && <p className="away-line">{tr('A loja ficou quietinha esperando você.')}</p>}
      {!away.helpers && <p className="away-line muted small">{tr('Com o aprendiz (nível 8) e o golem (nível 9), a loja prepara e vende o básico sozinha por até 8 horas.')}</p>}
    </div>
  );
}

/** Cartão "bem-vindo de volta": onde a partida parou e qual o próximo passo. */
export function WelcomeBack() {
  const welcome = useStageCards().welcome;
  const save = useGameStore((s) => s.save);
  const tutorial = useGameStore((s) => (s.save?.tutorialStep ?? 99) < 7);
  const dispatch = useGameStore((s) => s.dispatch);
  if (!welcome || !save || tutorial || save.phase === 'fechamento') return null;

  const potions = countPotions(save);
  const gift = save.visits.ready ? visitGift(save) : null;
  const giftN = (save.visits.count % VISIT_GIFTS.length) + 1;
  const letter = save.letter && !save.letter.done && save.letter.day === save.day ? save.letter : null;
  const close = () => { dispatch({ type: 'DISMISS_WELCOME' }); dispatch({ type: 'DISMISS_AWAY' }); };
  const go = (panel: PanelId) => { close(); dispatch({ type: 'OPEN_PANEL', panel }); };

  let step: { text: string; label: string; act: () => void };
  if (save.phase === 'expediente') {
    step = { text: tr('A loja está aberta e o relógio está pausado.'), label: tr('Continuar o dia'), act: close };
  } else if (potions === 0 && !save.brew && !save.brew2) {
    step = { text: tr('As prateleiras estão vazias. Prepare poções antes de abrir.'), label: tr('Ir ao caldeirão'), act: () => go('production') };
  } else {
    step = { text: tr('Tudo pronto para receber clientes.'), label: tr('Abrir a loja'), act: () => { close(); dispatch({ type: 'OPEN_SHOP' }); } };
  }

  return (
    <div className="tutorial welcome" role="status">
      <div className="tutorial-head">
        <span className="tutorial-step">{tr('Bem-vindo de volta')}</span>
        <button className="link-btn" onClick={close}>{tr('Fechar')}</button>
      </div>
      <p className="tutorial-title">{tr('Dia ')}{save.day} · {save.phase === 'expediente' ? tr('loja aberta') : tr('preparação')}</p>
      {save.away && <AwayBook away={save.away} />}
      {gift && (
        <div className="visit-gift">
          <div className="visit-days" aria-label={tr('Presente {0} de 7', giftN)}>
            {VISIT_GIFTS.map((_, n) => <span key={n} className={n < giftN - 1 ? 'got' : n === giftN - 1 ? 'now' : ''}>{n + 1}</span>)}
          </div>
          <p className="away-line"><b>{tr('Presente de visita nº ')}{giftN}:</b> {gift.label}</p>
          <button className="btn btn-small btn-primary btn-glow" onClick={() => dispatch({ type: 'CLAIM_VISIT_GIFT' })}><Icon e="🎁" />{tr(' Abrir presente')}</button>
          <p className="muted small">{tr('Um presente por dia em que você abre a loja. Faltou um dia? Ele só espera.')}</p>
        </div>
      )}
      {letter && <p className="away-line letter-line"><Icon e="✉️" /> {letter.from === 'condessa-estreia' ? tr('A Condessa') : REGULARS_BY_ID[letter.from]?.name.split(',')[0]}{tr(' vem hoje: “')}{letter.text}”</p>}
      <ul className="welcome-facts">
        <li><CoinIcon size={14} /> {save.coins}{tr(' moedas')}</li>
        <li>{potions}{tr(' poções à venda')}</li>
        {save.brew && <li>{tr('Caldeirão: ')}{RECIPES_BY_ID[save.brew.recipeId].shortName}</li>}
        {save.brew2 && <li>{tr('Caldeirão 2: ')}{RECIPES_BY_ID[save.brew2.recipeId].shortName}</li>}
        {save.contract?.accepted && <li>{tr('Contrato: ')}{save.contract.dueDay - save.day <= 0 ? tr('vence hoje!') : tr('faltam {0} dia(s)', save.contract.dueDay - save.day)}</li>}
        {save.order && <li>{tr('Pedido: ')}{potionStock(save, save.order.recipeId)}/{save.order.qty} {RECIPES_BY_ID[save.order.recipeId].shortName}</li>}
      </ul>
      <p className="tutorial-text">{step.text}</p>
      <div className="btn-row">
        <button className="btn btn-small btn-primary" onClick={step.act}>{step.label}</button>
      </div>
    </div>
  );
}
