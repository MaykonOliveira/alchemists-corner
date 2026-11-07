import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';

export function MenuScreen() {
  const { hasStoredSave, storageError, newGame, continueGame } = useGameStore();
  const [confirming, setConfirming] = useState(false);

  return (
    <main className="menu">
      <div className="menu-card">
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
      </div>
      <p className="menu-foot">Versão 0.7 · Expansões da loja e contratos de vários dias</p>
    </main>
  );
}
