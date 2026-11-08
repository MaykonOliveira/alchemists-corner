import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { PotionIcon } from '../../ui/SpriteIcon';
import { SaveTransferDialog } from '../layout/SaveTransferDialog';
import { useInstallPrompt } from '../pwa';
import { PrivacyDialog } from '../layout/PrivacyDialog';

const TITLE_POTIONS = ['cura-simples', 'tonico-energia', 'elixir-concentracao', 'pocao-sorte', 'elixir-estelar', 'elixir-fenix'];

export function MenuScreen() {
  const { hasStoredSave, storageError, newGame, continueGame } = useGameStore();
  const [confirming, setConfirming] = useState(false);
  const [dialog, setDialog] = useState<'import' | 'export' | null>(null);
  const [credits, setCredits] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const install = useInstallPrompt();

  return (
    <main className="menu">
      <div className="menu-card">
        <div className="menu-potions" aria-hidden="true">
          {TITLE_POTIONS.map((id, i) => (
            <span key={id} className="menu-potion" style={{ animationDelay: `${i * -0.45}s` }}>
              <PotionIcon recipeId={id} size={32} />
            </span>
          ))}
        </div>
        <p className="menu-kicker">Uma pequena loja de alquimia</p>
        <h1 className="menu-title">Alchemist's Corner</h1>
        <p className="menu-text">
          Você herdou uma loja modesta numa rua comercial da cidade. Equipamentos básicos, algumas moedas e um livro
          de receitas incompleto. O resto é com você.
        </p>
        {storageError && <p className="alert" role="alert">{storageError}</p>}
        <div className="menu-actions">
          {hasStoredSave && !confirming && (
            <button className="btn btn-primary" onClick={continueGame} autoFocus>Continuar</button>
          )}
          {!confirming ? (
            <button className={`btn ${hasStoredSave ? '' : 'btn-primary'}`} onClick={() => (hasStoredSave ? setConfirming(true) : newGame())} autoFocus={!hasStoredSave}>
              Nova partida
            </button>
          ) : (
            <div className="confirm" role="alertdialog" aria-label="Confirmar nova partida">
              <p>Começar do zero apaga a partida salva neste navegador.</p>
              <button className="btn btn-danger" onClick={newGame}>Começar do zero</button>
              <button className="btn" onClick={() => setConfirming(false)} autoFocus>Voltar</button>
            </div>
          )}
        </div>
        {!confirming && (
          <div className="menu-links">
            <button className="link-btn" onClick={() => setDialog('import')}>Importar save</button>
            {hasStoredSave && <button className="link-btn" onClick={() => setDialog('export')}>Exportar save</button>}
            {install && <button className="link-btn" onClick={install}>Instalar como app</button>}
            <button className="link-btn" onClick={() => setCredits((c) => !c)}>Créditos</button>
            <button className="link-btn" onClick={() => setPrivacy(true)}>Privacidade</button>
          </div>
        )}
        {credits && (
          <p className="menu-credits">
            Ideia e direção: Maykon Oliveira. Código, pixel art e sons sintetizados feitos com Claude.
            Fonte Pixelify Sans (SIL Open Font License).
          </p>
        )}
      </div>
      <p className="menu-foot">Versão 1.0 · Dê nome à sua loja, decore, volte amanhã e mostre para os amigos</p>
      {privacy && <PrivacyDialog onClose={() => setPrivacy(false)} />}
      {dialog && <SaveTransferDialog mode={dialog} onClose={() => setDialog(null)} />}
    </main>
  );
}
