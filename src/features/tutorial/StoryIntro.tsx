import { useState } from 'react';
import story1 from '../../assets/sprites/story-1.png';
import story2 from '../../assets/sprites/story-2.png';
import story3 from '../../assets/sprites/story-3.png';
import { useGameStore } from '../../store/gameStore';
import { AWNINGS } from '../../domain/data/catalog';
import { funnel } from '../../analytics/funnel';

import { tr } from '../../i18n';
const NAME_IDEAS = [tr('Loja da Esquina'), tr('Caldeirão Dourado'), tr('Frasco Encantado'), tr('Pó de Estrela'), tr('Elixir & Cia.')];

/** Último passo da abertura: o jogador dá nome à loja e escolhe a cor do toldo. */
function NameShop({ onDone }: { onDone: () => void }) {
  const dispatch = useGameStore((s) => s.dispatch);
  const [name, setName] = useState('');
  const [awning, setAwning] = useState<string>(AWNINGS[0].id);
  const idea = NAME_IDEAS[0];
  const color = AWNINGS.find((a) => a.id === awning)!.color;
  const finish = () => {
    dispatch({ type: 'SET_SHOP', name: name.trim() || idea, awning });
    onDone();
  };
  return (
    <div className="story-card name-shop">
      <p className="story-kicker">{tr('A loja é sua')}</p>
      <div className="awning-preview" style={{ ['--awning' as string]: color }} aria-hidden>
        <span className="awning-band" />
        <span className="awning-sign">{name.trim() || idea}</span>
      </div>
      <form className="name-form" onSubmit={(e) => { e.preventDefault(); finish(); }}>
        <label htmlFor="shop-name" className="name-label">{tr('Como a loja vai se chamar?')}</label>
        <input id="shop-name" className="name-input" maxLength={28} placeholder={idea} value={name} autoFocus
          onChange={(e) => setName(e.target.value)} autoComplete="off" />
        <div className="name-ideas">
          {NAME_IDEAS.slice(1).map((n) => <button type="button" key={n} className="chip" onClick={() => setName(n)}>{n}</button>)}
        </div>
        <p className="name-label">{tr('Cor do toldo')}</p>
        <div className="awning-swatches" role="radiogroup" aria-label={tr('Cor do toldo')}>
          {AWNINGS.map((a) => (
            <button type="button" key={a.id} role="radio" aria-checked={awning === a.id} aria-label={a.name} title={a.name}
              className={`swatch ${awning === a.id ? 'on' : ''}`} style={{ background: a.color }} onClick={() => setAwning(a.id)} />
          ))}
        </div>
        <div className="story-foot">
          <span className="muted small">{tr('Dá para mudar depois nas Configurações.')}</span>
          <button type="submit" className="btn btn-primary btn-glow">{tr('Pronto, é minha!')}</button>
        </div>
      </form>
    </div>
  );
}

const FRAMES = [
  { img: story1, kicker: tr('Uma carta chegou'), text: tr('O velho alquimista Bartolomeu se aposentou para cuidar das abelhas. Na carta, uma chave de latão e um bilhete: “A loja da esquina agora é sua. Cuide bem do caldeirão.”') },
  { img: story2, kicker: tr('A loja da esquina'), text: tr('As prateleiras estão vazias e o pó cobre tudo. Mas o armário ainda guarda umas folhas, umas pedras e um resto de orvalho feérico.') },
  { img: story3, kicker: tr('Fogo aceso'), text: tr('Você acende o caldeirão, e o gato da loja volta para o balcão como se nunca tivesse saído. A cidade está esperando suas poções.') },
];

/** História de abertura (três quadros) mostrada uma vez, numa partida nova. */
export function StoryIntro() {
  const show = useGameStore((s) => !!s.save && !s.save.storySeen);
  const dispatch = useGameStore((s) => s.dispatch);
  // Quem já passou pelos quadros e saiu na tela do nome volta direto para ela.
  const framesSeen = useGameStore((s) => !!s.save?.tipsSeen.includes('story:frames'));
  const [i, setI] = useState(framesSeen ? FRAMES.length : 0);
  if (!show) return null;
  const toName = () => { dispatch({ type: 'SEE_TIP', tipId: 'story:frames' }); setI(FRAMES.length); };
  const done = () => { funnel.mark('story_done'); dispatch({ type: 'SEE_STORY' }); };
  if (i >= FRAMES.length || framesSeen) {
    return (
      <div className="story" role="dialog" aria-modal="true" aria-label={tr('Nome da loja')}>
        <NameShop onDone={done} />
      </div>
    );
  }
  const f = FRAMES[i];
  const last = i === FRAMES.length - 1;
  return (
    <div className="story" role="dialog" aria-modal="true" aria-label={tr('História de abertura')}>
      <div className="story-card" key={i}>
        <div className="story-frame">
          <img src={f.img} alt="" className="story-img" />
          <span className="story-vignette" aria-hidden />
        </div>
        <p className="story-kicker">{f.kicker}</p>
        <p className="story-text">{f.text}</p>
        <div className="story-foot">
          <span className="story-dots" aria-label={tr('Quadro {0} de {1}', i + 1, FRAMES.length)}>
            {FRAMES.map((_, n) => <span key={n} className={n === i ? 'on' : ''} />)}
          </span>
          <button className="link-btn" onClick={toName}>{tr('Pular')}</button>
          <button className="btn btn-primary btn-glow" autoFocus onClick={() => (last ? toName() : setI(i + 1))}>
            {last ? tr('Dar nome à loja') : tr('Continuar')}
          </button>
        </div>
      </div>
    </div>
  );
}
