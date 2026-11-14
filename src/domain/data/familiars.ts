import { tr } from '../../i18n';
// Familiares mágicos (pacote E4): criaturinhas que nascem dos ovos ganhos jogando e moram na loja.
// Cada uma dá um bônus leve. Só duas ficam ativas por vez. A versão brilhante (rara) vale 50% a mais.
// Nada aqui se compra com dinheiro: ovos vêm de expedições, recordes, conquistas e momentos especiais.

export type FamiliarBonus = 'prateleira' | 'paciencia' | 'preparo' | 'clientes' | 'preco' | 'xp' | 'cristal' | 'fornecedor';

export interface Familiar {
  id: string;
  name: string;
  bonus: FamiliarBonus;
  /** Valor do bônus (fração, ou unidades para 'prateleira'). */
  value: number;
  text: string;
  /** Dica de onde o ovo costuma aparecer (para a silhueta no álbum). */
  hint: string;
}

export const FAMILIARS: Familiar[] = [
  { id: 'fadinha', name: tr('Fadinha das prateleiras'), bonus: 'prateleira', value: 4,
    text: tr('Arruma os frascos tão bem que cabem 4 a mais nas prateleiras.'), hint: tr('Ovos de expedições e de recordes.') },
  { id: 'slime', name: tr('Slime faxineiro'), bonus: 'paciencia', value: 0.1,
    text: tr('Deixa o chão brilhando: clientes esperam 10% mais.'), hint: tr('Ovos de conquistas do álbum.') },
  { id: 'dragaozinho', name: tr('Dragãozinho'), bonus: 'preparo', value: 0.1,
    text: tr('Sopra o fogo do caldeirão: preparos 10% mais rápidos.'), hint: tr('Ovos do dragão viajante.') },
  { id: 'vagalume', name: tr('Vaga-lume da vitrine'), bonus: 'clientes', value: 0.08,
    text: tr('Pisca na vitrine e chama a rua: 8% mais clientes.'), hint: tr('Ovos de expedições.') },
  { id: 'sapo-dourado', name: tr('Sapo dourado'), bonus: 'preco', value: 0.04,
    text: tr('Dá sorte no caixa: clientes pagam 4% a mais.'), hint: tr('Ovos de recordes.') },
  { id: 'raposa-lua', name: tr('Raposa da lua'), bonus: 'xp', value: 0.1,
    text: tr('Curiosa, aprende junto com você: +10% de experiência.'), hint: tr('Ovos de conquistas do álbum.') },
  { id: 'tartaruga-cristal', name: tr('Tartaruga de cristal'), bonus: 'cristal', value: 0.5,
    text: tr('Solta lascas do casco: 50% de chance de 1 Cristal de luar no fechamento.'), hint: tr('Ovos de expedições.') },
  { id: 'cogumelinho', name: tr('Cogumelinho'), bonus: 'fornecedor', value: 0.06,
    text: tr('Conhece todo mundo no mercado: ingredientes 6% mais baratos.'), hint: tr('Ovos de recordes e expedições.') },
];

export const FAMILIARS_BY_ID: Record<string, Familiar> = Object.fromEntries(FAMILIARS.map((f) => [f.id, f]));

/** Familiares ativos ao mesmo tempo. */
export const ACTIVE_FAMILIARS = 2;
/** Ovos que cabem no ninho. */
export const NEST_SIZE = 3;
/** Chance de um ovo depois de cada expedição e de cada conquista. */
export const EGG_EXPEDITION = 0.35;
export const EGG_ACHIEVEMENT = 0.5;
/** Chance de sair a versão brilhante quando todos os familiares já nasceram. */
export const SHINY_CHANCE = 0.3;
export const SHINY_FACTOR = 1.5;
