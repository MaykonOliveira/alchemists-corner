import type { PanelId } from '../../../store/gameStore';

import { tr } from '../../../i18n';
export interface HotspotDef {
  id: string;
  label: string;
  /** Painel React aberto ao clicar. */
  panel: PanelId;
  texture: string;
  x: number;
  y: number;
  /** Profundidade explícita (por padrão, a base do objeto). */
  depth?: number;
}

/** Estações interativas da loja (PRD 5.1). Coordenadas no mundo lógico 384×216. */
export const HOTSPOTS: HotspotDef[] = [
  { id: 'cabinet', label: tr('Armário de ingredientes'), panel: 'ingredients', texture: 'obj-cabinet', x: 2, y: 38 },
  { id: 'shelf-a', label: tr('Prateleira de poções'), panel: 'shelves', texture: 'obj-shelf', x: 108, y: 22 },
  { id: 'shelf-b', label: tr('Prateleira de poções'), panel: 'shelves', texture: 'obj-shelf', x: 170, y: 22 },
  { id: 'board', label: tr('Quadro de avisos'), panel: 'orders', texture: 'obj-board', x: 238, y: 32 },
  { id: 'door', label: tr('Porta da loja'), panel: 'door', texture: 'obj-door', x: 300, y: 28 },
  { id: 'cauldron', label: tr('Caldeirão'), panel: 'production', texture: 'obj-cauldron', x: 46, y: 128 },
  { id: 'counter', label: tr('Balcão de atendimento'), panel: 'counter', texture: 'obj-counter', x: 150, y: 128 },
  { id: 'register', label: tr('Caixa registradora'), panel: 'report', texture: 'obj-register', x: 243, y: 117, depth: 170 },
];
