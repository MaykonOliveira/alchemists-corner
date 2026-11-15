import shopUrl from '../../assets/sprites/shop.png';
import atlas from '../../assets/sprites/shop.json';
import vShopUrl from '../../assets/sprites/vector/shop.png';
import vAtlas from '../../assets/sprites/vector/shop.json';
import { VECTOR } from '../../app/skin';
import type { CatalogItem } from '../../domain/data/catalog';
import { Icon } from '../../ui/Icon';

const SHEET = VECTOR ? { url: vShopUrl, size: vAtlas.meta.size, frames: vAtlas.frames } : { url: shopUrl, size: atlas.meta.size, frames: atlas.frames };
const FRAMES = SHEET.frames as Record<string, { frame: { x: number; y: number; w: number; h: number } }>;
const DEFAULT_ICON: Record<string, string> = { tapete: '🟦', quadro: '🖼️', luminaria: '🕯️', planta: '🌿', toldo: '⛱️', tema: '🎉', uniforme: '🎩' };

/** Miniatura de um item de decoração, recortada do spritesheet da loja. */
export function DecorThumb({ item, size = 40 }: { item: CatalogItem; size?: number }) {
  if (item.slot === 'toldo') {
    return <span className="decor-thumb" style={{ width: size, height: size, background: `repeating-linear-gradient(90deg, ${item.look} 0 6px, #f3e6c8 6px 12px)` }} aria-hidden />;
  }
  const f = item.look ? FRAMES[item.look]?.frame : undefined;
  if (!f) return <span className="decor-thumb decor-thumb-empty" style={{ width: size, height: size }} aria-hidden><Icon e={DEFAULT_ICON[item.slot]} size={Math.max(16, Math.floor(size / 32) * 16)} /></span>;
  const scale = Math.min(size / f.w, size / f.h);
  return (
    <span className="decor-thumb" style={{ width: size, height: size }} aria-hidden>
      <span style={{
        width: f.w * scale, height: f.h * scale, backgroundImage: `url(${SHEET.url})`,
        backgroundPosition: `-${f.x * scale}px -${f.y * scale}px`, backgroundSize: `${SHEET.size.w * scale}px ${SHEET.size.h * scale}px`,
        imageRendering: VECTOR ? 'auto' : 'pixelated', display: 'block',
      }} />
    </span>
  );
}
