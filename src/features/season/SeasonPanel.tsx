import { useState } from 'react';
import { CATALOG, SLOT_LABEL, type DecorSlot } from '../../domain/data/catalog';
import { SEASON_FESTS, TRACK_REWARDS, TRACK_STEP } from '../../domain/data/retention';
import type { GameSave } from '../../domain/models/types';
import { charm, MAX_CHARM, owns } from '../../domain/rules/entitlements';
import { realWeek, trackDaysLeft, trackName, trackRewardLabel, trackTheme } from '../../domain/rules/retention';
import { canSendGift, challengeAvailable, giftContents } from '../../domain/rules/social';
import { daysToNextSeason, seasonOf } from '../../domain/rules/world';
import { INGREDIENTS_BY_ID } from '../../domain/data/ingredients';
import { funnel } from '../../analytics/funnel';
import { useGameStore } from '../../store/gameStore';
import { decodeGift, encodeGift, giftMessage } from '../share/giftCode';
import { DecorThumb } from './DecorThumb';
import { Icon } from '../../ui/Icon';
import { More } from '../../ui/widgets';

import { tr } from '../../i18n';
const SLOTS: DecorSlot[] = ['tapete', 'quadro', 'luminaria', 'planta', 'toldo'];

/** Trilha da temporada: mora no Diário da loja, junto das metas e do baú (auditoria P1.1). */
export function Track({ save }: { save: GameSave }) {
  const t = save.track;
  const next = Math.min(TRACK_REWARDS.length, t.tier + 1);
  const into = t.points - t.tier * TRACK_STEP;
  const done = t.tier >= TRACK_REWARDS.length;
  return (
    <section className="card track">
      <div className="card-head">
        <h3 className="mini-title"><Icon e={trackTheme(t.period).icon} /> {trackName(t.period)}</h3>
        <span className="muted small">{tr('termina em ')}{trackDaysLeft(Date.now())}{tr(' dia(s)')}</span>
      </div>
      <More label={tr('Como ganhar pontos')}><p className="card-text small">{tr('Metas do dia, pedidos, contratos, presentes de visita e cada fechamento dão pontos. São 30 recompensas grátis.')}</p></More>
      {!done ? (
        <>
          <div className="track-bar" aria-label={tr('{0} de {1} pontos para a recompensa {2}', into, TRACK_STEP, next)}>
            <span style={{ width: `${(into / TRACK_STEP) * 100}%` }} />
            <b>{into}/{TRACK_STEP}</b>
          </div>
          <p className="card-text small">{tr('Próxima (')}{next}/30): <b>{trackRewardLabel(next - 1)}</b></p>
        </>
      ) : <p className="card-text small"><b>{tr('Trilha completa!')}</b>{tr(' Uma nova temporada começa logo.')}</p>}
      <ol className="track-steps">
        {TRACK_REWARDS.map((r, i) => (
          <li key={i} className={`${i < t.tier ? 'got' : i === t.tier ? 'next' : ''} ${r.kind === 'item' ? 'big' : ''}`} title={trackRewardLabel(i)}>
            <span><Icon e={r.kind === 'coins' ? '🪙' : r.kind === 'crystals' ? '🌙' : r.kind === 'item' ? '🎀' : '🌿'} /></span>
            <small>{i + 1}</small>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Decor({ save }: { save: GameSave }) {
  const dispatch = useGameStore((s) => s.dispatch);
  const [slot, setSlot] = useState<DecorSlot>('tapete');
  const items = CATALOG.filter((i) => i.slot === slot && (i.source !== 'inicial' || slot !== 'toldo' || owns(save, i.id)));
  return (
    <section className="card decor">
      <div className="card-head">
        <h3 className="mini-title"><Icon e="🎀" />{tr(' Decorar a loja')}</h3>
        <span className="muted small">{tr('Encanto ')}{charm(save)}/{MAX_CHARM}: +{charm(save)}{tr(' de reputação por dia')}</span>
      </div>
      <div className="decor-tabs" role="tablist">
        {SLOTS.map((s) => (
          <button key={s} role="tab" aria-selected={slot === s} className={`chip ${slot === s ? 'chip-on' : ''}`} onClick={() => setSlot(s)}>{SLOT_LABEL[s]}</button>
        ))}
      </div>
      <ul className="decor-list">
        {items.map((it) => {
          const have = owns(save, it.id);
          const placed = save.decor[it.slot] === it.id;
          return (
            <li key={it.id} className={`decor-item ${placed ? 'placed' : ''}`}>
              <DecorThumb item={it} />
              <span className="decor-body">
                <b>{it.name}</b>{it.charm > 0 && <span className="charm">{tr(' ✦ encanto')}</span>}
                <span className="muted small">{it.text}</span>
              </span>
              {placed ? <span className="decor-state">{tr('Na loja')}</span>
                : have ? <button className="btn btn-small" onClick={() => { funnel.mark('first_decor'); dispatch({ type: 'PLACE_DECOR', itemId: it.id }); }}>{tr('Colocar')}</button>
                : it.crystals !== null ? (
                  <button className="btn btn-small btn-primary" disabled={save.crystals < it.crystals} onClick={() => { funnel.mark('first_decor'); dispatch({ type: 'BUY_DECOR', itemId: it.id }); }}>
                    <Icon e="🌙" /> {it.crystals}
                  </button>
                ) : <span className="decor-state muted">{it.source === 'trilha' ? tr('Trilha') : it.source === 'festa' ? tr('Festa') : tr('Presente')}</span>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Fest({ save }: { save: GameSave }) {
  const season = seasonOf(save.day);
  const f = SEASON_FESTS[season.id];
  const left = daysToNextSeason(save.day) - 1;
  const have = owns(save, f.reward);
  const today = save.event === 'festa-estacao';
  return (
    <section className={`card fest fest-${season.id}`}>
      <h3 className="mini-title"><Icon e="🎉" /> {f.name}</h3>
      <p className="card-text small">{f.text}</p>
      <p className="card-text small">
        {today ? <b>{tr('É hoje! ')}{f.guest}{tr(' chega no fim da manhã.')}</b> : left <= 0 ? tr('A festa é hoje.') : tr('Faltam {0} dia(s) de jogo (último dia da estação).', left)}
        {' '}{tr('Lembrança: ')}{have ? tr('você já tem ✓') : CATALOG.find((i) => i.id === f.reward)?.name}.
      </p>
    </section>
  );
}

function Challenge({ save }: { save: GameSave }) {
  const dispatch = useGameStore((s) => s.dispatch);
  const week = realWeek(Date.now());
  const best = save.challengeBest?.week === week ? save.challengeBest.score : null;
  return (
    <section className="card challenge">
      <h3 className="mini-title"><Icon e="⚔️" />{tr(' Desafio da semana ')}{week}</h3>
      <More label={tr('Regras do desafio')}><p className="card-text small">{tr('Um dia de loja em que os clientes são sorteados com a mesma semente para todos os jogadores. Uma tentativa por semana. Pontos: 10 por cliente atendido, 1 por moeda vendida, 50 por pedido entregue.')}</p></More>
      {save.challenge?.active ? <p className="card-text small"><b>{tr('Desafio em andamento.')}</b>{tr(' Abra a loja e venda tudo o que puder!')}</p>
        : best !== null ? <p className="card-text small">{tr('Sua pontuação nesta semana: ')}<b>{best}</b>. <button className="link-btn" onClick={() => dispatch({ type: 'OPEN_MODAL', modal: 'share' })}>{tr('Compartilhar')}</button></p>
        : save.level < 2 ? <p className="card-text small muted">{tr('Abre no nível 2.')}</p>
        : <button className="btn btn-primary" disabled={save.phase !== 'preparacao' || !challengeAvailable(save, Date.now())} onClick={() => dispatch({ type: 'START_CHALLENGE' })}>
            {save.phase === 'preparacao' ? tr('Começar o desafio hoje') : tr('Disponível na preparação')}
          </button>}
    </section>
  );
}

function Gifts({ save }: { save: GameSave }) {
  const dispatch = useGameStore((s) => s.dispatch);
  const [code, setCode] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const contents = giftContents(save);
  const send = async () => {
    dispatch({ type: 'SEND_GIFT' });
    const c = encodeGift(save.shopName, save.createdAt);
    setCode(c);
    funnel.mark('gift_sent');
    const text = giftMessage(c, save.shopName);
    try {
      if (navigator.share) await navigator.share({ text });
      else { await navigator.clipboard.writeText(text); setMsg(tr('Mensagem copiada! Cole para um amigo.')); }
    } catch { /* cancelou: o código fica na tela */ }
  };
  const redeem = () => {
    const gift = decodeGift(input);
    if (!gift) { setMsg(tr('Não encontrei um código de presente nesse texto.')); return; }
    dispatch({ type: 'REDEEM_GIFT', gift });
    setInput('');
    setMsg(null);
  };
  return (
    <section className="card gifts">
      <h3 className="mini-title"><Icon e="💌" />{tr(' Presentes entre amigos')}</h3>
      <More label={tr('Como funciona')}><p className="card-text small">{tr('Mande um código para quem está começando: a pessoa ganha ingredientes raros e ')}{contents.crystals}{tr(' cristais. O seu primeiro presente dá o quadro “Laço da amizade”. Um por dia.')}</p></More>
      <button className="btn" disabled={!canSendGift(save, Date.now())} onClick={send}>{canSendGift(save, Date.now()) ? tr('Mandar um presente') : tr('Amanhã tem mais')}</button>
      {code && <textarea className="gift-code" readOnly value={giftMessage(code, save.shopName)} onFocus={(e) => e.currentTarget.select()} aria-label={tr('Código do presente')} />}
      <label className="name-label" htmlFor="gift-in">{tr('Recebeu um código?')}</label>
      <div className="gift-row">
        <input id="gift-in" className="name-input" placeholder={tr('Cole aqui (AC1g.…)')} value={input} onChange={(e) => setInput(e.target.value)} />
        <button className="btn btn-primary" onClick={redeem} disabled={!input.trim()}>{tr('Abrir')}</button>
      </div>
      <p className="muted small">{tr('Ganha: ')}{contents.items.map((i) => `${i.qty}× ${INGREDIENTS_BY_ID[i.ingredientId].name}`).join(', ')}.</p>
      {msg && <p className="muted small">{msg}</p>}
    </section>
  );
}

/** Aba Decoração (tecla T): cristais, decoração, festa, desafio e presentes. A trilha foi para o Diário. */
export function SeasonPanel({ save }: { save: GameSave }) {
  const dispatch = useGameStore((s) => s.dispatch);
  return (
    <div className="season-panel">
      <div className="crystal-banner">
        <span className="crystal-n"><Icon e="🌙" /> {save.crystals}</span>
        <span className="small">{tr('Cristais de luar: vêm das metas, do baú, das conquistas, dos níveis altos e das receitas dominadas. Compram decoração aqui e talentos no Grimório. Só se ganham jogando.')}</span>
      </div>
      <Decor save={save} />
      <Fest save={save} />
      <Challenge save={save} />
      <Gifts save={save} />
      <button className="btn btn-share" onClick={() => dispatch({ type: 'OPEN_MODAL', modal: 'share' })}><Icon e="📸" />{tr(' Mostrar a loja')}</button>
    </div>
  );
}
