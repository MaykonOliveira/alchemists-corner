// Auditoria P3.2: todo texto que passa por tr() precisa ter versão em inglês.
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { EN } from '../../i18n/en';

/** Código-fonte do jogo (sem os testes e sem o próprio dicionário), lido como texto. */
const SOURCES = import.meta.glob(['../../**/*.{ts,tsx}', '!../../tests/**', '!../../i18n/**'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

function trKeys(): { key: string; file: string }[] {
  const out: { key: string; file: string }[] = [];
  for (const [file, text] of Object.entries(SOURCES)) {
    if (!text.includes('tr(')) continue;
    const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const visit = (n: ts.Node) => {
      if (ts.isCallExpression(n) && n.expression.getText(sf) === 'tr') {
        const a = n.arguments[0];
        if (a && (ts.isStringLiteral(a) || ts.isNoSubstitutionTemplateLiteral(a))) out.push({ key: a.text, file });
        else out.push({ key: `<texto não literal> ${n.getText(sf).slice(0, 60)}`, file });
      }
      ts.forEachChild(n, visit);
    };
    visit(sf);
  }
  return out;
}

const placeholders = (s: string) => [...new Set(s.match(/\{\d+\}/g) ?? [])].sort();

describe('versão em inglês (P3.2)', () => {
  const keys = trKeys();

  it('acha os textos do jogo', () => {
    expect(keys.length).toBeGreaterThan(1500);
  });

  it('todo texto tem tradução', () => {
    const missing = [...new Set(keys.filter((k) => EN[k.key] === undefined).map((k) => `${k.key}  (${k.file})`))];
    expect(missing).toEqual([]);
  });

  it('a tradução não perde valores: os {0}, {1}… usados continuam lá', () => {
    // Algumas frases em inglês dispensam o artigo ("o", "a") que o português passa como valor.
    const dropsArticle = new Set(['Começa {0} {1}. {2}', '{0} Chegou {1} {2}! {3}']);
    const broken = Object.entries(EN).filter(([pt, en]) => !dropsArticle.has(pt)
      && placeholders(pt).join() !== placeholders(en).join());
    expect(broken).toEqual([]);
  });

  it('o dicionário não guarda frases que o jogo não usa mais', () => {
    const used = new Set(keys.map((k) => k.key));
    expect(Object.keys(EN).filter((k) => !used.has(k))).toEqual([]);
  });
});
