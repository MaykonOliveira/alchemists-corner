// Ícones simples em SVG pixelado, desenhados para o jogo.
type P = { size?: number; title?: string };

const px = (cells: string[], color: Record<string, string>) =>
  cells.flatMap((row, y) =>
    [...row].map((ch, x) => (color[ch] ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={color[ch]} /> : null)),
  );

function Pixel({ cells, colors, size = 16, title }: P & { cells: string[]; colors: Record<string, string> }) {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${cells[0].length} ${cells.length}`} shapeRendering="crispEdges" role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      {px(cells, colors)}
    </svg>
  );
}

export const CoinIcon = (p: P) => (
  <Pixel {...p} colors={{ a: '#e0a040', b: '#f2c95c', c: '#fff1b0' }} cells={[
    '..aaaa..', '.abbbba.', 'abcbbbba', 'abbabbba', 'abbabbba', 'abbbbbba', '.abbbba.', '..aaaa..']} />
);

export const StarIcon = (p: P) => (
  <Pixel {...p} colors={{ a: '#b8693a', b: '#f2c95c' }} cells={[
    '...aa...', '..abba..', 'aabbbbaa', 'abbbbbba', '.abbbba.', '.abbbba.', 'abba.bba', 'aa....aa']} />
);

export const FlaskIcon = ({ color = '#5aa0e0', ...p }: P & { color?: string }) => (
  <Pixel {...p} colors={{ c: '#a0703c', g: '#d8e8e8', l: color, w: '#ffffff' }} cells={[
    '...cc...', '...gg...', '...gg...', '..gllg..', '.glwllg.', '.gllllg.', '.gllllg.', '..gggg..']} />
);

export const LeafIcon = ({ color = '#6b9a3c', ...p }: P & { color?: string }) => (
  <Pixel {...p} colors={{ l: color, d: '#2e1c14' }} cells={[
    '.....ll.', '...llll.', '..lllll.', '.llldll.', '.lldlll.', '.ldlll..', 'd.ll....', '........']} />
);
