import { useEffect, useRef, useState } from 'react';
import { seasonOf } from '../../domain/rules/world';
import { levelProgress, masterRank, MASTER_STEP_XP, MAX_LEVEL, reputationTitle, xpForLevel } from '../../domain/rules/progression';
import { dayProgress, formatClock, TIME_OF_DAY_LABEL, timeOfDay } from '../../domain/rules/time';
import { useGameStore } from '../../store/gameStore';
import { CoinIcon, StarIcon } from '../../ui/icons';
import { useAnimatedNumber } from '../../ui/useAnimatedNumber';

const PHASE_LABEL = { preparacao: 'Preparação', expediente: 'Loja aberta', fechamento: 'Fechamento' } as const;

export function Hud() {
  const save = useGameStore((s) => s.save)!;
  const paused = useGameStore((s) => s.ui.paused);
  const dispatch = useGameStore((s) => s.dispatch);
  const [confirmClose, setConfirmClose] = useState(false);
  const speed = useGameStore((s) => s.ui.speed);
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

  return (
    <header className="hud">
      <div className="hud-brand"><span className="brand-full">Alchemist's Corner</span><span className="brand-short">A.C.</span></div>
      <div className="hud-stat" title={`Dia e fase · ${seasonOf(save.day).name}`}>
        <span className="hud-label">Dia {save.day} <span className="hud-season" aria-label={seasonOf(save.day).name}>{seasonOf(save.day).icon}</span></span>
        <span className="hud-value">{PHASE_LABEL[save.phase]}</span>
      </div>
      <div className="hud-stat hud-clock" title="Horário">
        <span className="hud-label">{TIME_OF_DAY_LABEL[timeOfDay(save.clockMin)]}</span>
        <span className="hud-value">{formatClock(save.clockMin)}{paused && save.phase === 'expediente' ? ' ⏸' : ''}</span>
        <span className="bar" aria-hidden><span style={{ width: `${dayProgress(save.clockMin) * 100}%` }} /></span>
      </div>
      <div className="hud-stat hud-coins" title="Moedas">
        <span className="hud-label">Moedas</span>
        <span key={delta?.key ?? 0} className={`hud-value ${delta ? (delta.n > 0 ? 'coin-gain' : 'coin-loss') : ''}`}><CoinIcon size={16} /> {coins}</span>
        {delta && <span key={`d${delta.key}`} className={`coin-delta ${delta.n > 0 ? 'up' : 'down'}`}>{delta.n > 0 ? '+' : '−'}{Math.abs(delta.n)}</span>}
      </div>
      <div className="hud-stat" title={`Reputação ${save.reputation}: ${reputationTitle(save.reputation)}. Sobe com vendas a preço justo.`}>
        <span className="hud-label">Reputação</span>
        <span className="hud-value"><StarIcon size={16} /> {save.reputation}<span className="hud-sub hide-sm">{reputationTitle(save.reputation)}</span></span>
      </div>
      <div className="hud-stat hud-level" title={isMaster ? 'Grau de Mestre' : 'Nível da loja'}>
        <span className={`hud-label ${isMaster ? 'hud-master' : ''}`}>
          {isMaster ? `Mestre ${masterRank(save.xp)}` : `Nível ${save.level}`}
        </span>
        <span className="bar bar-xp" aria-label={`Experiência: ${Math.round(levelProgress(save.xp) * 100)}%`}>
          <span style={{ width: `${levelProgress(save.xp) * 100}%` }} />
        </span>
        <span className="hud-xp">{xpIn}/{xpSpan} XP</span>
      </div>
      <div className="hud-actions">
        {save.phase === 'preparacao' && (
          <button data-tut="open-shop" className="btn btn-primary btn-glow" onClick={() => dispatch({ type: 'OPEN_SHOP' })}>Abrir loja</button>
        )}
        {save.phase === 'expediente' && (
          <>
            <button
              className={`btn btn-speed ${speed === 2 ? 'on' : ''}`}
              onClick={() => dispatch({ type: 'TOGGLE_SPEED' })}
              aria-pressed={speed === 2}
              title={speed === 2 ? 'Voltar à velocidade normal' : 'Acelerar o dia (2×)'}
            >
              {speed === 2 ? '2×' : '1×'}
            </button>
            <button className="btn" onClick={() => dispatch({ type: 'TOGGLE_PAUSE' })} aria-pressed={paused} title="Pausar (espaço)">
              {paused ? '▶' : '❚❚'}<span className="hide-sm">{paused ? ' Continuar' : ' Pausar'}</span>
            </button>
            {confirmClose ? (
              <>
                <button className="btn btn-danger" onClick={() => { setConfirmClose(false); dispatch({ type: 'CLOSE_SHOP' }); }}>Fechar agora?</button>
                <button className="btn btn-ghost" onClick={() => setConfirmClose(false)}>Não</button>
              </>
            ) : (
              <button data-tut="close-day" className="btn" onClick={() => setConfirmClose(true)}>Encerrar dia</button>
            )}
          </>
        )}
        <button className="btn btn-ghost" onClick={() => dispatch({ type: 'OPEN_MODAL', modal: 'settings' })} aria-label="Configurações" title="Configurações">⚙</button>
      </div>
    </header>
  );
}
