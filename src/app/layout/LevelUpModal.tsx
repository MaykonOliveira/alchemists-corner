import { INGREDIENTS } from '../../domain/data/ingredients';
import { RECIPES_BY_ID } from '../../domain/data/recipes';
import { UPGRADES } from '../../domain/data/upgrades';
import { NOBLE_LEVEL } from '../../domain/data/customers';
import { DAY_EVENTS } from '../../domain/data/orders';
import { MAX_LEVEL, SEAL_LEVEL } from '../../domain/rules/progression';
import { useGameStore } from '../../store/gameStore';
import { PotionName } from '../../ui/widgets';
import { Icon } from '../../ui/Icon';

import { tr } from '../../i18n';
/** Telas que aparecem na barra ao chegar no nível (as mesmas regras de nav.ts). */
const AREA_UNLOCKS = [
  { level: 2, label: tr('Melhorias'), where: tr('em Progresso') },
  { level: 3, label: tr('Rua'), where: tr('em Mundo') },
  { level: 8, label: tr('Grimório'), where: tr('em Progresso') },
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
  if (level === NOBLE_LEVEL) extras.push(tr('A nobreza descobriu a loja: clientes nobres pagam caro pelas melhores poções.'));
  for (const e of events) extras.push(tr('Novo evento na cidade: {0}.', e.name));
  if (level === 10) extras.push(tr('Clientes ilustres (a Corte, o Observatório) começam a fazer encomendas mais generosas.'));
  if (level >= SEAL_LEVEL) extras.push(tr('Você ganhou 10 Cristais de luar! Gaste em talentos no Grimório ou em decoração.'));
  if (level === MAX_LEVEL) extras.push(tr('Nível máximo! Daqui em diante cada 3000 XP é um grau de Mestre e mais 10 Cristais de luar.'));
  // Duas novidades em destaque; o resto fica guardado num "e mais", para não virar uma lista de sete itens.
  const areas = AREA_UNLOCKS.filter((a) => a.level === level);
  const all: { key: string; node: React.ReactNode }[] = [
    ...recipes.map((id) => ({ key: id, node: <>{tr('Nova pista: ')}<PotionName id={id} /> <span className="muted small">{tr('(descubra a mistura na bancada)')}</span></> })),
    ...areas.map((a) => ({ key: a.label, node: <>{tr('Nova área: ')}<strong>{a.label}</strong> ({a.where})</> })),
    ...extras.map((t) => ({ key: t, node: <>{t}</> })),
    ...ups.map((u) => ({ key: u.id, node: <>{tr('Melhoria disponível: ')}<strong>{u.name}</strong></> })),
    ...ings.map((i) => ({ key: i.id, node: <>{tr('O fornecedor agora traz ')}<strong>{i.name}</strong></> })),
  ];
  const top = all.slice(0, 2);
  const rest = all.slice(2);
  return (
    <div className="modal-backdrop">
      <div className="modal modal-levelup" role="dialog" aria-modal="true" aria-labelledby="lvl-title">
        <div className="burst" aria-hidden />
        <p className="modal-kicker">{tr('A loja cresceu!')}</p>
        <h2 id="lvl-title">{tr('Nível ')}{level}</h2>
        <ul className="unlocks">
          {top.map((n) => <li key={n.key}>{n.node}</li>)}
          {all.length === 0 && <li>{tr('Clientes confiam mais em você e pedidos maiores chegam.')}</li>}
        </ul>
        {rest.length > 0 && (
          <details className="unlocks-more">
            <summary>{tr('E mais ')}{rest.length}{tr(' novidade')}{rest.length > 1 ? 's' : ''}</summary>
            <ul className="unlocks">{rest.map((n) => <li key={n.key}>{n.node}</li>)}</ul>
          </details>
        )}
        {ui.levelUp.gift && (
          <p className="level-gift"><Icon e="🎁" />{tr(' Presente do nível: +')}{ui.levelUp.gift.coins}{tr(' moedas')}{ui.levelUp.gift.crystals > 0 && tr(', +{0} Cristais de luar', ui.levelUp.gift.crystals)}
            {ui.levelUp.gift.items.length > 0 && `, ${ui.levelUp.gift.items.map((i) => `${i.qty}× ${INGREDIENTS.find((x) => x.id === i.ingredientId)?.name}`).join(', ')}`}</p>
        )}
        {recipes.length > 0 && <p className="card-text small muted">{RECIPES_BY_ID[recipes[0]].need}{tr(': novos clientes vão procurar por isso.')}</p>}
        <button className="btn btn-primary btn-big" autoFocus onClick={() => dispatch({ type: 'OPEN_MODAL', modal: null })}>{tr('Que maravilha!')}</button>
      </div>
    </div>
  );
}
