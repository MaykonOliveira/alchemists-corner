import { INGREDIENTS } from '../../domain/data/ingredients';
import { RECIPES_BY_ID } from '../../domain/data/recipes';
import { UPGRADES } from '../../domain/data/upgrades';
import { NOBLE_LEVEL } from '../../domain/data/customers';
import { DAY_EVENTS } from '../../domain/data/orders';
import { MAX_LEVEL, SEAL_LEVEL } from '../../domain/rules/progression';
import { useGameStore } from '../../store/gameStore';
import { PotionName } from '../../ui/widgets';
import { Icon } from '../../ui/Icon';

/** Telas que aparecem na barra ao chegar no nível (as mesmas regras de nav.ts). */
const AREA_UNLOCKS = [
  { level: 2, label: 'Melhorias', where: 'em Progresso' },
  { level: 3, label: 'Rua', where: 'em Mundo' },
  { level: 8, label: 'Grimório', where: 'em Progresso' },
];

export function LevelUpModal() {
  const ui = useGameStore((s) => s.ui);
  const dispatch = useGameStore((s) => s.dispatch);
  if (ui.modal !== 'levelup' || !ui.levelUp) return null;
  const { level, recipes } = ui.levelUp;
  const ups = UPGRADES.filter((u) => u.requiredLevel === level);
  const ings = INGREDIENTS.filter((i) => i.supplierLevel === level);
  const events = Object.values(DAY_EVENTS).filter((e) => e.minLevel === level);
  const extras: string[] = [];
  if (level === NOBLE_LEVEL) extras.push('A nobreza descobriu a loja: clientes nobres pagam caro pelas melhores poções.');
  for (const e of events) extras.push(`Novo evento na cidade: ${e.name}.`);
  if (level === 10) extras.push('Clientes ilustres (a Corte, o Observatório) começam a fazer encomendas mais generosas.');
  if (level >= SEAL_LEVEL) extras.push('Você ganhou 1 Selo de Mestre! Gaste no Grimório (Progresso › Grimório).');
  if (level === MAX_LEVEL) extras.push('Nível máximo! Daqui em diante cada 3000 XP é um grau de Mestre e mais 1 Selo.');
  // Duas novidades em destaque; o resto fica guardado num "e mais", para não virar uma lista de sete itens.
  const areas = AREA_UNLOCKS.filter((a) => a.level === level);
  const all: { key: string; node: React.ReactNode }[] = [
    ...recipes.map((id) => ({ key: id, node: <>Nova pista: <PotionName id={id} /> <span className="muted small">(descubra a mistura na bancada)</span></> })),
    ...areas.map((a) => ({ key: a.label, node: <>Nova área: <strong>{a.label}</strong> ({a.where})</> })),
    ...extras.map((t) => ({ key: t, node: <>{t}</> })),
    ...ups.map((u) => ({ key: u.id, node: <>Melhoria disponível: <strong>{u.name}</strong></> })),
    ...ings.map((i) => ({ key: i.id, node: <>O fornecedor agora traz <strong>{i.name}</strong></> })),
  ];
  const top = all.slice(0, 2);
  const rest = all.slice(2);
  return (
    <div className="modal-backdrop">
      <div className="modal modal-levelup" role="dialog" aria-modal="true" aria-labelledby="lvl-title">
        <div className="burst" aria-hidden />
        <p className="modal-kicker">A loja cresceu!</p>
        <h2 id="lvl-title">Nível {level}</h2>
        <ul className="unlocks">
          {top.map((n) => <li key={n.key}>{n.node}</li>)}
          {all.length === 0 && <li>Clientes confiam mais em você e pedidos maiores chegam.</li>}
        </ul>
        {rest.length > 0 && (
          <details className="unlocks-more">
            <summary>E mais {rest.length} novidade{rest.length > 1 ? 's' : ''}</summary>
            <ul className="unlocks">{rest.map((n) => <li key={n.key}>{n.node}</li>)}</ul>
          </details>
        )}
        {ui.levelUp.gift && (
          <p className="level-gift"><Icon e="🎁" /> Presente do nível: +{ui.levelUp.gift.coins} moedas
            {ui.levelUp.gift.crystals > 0 && `, +${ui.levelUp.gift.crystals} Cristais de luar`}
            {ui.levelUp.gift.items.length > 0 && `, ${ui.levelUp.gift.items.map((i) => `${i.qty}× ${INGREDIENTS.find((x) => x.id === i.ingredientId)?.name}`).join(', ')}`}</p>
        )}
        {recipes.length > 0 && <p className="card-text small muted">{RECIPES_BY_ID[recipes[0]].need}: novos clientes vão procurar por isso.</p>}
        <button className="btn btn-primary btn-big" autoFocus onClick={() => dispatch({ type: 'OPEN_MODAL', modal: null })}>Que maravilha!</button>
      </div>
    </div>
  );
}
