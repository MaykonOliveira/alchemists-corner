import { useEffect, useRef, useState } from 'react';
import { seasonOf } from '../../domain/rules/world';
import { levelProgress, masterRank, MASTER_STEP_XP, MAX_LEVEL, reputationTitle, xpForLevel } from '../../domain/rules/progression';
import { dayProgress, formatClock, TIME_OF_DAY_LABEL, timeOfDay } from '../../domain/rules/time';
import { autoFast, useGameStore } from '../../store/gameStore';
import { CoinIcon, StarIcon } from '../../ui/icons';
import { useAnimatedNumber } from '../../ui/useAnimatedNumber';
import { Icon } from '../../ui/Icon';

import { GAME_NAME, tr } from '../../i18n';
const PHASE_LABEL = { preparacao: tr('Preparação'), expediente: tr('Loja aberta'), fechamento: tr('Fechamento') } as const;

export function Hud() {
  const save = useGameStore((s) => s.save)!;
  const paused = useGameStore((s) => s.ui.paused);
  const dispatch = useGameStore((s) => s.dispatch);
  const [confirmClose, setConfirmClose] = useState(false);
  // Celular em pé (V5): uma linha só; nível, XP e reputação abrem num toque.
  const [details, setDetails] = useState(false);
  const speed = useGameStore((s) => s.ui.speed);
  const fast = useGameStore((s) => autoFast(s.save, s.ui));
  // Com o Início à vista, o botão grande "Abrir a loja" já está lá: o do topo só aparece com outra tela aberta.
  const homeVisible = useGameStore((s) => s.ui.activePanel === null);
  const coins = useAnimatedNumber(save.coins);
  // Moedas "pulam" e mostram a diferença quando o saldo muda.
  const [delta, setDelta] = useState<{ n: number; key: number } | null>(null);
  const prevCoins = useRef(save.coins);
  useEffect(() => {
    const diff = save.coins - prevCoins.current;
    prevCoins.current = save.coins;
    if (diff === 0) return;
    setDelta({ n: diff, key: Date.now() });
    const t = setTimeout(() => setDelta(null), 900);
    return () => clearTimeout(t);
  }, [save.coins]);
  const isMaster = save.level >= MAX_LEVEL;
  // XP dentro do nível atual (ou do grau de Mestre), em número, para o jogador saber quanto falta.
  const xpStart = isMaster ? xpForLevel(MAX_LEVEL) + masterRank(save.xp) * MASTER_STEP_XP : xpForLevel(save.level);
  const xpSpan = isMaster ? MASTER_STEP_XP : xpForLevel(save.level + 1) - xpStart;
  const xpIn = save.xp - xpStart;

  const season = seasonOf(save.day);
  const xpPct = levelProgress(save.xp) * 100;
  const levelShort = isMaster ? `M${masterRank(save.xp)}` : tr('Nv {0}', save.level);

  return (
    <header className="hud">
      <button className="hud-compact" onClick={() => setDetails((d) => !d)} aria-expanded={details} aria-label={tr('Ver nível, experiência e reputação')}>
        <span className="hc-day"><Icon e={season.icon} /> {save.day}</span>
        <span className="hc-clock">{formatClock(save.clockMin)}{paused && save.phase === 'expediente' ? ' ⏸\uFE0E' : fast ? <Icon e="⏩" /> : ''}</span>
        <span key={delta?.key ?? 0} className={`hc-coins ${delta ? (delta.n > 0 ? 'coin-gain' : 'coin-loss') : ''}`}><CoinIcon size={16} /> {coins}</span>
        <span className="hc-rep"><StarIcon size={16} /> {save.reputation}</span>
        <span className="hc-level" style={{ ['--xp' as string]: `${xpPct}%` }}>{levelShort}</span>
      </button>
      {details && (
        <div className="hud-pop" role="dialog" aria-label={tr('Sua loja')}>
          <div className="hp-head">
            <strong>{save.shopName}</strong>
            <button className="hud-crystals" onClick={() => { setDetails(false); dispatch({ type: 'TOGGLE_PANEL', panel: 'season' }); }}><Icon e="🌙" /> {save.crystals}</button>
          </div>
          <p className="hp-line">{tr('Dia ')}{save.day} · {season.name} · {PHASE_LABEL[save.phase]} · {TIME_OF_DAY_LABEL[timeOfDay(save.clockMin)]}</p>
          <span className="bar hp-day" aria-hidden><span style={{ width: `${dayProgress(save.clockMin) * 100}%` }} /></span>
          <p className="hp-line"><strong>{isMaster ? tr('Mestre {0}', masterRank(save.xp)) : tr('Nível {0}', save.level)}</strong> · {xpIn}/{xpSpan} XP</p>
          <span className="bar bar-xp hp-xp" aria-hidden><span style={{ width: `${xpPct}%` }} /></span>
          <p className="hp-line"><StarIcon size={16} />{tr(' Reputação ')}{save.reputation}: <strong>{reputationTitle(save.reputation)}</strong></p>
          <button className="btn btn-ghost hp-close" onClick={() => setDetails(false)}>{tr('Fechar')}</button>
        </div>
      )}
      <div className="hud-brand" title={GAME_NAME}>
        <span className="brand-full">{save.royal && save.royal.chapter >= 5 && <span className="brand-crown" title={tr('Grão-Alquimista do Reino')} aria-label={tr('Grão-Alquimista do Reino')}><Icon e="👑" /> </span>}{save.shopName}</span>
        <button className="hud-crystals" onClick={() => dispatch({ type: 'TOGGLE_PANEL', panel: 'season' })} title={tr('Cristais de luar: ganhe jogando e use na decoração ou nos talentos do Grimório')}><Icon e="🌙" /> {save.crystals}</button>
      </div>
      <div className="hud-stat" title={tr('Dia e fase · {0}', seasonOf(save.day).name)}>
        <span className="hud-label">{tr('Dia ')}{save.day} <span className="hud-season" aria-label={seasonOf(save.day).name}><Icon e={seasonOf(save.day).icon} /></span></span>
        <span className="hud-value">{PHASE_LABEL[save.phase]}</span>
      </div>
      <div className="hud-stat hud-clock" title={tr('Horário')}>
        <span className="hud-label">{TIME_OF_DAY_LABEL[timeOfDay(save.clockMin)]}</span>
        <span className="hud-value">{formatClock(save.clockMin)}{paused && save.phase === 'expediente' ? ' ⏸\uFE0E' : fast ? <span className="hud-fast" title={tr('Loja vazia: o relógio anda mais rápido até alguém entrar')}> <Icon e="⏩" /></span> : ''}</span>
        <span className="bar" aria-hidden><span style={{ width: `${dayProgress(save.clockMin) * 100}%` }} /></span>
      </div>
      <div className="hud-stat hud-coins" title={tr('Moedas')}>
        <span className="hud-label">{tr('Moedas')}</span>
        <span key={delta?.key ?? 0} className={`hud-value ${delta ? (delta.n > 0 ? 'coin-gain' : 'coin-loss') : ''}`}><CoinIcon size={16} /> {coins}</span>
        {delta && <span key={`d${delta.key}`} className={`coin-delta ${delta.n > 0 ? 'up' : 'down'}`}>{delta.n > 0 ? '+' : '−'}{Math.abs(delta.n)}</span>}
      </div>
      <div className="hud-stat" title={tr('Reputação {0}: {1}. Sobe com vendas a preço justo.', save.reputation, reputationTitle(save.reputation))}>
        <span className="hud-label">{tr('Reputação')}</span>
        <span className="hud-value"><StarIcon size={16} /> {save.reputation}<span className="hud-sub hide-sm">{reputationTitle(save.reputation)}</span></span>
      </div>
      <div className="hud-stat hud-level" title={isMaster ? tr('Grau de Mestre') : tr('Nível da loja')}>
        <span className={`hud-label ${isMaster ? 'hud-master' : ''}`}>
          {isMaster ? tr('Mestre {0}', masterRank(save.xp)) : tr('Nível {0}', save.level)}
        </span>
        <span className="bar bar-xp" aria-label={tr('Experiência: {0}%', Math.round(levelProgress(save.xp) * 100))}>
          <span style={{ width: `${levelProgress(save.xp) * 100}%` }} />
        </span>
        <span className="hud-xp">{xpIn}/{xpSpan} XP</span>
      </div>
      <div className="hud-actions">
        <div className="hud-run">
        {save.phase === 'preparacao' && !homeVisible && (
          <button data-tut="open-shop" className="btn btn-primary btn-glow" onClick={() => dispatch({ type: 'OPEN_SHOP' })}>{tr('Abrir loja')}</button>
        )}
        {save.phase === 'expediente' && (
          <>
            <button
              className={`btn btn-speed ${speed === 2 ? 'on' : ''}`}
              onClick={() => dispatch({ type: 'TOGGLE_SPEED' })}
              aria-pressed={speed === 2}
              title={speed === 2 ? tr('Voltar à velocidade normal') : tr('Acelerar o dia (2×)')}
            >
              {speed === 2 ? '2×' : '1×'}
            </button>
            <button className="btn" onClick={() => dispatch({ type: 'TOGGLE_PAUSE' })} aria-pressed={paused} title={tr('Pausar (espaço)')}>
              {paused ? '▶\uFE0E' : '❚❚'}<span className="hide-sm">{paused ? tr(' Continuar') : tr(' Pausar')}</span>
            </button>
            {confirmClose ? (
              <>
                <button className="btn btn-danger" onClick={() => { setConfirmClose(false); dispatch({ type: 'CLOSE_SHOP' }); }}>{tr('Fechar agora?')}</button>
                <button className="btn btn-ghost" onClick={() => setConfirmClose(false)}>{tr('Não')}</button>
              </>
            ) : (
              <button data-tut="close-day" className="btn" onClick={() => setConfirmClose(true)}>{tr('Encerrar dia')}</button>
            )}
          </>
        )}
        </div>
        <button className="btn btn-ghost" onClick={() => dispatch({ type: 'OPEN_MODAL', modal: 'settings' })} aria-label={tr('Configurações')} title={tr('Configurações')}><Icon e="⚙" /></button>
      </div>
    </header>
  );
}
