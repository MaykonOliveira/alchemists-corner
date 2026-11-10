// Código de presente entre amigos (pacote M): "AC1g." + JSON em base64 (sem servidor).
import type { GiftPayload } from '../../domain/rules/social';

import { tr } from '../../i18n';
const PREFIX = 'AC1g.';

const toB64 = (s: string) => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64 = (s: string) => {
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder().decode(Uint8Array.from(b, (c) => c.charCodeAt(0)));
};

export function encodeGift(from: string, sender: number, now = Date.now()): string {
  const payload: GiftPayload = { from: from.slice(0, 28), sender, id: `${sender.toString(36)}-${now.toString(36)}-${Math.random().toString(36).slice(2, 6)}` };
  return PREFIX + toB64(JSON.stringify(payload));
}

/** Lê um código colado (aceita espaços e o texto em volta, como numa mensagem de WhatsApp). */
export function decodeGift(text: string): GiftPayload | null {
  const m = text.match(/AC1g\.([A-Za-z0-9_-]+)/);
  if (!m) return null;
  try {
    const p = JSON.parse(fromB64(m[1])) as GiftPayload;
    if (typeof p.id !== 'string' || typeof p.sender !== 'number') return null;
    return { from: String(p.from ?? '').slice(0, 28), sender: p.sender, id: p.id.slice(0, 40) };
  } catch {
    return null;
  }
}

export const GAME_URL = 'https://maykonoliveira.github.io/alchemists-corner/';

export const giftMessage = (code: string, shopName: string) =>
  tr('🎁 A loja "{0}" mandou um presente para você no Alchemist\'s Corner! Jogue em {1} e cole este código na aba Decoração (área Mundo): {2}', shopName, GAME_URL, code);
