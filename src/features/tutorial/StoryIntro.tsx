import { useState } from 'react';
import story1 from '../../assets/sprites/story-1.png';
import story2 from '../../assets/sprites/story-2.png';
import story3 from '../../assets/sprites/story-3.png';
import { useGameStore } from '../../store/gameStore';

const FRAMES = [
  { img: story1, kicker: 'Uma carta chegou', text: 'O velho alquimista Bartolomeu se aposentou para cuidar das abelhas. Na carta, uma chave de latão e um bilhete: “A loja da esquina agora é sua. Cuide bem do caldeirão.”' },
  { img: story2, kicker: 'A loja da esquina', text: 'As prateleiras estão vazias e o pó cobre tudo. Mas o armário ainda guarda umas folhas, umas pedras e um resto de orvalho feérico.' },
  { img: story3, kicker: 'Fogo aceso', text: 'Você acende o caldeirão, e o gato da loja volta para o balcão como se nunca tivesse saído. A cidade está esperando suas poções.' },
];

/** História de abertura (três quadros) mostrada uma vez, numa partida nova. */
export function StoryIntro() {
  const show = useGameStore((s) => !!s.save && !s.save.storySeen);
  const dispatch = useGameStore((s) => s.dispatch);
  const [i, setI] = useState(0);
  if (!show) return null;
  const f = FRAMES[i];
  const last = i === FRAMES.length - 1;
  const done = () => dispatch({ type: 'SEE_STORY' });
  return (
    <div className="story" role="dialog" aria-modal="true" aria-label="História de abertura">
      <div className="story-card" key={i}>
        <div className="story-frame">
          <img src={f.img} alt="" className="story-img" />
          <span className="story-vignette" aria-hidden />
        </div>
        <p className="story-kicker">{f.kicker}</p>
        <p className="story-text">{f.text}</p>
        <div className="story-foot">
          <span className="story-dots" aria-label={`Quadro ${i + 1} de ${FRAMES.length}`}>
            {FRAMES.map((_, n) => <span key={n} className={n === i ? 'on' : ''} />)}
          </span>
          <button className="link-btn" onClick={done}>Pular</button>
          <button className="btn btn-primary btn-glow" autoFocus onClick={() => (last ? done() : setI(i + 1))}>
            {last ? 'Abrir a loja' : 'Continuar'}
          </button>
        </div>
      </div>
    </div>
  );
}
