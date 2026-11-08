// Arte do jogo: spritesheets em pixel art gerados a partir dos fontes em art/ (ver art/README.md).
// Este módulo só expõe as URLs e as medidas que a cena precisa conhecer.
import roomUrl from '../../../assets/sprites/room.png';
import shopUrl from '../../../assets/sprites/shop.png';
import shopAtlas from '../../../assets/sprites/shop.json';
import layout from '../../../assets/sprites/layout.json';
import aventureiroUrl from '../../../assets/sprites/customer-aventureiro.png';
import estudiosoUrl from '../../../assets/sprites/customer-estudioso.png';
import moradorUrl from '../../../assets/sprites/customer-morador.png';
import viajanteUrl from '../../../assets/sprites/customer-viajante.png';
import nobreUrl from '../../../assets/sprites/customer-nobre.png';
import type { CustomerArchetype } from '../../../domain/models/types';

// Dimensões do mundo lógico (PRD 6.3).
export const WORLD_W = 384;
export const WORLD_H = 216;

export const ROOM_URL = roomUrl;
export const SHOP_ATLAS = { url: shopUrl, data: shopAtlas };

export const CUSTOMER_W = layout.customer.w;
export const CUSTOMER_H = layout.customer.h;
export const CUSTOMER_FRAMES = layout.customer.frames; // 0 parado, 1 e 2 caminhando
export const CUSTOMER_URLS: Record<CustomerArchetype, string> = {
  aventureiro: aventureiroUrl,
  estudioso: estudiosoUrl,
  morador: moradorUrl,
  viajante: viajanteUrl,
  nobre: nobreUrl,
};

/** Posições das melhorias do late game (estufa, alambique, runas, vitral e sino). */
export const LATEGAME: Record<'greenhouse' | 'alembic' | 'cabinet-runes' | 'vitral' | 'bell', { x: number; y: number }> = layout.lategame;

/** Posições das expansões da loja (2º caldeirão, ala do balcão e astrolábio da torre). */
export const EXPANSION: Record<'cauldron-2' | 'counter-wing' | 'astrolabe', { x: number; y: number }> = layout.expansion;

/** Lugares da decoração da loja (fase 3): tapete, quadro, luminária, planta e toldo da janela. */
export const DECOR_POS: Record<'rug' | 'frame' | 'lamp' | 'plant' | 'awning', { x: number; y: number }> = layout.decor;

/** Concurso Real (fase 4): estante dos troféus embaixo do quadro de avisos. */
export const ROYAL_POS: Record<'trophy-shelf', { x: number; y: number }> = layout.royal;

/** Linhas (y relativo) das tábuas onde os frascos ficam apoiados. */
export const SHELF_BOARDS: number[] = layout.shelfBoards;

/** Lâmpadas do cordão de luzes (melhoria "Iluminação aconchegante"). */
export const GARLAND_BULBS: { x: number; y: number; color: string }[] = layout.garlandBulbs;

/** Posições das lanternas (centro da luz) para os brilhos animados. */
export const LANTERNS = [
  { x: 107, y: 30 },
  { x: 289, y: 26 },
];
