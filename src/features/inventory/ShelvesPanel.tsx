import { RECIPES_BY_ID } from '../../domain/data/recipes';
import type { GameSave } from '../../domain/models/types';
import { countPotions, getPrice, potionCapacity, potionStock, priceRange, recipeCost, shelfPerRecipe } from '../../domain/rules/economy';
import { potionsPerBatch } from '../../domain/rules/alchemy';
import { masteryStars } from '../../domain/rules/mastery';
import { Stars } from '../../ui/Stars';
import { useGameStore } from '../../store/gameStore';
import { Meter, PotionName, More } from '../../ui/widgets';
import { stackQualities } from '../../domain/rules/quality';
import { Icon } from '../../ui/Icon';

function priceLabel(price: number, base: number) {
  const r = price / base;
  if (r <= 0.9) return { text: 'barato · vende fácil', tone: 'tag-ok' };
  if (r <= 1.05) return { text: 'preço justo', tone: '' };
  if (r <= 1.18) return { text: 'salgado', tone: 'tag-gold' };
  return { text: 'caro · muitos recusam', tone: 'tag-warn' };
}

export function ShelvesPanel({ save }: { save: GameSave }) {
  const dispatch = useGameStore((s) => s.dispatch);
  const total = countPotions(save);
  const cap = potionCapacity(save);
  return (
    <>
      <div className="capacity">
        <span>Prateleiras: {total}/{cap} poções · até {shelfPerRecipe(save)} de cada</span>
        <Meter ratio={total / cap} tone={total / cap > 0.85 ? 'warn' : 'ok'} label="Ocupação das prateleiras" />
      </div>
      <More label="Como o preço funciona"><p className="card-text small">Mais caro rende mais, mas clientes com pouco dinheiro recusam.</p></More>
      <ul className="list">
        {save.knownRecipes.map((id) => {
          const stock = potionStock(save, id);
          const stack = save.potions.find((p) => p.recipeId === id);
          const { min, max, base } = priceRange(save, id);
          const price = getPrice(save, id);
          const label = priceLabel(price, base);
          const unitCost = Math.round(recipeCost(save, id) / potionsPerBatch(save));
          return (
            <li key={id} className={`card ${stock === 0 ? 'card-empty' : ''}`}>
              <div className="card-head">
                <PotionName id={id} size={18} />
                {save.trend?.includes(id) && <span className="trend-tag" title="Procurada hoje">em alta</span>}
                <Stars n={masteryStars(save, id)} />
                <span className={`qty ${stock === 0 ? 'qty-low' : ''}`}>{stock}</span>
              </div>
              {stack && (stack.prime || stack.fine) ? (
                <p className="quality-line small">
                  {stackQualities(stack).prime > 0 && <span className="q-3"><Icon e="✨" /> {stackQualities(stack).prime} Primorosas (+50%)</span>}
                  {stackQualities(stack).fine > 0 && <span className="q-2">★ {stackQualities(stack).fine} Finas (+20%)</span>}
                </p>
              ) : null}
              <div className="price-row">
                <input
                  type="range"
                  min={min}
                  max={max}
                  value={price}
                  aria-label={`Preço de ${RECIPES_BY_ID[id].name}`}
                  onChange={(e) => dispatch({ type: 'SET_PRICE', recipeId: id, price: Number(e.target.value) })}
                />
                <span className="price-value">{price}</span>
              </div>
              <div className="card-foot small">
                <span className={`tag ${label.tone}`}>{label.text}</span>
                <span className="muted">base {base} · custo ≈ {unitCost}</span>
              </div>
              {stack && (
                <label className="toggle small">
                  <input type="checkbox" checked={stack.forSale} onChange={(e) => dispatch({ type: 'SET_FOR_SALE', recipeId: id, forSale: e.target.checked })} />
                  Expor à venda
                </label>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
