import { useState } from 'react';
import { levelProgress, reputationTitle } from '../../domain/rules/progression';
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
  const coins = useAnimatedNumber(save.coins);

  return (
    <header className="hud">
      <div className="hud-brand"><span className="brand-full">Alchemist's Corner</span><span className="brand-short">A.C.</span></div>
      <div className="hud-stat" title="Dia e fase">
        <span className="hud-label">Dia {save.day}</span>
        <span className="hud-value">{PHASE_LABEL[save.phase]}</span>
      </div>
      <div className="hud-stat hud-clock" title="Horário">
        <span className="hud-label">{TIME_OF_DAY_LABEL[timeOfDay(save.clockMin)]}</span>
        <span className="hud-value">{formatClock(save.clockMin)}{paused && save.phase === 'expediente' ? ' ⏸' : ''}</span>
        <span className="bar" aria-hidden><span style={{ width: `${dayProgress(save.clockMin) * 100}%` }} /></span>
      </div>
      <div className="hud-stat hud-coins" title="Moedas">
        <span className="hud-label">Moedas</span>
        <span className="hud-value"><CoinIcon size={16} /> {coins}</span>
      </div>
      <div className="hud-stat" title={`Reputação: ${reputationTitle(save.reputation)}`}>
        <span className="hud-label">{reputationTitle(save.reputation)}</span>
        <span className="hud-value"><StarIcon size={16} /> {save.reputation}</span>
      </div>
      <div className="hud-stat" title="Nível da loja">
        <span className="hud-label">Nível {save.level}</span>
        <span className="bar bar-xp" aria-label={`Experiência: ${Math.round(levelProgress(save.xp) * 100)}%`}>
          <span style={{ width: `${levelProgress(save.xp) * 100}%` }} />
        </span>
      </div>
      <div className="hud-actions">
        {save.phase === 'preparacao' && (
          <button className="btn btn-primary btn-glow" onClick={() => dispatch({ type: 'OPEN_SHOP' })}>Abrir loja</button>
        )}
        {save.phase === 'expediente' && (
          <>
            <button className="btn" onClick={() => dispatch({ type: 'TOGGLE_PAUSE' })} aria-pressed={paused} title="Pausar (espaço)">
              {paused ? '▶' : '❚❚'}<span className="hide-sm">{paused ? ' Continuar' : ' Pausar'}</span>
            </button>
            {confirmClose ? (
              <>
                <button className="btn btn-danger" onClick={() => { setConfirmClose(false); dispatch({ type: 'CLOSE_SHOP' }); }}>Fechar agora?</button>
                <button className="btn btn-ghost" onClick={() => setConfirmClose(false)}>Não</button>
              </>
            ) : (
              <button className="btn" onClick={() => setConfirmClose(true)}>Encerrar dia</button>
            )}
          </>
        )}
        <button className="btn btn-ghost" onClick={() => dispatch({ type: 'OPEN_MODAL', modal: 'settings' })} aria-label="Configurações" title="Configurações">⚙</button>
      </div>
    </header>
  );
}
