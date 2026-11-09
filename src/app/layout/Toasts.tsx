import { useGameStore } from '../../store/gameStore';
import { withIcons } from '../../ui/Icon';

export function Toasts() {
  const toasts = useGameStore((s) => s.ui.toasts);
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.tone}`}>{withIcons(t.text)}</div>
      ))}
    </div>
  );
}
