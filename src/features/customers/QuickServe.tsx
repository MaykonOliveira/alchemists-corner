import { ARCHETYPES } from '../../domain/data/customers';
import { regularOf, regularState } from '../../domain/rules/world';
import { RECIPES_BY_ID } from '../../domain/data/recipes';
import { bestOffer, priceVerdict, reservedForOrder, vipPrice } from '../../domain/rules/customers';
import { getPrice, potionStock } from '../../domain/rules/economy';
import { useGameStore } from '../../store/gameStore';
import { useStageCards } from '../tutorial/stage';
import { CoinIcon } from '../../ui/icons';
import { PotionIcon } from '../../ui/SpriteIcon';
import { Meter } from '../../ui/widgets';
import { Icon } from '../../ui/Icon';

const VERDICT_LABEL = { sim: 'O preço agrada', negocia: 'Vai pedir desconto', nao: 'Vai achar caro' } as const;

/** Atendimento rápido sobre a loja: o cliente selecionado e um botão para vender com um toque. */
export function QuickServe({ placement }: { placement: 'stage' | 'side' }) {
  const save = useGameStore((s) => s.save);
  const selectedId = useGameStore((s) => s.ui.selectedCustomerId);
  const panel = useGameStore((s) => s.ui.activePanel);
  const modal = useGameStore((s) => s.ui.modal);
  const dispatch = useGameStore((s) => s.dispatch);
  const { welcome } = useStageCards();

  if (!save || save.phase !== 'expediente' || panel === 'counter' || modal || welcome) return null;
  const idx = save.customers.findIndex((c) => c.id === selectedId);
  if (idx < 0) return null;
  const c = save.customers[idx];
  const a = ARCHETYPES[c.archetype];
  const reg = regularOf(c);
  const hearts = reg ? regularState(save, reg.id).hearts : 0;
  const wanted = RECIPES_BY_ID[c.wantedRecipeId];
  const left = 1 - c.waitedMs / c.patienceMs;
  const offerId = c.offer ? null : bestOffer(save, c);
  const verdict = offerId ? priceVerdict(save, c, offerId) : null;
  const next = save.customers.length > 1 ? save.customers[(idx + 1) % save.customers.length] : null;
  const reserved = !c.offer && !offerId && reservedForOrder(save, wanted.id) > 0 && potionStock(save, wanted.id) > 0;

  // Cliente misterioso: não diz o que quer, só deixa uma charada.
  if (c.mystery) {
    const stock = save.potions.filter((p) => p.forSale && p.quantity > 0);
    return (
      <section className={`quick-serve qs-${placement} qs-mystery`} aria-label="Atender o cliente misterioso">
        <div className="qs-head">
          <span className="qs-mystery-icon" aria-hidden><Icon e="❓" size={32} /></span>
          <div className="qs-who">
            <span className="qs-name">Viajante encapuzado <span className="muted">· paga 3× e deixa cristais</span></span>
            <Meter ratio={left} tone={left > 0.5 ? 'ok' : left > 0.25 ? 'gold' : 'warn'} label="Paciência" />
          </div>
          <button className="qs-icon" onClick={() => dispatch({ type: 'SELECT_CUSTOMER', id: null })} aria-label="Fechar atendimento">×</button>
        </div>
        <p className="qs-remark qs-riddle">“{c.remark}”</p>
        <div className="qs-guess">
          {stock.length === 0 ? <span className="qs-none">Nada nas prateleiras para arriscar.</span> : stock.slice(0, 8).map((p) => (
            <button key={p.recipeId} className="qs-guess-btn" title={RECIPES_BY_ID[p.recipeId].name} onClick={() => dispatch({ type: 'SERVE_CUSTOMER', customerId: c.id, recipeId: p.recipeId })}>
              <PotionIcon recipeId={p.recipeId} size={22} />
              <span>{RECIPES_BY_ID[p.recipeId].shortName}</span>
            </button>
          ))}
        </div>
        <p className="small muted">Errar não custa a poção, mas ele perde a paciência mais rápido.</p>
      </section>
    );
  }

  // Sem nada para oferecer: uma linha só, para não ocupar a tela inteira enquanto o cliente espera.
  if (!c.offer && !offerId) {
    return (
      <section className={`quick-serve qs-${placement} qs-compact`} aria-label={`Atender ${a.label}`}>
        <PotionIcon recipeId={wanted.id} size={20} />
        <span className="qs-none">
          <span className="qs-face" aria-label="Humor"><Icon e={left > 0.5 ? '🙂' : left > 0.25 ? '😐' : '😠'} /></span> {c.vip ? c.vip.name : reg ? reg.name.split(',')[0] : a.label} quer {wanted.shortName}
          <span className="muted small"> · {reserved ? 'as que você tem estão guardadas para o pedido' : 'acabou na prateleira'}</span>
        </span>
        {next && <button className="qs-icon" onClick={() => dispatch({ type: 'SELECT_CUSTOMER', id: next.id })} aria-label="Próximo cliente">{idx + 1}/{save.customers.length} ›</button>}
        <button className="btn btn-small" onClick={() => dispatch({ type: 'DISMISS_CUSTOMER', customerId: c.id })}>Dispensar</button>
        <button className="btn btn-small btn-ghost" onClick={() => dispatch({ type: 'OPEN_PANEL', panel: 'counter' })}>Opções</button>
      </section>
    );
  }

  return (
    <section className={`quick-serve qs-${placement} ${c.vip ? 'qs-is-vip' : ''}`} aria-label={`Atender ${a.label}`}>
      <div className="qs-head">
        <PotionIcon recipeId={wanted.id} size={24} />
        <div className="qs-who">
          <span className="qs-name"><span className="qs-face" aria-label="Humor"><Icon e={left > 0.5 ? '🙂' : left > 0.25 ? '😐' : '😠'} /></span> {c.vip ? <span className="qs-regular qs-vip"><Icon e="✨" /> {c.vip.name}</span> : reg ? <span className="qs-regular">{reg.name.split(',')[0]} <span className="heart-on">{'♥\uFE0E'.repeat(hearts) || '♡'}</span></span> : a.label} <span className="muted">quer</span> {wanted.shortName}</span>
          <Meter ratio={left} tone={left > 0.5 ? 'ok' : left > 0.25 ? 'gold' : 'warn'} label="Paciência" />
        </div>
        {next && (
          <button className="qs-icon" onClick={() => dispatch({ type: 'SELECT_CUSTOMER', id: next.id })} aria-label="Próximo cliente" title="Próximo cliente">
            {idx + 1}/{save.customers.length} ›
          </button>
        )}
        <button className="qs-icon" onClick={() => dispatch({ type: 'SELECT_CUSTOMER', id: null })} aria-label="Fechar atendimento">×</button>
      </div>

      {c.remark && <p className="qs-remark">“{c.remark}”</p>}

      <div className="qs-actions">
        {c.offer ? (
          <>
            <button className="btn btn-primary qs-main" onClick={() => dispatch({ type: 'ACCEPT_OFFER', customerId: c.id })}>
              Aceitar <CoinIcon size={14} /> {c.offer.price}
            </button>
            <button className="btn" onClick={() => dispatch({ type: 'DECLINE_OFFER', customerId: c.id })}>Recusar</button>
          </>
        ) : offerId ? (
          <>
            <button
              data-tut="quick-sell"
              className={`btn btn-primary qs-main qs-${verdict}`}
              onClick={() => dispatch({ type: 'SERVE_CUSTOMER', customerId: c.id, recipeId: offerId })}
            >
              <PotionIcon recipeId={offerId} size={18} />
              <span>Vender {RECIPES_BY_ID[offerId].shortName}</span>
              <span className="qs-price"><CoinIcon size={14} /> {c.vip ? vipPrice(c, offerId) : getPrice(save, offerId)}</span>
            </button>
            <span className={`qs-verdict qs-v-${verdict}`}>{offerId !== c.wantedRecipeId ? 'parecida · ' : ''}{c.vip ? `paga ${c.vip.pays}× o preço` : VERDICT_LABEL[verdict!]}</span>
          </>
        ) : (
          <>
            <span className="qs-none">Sem {wanted.shortName} nas prateleiras.</span>
            <button className="btn" onClick={() => dispatch({ type: 'DISMISS_CUSTOMER', customerId: c.id })}>Dispensar</button>
          </>
        )}
        <button className="btn btn-ghost qs-more" onClick={() => dispatch({ type: 'OPEN_PANEL', panel: 'counter' })}>Opções</button>
      </div>
    </section>
  );
}
