import { LANG, setLang, tr, type Lang } from '../i18n';

const OPTIONS: { id: Lang; label: string }[] = [
  { id: 'pt', label: 'Português' },
  { id: 'en', label: 'English' },
];

/** Troca de idioma (auditoria P3.2). Cada nome aparece no próprio idioma, para quem não lê o outro. */
export function LangSwitch() {
  return (
    <div className="lang-switch" role="radiogroup" aria-label={tr('Idioma')}>
      {OPTIONS.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={LANG === o.id} lang={o.id}
          className={`lang-opt ${LANG === o.id ? 'on' : ''}`} onClick={() => LANG !== o.id && setLang(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
