// Ícones da interface recortados do spritesheet src/assets/sprites/icons.png (fontes em art/).
import iconsUrl from '../assets/sprites/icons.png';
import sheet from '../assets/sprites/icons.json';

type IconName = keyof typeof sheet.icons;

interface Props {
  name: string;
  /** Tamanho em px. Arredondado para múltiplo de 16 para manter os pixels nítidos. */
  size?: number;
  title?: string;
  /** Versão apagada (receita ou ingrediente bloqueado). */
  muted?: boolean;
}

export function SpriteIcon({ name, size = 16, title, muted }: Props) {
  const pos = sheet.icons[name as IconName];
  if (!pos) return null;
  const scale = Math.max(1, Math.round(size / sheet.size));
  const px = sheet.size * scale;
  return (
    <span
      className={`sprite-icon${muted ? ' sprite-icon-muted' : ''}`}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      style={{
        width: px,
        height: px,
        backgroundImage: `url(${iconsUrl})`,
        backgroundSize: `${sheet.width * scale}px ${sheet.height * scale}px`,
        backgroundPosition: `-${pos[0] * scale}px -${pos[1] * scale}px`,
      }}
    />
  );
}

export const PotionIcon = ({ recipeId, ...p }: Omit<Props, 'name'> & { recipeId: string }) => (
  <SpriteIcon name={`potion-${recipeId}`} {...p} />
);

export const IngredientIcon = ({ ingredientId, ...p }: Omit<Props, 'name'> & { ingredientId: string }) => (
  <SpriteIcon name={`ingredient-${ingredientId}`} {...p} />
);
