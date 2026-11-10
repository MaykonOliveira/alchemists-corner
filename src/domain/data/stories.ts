import { tr } from '../../i18n';
// Fregueses fiéis com história (auditoria P1.6): cada um tem 5 capítulos curtos, um por coração.
// Em cada capítulo o freguês conta o que está acontecendo (sem dizer o nome da poção) e o pedido muda
// com a história. Acertar a poção dá o coração e abre o fim do capítulo.
// Os pedidos usam só poções do nível 1 ou a favorita do freguês, para nunca pedir algo impossível.

export interface Chapter {
  title: string;
  /** O que o freguês conta ao chegar. */
  opening: string;
  /** A poção que resolve (o jogador precisa deduzir). */
  wants: string;
  /** O que ele diz depois de atendido: o capítulo se fecha aqui. */
  closing: string;
}

export const REGULAR_STORIES: Record<string, Chapter[]> = {
  'dona-celia': [
    { title: tr('O joelho do neto'), wants: 'cura-simples',
      opening: tr('Meu neto Pedrinho caiu da goiabeira de novo. Ralou o joelho inteiro.'),
      closing: tr('Ele já está trepado na árvore outra vez. Obrigada, querida.') },
    { title: tr('A feira de domingo'), wants: 'tonico-energia',
      opening: tr('Vou vender minhas compotas na feira e preciso aguentar o dia todo de pé.'),
      closing: tr('Vendi todas as compotas! Até a de jiló.') },
    { title: tr('Carta do filho'), wants: 'elixir-concentracao',
      opening: tr('Meu filho mandou carta da capital. Minhas vistas cansam e as letras dançam.'),
      closing: tr('Ele vai casar! Li a carta três vezes, sem perder uma linha.') },
    { title: tr('Os preparativos'), wants: 'tonico-energia',
      opening: tr('Faltam dez dias para o casamento e eu tenho bolo, toalha e vestido para fazer.'),
      closing: tr('O bolo tem quatro andares. Guardei um pedaço para você.') },
    { title: tr('A dança'), wants: 'cura-simples',
      opening: tr('Dancei tanto no casamento que torci o tornozelo. Mas valeu cada passo!'),
      closing: tr('Na festa contei para todo mundo que minhas poções vêm daqui.') },
  ],
  bram: [
    { title: tr('Faísca no olho'), wants: 'cura-simples',
      opening: tr('Uma faísca da forja me queimou o braço. Nada grave, mas arde.'),
      closing: tr('Já estou batendo ferro de novo.') },
    { title: tr('A encomenda do capitão'), wants: 'tonico-energia',
      opening: tr('O capitão da guarda quer cem ferraduras até amanhã. Cem!'),
      closing: tr('Cento e duas. Fiz duas a mais, de birra.') },
    { title: tr('O desenho da espada'), wants: 'elixir-concentracao',
      opening: tr('Quero forjar uma espada de verdade, com runas. Mas não consigo acertar o desenho.'),
      closing: tr('O desenho ficou pronto. Pela primeira vez parece coisa de mestre.') },
    { title: tr('A noite na forja'), wants: 'tonico-energia',
      opening: tr('A espada precisa de três noites de fogo sem parar. Estou na segunda.'),
      closing: tr('A lâmina cantou quando esfriou. Nunca ouvi aquilo.') },
    { title: tr('O torneio'), wants: 'cura-simples',
      opening: tr('Um cavaleiro venceu o torneio com a minha espada! Eu fui segurar o cavalo e levei um coice.'),
      closing: tr('Agora tem fila na forja. Mando todo mundo passar aqui depois.') },
  ],
  lia: [
    { title: tr('A primeira prova'), wants: 'elixir-concentracao',
      opening: tr('A prova de runas é amanhã e eu esqueço tudo o que leio.'),
      closing: tr('Passei! Raspando, mas passei.') },
    { title: tr('O feitiço que explodiu'), wants: 'cura-simples',
      opening: tr('Errei uma sílaba do feitiço e ele explodiu na minha mão.'),
      closing: tr('A mestra disse que todo mago já explodiu alguma coisa. Fiquei mais tranquila.') },
    { title: tr('A biblioteca proibida'), wants: 'elixir-concentracao',
      opening: tr('Achei um livro na ala proibida. Preciso entender antes que deem falta dele.'),
      closing: tr('Era um livro de receitas de poção! Devolvi, mas copiei uma página.') },
    { title: tr('Noites sem dormir'), wants: 'tonico-energia',
      opening: tr('Estou testando a receita do livro escondida. Já são três noites acordada.'),
      closing: tr('Funcionou! Uma luzinha azul que dança. Pequena, mas minha.') },
    { title: tr('A formatura'), wants: 'elixir-concentracao',
      opening: tr('Vou apresentar a minha luzinha na banca da formatura. Não posso travar na hora.'),
      closing: tr('Sou maga formada! E disse para a banca onde aprendi a gostar de poções.') },
  ],
  tobias: [
    { title: tr('A estrada do norte'), wants: 'tonico-energia',
      opening: tr('Vou atravessar a serra com a carroça carregada. Três dias de subida.'),
      closing: tr('Cheguei inteiro, e a mula também.') },
    { title: tr('O túnel escuro'), wants: 'visao-noturna',
      opening: tr('Dizem que o túnel velho da serra corta caminho, mas lá dentro não se vê nada.'),
      closing: tr('Achei um veio de cristal no túnel! Vou voltar com picareta.') },
    { title: tr('O mapa'), wants: 'elixir-concentracao',
      opening: tr('Preciso desenhar o mapa do túnel antes de esquecer cada curva.'),
      closing: tr('Mapa pronto. Vale mais que a carroça.') },
    { title: tr('O tombo'), wants: 'cura-simples',
      opening: tr('Escorreguei numa pedra do túnel e abri a canela.'),
      closing: tr('Tobias, o mascate, não para por causa de uma canela.') },
    { title: tr('A sociedade'), wants: 'visao-noturna',
      opening: tr('Montei sociedade com o Bram para tirar cristal do túnel. Hoje é o primeiro dia lá embaixo.'),
      closing: tr('Primeiro carregamento vendido. O Bram mandou dizer que a próxima rodada é por conta dele.') },
  ],
  'vovo-ze': [
    { title: tr('As noites compridas'), wants: 'balsamo-calmante',
      opening: tr('Desde que a Maria se foi, a casa ficou grande e a noite comprida.'),
      closing: tr('Dormi a noite toda. Sonhei com ela no jardim.') },
    { title: tr('A horta'), wants: 'tonico-energia',
      opening: tr('Resolvi replantar a horta que era dela. Mas a enxada pesa mais do que antes.'),
      closing: tr('Plantei couve, alface e as rosas dela.') },
    { title: tr('O espinho'), wants: 'cura-simples',
      opening: tr('As roseiras da Maria me pegaram de jeito. A mão está toda furada.'),
      closing: tr('A primeira rosa abriu hoje cedo.') },
    { title: tr('As cartas antigas'), wants: 'elixir-concentracao',
      opening: tr('Achei as cartas que a Maria me escrevia quando eu era moço. A letra é miúda.'),
      closing: tr('Li todas. Ela escrevia muito melhor do que eu lembrava.') },
    { title: tr('O neto que voltou'), wants: 'balsamo-calmante',
      opening: tr('Meu neto vem morar comigo. Estou tão aflito que nem sento direito.'),
      closing: tr('A casa voltou a ter barulho. Trouxe ele para conhecer a loja.') },
  ],
  condessa: [
    { title: tr('O baile de inverno'), wants: 'pocao-brilho',
      opening: tr('O salão do castelo é escuro demais para o baile. Quero uma luz que não apague.'),
      closing: tr('O salão brilhou. A corte inteira perguntou de onde veio a luz.') },
    { title: tr('O duque chato'), wants: 'balsamo-calmante',
      opening: tr('O duque de Valverde falou três horas sobre cavalos. Meus nervos estão em pedaços.'),
      closing: tr('Hoje ele falou quatro horas. Sorri o tempo todo.') },
    { title: tr('Os livros da casa'), wants: 'elixir-concentracao',
      opening: tr('Descobri que o administrador do castelo me rouba. Preciso conferir dez anos de livros.'),
      closing: tr('Achei o rombo. O administrador agora cuida dos porcos.') },
    { title: tr('A caçada'), wants: 'cura-simples',
      opening: tr('Caí do cavalo na caçada real. O orgulho dói mais que o braço, mas o braço dói.'),
      closing: tr('Voltei a montar. O cavalo é que ficou com medo de mim.') },
    { title: tr('A recomendação'), wants: 'pocao-brilho',
      opening: tr('Vou recomendar sua loja à Rainha. Preciso que o brilho de hoje seja o melhor de todos.'),
      closing: tr('A Rainha guardou o frasco. Disse que quer conhecer quem fez.') },
  ],
};

export const chapterFor = (regularId: string, hearts: number): Chapter | null => REGULAR_STORIES[regularId]?.[hearts] ?? null;
