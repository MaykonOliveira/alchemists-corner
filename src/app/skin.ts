// Visual do jogo. 'classic' é o pixel art; 'vector' é o teste do visual vetorial cozy.
// A escolha vale para o aparelho (fica no navegador, fora do save) e trocar recarrega o jogo, como o idioma.
export type Skin = 'classic' | 'vector';
export const SKIN_KEY = 'ac-skin';

/** O visual vetorial depende do WebGL (a cena é desenhada em alta resolução); sem ele o jogo fica no pixel art. */
function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

function detect(): Skin {
  if (typeof window === 'undefined') return 'classic';
  try {
    // ?visual=novo ou ?visual=classico no endereço troca e fica lembrado.
    const q = new URLSearchParams(location.search).get('visual');
    if (q === 'novo' || q === 'classico') localStorage.setItem(SKIN_KEY, q === 'novo' ? 'vector' : 'classic');
    const saved = localStorage.getItem(SKIN_KEY);
    if (saved === 'vector') return hasWebGL() ? 'vector' : 'classic';
    if (saved === 'classic') return saved;
  } catch { /* armazenamento bloqueado: fica no visual clássico */ }
  return 'classic';
}

export const SKIN: Skin = detect();
export const VECTOR = SKIN === 'vector';

/** Troca o visual e recarrega o jogo (o save não muda). */
export function setSkin(skin: Skin) {
  try { localStorage.setItem(SKIN_KEY, skin); } catch { /* segue sem lembrar */ }
  // Tira o ?visual= do endereço, senão ele venceria a escolha feita em Opções.
  const url = new URL(location.href);
  if (url.searchParams.has('visual')) {
    url.searchParams.delete('visual');
    location.replace(url.toString());
  } else location.reload();
}
