import { useEffect, useState } from 'react';
import { RECIPES_BY_ID } from '../../domain/data/recipes';
import { ROYAL_CHAPTERS } from '../../domain/data/royal';
import { gameEvents } from '../../game/events';
import { sfx } from '../../audio/sound';
import { useGameStore } from '../../store/gameStore';
import { SpriteIcon } from '../../ui/SpriteIcon';
import { Icon } from '../../ui/Icon';

import { tr } from '../../i18n';
/** Conquistas que viram um momento na tela (as outras continuam como aviso pequeno). */
export const BIG_ACHIEVEMENTS: Record<string, { icon: string; title: string; text: string }> = {
  'primeira-venda': { icon: '🪙', title: tr('Primeira venda!'), text: tr('A loja da esquina está viva de novo.') },
  'mil-moedas': { icon: '💰', title: tr('Mil moedas!'), text: tr('O primeiro cofre da loja está cheio.') },
  'primeiro-contrato': { icon: '📜', title: tr('Palavra cumprida!'), text: tr('Seu primeiro contrato foi entregue.') },
  'amigo': { icon: '💛', title: tr('Um amigo!'), text: tr('Um freguês fiel agora é amigo da loja.') },
  'maestria': { icon: '✨', title: tr('Mão de mestre!'), text: tr('Você dominou uma receita: 5 estrelas.') },
  'rival-vencida': { icon: '🏆', title: tr('Vitória na rua!'), text: tr('A Madame Vesper vai ter que caprichar.') },
};

interface Moment { key: number; icon: string; title: string; text: string; trophy?: number }

/** Momentos grandes sobre a loja: moedas caindo, brilho e som. Some sozinho ou com um toque. */
export function Milestone() {
  const [m, setM] = useState<Moment | null>(null);
  const reduce = useGameStore((s) => !!s.save?.settings.reduceMotion);
  useEffect(() => gameEvents.on((e) => {
    if (e.type === 'ACHIEVEMENT' && BIG_ACHIEVEMENTS[e.id]) {
      setM({ key: Date.now(), ...BIG_ACHIEVEMENTS[e.id] });
      sfx.sparkle();
    } else if (e.type === 'ROYAL_CHAPTER_DONE') {
      const c = ROYAL_CHAPTERS[e.chapter];
      setM({ key: Date.now(), icon: c.icon, trophy: e.chapter, title: `${c.trophy}!`, text: tr('Prova vencida: {0}. +{1} moedas e {2} cristais.', c.title, e.coins, e.crystals) });
      sfx.sparkle();
    } else if (e.type === 'DISCOVERY' && e.legend) {
      const r = RECIPES_BY_ID[e.recipeId];
      setM({ key: Date.now(), icon: '📜', title: tr('Lenda descoberta!'), text: tr('{0}: {1}. Nenhum livro guardava esta receita.', r.name, r.need.toLowerCase()) });
      sfx.sparkle();
    } else if (e.type === 'BREW_DONE') {
      const s = useGameStore.getState().save;
      const total = s ? Object.values(s.mastery).reduce((n, q) => n + q, 0) : 0;
      if (total > 0 && total === e.qty) {
        setM({ key: Date.now(), icon: '🧪', title: tr('Primeira poção!'), text: tr('{0}× {1} saíram do seu caldeirão.', e.qty, RECIPES_BY_ID[e.recipeId].name) });
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
      <span className="milestone-icon" aria-hidden>{m.trophy !== undefined ? <SpriteIcon name={`trophy-${m.trophy}`} size={64} /> : <Icon e={m.icon} size={64} />}</span>
      <span className="milestone-title">{m.title}</span>
      <span className="milestone-text">{m.text}</span>
    </button>
  );
}
