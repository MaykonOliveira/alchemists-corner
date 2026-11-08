import { useEffect, useState } from 'react';
import { RECIPES_BY_ID } from '../../domain/data/recipes';
import { gameEvents } from '../../game/events';
import { sfx } from '../../audio/sound';
import { useGameStore } from '../../store/gameStore';

/** Conquistas que viram um momento na tela (as outras continuam como aviso pequeno). */
export const BIG_ACHIEVEMENTS: Record<string, { icon: string; title: string; text: string }> = {
  'primeira-venda': { icon: '🪙', title: 'Primeira venda!', text: 'A loja da esquina está viva de novo.' },
  'mil-moedas': { icon: '💰', title: 'Mil moedas!', text: 'O primeiro cofre da loja está cheio.' },
  'primeiro-contrato': { icon: '📜', title: 'Palavra cumprida!', text: 'Seu primeiro contrato foi entregue.' },
  'amigo': { icon: '💛', title: 'Um amigo!', text: 'Um freguês fiel agora é amigo da loja.' },
  'maestria': { icon: '✨', title: 'Mão de mestre!', text: 'Você dominou uma receita: 5 estrelas.' },
  'rival-vencida': { icon: '🏆', title: 'Vitória na rua!', text: 'A Madame Vesper vai ter que caprichar.' },
};

interface Moment { key: number; icon: string; title: string; text: string }

/** Momentos grandes sobre a loja: moedas caindo, brilho e som. Some sozinho ou com um toque. */
export function Milestone() {
  const [m, setM] = useState<Moment | null>(null);
  const reduce = useGameStore((s) => !!s.save?.settings.reduceMotion);
  useEffect(() => gameEvents.on((e) => {
    if (e.type === 'ACHIEVEMENT' && BIG_ACHIEVEMENTS[e.id]) {
      setM({ key: Date.now(), ...BIG_ACHIEVEMENTS[e.id] });
      sfx.sparkle();
    } else if (e.type === 'BREW_DONE') {
      const s = useGameStore.getState().save;
      const total = s ? Object.values(s.mastery).reduce((n, q) => n + q, 0) : 0;
      if (total > 0 && total === e.qty) {
        setM({ key: Date.now(), icon: '🧪', title: 'Primeira poção!', text: `${e.qty}× ${RECIPES_BY_ID[e.recipeId].name} saíram do seu caldeirão.` });
        sfx.sparkle();
      }
    }
  }), []);
  useEffect(() => {
    if (!m) return;
    const t = setTimeout(() => setM(null), 2800);
    return () => clearTimeout(t);
  }, [m]);
  if (!m) return null;
  return (
    <button className="milestone" key={m.key} onClick={() => setM(null)} aria-live="polite">
      {!reduce && (
        <span className="milestone-rain" aria-hidden>
          {Array.from({ length: 14 }, (_, i) => <i key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 7) * 0.12}s` }} />)}
        </span>
      )}
      <span className="milestone-icon" aria-hidden>{m.icon}</span>
      <span className="milestone-title">{m.title}</span>
      <span className="milestone-text">{m.text}</span>
    </button>
  );
}
