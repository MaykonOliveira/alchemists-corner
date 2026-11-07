import { describe, expect, it } from 'vitest';
import { createNewGame } from '../../domain/rules/initialState';
import { describeSave, exportSaveCode, importSaveCode, SaveImportError, saveFileName } from '../../persistence/saveTransfer';

const sample = () => ({ ...createNewGame(1_700_000_000_000), day: 42, level: 13, coins: 98765.4, playerName: 'Alquimista ção' });

describe('exportar e importar o save', () => {
  it('ida e volta com código comprimido', async () => {
    const save = sample();
    const code = await exportSaveCode(save);
    expect(code.startsWith('AC1z.')).toBe(true);
    expect(code).toMatch(/^[A-Za-z0-9._-]+$/);
    const back = await importSaveCode(code);
    expect(back.day).toBe(42);
    expect(back.level).toBe(13);
    expect(back.coins).toBeCloseTo(98765.4);
  });

  it('ida e volta com código sem compressão e com quebras de linha coladas', async () => {
    const code = await exportSaveCode(sample(), { compress: false });
    expect(code.startsWith('AC1.')).toBe(true);
    const messy = `  ${code.slice(0, 30)}\n${code.slice(30)}  `;
    expect((await importSaveCode(messy)).day).toBe(42);
  });

  it('aceita o JSON do arquivo baixado', async () => {
    const back = await importSaveCode(JSON.stringify(sample(), null, 2));
    expect(back.level).toBe(13);
  });

  it('save antigo é migrado na importação', async () => {
    const back = await importSaveCode(JSON.stringify({ saveVersion: 1, day: 5, coins: 30 }));
    expect(back.day).toBe(5);
    expect(back.saveVersion).toBe(sample().saveVersion);
  });

  it('recusa lixo e saves do futuro com mensagem clara', async () => {
    await expect(importSaveCode('oi tudo bem')).rejects.toBeInstanceOf(SaveImportError);
    await expect(importSaveCode('AC1z.quebrado')).rejects.toBeInstanceOf(SaveImportError);
    await expect(importSaveCode(JSON.stringify({ saveVersion: 999 }))).rejects.toThrow(/versão mais nova/);
  });

  it('resumo e nome do arquivo', () => {
    const s = sample();
    expect(describeSave(s)).toBe('Dia 42 · nível 13 · 98765 moedas');
    expect(saveFileName(s, new Date('2026-11-07T12:00:00Z'))).toBe('alchemists-corner-dia42-2026-11-07.json');
  });
});
