import { useGameStore } from '../../store/gameStore';

export function Toasts() {
  const toasts = useGameStore((s) => s.ui.toasts);
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.tone}`}>{t.text}</div>
      ))}
    </div>
  );
}
