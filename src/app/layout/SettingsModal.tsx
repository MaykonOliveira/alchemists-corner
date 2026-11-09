import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { SaveTransferDialog } from './SaveTransferDialog';
import { nowPlaying } from '../../audio/sound';
import { AWNINGS } from '../../domain/data/catalog';
import { askReminderPermission, remindersSupported } from '../reminders';
import { FunnelStats } from './FunnelStats';
import { PrivacyDialog } from './PrivacyDialog';
import { Icon } from '../../ui/Icon';

function Slider({ label, icon, value, onChange, disabled, toggle }: {
  label: string; icon: string; value: number; onChange: (v: number) => void; disabled?: boolean;
  toggle?: { on: boolean; set: (on: boolean) => void };
}) {
  return (
    <div className={`mixer-row ${disabled ? 'mixer-off' : ''}`}>
      {toggle ? (
        <label className="mixer-name"><input type="checkbox" checked={toggle.on} onChange={(e) => toggle.set(e.target.checked)} /> <Icon e={icon} /> {label}</label>
      ) : (
        <span className="mixer-name"><Icon e={icon} /> {label}</span>
      )}
      <input type="range" min={0} max={1} step={0.05} value={value} disabled={disabled} aria-label={`Volume: ${label}`}
        onChange={(e) => onChange(Number(e.target.value))} />
      <span className="mixer-val">{Math.round(value * 100)}</span>
    </div>
  );
}

/** Nome e toldo da loja (montado ao abrir a janela, para começar com o nome atual). */
function ShopForm() {
  const dispatch = useGameStore((s) => s.dispatch);
  const shopName = useGameStore((s) => s.save?.shopName ?? '');
  const awning = useGameStore((s) => s.save?.awning ?? '');
  const [name, setName] = useState(shopName);
  return (
    <div className="settings-shop">
      <label className="name-label" htmlFor="set-shop-name">Nome da loja</label>
      <div className="gift-row">
        <input id="set-shop-name" className="name-input" maxLength={28} value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn btn-small" disabled={!name.trim() || name.trim() === shopName} onClick={() => dispatch({ type: 'SET_SHOP', name, awning })}>Salvar</button>
      </div>
      <div className="awning-swatches" role="radiogroup" aria-label="Cor do toldo">
        {AWNINGS.map((a) => (
          <button type="button" key={a.id} role="radio" aria-checked={awning === a.id} aria-label={a.name} title={a.name}
            className={`swatch swatch-sm ${awning === a.id ? 'on' : ''}`} style={{ background: a.color }} onClick={() => dispatch({ type: 'SET_SHOP', name: shopName, awning: a.id })} />
        ))}
      </div>
    </div>
  );
}

export function SettingsModal() {
  const modal = useGameStore((s) => s.ui.modal);
  const settings = useGameStore((s) => s.save?.settings);
  const dispatch = useGameStore((s) => s.dispatch);
  const backToMenu = useGameStore((s) => s.backToMenu);
  const [exporting, setExporting] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const playing = nowPlaying();
  const canVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator;
  if (modal !== 'settings' || !settings) return null;
  const set = (patch: Partial<typeof settings>) => dispatch({ type: 'SET_SETTINGS', settings: patch });
  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && dispatch({ type: 'OPEN_MODAL', modal: null })}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <h2 id="settings-title">Configurações</h2>
        <p className="muted small">O jogo fica pausado enquanto esta janela está aberta.</p>
        <div className="mixer" role="group" aria-label="Mixer de som">
          <Slider label="Geral" icon="🔊" value={settings.volume} onChange={(v) => set({ volume: v })} />
          <Slider label="Música" icon="🎵" value={settings.musicVolume} disabled={!settings.music} onChange={(v) => set({ musicVolume: v })}
            toggle={{ on: settings.music, set: (on) => set({ music: on }) }} />
          <Slider label="Efeitos" icon="✨" value={settings.sfxVolume} disabled={settings.muted} onChange={(v) => set({ sfxVolume: v })}
            toggle={{ on: !settings.muted, set: (on) => set({ muted: !on }) }} />
          <Slider label="Ambiente" icon="🌧️" value={settings.ambienceVolume} onChange={(v) => set({ ambienceVolume: v })} />
        </div>
        {playing && settings.music && <p className="muted small now-playing">♪ Tocando agora: {playing}</p>}
        {canVibrate && (
          <label className="toggle"><input type="checkbox" checked={settings.vibration} onChange={(e) => set({ vibration: e.target.checked })} /> Vibrar em vendas, níveis e conquistas</label>
        )}
        <ShopForm />
        {remindersSupported() && (
          <label className="toggle"><input type="checkbox" checked={settings.reminders} onChange={async (e) => {
            const on = e.target.checked;
            if (on && !(await askReminderPermission())) return;
            set({ reminders: on });
          }} /> Lembretes (caldeirão pronto), no máximo 1 por dia</label>
        )}
        <label className="toggle"><input type="checkbox" checked={settings.reduceMotion} onChange={(e) => set({ reduceMotion: e.target.checked })} /> Reduzir animações e brilhos</label>
        <div className="btn-row">
          <button className="btn" onClick={() => { dispatch({ type: 'SET_TUTORIAL', step: 0 }); dispatch({ type: 'OPEN_MODAL', modal: null }); }}>Rever tutorial</button>
          <button className="btn" onClick={() => setExporting(true)}>Levar a partida</button>
          <button className="btn" onClick={backToMenu}>Menu principal</button>
        </div>
        {exporting && <SaveTransferDialog mode="export" onClose={() => setExporting(false)} />}
        <div className="btn-row">
          <button className="btn" onClick={() => dispatch({ type: 'OPEN_MODAL', modal: 'share' })}><Icon e="📸" /> Mostrar a loja</button>
        </div>
        <div className="settings-links">
          <FunnelStats />
          <button className="link-btn" onClick={() => setPrivacy(true)}>Privacidade e termos</button>
        </div>
        {privacy && <PrivacyDialog onClose={() => setPrivacy(false)} />}
        <p className="muted small">Atalhos: 1–9, 0, R e M abrem os painéis, Esc fecha, espaço pausa.</p>
        <button className="btn btn-primary" autoFocus onClick={() => dispatch({ type: 'OPEN_MODAL', modal: null })}>Voltar ao jogo</button>
      </div>
    </div>
  );
}
