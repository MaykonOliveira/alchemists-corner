import { useEffect, useState } from 'react';
import { QUEEN, ROYAL_CHAPTERS, ROYAL_TITLE } from '../../domain/data/royal';
import { royalWon } from '../../domain/rules/royal';
import { sfx } from '../../audio/sound';
import { useGameStore } from '../../store/gameStore';
import { SpriteIcon } from '../../ui/SpriteIcon';
import { TrophyRow } from './RoyalPanel';
import { Icon } from '../../ui/Icon';

import { tr } from '../../i18n';
const CREDITS = [
  [tr('Alquimista-chefe'), tr('Você')],
  [tr('Gerente do caixa'), tr('O golem balconista')],
  [tr('Entregas aéreas'), tr('O corvo')],
  [tr('Mexedor oficial'), tr('O aprendiz')],
  [tr('Moral da equipe'), tr('O gato da loja')],
  [tr('Rival honrada'), tr('Madame Vesper')],
  [tr('Primeira cliente'), tr('A Condessa')],
  [tr('Juíza do concurso'), QUEEN],
];

/** Fogos de artifício em CSS (somem com "reduzir movimento"). */
function Fireworks() {
  return (
    <div className="fireworks" aria-hidden>
      {Array.from({ length: 7 }, (_, i) => (
        <span key={i} className="firework" style={{ left: `${8 + ((i * 41) % 84)}%`, top: `${10 + ((i * 23) % 40)}%`, animationDelay: `${i * 0.45}s`, ['--hue' as string]: `${(i * 57) % 360}` }}>
          {Array.from({ length: 10 }, (_, k) => <i key={k} style={{ transform: `rotate(${k * 36}deg)` }} />)}
        </span>
      ))}
    </div>
  );
}

/** Cerimônia final do Concurso Real: troféus, título, coroa e créditos. */
function Ceremony({ onClose }: { onClose: () => void }) {
  const reduce = useGameStore((s) => !!s.save?.settings.reduceMotion);
  const save = useGameStore((s) => s.save)!;
  const [step, setStep] = useState(0);
  useEffect(() => { sfx.sparkle(); }, [step]);
  return (
    <div className="story royal-scene ceremony" role="dialog" aria-modal="true" aria-label={tr('Cerimônia do Concurso Real')}>
      {!reduce && <Fireworks />}
      <div className="story-card royal-card" key={step}>
        {step === 0 ? (
          <>
            <p className="story-kicker">{tr('O grande salão do palácio')}</p>
            <div className="ceremony-crown" aria-hidden><SpriteIcon name="trophy-4" size={96} /></div>
            <h2 className="royal-headline">{tr('Você venceu o Concurso Real!')}</h2>
            <p className="story-text">A {QUEEN}{tr(' prova a Poção da Coroa, sorri e se levanta do trono. “Nunca provei nada igual. Este reino tem um novo ')}{ROYAL_TITLE}.”</p>
            <TrophyRow save={save} size={48} />
            <div className="story-foot"><span /><button className="btn btn-primary btn-glow" autoFocus onClick={() => setStep(1)}>{tr('Receber a coroa')}</button></div>
          </>
        ) : (
          <>
            <p className="story-kicker">{save.shopName}</p>
            <h2 className="royal-headline"><Icon e="👑" /> {ROYAL_TITLE}</h2>
            <p className="story-text">{tr('A loja ganhou uma coroa na fachada, a nobreza agora pede a Poção da Coroa e os talentos sem fim esperam seus cristais. A história continua: a loja é sua.')}</p>
            <div className={`credits ${reduce ? 'still' : ''}`}>
              <div className="credits-roll">
                {CREDITS.map(([role, who]) => <p key={role}><span>{role}</span><b>{who}</b></p>)}
                <p className="credits-end">{tr('Obrigado por jogar Alchemist\'s Corner')}</p>
              </div>
            </div>
            <div className="story-foot"><span /><button className="btn btn-primary btn-glow" autoFocus onClick={onClose}>{tr('Voltar à loja')}</button></div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Cena de abertura de cada capítulo do Concurso Real e a cerimônia final.
 * Aparece sozinha quando há capítulo novo (fora do fechamento e sem outra janela aberta),
 * e de novo quando o jogador pede na aba Concurso.
 */
export function RoyalScene() {
  const dispatch = useGameStore((s) => s.dispatch);
  const royal = useGameStore((s) => s.save?.royal ?? null);
  const replay = useGameStore((s) => s.ui.modal === 'royal');
  const blocked = useGameStore((s) => !s.save || !s.save.storySeen || s.save.phase === 'fechamento' || !!s.ui.levelUp || (!!s.ui.modal && s.ui.modal !== 'royal') || s.ui.welcome);
  const unseen = !!royal && royal.seen < royal.chapter;
  // Um respiro depois de vencer um capítulo, para o troféu brilhar na loja antes da cena seguinte.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!unseen) { setReady(false); return; }
    const t = setTimeout(() => setReady(true), 2600);
    return () => clearTimeout(t);
  }, [unseen, royal?.chapter]);
  useEffect(() => { if (unseen && ready && !blocked) dispatch({ type: 'SET_PAUSED', paused: true }); }, [unseen, ready, blocked, dispatch]);

  const won = !!royal && royal.chapter >= ROYAL_CHAPTERS.length;
  const show = !!royal && (replay || (unseen && ready && !blocked));
  if (!show) return null;
  const close = () => {
    dispatch({ type: 'SEE_ROYAL' });
    dispatch({ type: 'OPEN_MODAL', modal: null });
    dispatch({ type: 'SET_PAUSED', paused: false });
  };
  const save = useGameStore.getState().save!;
  if (won && royalWon(save)) return <Ceremony onClose={close} />;
  const ch = ROYAL_CHAPTERS[royal.chapter];
  return (
    <div className="story royal-scene" role="dialog" aria-modal="true" aria-label={ch.title}>
      <div className="story-card royal-card">
        <div className="royal-seal" aria-hidden><Icon e={ch.icon} size={32} /></div>
        <p className="story-kicker">{tr('Concurso Real · capítulo ')}{royal.chapter + 1}{tr(' de ')}{ROYAL_CHAPTERS.length}</p>
        <h2 className="royal-headline">{ch.title}</h2>
        {ch.intro.map((line) => <p key={line} className="story-text royal-line">{line}</p>)}
        <div className="royal-task">
          <b>{ch.task}</b>
          <span>{tr('Prêmio: ')}{ch.reward.coins}{tr(' moedas, ')}{ch.reward.crystals}{tr(' cristais e o troféu ')}{ch.trophy}.</span>
        </div>
        <div className="story-foot">
          <TrophyRow save={save} size={32} />
          <button className="btn btn-primary btn-glow" autoFocus onClick={close}>{royal.seen >= royal.chapter ? tr('Fechar') : tr('Aceitar o desafio')}</button>
        </div>
      </div>
    </div>
  );
}
