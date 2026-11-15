import { SKIN, setSkin, type Skin } from '../app/skin';
import { tr } from '../i18n';

/** Alterna entre o pixel art e o visual vetorial em teste. A troca recarrega o jogo, como a de idioma. */
export function SkinSwitch() {
  const options: { id: Skin; label: string }[] = [
    { id: 'classic', label: tr('Pixel art') },
    { id: 'vector', label: tr('Novo (vetorial)') },
  ];
  return (
    <div className="lang-switch" role="radiogroup" aria-label={tr('Visual')}>
      {options.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={SKIN === o.id}
          className={`lang-opt ${SKIN === o.id ? 'on' : ''}`} onClick={() => SKIN !== o.id && setSkin(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
