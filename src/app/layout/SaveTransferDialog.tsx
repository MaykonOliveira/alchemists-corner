import { useEffect, useRef, useState } from 'react';
import type { GameSave } from '../../domain/models/types';
import { describeSave, exportSaveCode, importSaveCode, SaveImportError, saveFileName } from '../../persistence/saveTransfer';
import { useGameStore } from '../../store/gameStore';

interface Props {
  mode: 'export' | 'import';
  onClose: () => void;
}

/** Janela para levar a partida para outro navegador ou aparelho, com código ou arquivo. */
export function SaveTransferDialog({ mode, onClose }: Props) {
  return (
    <div className="modal-backdrop modal-top" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal transfer" role="dialog" aria-modal="true" aria-labelledby="transfer-title">
        {mode === 'export' ? <ExportBody onClose={onClose} /> : <ImportBody onClose={onClose} />}
      </div>
    </div>
  );
}

function ExportBody({ onClose }: { onClose: () => void }) {
  const save = useGameStore((s) => s.exportableSave());
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (save) void exportSaveCode(save).then(setCode);
  }, [save]);

  if (!save) return <p>Não há partida salva para exportar.</p>;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      area.current?.select();
      document.execCommand?.('copy');
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };
  const download = () => {
    const blob = new Blob([JSON.stringify(save)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = saveFileName(save);
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  return (
    <>
      <h2 id="transfer-title">Levar a partida</h2>
      <p className="muted small">
        {describeSave(save)}. Copie o código e cole em <b>Importar save</b> no menu do jogo em outro navegador ou
        celular. O progresso daqui continua salvo.
      </p>
      <textarea ref={area} className="transfer-code" readOnly value={code || 'Gerando código…'} onFocus={(e) => e.target.select()} rows={4} />
      <div className="btn-row">
        <button className="btn btn-primary" onClick={copy} disabled={!code}>{copied ? 'Copiado!' : 'Copiar código'}</button>
        <button className="btn" onClick={download}>Baixar arquivo</button>
        <button className="btn" onClick={onClose}>Fechar</button>
      </div>
    </>
  );
}

function ImportBody({ onClose }: { onClose: () => void }) {
  const importSave = useGameStore((s) => s.importSave);
  const hasStoredSave = useGameStore((s) => s.hasStoredSave);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState<GameSave | null>(null);

  const check = async (input: string) => {
    setError(null);
    setReady(null);
    if (!input.trim()) return;
    try {
      setReady(await importSaveCode(input));
    } catch (err) {
      setError(err instanceof SaveImportError ? err.message : 'Não foi possível ler esse save.');
    }
  };
  const pickFile = async (file: File | undefined) => {
    if (!file) return;
    const content = await file.text();
    setText(content.length > 400 ? `Arquivo: ${file.name}` : content);
    await check(content);
  };

  return (
    <>
      <h2 id="transfer-title">Importar save</h2>
      <p className="muted small">Cole o código gerado em <b>Configurações → Levar a partida</b>, ou escolha o arquivo baixado.</p>
      <textarea
        className="transfer-code"
        placeholder="AC1z.…"
        value={text}
        rows={4}
        onChange={(e) => { setText(e.target.value); void check(e.target.value); }}
        aria-label="Código do save"
      />
      <label className="btn file-btn">
        Escolher arquivo
        <input type="file" accept=".json,application/json,text/plain" onChange={(e) => void pickFile(e.target.files?.[0])} />
      </label>
      {error && <p className="alert" role="alert">{error}</p>}
      {ready && (
        <div className="transfer-ok" role="status">
          <b>Save encontrado:</b> {describeSave(ready)}.
          {hasStoredSave && <span className="muted small"> A partida que está neste navegador será substituída.</span>}
        </div>
      )}
      <div className="btn-row">
        <button className="btn btn-primary" disabled={!ready} onClick={() => ready && void importSave(ready).then(onClose)}>
          Carregar e jogar
        </button>
        <button className="btn" onClick={onClose}>Voltar</button>
      </div>
    </>
  );
}
