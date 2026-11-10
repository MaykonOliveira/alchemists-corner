import { useEffect, useState } from 'react';
import { funnel } from '../../analytics/funnel';
import { useGameStore } from '../../store/gameStore';
import { canvasBlob, drawShopCard } from './shareCard';
import { GAME_URL } from './giftCode';

import { GAME_NAME, tr } from '../../i18n';
/** "Mostrar a loja": gera o cartão e deixa compartilhar, baixar ou copiar o link do jogo. */
export function ShareModal() {
  const modal = useGameStore((s) => s.ui.modal);
  const save = useGameStore((s) => s.save);
  const dispatch = useGameStore((s) => s.dispatch);
  const [url, setUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const open = modal === 'share' && !!save;

  useEffect(() => {
    if (!open || !save) return;
    let alive = true;
    let made: string | null = null;
    setUrl(null);
    const ch = save.challenge && !save.challenge.active && save.challenge.score !== null ? { week: save.challenge.week, score: save.challenge.score } : undefined;
    // Espera um quadro para a cena desenhar sem o modal por cima.
    requestAnimationFrame(async () => {
      const cv = await drawShopCard(save, { challenge: ch && save.phase === 'fechamento' ? ch : undefined });
      const b = await canvasBlob(cv);
      if (!alive || !b) return;
      made = URL.createObjectURL(b);
      setBlob(b);
      setUrl(made);
    });
    return () => { alive = false; if (made) URL.revokeObjectURL(made); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open || !save) return null;
  const close = () => dispatch({ type: 'OPEN_MODAL', modal: null });
  const text = tr('Olha a minha loja de poções "{0}" no {2}! {1}', save.shopName, GAME_URL, GAME_NAME);
  const file = blob ? new File([blob], 'minha-loja.png', { type: 'image/png' }) : null;
  const canShareFile = !!file && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });

  const share = async () => {
    funnel.mark('shared_card');
    try {
      if (canShareFile) await navigator.share({ files: [file!], text });
      else if (navigator.share) await navigator.share({ text, url: GAME_URL });
      else download();
    } catch { /* o jogador cancelou */ }
  };
  const download = () => {
    if (!url) return;
    funnel.mark('shared_card');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${save.shopName.replace(/[^\p{L}\p{N}]+/gu, '-').toLowerCase() || 'minha-loja'}.png`;
    a.click();
    setMsg(tr('Imagem salva.'));
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setMsg(tr('Link copiado!')); } catch { setMsg(text); }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="modal modal-share" role="dialog" aria-modal="true" aria-labelledby="share-title">
        <p className="modal-kicker">{tr('Mostrar a loja')}</p>
        <h2 id="share-title">{save.shopName}</h2>
        <div className="share-preview">
          {url ? <img src={url} alt={tr('Cartão da loja {0}', save.shopName)} /> : <span className="muted">{tr('Pintando o cartão…')}</span>}
        </div>
        <div className="btn-row">
          <button className="btn btn-primary btn-glow" disabled={!url} onClick={share}>{tr('Compartilhar')}</button>
          <button className="btn" disabled={!url} onClick={download}>{tr('Baixar imagem')}</button>
          <button className="btn" onClick={copy}>{tr('Copiar link')}</button>
        </div>
        {msg && <p className="muted small">{msg}</p>}
        <button className="btn btn-ghost-dark" onClick={close}>{tr('Voltar')}</button>
      </div>
    </div>
  );
}
