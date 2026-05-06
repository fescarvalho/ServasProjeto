import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import './ModuleViewer.css';

// ─── Tipos de blocos de conteúdo ─────────────────────────────────────────────
type Block =
  | { type: 'paragraph'; text: string }
  | { type: 'bullets'; items: string[] }
  | { type: 'callout'; emoji: string; title: string; text: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'steps'; items: { title: string; text: string }[] }
  | { type: 'subtitle'; text: string }
  | { type: 'divider' };

interface ModuleData {
  title: string;
  intro: string;
  color: string;
  emoji: string;
  blocks: Block[];
}

// ─── Conteúdo de cada módulo ──────────────────────────────────────────────────
const MODULES: Record<string, ModuleData> = {
  '1': {
    title: 'Preparação e Postura',
    intro: 'O serviço do altar começa muito antes da Missa. A sacristia não é lugar de brincadeira, mas de preparação espiritual para o mistério que será celebrado.',
    color: '#7c3f20',
    emoji: '🙏',
    blocks: [
      {
        type: 'steps',
        items: [
          {
            title: 'Silêncio',
            text: 'É o momento do padre e dos servos se concentrarem. O silêncio ajuda a acalmar o coração e a focar na missa.',
          },
          {
            title: 'Oração',
            text: 'Sempre rezar a oração preparatória do coroinha/acólito antes de se paramentar.',
          },
          {
            title: 'Apresentação',
            text: 'Mãos e unhas limpas, sapatos discretos e vestes litúrgicas perfeitamente limpas e bem alinhadas.',
          },
        ],
      },
      {
        type: 'callout',
        emoji: '✨',
        title: 'Lembre-se sempre',
        text: 'O que você faz na sacristia reflete diretamente na sua postura durante a celebração. Prepare o coração, não apenas o corpo.',
      },
    ],
  },

  '2': {
    title: 'O Ano Litúrgico e Cores',
    intro: 'A Igreja conta o tempo de uma maneira diferente. As cores das vestes do padre (paramentos) nos ajudam a entender o que estamos celebrando.',
    color: '#5b3d8e',
    emoji: '🗓️',
    blocks: [
      {
        type: 'table',
        headers: ['Tempo Litúrgico', 'Cor', 'Significado'],
        rows: [
          ['Advento', '🟣 Roxo', 'Espera e preparação para o Natal. Tempo de penitência suave.'],
          ['Natal', '⚪ Branco / Dourado', 'Alegria pelo nascimento de Cristo, pureza, luz.'],
          ['Quaresma', '🟣 Roxo', 'Tempo forte de penitência, conversão e jejum.'],
          ['Páscoa', '⚪ Branco / Dourado', 'A maior festa da fé. Celebra a Ressurreição, vida nova.'],
          ['Tempo Comum', '🟢 Verde', 'O dia a dia da Igreja, crescimento espiritual, esperança.'],
          ['Mártires / Pentecostes', '🔴 Vermelho', 'Fogo do Espírito Santo e o sangue dos santos mártires.'],
          ['Nossa Senhora', '⚪ Branco ou 🔵 Azul', 'Festas marianas simbolizam pureza e graça.'],
          ['Domingo Gaudete / Laetare', '🌸 Róseo (Rosa)', '3º Domingo do Advento e 4º da Quaresma. Alegria no meio da penitência.'],
        ],
      },
      {
        type: 'callout',
        emoji: '💡',
        title: 'Dica prática',
        text: 'Antes de cada missa, observe a cor da casula do padre. Isso te diz imediatamente em que momento da vida da Igreja você está.',
      },
    ],
  },

  '3': {
    title: 'Livros Sagrados e Marcações',
    intro: 'Os livros contêm a Palavra de Deus e as orações oficiais da Igreja. Devem ser manuseados com extremo respeito e nunca lidos como um livro comum.',
    color: '#1a5c3a',
    emoji: '📖',
    blocks: [
      { type: 'subtitle', text: 'Como Marcar o Missal Romano (Passo a Passo)' },
      {
        type: 'paragraph',
        text: 'O Missal é o livro das orações do padre e fica no altar. Ele possui fitilhos (fitas de marcação) coloridos e abas laterais. O "coroinha do livro" deve prepará-lo antes da missa.',
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Fita 1 — Próprio do Tempo',
            text: 'Marca as orações específicas daquele domingo ou santo do dia (Coleta, Sobre as Oferendas e Pós-Comunhão).',
          },
          {
            title: 'Fita 2 — Ordinário da Missa',
            text: 'Marca o início dos ritos que nunca mudam, como o Ato Penitencial, Glória e o Creio.',
          },
          {
            title: 'Fita 3 — Prefácio',
            text: 'Marca o diálogo antes do "Santo" e o prefácio correspondente ao tempo litúrgico.',
          },
          {
            title: 'Fita 4 — Oração Eucarística',
            text: 'Marca a grande oração da consagração escolhida pelo padre (I, II, III ou IV).',
          },
          {
            title: 'Fita 5 — Ritos da Comunhão',
            text: 'Marca a introdução ao Pai-Nosso e a oração da paz.',
          },
        ],
      },
      {
        type: 'callout',
        emoji: '⚠️',
        title: 'Regra de Ouro',
        text: 'Nunca marque o missal "esmagando" as fitas no meio das páginas. Deixe-as esticadas para baixo para não amassar, rasgar ou manchar as folhas do livro.',
      },
      { type: 'divider' },
      { type: 'subtitle', text: 'Como Marcar o Lecionário e o Evangeliário' },
      {
        type: 'paragraph',
        text: 'O Lecionário fica no Ambão (estante de leituras) e contém as leituras bíblicas. A marcação depende do dia e do ano litúrgico (Anos A, B, C para domingos).',
      },
      {
        type: 'bullets',
        items: [
          'Verifique no Diretório Litúrgico qual a leitura exata do dia.',
          'Coloque o fitilho de marcação no início da Primeira Leitura.',
          'Certifique-se de que o livro já está aberto na página correta antes do início da missa.',
          'Se usar o Evangeliário, ele deve estar marcado no Evangelho do dia e colocado sobre o altar antes da celebração.',
        ],
      },
    ],
  },

  '4': {
    title: 'Gestos e Posturas Litúrgicas',
    intro: 'O corpo também reza. Cada movimento de um servo no altar tem um significado profundo. O movimento deve ser calmo e solene.',
    color: '#0d4f6e',
    emoji: '🤲',
    blocks: [
      {
        type: 'steps',
        items: [
          {
            title: 'Vênia (Inclinação Profunda)',
            text: 'Feita com o tronco (dobrando a cintura). É feita ao altar no início e no fim da missa, caso não haja o Santíssimo Sacramento no centro, ou diante do Bispo.',
          },
          {
            title: 'Inclinação de Cabeça',
            text: 'Feita ao ouvir o nome de Jesus, da Virgem Maria ou do Santo do dia, e também ao receber a bênção.',
          },
          {
            title: 'Genuflexão',
            text: 'Tocar apenas o joelho direito no chão. É o gesto máximo de adoração. Feita exclusivamente para o Santíssimo Sacramento. A coluna deve estar reta.',
          },
          {
            title: 'Mãos Postas',
            text: 'Palma com palma, dedos juntos apontando levemente para cima, polegares cruzados (o direito sobre o esquerdo, formando uma cruz). Postura padrão quando parado e com as mãos livres.',
          },
        ],
      },
    ],
  },

  '5': {
    title: 'Vestes Litúrgicas do Padre',
    intro: 'O padre não veste "roupas", ele se paramenta. Ao colocar as vestes litúrgicas, ele passa a agir In Persona Christi — Na pessoa de Cristo.',
    color: '#7a2d5e',
    emoji: '👘',
    blocks: [
      {
        type: 'steps',
        items: [
          {
            title: 'Amicto',
            text: 'Pano retangular branco que cobre o pescoço e os ombros. Simboliza o "capacete da salvação" que protege a mente do padre das tentações.',
          },
          {
            title: 'Alva ou Túnica',
            text: 'Veste branca longa que cobre todo o corpo do padre. Representa a pureza de coração. Os servos também costumam usar uma veste baseada na alva.',
          },
          {
            title: 'Cíngulo',
            text: 'Cordão amarrado na cintura para prender a alva e a estola. Representa a castidade e o estar pronto para o serviço.',
          },
          {
            title: 'Estola',
            text: 'A faixa longa e vertical pendurada no pescoço. É o símbolo primordial do poder sacerdotal. Carrega a cor do tempo litúrgico. Sem a estola, o padre não administra sacramentos.',
          },
          {
            title: 'Casula',
            text: 'A veste superior, em formato de manto amplo, usada sobre tudo. Representa o jugo suave de Cristo e a proteção da caridade divina. Também leva a cor do tempo litúrgico.',
          },
        ],
      },
      {
        type: 'callout',
        emoji: '✨',
        title: 'Significado profundo',
        text: 'Cada peça das vestes tem um nome, uma oração e um significado. Conhecer isso ajuda o servo a entender que tudo na liturgia é símbolo da presença de Deus.',
      },
    ],
  },

  '6': {

    title: 'Uso do Turíbulo e da Naveta',
    intro: 'O incenso na Igreja não é um perfume, é oração. O salmo diz: "Suba minha oração como incenso à tua presença". Ele honra o que é sagrado e purifica o ambiente.',
    color: '#6b4226',
    emoji: '🔥',
    blocks: [
      {
        type: 'steps',
        items: [
          {
            title: 'Naveteiro',
            text: 'Segura a naveta (o pequeno "barquinho" metálico com incenso em grãos). Anda sempre ao lado esquerdo do turiferário. Apresenta a naveta aberta ao padre, segurando-a com as duas mãos.',
          },
          {
            title: 'Turiferário',
            text: 'Segura e cuida do turíbulo. Sua função mais importante é manter o carvão sempre em brasa, soprando discretamente antes de entrar.',
          },
        ],
      },
      { type: 'subtitle', text: 'Como Apresentar para o Padre (Imposição)' },
      {
        type: 'paragraph',
        text: 'O turiferário levanta a argola central com a mão direita até a altura do peito e puxa a corrente menor com a mão esquerda, levantando a tampa do turíbulo.',
      },
      { type: 'subtitle', text: 'Os Ductos (Movimentos de Incensação)' },
      {
        type: 'table',
        headers: ['Ductos', 'Usado para'],
        rows: [
          ['3 ductos duplos', 'Deus: Santíssimo Sacramento, Relíquia da Santa Cruz, Evangeliário e Cruz do Altar.'],
          ['2 ductos duplos', 'Imagens dos santos, Nossa Senhora e relíquias.'],
          ['Ductos simples (3×)', 'O sacerdote e a assembleia de fiéis — somos o povo de Deus.'],
        ],
      },
      {
        type: 'callout',
        emoji: '🙏',
        title: 'Significado espiritual',
        text: 'Cada balanço do turíbulo é uma oração ascendendo ao céu. Execute o gesto com devoção e calma, não com pressa.',
      },
    ],
  },

  '7': {
    title: 'Objetos e Alfaias',
    intro: 'Os vasos sagrados onde ficam o Corpo e Sangue de Cristo costumam ser dourados por dentro, indicando a realeza e o valor infinito do que carregam.',
    color: '#8a6900',
    emoji: '✝️',
    blocks: [
      {
        type: 'steps',
        items: [
          { title: 'Cálice', text: 'A taça central onde ocorre a consagração do vinho em Sangue de Cristo.' },
          { title: 'Pátena', text: 'O pratinho metálico dourado que acompanha o cálice, onde fica apoiada a Hóstia Grande.' },
          { title: 'Cibório (ou Âmbula)', text: 'Recipiente parecido com um cálice, mas com tampa. É onde são consagradas as hóstias menores para a comunhão dos fiéis.' },
          { title: 'Corporal', text: 'Tecido quadrado de linho, dobrado em nove partes. É estendido no centro do altar. O cálice e a pátena ficam OBRIGATORIAMENTE em cima do corporal.' },
          { title: 'Sanguíneo (ou Purificatório)', text: 'Tecido retangular usado para limpar (purificar) o cálice, a pátena e as âmbulas após a comunhão.' },
          { title: 'Pala', text: 'Um quadrado firme de linho que serve como tampa para cobrir o cálice e evitar que caiam insetos ou poeira no vinho.' },
          { title: 'Galhetas', text: 'Os dois jarros pequenos de vidro ou cristal que contêm a água e o vinho para o ofertório.' },
          { title: 'Manustérgio', text: 'A pequena toalha que o padre usa para enxugar as pontas dos dedos no momento do lavabo.' },
          { title: 'Credência', text: 'A pequena mesa lateral onde ficam todos esses objetos guardados antes de serem levados ao altar.' },
        ],
      },
      { type: 'divider' },
      { type: 'subtitle', text: 'Funções Específicas dos Servos' },
      {
        type: 'table',
        headers: ['Função', 'Responsabilidade'],
        rows: [
          ['Cruciferário', 'Carrega a Cruz Processional. Dita o ritmo da procissão. A imagem de Cristo deve estar voltada para a frente. Nunca faz genuflexão enquanto segura a cruz.'],
          ['Ceriferário', 'Leva as velas (círios). Acompanha o diácono ou padre ao Ambão durante a leitura do Evangelho para iluminar a Palavra de Deus.'],
          ['Libretista', 'Apresenta o Missal Romano ao padre na Sede. O livro deve estar firme, na altura do peito, bem estável.'],
          ['Acólito do Altar', 'Prepara o altar para o sacrifício. Leva o Cálice, Pátena e Cibórios da credência. Oferece as galhetas de água e vinho.'],
          ['Coroinha do Lavabo', 'Leva a jarra com água, a bacia e o manustérgio para o padre purificar os dedos. Entrega a toalha aberta.'],
          ['Sineiro', 'Toca a sineta na Epiclese e três vezes solenes na elevação do Corpo e Sangue de Cristo.'],
        ],
      },
    ],
  },
};

// ─── Componente ───────────────────────────────────────────────────────────────
export function ModuleViewer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const module = id ? MODULES[id] : null;

  if (!module) {
    return (
      <div className="mv-not-found">
        <p>Módulo não encontrado.</p>
        <button onClick={() => navigate('/formacao')}>Voltar</button>
      </div>
    );
  }

  const renderBlock = (block: Block, index: number) => {
    switch (block.type) {
      case 'paragraph':
        return <p key={index} className="mv-paragraph">{block.text}</p>;

      case 'subtitle':
        return <h3 key={index} className="mv-subtitle">{block.text}</h3>;

      case 'divider':
        return <hr key={index} className="mv-divider" />;

      case 'bullets':
        return (
          <ul key={index} className="mv-bullets">
            {block.items.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        );

      case 'callout':
        return (
          <div key={index} className="mv-callout">
            <span className="mv-callout-emoji">{block.emoji}</span>
            <div>
              <strong>{block.title}</strong>
              <p>{block.text}</p>
            </div>
          </div>
        );

      case 'steps':
        return (
          <div key={index} className="mv-steps">
            {block.items.map((item, i) => (
              <div key={i} className="mv-step">
                <div className="mv-step-number">{i + 1}</div>
                <div className="mv-step-body">
                  <strong>{item.title}</strong>
                  <p>{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        );

      case 'table':
        return (
          <div key={index} className="mv-table-wrapper">
            <table className="mv-table">
              <thead>
                <tr>
                  {block.headers.map((h, i) => <th key={i}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => <td key={ci}>{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="mv-container">
      {/* Header */}
      <div className="mv-header" style={{ background: module.color }}>
        <button className="mv-back-btn" onClick={() => navigate('/formacao')}>
          <ChevronLeft size={22} />
          <span>Trilha</span>
        </button>
        <div className="mv-hero">
          <span className="mv-emoji">{module.emoji}</span>
          <h1 className="mv-title">{module.title}</h1>
          <p className="mv-intro">{module.intro}</p>
        </div>
      </div>

      {/* Content */}
      <div className="mv-content">
        {module.blocks.map((block, i) => renderBlock(block, i))}
      </div>

      {/* Footer */}
      <div className="mv-footer">
        <button className="mv-footer-btn" onClick={() => navigate('/formacao')}>
          ← Voltar à Trilha de Estudos
        </button>
      </div>
    </div>
  );
}
