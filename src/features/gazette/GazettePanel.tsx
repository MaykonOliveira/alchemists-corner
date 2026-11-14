import { useEffect, useState } from 'react';
import { CITIES_BY_ID } from '../../domain/data/kingdom';
import { FAMILIARS_BY_ID } from '../../domain/data/familiars';
import { EXPEDITIONS_BY_ID, RIVAL } from '../../domain/data/street';
import { RECIPES_BY_ID } from '../../domain/data/recipes';
import type { GameSave, NewsItem } from '../../domain/models/types';
import { staffName } from '../../domain/rules/staff';
import { useGameStore } from '../../store/gameStore';
import { Icon } from '../../ui/Icon';
import { drawGazette } from './gazetteCard';

import { tr } from '../../i18n';

export interface GazetteStory {
  icon: string;
  title: string;
  text: string;
}

const RECORD_TEXT: Record<string, string> = {
  revenue: tr('maior faturamento de um dia'),
  served: tr('mais clientes atendidos num dia'),
  bestSale: tr('venda mais cara da história da loja'),
};
const MOMENT_TEXT: Record<string, string> = {
  estrela: tr('Uma estrela cadente cruzou a janela da loja, e quem viu fez um pedido.'),
  dragao: tr('Um dragão viajante pousou no balcão e deixou um ovo de presente.'),
  borboleta: tr('Uma borboleta arco-íris rodou pela loja e trouxe sorte ao caixa.'),
};

function story(s: GameSave, n: NewsItem): GazetteStory | null {
  switch (n.kind) {
    case 'staff-level': return { icon: '🏅', title: tr('{0} chega ao nível {1}', staffName(s, n.ref ?? ''), n.n ?? 0), text: tr('A equipe comemorou com bolo de mandrágora.') };
    case 'hatch': {
      const f = FAMILIARS_BY_ID[n.ref ?? ''];
      return f ? { icon: '🥚', title: n.n ? tr('Nasceu um {0} brilhante!', f.name) : tr('Nasceu: {0}', f.name), text: f.text } : null;
    }
    case 'branch-open': {
      const c = CITIES_BY_ID[n.ref ?? ''];
      return c ? { icon: '🏰', title: (n.n ?? 1) > 1 ? tr('A filial de {0} cresceu', c.name) : tr('Nova filial em {0}', c.name), text: c.text } : null;
    }
    case 'branch': return { icon: '🪙', title: tr('Filiais renderam {0} moedas', n.n ?? 0), text: tr('As carroças de remessa voltaram vazias e os cofres, cheios.') };
    case 'moment': return { icon: '🌠', title: tr('Visita rara na loja'), text: MOMENT_TEXT[n.ref ?? ''] ?? '' };
    case 'record': return { icon: '📈', title: tr('Recorde: {0}', RECORD_TEXT[n.ref ?? ''] ?? ''), text: tr('A rua inteira comentou.') };
    case 'expedition': {
      const e = EXPEDITIONS_BY_ID[n.ref ?? ''];
      return e ? { icon: '🎒', title: tr('Exploradora volta de {0}', e.name), text: tr('Trouxe {0} ingredientes na mochila e muita história para contar.', n.n ?? 0) } : null;
    }
    default: return null;
  }
}

/** Monta a página do jornal: manchete do dia, as notícias guardadas e a coluna da rival. */
export function gazetteStories(s: GameSave): { headline: GazetteStory; stories: GazetteStory[] } {
  const g = s.evo.gazette;
  const report = s.reports.find((r) => r.day === g?.day) ?? s.reports[s.reports.length - 1];
  const best = report ? Object.entries(report.salesByRecipe).sort((a, b) => b[1] - a[1])[0] : undefined;
  const headline: GazetteStory = report
    ? {
        icon: '📜',
        title: report.revenue > 0 ? tr('{0} fatura {1} moedas', s.shopName, report.revenue) : tr('Dia calmo na {0}', s.shopName),
        text: best ? tr('{0} clientes atendidos. A mais vendida foi {1} ({2}).', report.customersServed, RECIPES_BY_ID[best[0]]?.name ?? best[0], best[1]) : tr('{0} clientes atendidos.', report.customersServed),
      }
    : { icon: '📜', title: tr('Primeira edição da Gazeta'), text: tr('A vila agora tem um jornal, e a sua loja é a notícia.') };
  const stories = (g?.items ?? []).map((n) => story(s, n)).filter((x): x is GazetteStory => !!x);
  if (report?.staffOfDay) stories.unshift({ icon: '🏅', title: tr('Funcionário do dia: {0}', staffName(s, report.staffOfDay.id)), text: tr('Foi quem mais trabalhou na loja.') });
  if (report?.rival) stories.push({ icon: '⚔️', title: tr('Coluna da {0}', RIVAL.name), text: report.rival.me >= report.rival.her ? tr('"Sorte de principiante", resmungou a vizinha, com o placar em {0} a {1}.', report.rival.me, report.rival.her) : tr('"Minha vitrine está lotada", gabou-se a vizinha, com o placar em {0} a {1}.', report.rival.her, report.rival.me) });
  return { headline, stories: stories.slice(0, 6) };
}

/** Gazeta da Vila (pacote E5): o jornal da manhã com o que aconteceu ontem. */
export function GazettePanel({ save }: { save: GameSave }) {
  const dispatch = useGameStore((s) => s.dispatch);
  const [shared, setShared] = useState<string | null>(null);
  const unread = !!save.evo.gazette && !save.evo.gazette.read;
  useEffect(() => { if (unread) dispatch({ type: 'READ_GAZETTE' }); }, [unread, dispatch]);
  const { headline, stories } = gazetteStories(save);
  const day = save.evo.gazette?.day ?? Math.max(1, save.day - 1);
  const share = async () => {
    try {
      const blob = await drawGazette(save, headline, stories, day);
      if (!blob) return;
      const file = new File([blob], 'gazeta.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: tr('Gazeta da Vila') });
      else setShared(URL.createObjectURL(blob));
    } catch { /* o jogador cancelou */ }
  };
  return (
    <article className="gazette">
      <header className="gazette-mast">
        <p className="gazette-name">{tr('Gazeta da Vila')}</p>
        <p className="gazette-date small">{tr('Edição do dia {0}', day + 1)} · {tr('notícias do dia {0}', day)}</p>
      </header>
      <section className="gazette-head">
        <h3><Icon e={headline.icon} size={16} /> {headline.title}</h3>
        <p>{headline.text}</p>
      </section>
      {stories.length > 0 ? (
        <ul className="gazette-stories">
          {stories.map((st, i) => (
            <li key={i}>
              <b><Icon e={st.icon} /> {st.title}</b>
              <span className="small">{st.text}</span>
            </li>
          ))}
        </ul>
      ) : <p className="small muted">{tr('Nada mais de novo. Amanhã tem mais.')}</p>}
      <div className="card-foot">
        <button className="btn btn-small" onClick={share}><Icon e="📸" /> {tr('Compartilhar a primeira página')}</button>
      </div>
      {shared && <img className="gazette-shared" src={shared} alt={tr('Primeira página da Gazeta')} />}
    </article>
  );
}
