import { describe, expect, it } from 'vitest';
import sheet from '../../assets/sprites/icons.json';
import { ARCHETYPES } from '../../domain/data/customers';
import { REGULARS } from '../../domain/data/world';

describe('clientes com rosto (auditoria P1.5)', () => {
  it('cada tipo de cliente e cada freguês fiel tem três expressões', () => {
    const icons = sheet.icons as Record<string, unknown>;
    for (const who of [...Object.keys(ARCHETYPES), ...REGULARS.map((r) => r.id)]) {
      for (const m of ['feliz', 'neutro', 'bravo']) expect(icons[`face-${who}-${m}`], `${who} ${m}`).toBeDefined();
    }
  });
});
