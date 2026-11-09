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
    { title: 'O joelho do neto', wants: 'cura-simples',
      opening: 'Meu neto Pedrinho caiu da goiabeira de novo. Ralou o joelho inteiro.',
      closing: 'Ele já está trepado na árvore outra vez. Obrigada, querida.' },
    { title: 'A feira de domingo', wants: 'tonico-energia',
      opening: 'Vou vender minhas compotas na feira e preciso aguentar o dia todo de pé.',
      closing: 'Vendi todas as compotas! Até a de jiló.' },
    { title: 'Carta do filho', wants: 'elixir-concentracao',
      opening: 'Meu filho mandou carta da capital. Minhas vistas cansam e as letras dançam.',
      closing: 'Ele vai casar! Li a carta três vezes, sem perder uma linha.' },
    { title: 'Os preparativos', wants: 'tonico-energia',
      opening: 'Faltam dez dias para o casamento e eu tenho bolo, toalha e vestido para fazer.',
      closing: 'O bolo tem quatro andares. Guardei um pedaço para você.' },
    { title: 'A dança', wants: 'cura-simples',
      opening: 'Dancei tanto no casamento que torci o tornozelo. Mas valeu cada passo!',
      closing: 'Na festa contei para todo mundo que minhas poções vêm daqui.' },
  ],
  bram: [
    { title: 'Faísca no olho', wants: 'cura-simples',
      opening: 'Uma faísca da forja me queimou o braço. Nada grave, mas arde.',
      closing: 'Já estou batendo ferro de novo.' },
    { title: 'A encomenda do capitão', wants: 'tonico-energia',
      opening: 'O capitão da guarda quer cem ferraduras até amanhã. Cem!',
      closing: 'Cento e duas. Fiz duas a mais, de birra.' },
    { title: 'O desenho da espada', wants: 'elixir-concentracao',
      opening: 'Quero forjar uma espada de verdade, com runas. Mas não consigo acertar o desenho.',
      closing: 'O desenho ficou pronto. Pela primeira vez parece coisa de mestre.' },
    { title: 'A noite na forja', wants: 'tonico-energia',
      opening: 'A espada precisa de três noites de fogo sem parar. Estou na segunda.',
      closing: 'A lâmina cantou quando esfriou. Nunca ouvi aquilo.' },
    { title: 'O torneio', wants: 'cura-simples',
      opening: 'Um cavaleiro venceu o torneio com a minha espada! Eu fui segurar o cavalo e levei um coice.',
      closing: 'Agora tem fila na forja. Mando todo mundo passar aqui depois.' },
  ],
  lia: [
    { title: 'A primeira prova', wants: 'elixir-concentracao',
      opening: 'A prova de runas é amanhã e eu esqueço tudo o que leio.',
      closing: 'Passei! Raspando, mas passei.' },
    { title: 'O feitiço que explodiu', wants: 'cura-simples',
      opening: 'Errei uma sílaba do feitiço e ele explodiu na minha mão.',
      closing: 'A mestra disse que todo mago já explodiu alguma coisa. Fiquei mais tranquila.' },
    { title: 'A biblioteca proibida', wants: 'elixir-concentracao',
      opening: 'Achei um livro na ala proibida. Preciso entender antes que deem falta dele.',
      closing: 'Era um livro de receitas de poção! Devolvi, mas copiei uma página.' },
    { title: 'Noites sem dormir', wants: 'tonico-energia',
      opening: 'Estou testando a receita do livro escondida. Já são três noites acordada.',
      closing: 'Funcionou! Uma luzinha azul que dança. Pequena, mas minha.' },
    { title: 'A formatura', wants: 'elixir-concentracao',
      opening: 'Vou apresentar a minha luzinha na banca da formatura. Não posso travar na hora.',
      closing: 'Sou maga formada! E disse para a banca onde aprendi a gostar de poções.' },
  ],
  tobias: [
    { title: 'A estrada do norte', wants: 'tonico-energia',
      opening: 'Vou atravessar a serra com a carroça carregada. Três dias de subida.',
      closing: 'Cheguei inteiro, e a mula também.' },
    { title: 'O túnel escuro', wants: 'visao-noturna',
      opening: 'Dizem que o túnel velho da serra corta caminho, mas lá dentro não se vê nada.',
      closing: 'Achei um veio de cristal no túnel! Vou voltar com picareta.' },
    { title: 'O mapa', wants: 'elixir-concentracao',
      opening: 'Preciso desenhar o mapa do túnel antes de esquecer cada curva.',
      closing: 'Mapa pronto. Vale mais que a carroça.' },
    { title: 'O tombo', wants: 'cura-simples',
      opening: 'Escorreguei numa pedra do túnel e abri a canela.',
      closing: 'Tobias, o mascate, não para por causa de uma canela.' },
    { title: 'A sociedade', wants: 'visao-noturna',
      opening: 'Montei sociedade com o Bram para tirar cristal do túnel. Hoje é o primeiro dia lá embaixo.',
      closing: 'Primeiro carregamento vendido. O Bram mandou dizer que a próxima rodada é por conta dele.' },
  ],
  'vovo-ze': [
    { title: 'As noites compridas', wants: 'balsamo-calmante',
      opening: 'Desde que a Maria se foi, a casa ficou grande e a noite comprida.',
      closing: 'Dormi a noite toda. Sonhei com ela no jardim.' },
    { title: 'A horta', wants: 'tonico-energia',
      opening: 'Resolvi replantar a horta que era dela. Mas a enxada pesa mais do que antes.',
      closing: 'Plantei couve, alface e as rosas dela.' },
    { title: 'O espinho', wants: 'cura-simples',
      opening: 'As roseiras da Maria me pegaram de jeito. A mão está toda furada.',
      closing: 'A primeira rosa abriu hoje cedo.' },
    { title: 'As cartas antigas', wants: 'elixir-concentracao',
      opening: 'Achei as cartas que a Maria me escrevia quando eu era moço. A letra é miúda.',
      closing: 'Li todas. Ela escrevia muito melhor do que eu lembrava.' },
    { title: 'O neto que voltou', wants: 'balsamo-calmante',
      opening: 'Meu neto vem morar comigo. Estou tão aflito que nem sento direito.',
      closing: 'A casa voltou a ter barulho. Trouxe ele para conhecer a loja.' },
  ],
  condessa: [
    { title: 'O baile de inverno', wants: 'pocao-brilho',
      opening: 'O salão do castelo é escuro demais para o baile. Quero uma luz que não apague.',
      closing: 'O salão brilhou. A corte inteira perguntou de onde veio a luz.' },
    { title: 'O duque chato', wants: 'balsamo-calmante',
      opening: 'O duque de Valverde falou três horas sobre cavalos. Meus nervos estão em pedaços.',
      closing: 'Hoje ele falou quatro horas. Sorri o tempo todo.' },
    { title: 'Os livros da casa', wants: 'elixir-concentracao',
      opening: 'Descobri que o administrador do castelo me rouba. Preciso conferir dez anos de livros.',
      closing: 'Achei o rombo. O administrador agora cuida dos porcos.' },
    { title: 'A caçada', wants: 'cura-simples',
      opening: 'Caí do cavalo na caçada real. O orgulho dói mais que o braço, mas o braço dói.',
      closing: 'Voltei a montar. O cavalo é que ficou com medo de mim.' },
    { title: 'A recomendação', wants: 'pocao-brilho',
      opening: 'Vou recomendar sua loja à Rainha. Preciso que o brilho de hoje seja o melhor de todos.',
      closing: 'A Rainha guardou o frasco. Disse que quer conhecer quem fez.' },
  ],
};

export const chapterFor = (regularId: string, hearts: number): Chapter | null => REGULAR_STORIES[regularId]?.[hearts] ?? null;
