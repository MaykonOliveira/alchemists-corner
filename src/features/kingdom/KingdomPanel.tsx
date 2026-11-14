import mapUrl from '../../assets/sprites/kingdom-map.png';
import { BRANCH_SIZES, CITIES, MANAGER_LEVEL, SHIP_PRICE, type City } from '../../domain/data/kingdom';
import { STAFF_ROLES } from '../../domain/data/staff';
import type { GameSave } from '../../domain/models/types';
import { branchCost, branchIncome, canManage, KINGDOM_LEVEL, shipmentPlan } from '../../domain/rules/kingdom';
import { staffLevel } from '../../domain/rules/evoCore';
import { staffName } from '../../domain/rules/staff';
import { useGameStore } from '../../store/gameStore';
import { SpriteIcon } from '../../ui/SpriteIcon';
import { Coins, PotionName } from '../../ui/widgets';
import { Icon } from '../../ui/Icon';

import { tr } from '../../i18n';

const MAP_W = 192;
const MAP_H = 108;

/** Mapa do reino em pixel art, com o marcador de cada cidade (fechada, barraca, loja ou empório). */
function KingdomMap({ save }: { save: GameSave }) {
  return (
    <div className="kingdom-map" style={{ aspectRatio: `${MAP_W} / ${MAP_H}` }}>
      <img src={mapUrl} alt={tr('Mapa do reino com as cinco cidades')} />
      <span className="kingdom-home" style={{ left: `${(96 / MAP_W) * 100}%`, top: `${(80 / MAP_H) * 100}%` }} title={save.shopName}>
        <SpriteIcon name="city-home" size={16} />
      </span>
      {CITIES.map((c) => {
        const b = save.evo.branches[c.id];
        const locked = save.level < c.minLevel;
        return (
          <span key={c.id} className={`kingdom-pin ${b ? 'kingdom-pin-open' : ''} ${locked ? 'kingdom-pin-locked' : ''}`}
            style={{ left: `${(c.x / MAP_W) * 100}%`, top: `${(c.y / MAP_H) * 100}%` }} title={c.name}>
            <SpriteIcon name={`city-${b ? b.size : 0}`} size={16} muted={locked} />
            <span className="kingdom-pin-label">{c.name}</span>
          </span>
        );
      })}
    </div>
  );
}

function CityCard({ save, city }: { save: GameSave; city: City }) {
  const dispatch = useGameStore((s) => s.dispatch);
  const b = save.evo.branches[city.id];
  const locked = save.level < city.minLevel;
  const nextCost = b ? (b.size < 3 ? branchCost(city.id, b.size + 1) : null) : branchCost(city.id, 1);
  const managers = STAFF_ROLES.filter((r) => canManage(save, r.id));
  const plan = b ? shipmentPlan(save, city.id) : [];
  return (
    <li className={`card city-card ${b ? 'city-open' : ''} ${locked ? 'card-locked' : ''}`}>
      <div className="card-head">
        <SpriteIcon name={`city-${b ? b.size : 0}`} size={32} muted={locked} />
        <span className="row-title">{city.name}</span>
        {b ? <span className="tag tag-gold">{BRANCH_SIZES[b.size - 1]}</span> : locked ? <span className="tag">{tr('nível ')}{city.minLevel}</span> : null}
      </div>
      <p className="card-text small">{city.text}</p>
      <p className="small">{tr('Pede: ')}{city.favorites.map((id, i) => <span key={id}>{i > 0 && ', '}<PotionName id={id} /></span>)}</p>
      {b && (
        <>
          <p className="small"><Icon e="🪙" /> {tr('Lucro por dia: {0} + remessa (paga {1}% acima da etiqueta).', branchIncome(save, city.id), Math.round((SHIP_PRICE - 1) * 100))}</p>
          <p className="small muted">{plan.length ? tr('Remessa de hoje: {0} poções.', plan.reduce((n, p) => n + p.qty, 0)) : tr('Sem poções favoritas na prateleira para a remessa de hoje.')} {tr('Já rendeu {0} moedas.', Math.round(b.earned))}</p>
          <label className="small city-manager">
            {tr('Supervisor: ')}
            <select id={`manager-${city.id}`} value={b.manager ?? ''} onChange={(e) => dispatch({ type: 'SET_MANAGER', cityId: city.id, staffId: e.target.value || null })}>
              <option value="">{tr('ninguém')}</option>
              {managers.map((r) => <option key={r.id} value={r.id}>{staffName(save, r.id)} ({tr('Nv')} {staffLevel(save, r.id)})</option>)}
            </select>
          </label>
          {!managers.length && <p className="small muted">{tr('Funcionários de nível {0} ou mais podem supervisionar (veja a Equipe).', MANAGER_LEVEL)}</p>}
        </>
      )}
      <div className="card-foot">
        {nextCost !== null && <Coins n={nextCost} />}
        {locked ? null : !b ? (
          <button className="btn btn-small btn-primary" disabled={save.coins < nextCost!} onClick={() => dispatch({ type: 'OPEN_BRANCH', cityId: city.id })}>
            {save.coins >= nextCost! ? tr('Abrir barraca') : tr('Faltam {0}', nextCost! - save.coins)}
          </button>
        ) : nextCost !== null ? (
          <button className="btn btn-small btn-primary" disabled={save.coins < nextCost} onClick={() => dispatch({ type: 'GROW_BRANCH', cityId: city.id })}>
            {save.coins >= nextCost ? tr('Virar {0}', BRANCH_SIZES[b.size].toLowerCase()) : tr('Faltam {0}', nextCost - save.coins)}
          </button>
        ) : <span className="tag tag-ok">{tr('empório completo ✓')}</span>}
      </div>
    </li>
  );
}

/** Filiais pelo reino (pacote E3). */
export function KingdomPanel({ save }: { save: GameSave }) {
  const open = Object.keys(save.evo.branches).length;
  const income = CITIES.reduce((n, c) => n + branchIncome(save, c.id), 0);
  return (
    <>
      <KingdomMap save={save} />
      <div className="card kingdom-summary">
        <p className="small">
          {open === 0
            ? tr('A fama da sua loja chegou longe. Abra filiais nas cidades do reino: cada uma paga um lucro por dia, compra as poções favoritas da cidade e manda cristais toda semana.')
            : tr('{0} de {1} filiais abertas · {2} moedas por dia, mais as remessas.', open, CITIES.length, income)}
        </p>
        {save.level < KINGDOM_LEVEL && <p className="small muted">{tr('As primeiras cidades abrem no nível {0}.', KINGDOM_LEVEL)}</p>}
        {open === CITIES.length && <p className="small"><Icon e="👑" /> {tr('Rede do Reino completa: o letreiro da loja ficou dourado.')}</p>}
      </div>
      <ul className="list">
        {CITIES.map((c) => <CityCard key={c.id} save={save} city={c} />)}
      </ul>
    </>
  );
}
