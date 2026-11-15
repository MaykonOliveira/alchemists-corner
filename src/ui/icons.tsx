import type React from 'react';
// Ícones simples em SVG pixelado, desenhados para o jogo.
// No visual vetorial (teste) a moeda e a estrela ganham uma versão de traço redondo.
import { VECTOR } from '../app/skin';
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

const Smooth = ({ size = 16, title, children }: P & { children: React.ReactNode }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>{children}</svg>
);

export const CoinIcon = (p: P) => VECTOR ? (
  <Smooth {...p}>
    <circle cx="8" cy="8.4" r="6.6" fill="#e59a1f" stroke="#4a2b3a" strokeWidth="1" />
    <circle cx="8" cy="7.6" r="5.6" fill="#ffc94d" />
    <circle cx="8" cy="7.6" r="3.4" fill="#ffe9a3" stroke="#e59a1f" strokeWidth=".7" />
  </Smooth>
) : (
  <Pixel {...p} colors={{ a: '#e0a040', b: '#f2c95c', c: '#fff1b0' }} cells={[
    '..aaaa..', '.abbbba.', 'abcbbbba', 'abbabbba', 'abbabbba', 'abbbbbba', '.abbbba.', '..aaaa..']} />
);

export const StarIcon = (p: P) => VECTOR ? (
  <Smooth {...p}>
    <path d="M8 1.2l2.1 4.4 4.8.6-3.5 3.3.9 4.8L8 12l-4.3 2.3.9-4.8L1.1 6.2l4.8-.6z" fill="#ffc94d" stroke="#4a2b3a" strokeWidth="1" strokeLinejoin="round" />
  </Smooth>
) : (
  <Pixel {...p} colors={{ a: '#b8693a', b: '#f2c95c' }} cells={[
    '...aa...', '..abba..', 'aabbbbaa', 'abbbbbba', '.abbbba.', '.abbbba.', 'abba.bba', 'aa....aa']} />
);
