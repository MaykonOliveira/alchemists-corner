import { ARCHETYPES } from '../../domain/data/customers';
import { RECIPES_BY_ID } from '../../domain/data/recipes';
import { bestOffer, priceVerdict } from '../../domain/rules/customers';
import { getPrice } from '../../domain/rules/economy';
import { useGameStore } from '../../store/gameStore';
import { CoinIcon } from '../../ui/icons';
import { PotionIcon } from '../../ui/SpriteIcon';
import { Meter } from '../../ui/widgets';

const VERDICT_LABEL = { sim: 'deve aceitar', negocia: 'vai pechinchar', nao: 'caro demais' } as const;

/** Atendimento rápido sobre a loja: o cliente selecionado e um botão para vender com um toque. */
export function QuickServe({ placement }: { placement: 'stage' | 'side' }) {
  const save = useGameStore((s) => s.save);
  const selectedId = useGameStore((s) => s.ui.selectedCustomerId);
  const panel = useGameStore((s) => s.ui.activePanel);
  const modal = useGameStore((s) => s.ui.modal);
  const dispatch = useGameStore((s) => s.dispatch);

  if (!save || save.phase !== 'expediente' || panel === 'counter' || modal) return null;
  const idx = save.customers.findIndex((c) => c.id === selectedId);
  if (idx < 0) return null;
  const c = save.customers[idx];
  const a = ARCHETYPES[c.archetype];
  const wanted = RECIPES_BY_ID[c.wantedRecipeId];
  const left = 1 - c.waitedMs / c.patienceMs;
  const offerId = c.offer ? null : bestOffer(save, c);
  const verdict = offerId ? priceVerdict(save, c, offerId) : null;
  const next = save.customers.length > 1 ? save.customers[(idx + 1) % save.customers.length] : null;

  return (
    <section className={`quick-serve qs-${placement}`} aria-label={`Atender ${a.label}`}>
      <div className="qs-head">
        <PotionIcon recipeId={wanted.id} size={24} />
        <div className="qs-who">
          <span className="qs-name"><span className="qs-face" aria-label="Humor">{left > 0.5 ? '🙂' : left > 0.25 ? '😐' : '😠'}</span> {a.label} <span className="muted">quer</span> {wanted.shortName}</span>
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
              className={`btn btn-primary qs-main qs-${verdict}`}
              onClick={() => dispatch({ type: 'SERVE_CUSTOMER', customerId: c.id, recipeId: offerId })}
            >
              <PotionIcon recipeId={offerId} size={18} />
              <span>Vender {RECIPES_BY_ID[offerId].shortName}</span>
              <span className="qs-price"><CoinIcon size={14} /> {getPrice(save, offerId)}</span>
            </button>
            <span className={`qs-verdict qs-v-${verdict}`}>{offerId !== c.wantedRecipeId ? 'parecida · ' : ''}{VERDICT_LABEL[verdict!]}</span>
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
