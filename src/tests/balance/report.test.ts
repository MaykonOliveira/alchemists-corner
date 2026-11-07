import { it } from 'vitest';

declare const process: { env: Record<string, string | undefined> };
import { CASUAL, DISTRAIDO, DISTRAIDO_COM_AJUDANTES, EFICIENTE, summarize } from './bot';

// Relatório de balanceamento: rode com `SIM_REPORT=1 npx vitest run src/tests/balance/report.test.ts`.
it.runIf(process.env.SIM_REPORT)('relatório de balanceamento', { timeout: 120_000 }, () => {
  for (const p of [CASUAL, EFICIENTE, DISTRAIDO, DISTRAIDO_COM_AJUDANTES]) {
    const r = summarize(p, 10, 40);
    console.log(`\n== ${p.name} == 1ª melhoria comprada no dia ${r.firstUpgradeDay} (min ${r.firstUpgradeMin}, máx ${r.firstUpgradeMax}); ao alcance no dia ${r.firstAffordableDay}`);
    console.table(r.perDay);
  }
});
