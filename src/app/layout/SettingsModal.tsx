import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { SaveTransferDialog } from './SaveTransferDialog';

export function SettingsModal() {
  const modal = useGameStore((s) => s.ui.modal);
  const settings = useGameStore((s) => s.save?.settings);
  const dispatch = useGameStore((s) => s.dispatch);
  const backToMenu = useGameStore((s) => s.backToMenu);
  const [exporting, setExporting] = useState(false);
  if (modal !== 'settings' || !settings) return null;
  const set = (patch: Partial<typeof settings>) => dispatch({ type: 'SET_SETTINGS', settings: patch });
  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && dispatch({ type: 'OPEN_MODAL', modal: null })}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <h2 id="settings-title">Configurações</h2>
        <p className="muted small">O jogo fica pausado enquanto esta janela está aberta.</p>
        <label className="field">
          Volume
          <input type="range" min={0} max={1} step={0.05} value={settings.volume} onChange={(e) => set({ volume: Number(e.target.value) })} />
        </label>
        <label className="toggle"><input type="checkbox" checked={!settings.muted} onChange={(e) => set({ muted: !e.target.checked })} /> Efeitos sonoros</label>
        <label className="toggle"><input type="checkbox" checked={settings.music} onChange={(e) => set({ music: e.target.checked })} /> Música ambiente</label>
        <label className="toggle"><input type="checkbox" checked={settings.reduceMotion} onChange={(e) => set({ reduceMotion: e.target.checked })} /> Reduzir animações e brilhos</label>
        <div className="btn-row">
          <button className="btn" onClick={() => { dispatch({ type: 'SET_TUTORIAL', step: 0 }); dispatch({ type: 'OPEN_MODAL', modal: null }); }}>Rever tutorial</button>
          <button className="btn" onClick={() => setExporting(true)}>Levar a partida</button>
          <button className="btn" onClick={backToMenu}>Menu principal</button>
        </div>
        {exporting && <SaveTransferDialog mode="export" onClose={() => setExporting(false)} />}
        <p className="muted small">Atalhos: 1–8 abrem os painéis, Esc fecha, espaço pausa.</p>
        <button className="btn btn-primary" autoFocus onClick={() => dispatch({ type: 'OPEN_MODAL', modal: null })}>Voltar ao jogo</button>
      </div>
    </div>
  );
}
