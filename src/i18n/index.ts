// Idiomas do jogo (auditoria P3.2). O português é o texto-fonte: cada frase do código passa por `tr()`,
// e o inglês vem do dicionário `en.ts`, indexado pela frase em português (com {0}, {1}… no lugar dos valores).
// O idioma é escolhido uma vez, ao abrir o jogo: trocar recarrega a página. Os testes rodam em português.
import { EN } from './en';

export type Lang = 'pt' | 'en';
export const LANG_KEY = 'ac-lang';

function detect(): Lang {
  try {
    const saved = globalThis.localStorage?.getItem(LANG_KEY);
    if (saved === 'pt' || saved === 'en') return saved;
  } catch { /* armazenamento bloqueado: segue o navegador */ }
  const nav = (globalThis as { navigator?: { language?: string } }).navigator?.language ?? 'pt';
  // Fora do navegador (testes) fica em português.
  if (typeof window === 'undefined') return 'pt';
  return nav.toLowerCase().startsWith('pt') ? 'pt' : 'en';
}

export const LANG: Lang = detect();

/** Troca o idioma e recarrega o jogo (o save não muda). */
export function setLang(lang: Lang) {
  try { localStorage.setItem(LANG_KEY, lang); } catch { /* segue sem lembrar */ }
  location.reload();
}

const missing = new Set<string>();

/** Traduz uma frase em português. Valores entram em {0}, {1}… */
export function tr(pt: string, ...args: unknown[]): string {
  let s = pt;
  if (LANG === 'en') {
    const en = EN[pt];
    if (en !== undefined) s = en;
    else if (import.meta.env?.DEV && !missing.has(pt)) { missing.add(pt); console.warn('[i18n] sem tradução:', pt); }
  }
  return args.length ? s.replace(/\{(\d+)\}/g, (m, i) => (args[+i] === undefined ? m : String(args[+i]))) : s;
}

/** Locale para números e datas. */
export const LOCALE = LANG === 'en' ? 'en-US' : 'pt-BR';
