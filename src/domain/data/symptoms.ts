// Pedido por sintoma (auditoria P0.2): a partir do dia 2 a maioria dos clientes conta o problema
// em vez de dizer o nome da poção. O jogador diagnostica e escolhe na prateleira.

/** Três jeitos de contar o problema, sem dizer o nome da poção. */
export const SYMPTOMS: Record<string, string[]> = {
  'cura-simples': [
    'Cortei a mão no arado e não para de sangrar.',
    'Um lobo me pegou de raspão na perna. Arde muito.',
    'Levei um tombo feio na escada da torre. Estou todo ralado.',
  ],
  'tonico-energia': [
    'Vou carregar sacos no porto o dia inteiro e já acordei cansado.',
    'Minhas pernas pesam como chumbo e ainda faltam duas cidades.',
    'Trabalhei a noite toda na forja. Preciso aguentar mais um turno.',
  ],
  'elixir-concentracao': [
    'Leio a mesma linha três vezes e não guardo nada.',
    'Amanhã é o exame da academia e minha cabeça só vagueia.',
    'Preciso copiar um livro inteiro sem errar uma letra.',
  ],
  'visao-noturna': [
    'Minha tocha apagou na mina e eu quase não achei a saída.',
    'Faço ronda à noite nos muros e não vejo nada além do portão.',
    'A caverna do vale é escura como breu e eu preciso mapear.',
  ],
  'balsamo-calmante': [
    'Viro na cama até o galo cantar. Já faz uma semana.',
    'Meu coração dispara à toa e as mãos não param de tremer.',
    'O bebê dos vizinhos chora a noite inteira e eu não prego o olho.',
  ],
  'pocao-brilho': [
    'Minha lanterna vive apagando com o vento da estrada.',
    'Quero enfeitar a praça para a festa com uma luz que dure a noite toda.',
    'A biblioteca não deixa entrar com fogo. Como eu leio lá dentro?',
  ],
  'pocao-sorte': [
    'Aposto tudo nos dados hoje à noite. Preciso que os números caiam do meu lado.',
    'Vou pedir a mão da minha amada e tenho medo de tudo dar errado.',
    'Meu navio sai amanhã e as cartas da cigana não foram boas.',
  ],
  'elixir-geada': [
    'Vou trabalhar ao lado do forno da padaria e o calor me derruba.',
    'A caravana atravessa as dunas ao meio-dia. Não vou aguentar o sol.',
    'O ferreiro precisa de alguém que suporte a fornalha por horas.',
  ],
  'pena-leve': [
    'Tenho que descer do alto do campanário e a escada caiu.',
    'Vou atravessar o desfiladeiro por uma ponte que balança muito.',
    'Morro de medo de cair do telhado quando conserto as telhas.',
  ],
  'elixir-estelar': [
    'Os astros vão se alinhar esta noite e eu quero entender o que dizem.',
    'Preciso de uma resposta que nenhum livro tem.',
    'Sonhei três vezes com o mesmo caminho. Quero ver para onde ele leva.',
  ],
  'elixir-fenix': [
    'Meu velho mestre está à beira da morte. Nenhum remédio funcionou.',
    'Um cavaleiro voltou da guerra quase sem vida.',
    'Dizem que só algo nascido das cinzas pode salvar quem já desistiu.',
  ],
  'nectar-primavera': [
    'O inverno me deixou sem ânimo. Quero sentir as flores de novo.',
    'Ando apagado. Quero o gosto da estação que acabou de chegar.',
    'Vou ao baile das flores e quero estar florescendo também.',
  ],
  'refresco-solar': [
    'O sol do verão está derretendo até as pedras da rua.',
    'Trabalho na colheita ao meio-dia. Preciso de algo que refresque.',
    'Essa onda de calor não me deixa nem pensar.',
  ],
  'cha-colheita': [
    'As aulas de outono começaram e eu esqueço tudo o que estudo.',
    'Preciso lembrar de todas as contas da colheita deste ano.',
    'Meu avô esquece o nome dos netos. Algo da estação ajuda?',
  ],
  'aurora-boreal': [
    'O inverno está tão escuro que a casa parece triste.',
    'As noites longas me deixam sem alegria nenhuma.',
    'Quero levar um pouco de luz colorida para as crianças nesta neve.',
  ],
};

/** Quando o jogador erra, o cliente explica melhor (com a "necessidade" da receita). */
export const symptomClarify = (need: string) => `Não, não… o que eu preciso mesmo é de algo para ${need.charAt(0).toLowerCase()}${need.slice(1)}.`;
