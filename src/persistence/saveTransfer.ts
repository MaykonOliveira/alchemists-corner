import type { GameSave } from '../domain/models/types';
import { migrateSave } from './migrations';

import { GAME_NAME, tr } from '../i18n';
/**
 * Exportar e importar a partida como texto, para levar o save entre navegadores e aparelhos
 * (por exemplo, do link do Claude para o GitHub Pages ou para o celular).
 *
 * Formato do código: `AC1.` + base64url do JSON do save. Quando o navegador tem
 * CompressionStream, o JSON vai comprimido com gzip e o prefixo vira `AC1z.`.
 */
const PREFIX_PLAIN = 'AC1.';
const PREFIX_GZIP = 'AC1z.';

const toBase64Url = (bytes: Uint8Array) => {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const fromBase64Url = (text: string) => {
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream) {
  const res = new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(stream));
  return new Uint8Array(await res.arrayBuffer());
}

const canGzip = () => typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';

/** Gera o código de exportação do save. */
export async function exportSaveCode(save: GameSave, { compress = true } = {}): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(save));
  if (compress && canGzip()) return PREFIX_GZIP + toBase64Url(await pipe(json, new CompressionStream('gzip')));
  return PREFIX_PLAIN + toBase64Url(json);
}

export class SaveImportError extends Error {}

/**
 * Lê um código de exportação ou o conteúdo de um arquivo .json de save.
 * Valida e migra com as mesmas regras do carregamento normal.
 */
export async function importSaveCode(input: string): Promise<GameSave> {
  const text = input.trim().replace(/\s+/g, '');
  let raw: unknown;
  try {
    if (text.startsWith(PREFIX_GZIP)) {
      if (!canGzip()) throw new SaveImportError(tr('Este navegador não consegue abrir códigos comprimidos.'));
      const bytes = await pipe(fromBase64Url(text.slice(PREFIX_GZIP.length)), new DecompressionStream('gzip'));
      raw = JSON.parse(new TextDecoder().decode(bytes));
    } else if (text.startsWith(PREFIX_PLAIN)) {
      raw = JSON.parse(new TextDecoder().decode(fromBase64Url(text.slice(PREFIX_PLAIN.length))));
    } else {
      // Arquivo .json exportado (aceita espaços e quebras de linha originais).
      raw = JSON.parse(input);
    }
  } catch (err) {
    if (err instanceof SaveImportError) throw err;
    throw new SaveImportError(tr('O código não parece um save do {0}. Confira se copiou ele inteiro.', GAME_NAME));
  }
  const save = migrateSave(raw);
  if (!save) throw new SaveImportError(tr('Esse save é de uma versão mais nova do jogo ou está corrompido.'));
  return save;
}

/** Resumo curto mostrado antes de confirmar a importação. */
export const describeSave = (s: GameSave) =>
  tr('Dia {0} · nível {1} · {2} moedas', s.day, s.level, Math.floor(s.coins));

/** Nome do arquivo de exportação, com a data. */
export const saveFileName = (s: GameSave, now = new Date()) =>
  `alchemists-corner-dia${s.day}-${now.toISOString().slice(0, 10)}.json`;
