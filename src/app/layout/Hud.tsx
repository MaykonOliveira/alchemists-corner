import { levelFromXp, levelProgress } from '../../domain/rules/progression';
import { dayProgress, formatClock, TIME_OF_DAY_LABEL, timeOfDay } from '../../domain/rules/time';
import { useGameStore } from '../../store/gameStore';
import { CoinIcon, StarIcon } from '../../ui/icons';

const PHASE_LABEL = { preparacao: 'Preparação', expediente: 'Expediente', fechamento: 'Fechamento' } as const;

export function Hud() {
  const save = useGameStore((s) => s.save)!;
  const paused = useGameStore((s) => s.ui.paused);
  const dispatch = useGameStore((s) => s.dispatch);
  const backToMenu = useGameStore((s) => s.backToMenu);
  const level = levelFromXp(save.xp);

  return (
    <header className="hud">
      <div className="hud-brand">Alchemist's Corner</div>
      <div className="hud-stat" title="Dia e fase">
        <span className="hud-label">Dia {save.day}</span>
        <span className="hud-value">{PHASE_LABEL[save.phase]}</span>
      </div>
      <div className="hud-stat hud-clock" title="Horário">
        <span className="hud-label">{TIME_OF_DAY_LABEL[timeOfDay(save.clockMin)]}</span>
        <span className="hud-value">{formatClock(save.clockMin)}{paused && ' · pausado'}</span>
        <span className="bar" aria-hidden><span style={{ width: `${dayProgress(save.clockMin) * 100}%` }} /></span>
      </div>
      <div className="hud-stat" title="Moedas">
        <span className="hud-label">Moedas</span>
        <span className="hud-value"><CoinIcon size={14} /> {save.coins}</span>
      </div>
      <div className="hud-stat" title="Reputação">
        <span className="hud-label">Reputação</span>
        <span className="hud-value"><StarIcon size={14} /> {save.reputation}</span>
      </div>
      <div className="hud-stat" title="Nível da loja">
        <span className="hud-label">Nível {level}</span>
        <span className="bar" aria-label={`Experiência: ${Math.round(levelProgress(save.xp) * 100)}%`}>
          <span style={{ width: `${levelProgress(save.xp) * 100}%` }} />
        </span>
      </div>
      <div className="hud-actions">
        {save.phase === 'preparacao' && (
          <button className="btn btn-primary" onClick={() => dispatch({ type: 'OPEN_SHOP' })}>Abrir loja</button>
        )}
        {save.phase === 'expediente' && (
          <>
            <button className="btn" onClick={() => dispatch({ type: 'TOGGLE_PAUSE' })} aria-pressed={paused}>
              {paused ? 'Continuar' : 'Pausar'} <kbd>espaço</kbd>
            </button>
            <button className="btn" onClick={() => dispatch({ type: 'CLOSE_SHOP' })}>Encerrar dia</button>
          </>
        )}
        <button className="btn btn-ghost" onClick={backToMenu}>Menu</button>
      </div>
    </header>
  );
}
