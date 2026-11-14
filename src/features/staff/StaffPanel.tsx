import { useState } from 'react';
import { STAFF_MAX_LEVEL, STAFF_ROLES, type StaffRole } from '../../domain/data/staff';
import { UPGRADES_BY_ID } from '../../domain/data/upgrades';
import type { FairyStrategy, GameSave } from '../../domain/models/types';
import { helperWage, helperWages } from '../../domain/rules/economy';
import { pendingPerks, perkCount, staffLevel, staffTier } from '../../domain/rules/evoCore';
import { helperActive } from '../../domain/rules/helpers';
import { courseCost, FAIRY, needsCourse, staffName, staffProgress } from '../../domain/rules/staff';
import { useGameStore } from '../../store/gameStore';
import { SpriteIcon } from '../../ui/SpriteIcon';
import { Coins, Meter } from '../../ui/widgets';
import { Icon } from '../../ui/Icon';

import { tr } from '../../i18n';

const TIER_LABEL = ['', tr('bronze'), tr('prata'), tr('ouro')];

const STRATEGIES: { id: FairyStrategy; name: string; text: string }[] = [
  { id: 'volume', name: tr('Vender muito'), text: tr('Preço um pouco abaixo da base: mais gente compra.') },
  { id: 'lucro', name: tr('Lucro alto'), text: tr('Preço alto quando a rua procura, mais baixo quando sobra na prateleira.') },
  { id: 'fama', name: tr('Fama na vila'), text: tr('Preço-base sempre: a reputação cresce mais.') },
];

/** Insígnia do uniforme (bronze, prata, ouro) que aparece também sobre o funcionário na loja. */
function Badge({ tier }: { tier: number }) {
  if (!tier) return null;
  return <span className={`staff-badge staff-badge-${tier}`} title={tr('Insígnia de {0}', TIER_LABEL[tier])}>{'★'.repeat(tier)}</span>;
}

function PerkChoice({ role, onPick }: { role: StaffRole; onPick: (side: 'a' | 'b') => void }) {
  return (
    <div className="perk-choice" role="group" aria-label={tr('Escolha um caminho')}>
      <p className="perk-choice-title"><Icon e="✨" />{tr(' Novo nível! Escolha um caminho:')}</p>
      <div className="perk-options">
        {(['a', 'b'] as const).map((side) => (
          <button key={side} className={`perk-option perk-${side}`} onClick={() => onPick(side)}>
            <b>{role[side].name}</b>
            <span className="small">{role[side].text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StaffCard({ save, role }: { save: GameSave; role: StaffRole }) {
  const dispatch = useGameStore((s) => s.dispatch);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(save.evo.staff[role.id]?.name ?? '');
  const level = staffLevel(save, role.id);
  const tier = staffTier(save, role.id);
  const prog = staffProgress(save, role.id);
  const course = courseCost(save, role.id);
  const blocked = needsCourse(save, role.id);
  const pending = pendingPerks(save, role.id);
  const perks = save.evo.staff[role.id]?.perks ?? [];
  const on = helperActive(save, role.id);
  const up = UPGRADES_BY_ID[role.id];
  const save_ = () => { dispatch({ type: 'RENAME_STAFF', staffId: role.id, name }); setEditing(false); };
  return (
    <li className={`card staff-card ${pending ? 'staff-card-pending' : ''} staff-tier-${tier}`}>
      <div className="card-head">
        <span className="staff-portrait"><SpriteIcon name={`helper-${role.id}`} size={32} muted={!on} /></span>
        <span className="staff-id">
          {editing ? (
            <form className="staff-rename" onSubmit={(e) => { e.preventDefault(); save_(); }}>
              <input id={`staff-name-${role.id}`} value={name} maxLength={16} placeholder={role.role} onChange={(e) => setName(e.target.value)} aria-label={tr('Nome do funcionário')} autoFocus />
              <button className="btn btn-small btn-primary" type="submit">{tr('Salvar')}</button>
            </form>
          ) : (
            <span className="row-title">
              {staffName(save, role.id)} <Badge tier={tier} />
              <button className="link-btn small" onClick={() => setEditing(true)} aria-label={tr('Dar nome')}>{tr('dar nome')}</button>
            </span>
          )}
          <span className="muted small">{up?.name}{!on ? ` · ${tr('descansando')}` : ''}</span>
        </span>
        <span className="staff-level" aria-label={tr('Nível {0}', level)}>{tr('Nv')} <b>{level}</b></span>
      </div>
      <Meter ratio={level >= STAFF_MAX_LEVEL ? 1 : blocked ? 1 : prog.frac} tone={blocked ? 'warn' : 'ok'} label={tr('Experiência')} />
      <p className="small muted">
        {level >= STAFF_MAX_LEVEL ? tr('Nível máximo. Uma lenda da loja!')
          : blocked ? tr('Pronto para o nível {0}: falta o curso na Guilda.', level + 1)
          : tr('Faltam {0} de experiência para o nível {1} (ganha com {2} e com cada dia trabalhado).', prog.left, level + 1, role.work)}
      </p>
      {pending > 0 && <PerkChoice role={role} onPick={(side) => dispatch({ type: 'CHOOSE_PERK', staffId: role.id, side })} />}
      {perks.length > 0 && (
        <p className="staff-perks small">
          {perks.map((p, i) => <span key={i} className={`tag tag-perk tag-perk-${p}`}>{role[p].name}</span>)}
        </p>
      )}
      {role.id === FAIRY && (
        <div className="fairy-strategy">
          <p className="small"><b>{tr('Estratégia de preços')}</b></p>
          <div className="decor-tabs" role="radiogroup" aria-label={tr('Estratégia de preços')}>
            {STRATEGIES.map((st) => (
              <button key={st.id} role="radio" aria-checked={save.evo.fairy.strategy === st.id} className={`chip ${save.evo.fairy.strategy === st.id ? 'chip-on' : ''}`}
                onClick={() => dispatch({ type: 'SET_STRATEGY', strategy: st.id })}>{st.name}</button>
            ))}
          </div>
          <p className="small muted">{STRATEGIES.find((st) => st.id === save.evo.fairy.strategy)?.text} {tr('Preços travados: {0}.', save.evo.fairy.locked.length)}</p>
        </div>
      )}
      <div className="card-foot">
        <span className="muted small">{tr('Salário: {0} por dia', Math.round(helperWage(save, role.id)))}</span>
        {course !== null && level < STAFF_MAX_LEVEL && (
          <button className={`btn btn-small ${blocked ? 'btn-primary' : ''}`} disabled={save.coins < course}
            onClick={() => dispatch({ type: 'BUY_COURSE', staffId: role.id })} title={tr('Libera o nível {0}', (save.evo.staff[role.id]?.cap ?? 5) + 1)}>
            <Icon e="🎓" /> {tr('Curso')} <Coins n={course} />
          </button>
        )}
      </div>
      {perkCount(save, role.id, 'a') + perkCount(save, role.id, 'b') === 0 && level < 3 && (
        <p className="small muted">{tr('No nível 3 você escolhe: {0} ou {1}.', role.a.name, role.b.name)}</p>
      )}
    </li>
  );
}

/** Equipe (pacote E1): carreira de cada funcionário contratado. */
export function StaffPanel({ save }: { save: GameSave }) {
  const dispatch = useGameStore((s) => s.dispatch);
  const hired = STAFF_ROLES.filter((r) => save.upgrades.includes(r.id));
  const last = save.reports[save.reports.length - 1];
  const best = last?.staffOfDay;
  if (!hired.length) {
    return (
      <div className="card empty-state">
        <p className="row-title"><Icon e="🧙" />{tr(' Ninguém na equipe ainda')}</p>
        <p className="card-text small">{tr('Contrate ajudantes em Melhorias. Cada um ganha experiência trabalhando, sobe de nível e, nos níveis 3, 6 e 9, você escolhe o caminho dele.')}</p>
        <button className="btn btn-small btn-primary" onClick={() => dispatch({ type: 'OPEN_PANEL', panel: 'upgrades' })}>{tr('Ver ajudantes')}</button>
      </div>
    );
  }
  const pending = hired.filter((r) => pendingPerks(save, r.id) > 0).length;
  // Quem tem escolha de caminho esperando aparece primeiro.
  const order = [...hired].sort((a, b) => Number(pendingPerks(save, b.id) > 0) - Number(pendingPerks(save, a.id) > 0));
  return (
    <>
      <div className="card staff-summary">
        <p className="small">
          {tr('{0} na equipe · salários de {1} por dia', hired.length, helperWages(save))}
          {pending > 0 && <> · <b className="text-warn">{pending === 1 ? tr('1 escolha de caminho esperando') : tr('{0} escolhas de caminho esperando', pending)}</b></>}
        </p>
        {best && <p className="small"><Icon e="🏅" /> {tr('Funcionário de ontem: {0}', staffName(save, best.id))}</p>}
      </div>
      <ul className="list staff-list">
        {order.map((r) => <StaffCard key={r.id} save={save} role={r} />)}
      </ul>
    </>
  );
}
