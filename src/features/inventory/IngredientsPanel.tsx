import { FAMILY_LABEL, INGREDIENTS } from '../../domain/data/ingredients';
import type { GameSave } from '../../domain/models/types';
import { LeafIcon } from '../../ui/icons';

const LOW_STOCK = 2;

export function IngredientsPanel({ save }: { save: GameSave }) {
  const families = Object.keys(FAMILY_LABEL) as (keyof typeof FAMILY_LABEL)[];
  return (
    <>
      <p className="panel-lead">O que sobrou do antigo dono. A compra com o fornecedor chega na próxima fase.</p>
      {families.map((fam) => (
        <section key={fam} className="group">
          <h3>{FAMILY_LABEL[fam]}</h3>
          <ul className="list">
            {INGREDIENTS.filter((i) => i.family === fam).map((ing) => {
              const qty = save.ingredients[ing.id] ?? 0;
              return (
                <li key={ing.id} className="row">
                  <LeafIcon color={ing.color} size={18} />
                  <div className="row-main">
                    <span className="row-title">{ing.name}</span>
                    <span className="row-sub">{ing.price} moedas cada</span>
                  </div>
                  <span className={`qty ${qty <= LOW_STOCK ? 'qty-low' : ''}`}>
                    {qty}
                    {qty === 0 ? <span className="tag tag-warn">sem estoque</span> : qty <= LOW_STOCK ? <span className="tag tag-warn">baixo</span> : null}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </>
  );
}
