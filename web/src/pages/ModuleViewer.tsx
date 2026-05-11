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
  | { type: 'image'; src: string; alt: string; caption?: string }
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
  '2': {
    title: 'Estrutura da Igreja',
    intro: 'A igreja é um espaço sagrado para acolher o povo de Deus e conduzir à celebração dos mistérios da fé. Cada parte tem uma função própria e profunda.',
    color: '#4a2c6e',
    emoji: '⛪',
    blocks: [
      {
        type: 'image',
        src: '/formacao/igreja_estrutura.png',
        alt: 'Interior de uma Igreja Católica',
        caption: 'Vista interna de uma Igreja Católica com Nave, Presbitério e Altar',
      },
      {
        type: 'subtitle',
        text: 'Espaços Principais',
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Nave',
            text: 'Espaço onde se reúne a assembleia para escutar a Palavra, orar e cantar. Contém os bancos e o corredor central.',
          },
          {
            title: 'Presbitério',
            text: 'Área elevada na frente da igreja, reservada aos ministros ordenados e auxiliares. É um lugar de postura, atenção e recolhimento.',
          },
          {
            title: 'Altar',
            text: 'Centro do presbitério e ponto mais sagrado. É onde se realiza o Sacrifício de Cristo. Deve ser tratado com profundo respeito: nunca encostar sem função ou apoiá-lo.',
          },
          {
            title: 'Ambão',
            text: 'Lugar próprio da Proclamação da Palavra de Deus (Leituras, Salmo, Evangelho e Oração Universal). É a "Mesa da Palavra".',
          },
          {
            title: 'Capela do Santíssimo',
            text: 'Destinada à adoração silenciosa e oração pessoal.',
          },
          {
            title: 'Sacristia',
            text: 'Onde se guardam paramentos e objetos e os ministros se preparam. O servo deve manter organização, silêncio, pontualidade e zelo. Não é lugar de conversa ou brincadeiras.',
          },
          {
            title: 'Átrio (Nártex)',
            text: 'Espaço de transição entre o mundo exterior e o interior sagrado.',
          },
          {
            title: 'Sacrário (Tabernáculo)',
            text: 'Local onde se reserva o Santíssimo Sacramento em parte nobre e visível. A lâmpada vermelha sinaliza a presença real de Cristo. Exige genuflexão.',
          },
          {
            title: 'Batistério',
            text: 'Local da pia batismal para o primeiro sacramento. Geralmente próximo à entrada, simbolizando o início da vida cristã.',
          },
        ],
      },
      {
        type: 'callout',
        emoji: '🕯️',
        title: 'Atenção especial ao Sacrário',
        text: 'Sempre que passar diante do Sacrário com a lâmpada vermelha acesa, faça genuflexão com o joelho direito, pois Cristo está ali presente.',
      },
    ],
  },

  '3': {
    title: 'A Santa Missa Parte por Parte',
    intro: 'A Eucaristia é o memorial da morte e ressurreição do Senhor sob o sinal do pão e do vinho.',
    color: '#7c3f20',
    emoji: '✝️',
    blocks: [
      {
        type: 'image',
        src: '/formacao/santa_missa.png',
        alt: 'Cálice e Hóstia — Eucaristia',
        caption: 'O Cálice e a Hóstia: sinais da presença real de Cristo na Eucaristia',
      },
      {
        type: 'subtitle',
        text: '1. Ritos Iniciais',
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Procissão de Entrada',
            text: 'Representa o Salvador vindo ao mundo.',
          },
          {
            title: 'Saudação do Altar',
            text: 'O presidente beija o altar em sinal de carinho e reverência.',
          },
          {
            title: 'Ato Penitencial',
            text: 'Momento de silêncio para reconhecer-se pecador.',
          },
          {
            title: 'Hino de Louvor (Glória)',
            text: 'Hino venerável que glorifica a Deus e ao Cordeiro. OBS: Não se canta no Advento e Quaresma.',
          },
          {
            title: 'Oração da Coleta',
            text: 'Encerra o rito de entrada. Inclui invocação, pedido e finalidade.',
          },
        ],
      },
      { type: 'divider' },
      {
        type: 'subtitle',
        text: '2. Liturgia da Palavra',
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Leituras Bíblicas',
            text: 'Devem ser proclamadas do Ambão. Domingos divididos em anos A (Mateus), B (Marcos) e C (Lucas). OBS: Só há 2ª leitura aos domingos e solenidades.',
          },
          {
            title: 'Salmo Responsorial',
            text: 'Parte integrante da liturgia que favorece a meditação.',
          },
          {
            title: 'Aclamação ao Evangelho',
            text: 'Canto do Aleluia (ou outro conforme o tempo). OBS: Não se canta Aleluia na Quaresma.',
          },
          {
            title: 'Evangelho',
            text: 'Ponto alto da liturgia da Palavra. Faz-se o sinal da cruz na testa, boca e coração.',
          },
          {
            title: 'Homilia',
            text: 'Feita exclusivamente por ministro ordenado para confrontar o mistério com a vida.',
          },
          {
            title: 'Profissão de Fé',
            text: 'Resposta à Palavra ouvida. Usa-se o Símbolo Apostólico ou o Niceno-Constantinopolitano.',
          },
          {
            title: 'Oração Universal (Preces)',
            text: 'Assembleia pede pelas necessidades da Igreja e do mundo.',
          },
        ],
      },
      { type: 'divider' },
      {
        type: 'subtitle',
        text: '3. Liturgia Eucarística',
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Preparação das Ofertas',
            text: 'Procissão dos dons e lavagem das mãos pelo sacerdote (purificação interior).',
          },
          {
            title: 'Oração Eucarística',
            text: 'Oração de ação de graças e santificação.',
          },
          {
            title: 'Prefácio e Santo',
            text: 'Louvor a Deus pelas suas maravilhas.',
          },
          {
            title: 'Epíclese',
            text: 'Invocação do Espírito Santo sobre o pão e vinho.',
          },
          {
            title: 'Consagração',
            text: 'Realiza-se o sacrifício instituído por Cristo.',
          },
          {
            title: 'Anamnese',
            text: 'Memória da paixão, ressurreição e ascensão.',
          },
          {
            title: 'Doxologia Final',
            text: 'Glorificação de Deus confirmada pelo "Amém" empolgante do povo.',
          },
          {
            title: 'Rito da Comunhão',
            text: 'Pai-Nosso, Rito da Paz (dada com sobriedade), Fração do Pão (Cordeiro de Deus) e Comunhão.',
          },
        ],
      },
      { type: 'divider' },
      {
        type: 'subtitle',
        text: '4. Ritos Finais',
      },
      {
        type: 'paragraph',
        text: 'Saudação, bênção, avisos, despedida, beijo no altar e procissão para a sacristia.',
      },
      {
        type: 'callout',
        emoji: '🙏',
        title: 'O coração da celebração',
        text: 'A Consagração é o momento mais solene da Missa. O servo deve estar de joelhos, em silêncio e com postura de adoração.',
      },
    ],
  },

  '4': {
    title: 'Liturgia – Tempos e Cores',
    intro: 'O Ano Litúrgico celebra os feitos salvíficos de Deus. Inicia no 1º Domingo do Advento e termina na Solenidade de Cristo Rei.',
    color: '#1a5c3a',
    emoji: '🗓️',
    blocks: [
      {
        type: 'image',
        src: '/formacao/liturgia_cores.png',
        alt: 'Cores Litúrgicas do Ano Litúrgico',
        caption: 'As cores do Ano Litúrgico e seus significados',
      },
      {
        type: 'subtitle',
        text: 'Cores Litúrgicas',
      },
      {
        type: 'table',
        headers: ['Cor', 'Uso e Significado'],
        rows: [
          ['🟣 Roxo', 'Penitência — Advento e Quaresma.'],
          ['⚪ Branco', 'Paz, alegria, Ressurreição e santos não mártires.'],
          ['🔴 Vermelho', 'Espírito Santo e martírio — Pentecostes, Ramos, Apóstolos.'],
          ['🟢 Verde', 'Esperança e vida — Tempo Comum.'],
          ['🌸 Rosa', 'Alegria — 3º Domingo do Advento e 4º da Quaresma.'],
          ['⚫ Preto', 'Luto — finados.'],
          ['🟡 Dourado', 'Celebrações solenes.'],
        ],
      },
      { type: 'divider' },
      {
        type: 'subtitle',
        text: 'Tempos Litúrgicos',
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Advento',
            text: 'Preparação para o Natal (1ª vinda) e expectativa da 2ª vinda.',
          },
          {
            title: 'Natal',
            text: 'Das vésperas de Natal até o Batismo do Senhor.',
          },
          {
            title: 'Quaresma',
            text: 'Da 4ª feira de Cinzas até a Missa da Ceia do Senhor. Não se canta Glória nem Aleluia.',
          },
          {
            title: 'Tríduo Pascal',
            text: 'Quinta-feira Santa, Sexta-feira Santa (não há Eucaristia) e Vigília Pascal.',
          },
          {
            title: 'Tempo Pascal',
            text: '50 dias entre a Ressurreição e Pentecostes.',
          },
          {
            title: 'Tempo Comum',
            text: '33 ou 34 semanas celebrando o mistério de Cristo em sua plenitude.',
          },
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

  '5': {
    title: 'Livros, Objetos e Paramentos',
    intro: 'Conhecer os instrumentos sagrados da liturgia é parte essencial da formação do servo do altar.',
    color: '#8a6900',
    emoji: '📖',
    blocks: [
      {
        type: 'image',
        src: '/formacao/objetos_sagrados.png',
        alt: 'Objetos Sagrados — Cálice, Patena, Missal e Turíbulo',
        caption: 'Os objetos sagrados utilizados na celebração eucarística',
      },
      {
        type: 'subtitle',
        text: 'Livros Litúrgicos',
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Missal Romano',
            text: 'Orações usadas pelo sacerdote na missa.',
          },
          {
            title: 'Lecionários',
            text: 'Dominical (A, B, C), Semanal (anos par/ímpar) e Santoral.',
          },
          {
            title: 'Evangeliário',
            text: 'Textos dos Evangelhos para domingos e solenidades.',
          },
          {
            title: 'IGMR',
            text: 'Documento com as normas litúrgicas oficiais.',
          },
        ],
      },
      { type: 'divider' },
      {
        type: 'subtitle',
        text: 'Objetos (Alfaias) Sagrados',
      },
      {
        type: 'table',
        headers: ['Objeto', 'Descrição'],
        rows: [
          ['Cálice e Patena', 'Recipiente para o vinho e prato para a hóstia magna.'],
          ['Corporal', 'Pano quadrado onde se colocam os vasos sagrados.'],
          ['Sanguíneo', 'Pano para purificar o cálice.'],
          ['Pala', 'Cartão que cobre o cálice.'],
          ['Âmbula / Cibório', 'Para guardar as hóstias.'],
          ['Galhetas', 'Para água e vinho.'],
          ['Ostensório e Luneta', 'Para exposição e adoração do Santíssimo.'],
          ['Turíbulo e Naveta', 'Para o incenso.'],
          ['Caldeirinha e Aspersório', 'Para água benta.'],
          ['Círio Pascal', 'Vela principal usada até Pentecostes.'],
          ['Matraca', 'Substitui os sinos na Semana Santa.'],
        ],
      },
      { type: 'divider' },
      {
        type: 'subtitle',
        text: 'Paramentos',
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Amito',
            text: 'Lembra a disciplina dos sentidos.',
          },
          {
            title: 'Alva',
            text: 'Roupa branca que lembra a pureza e o Batismo.',
          },
          {
            title: 'Cíngulo',
            text: 'Cordão na cintura que lembra a castidade.',
          },
          {
            title: 'Estola',
            text: 'Simboliza a autoridade do sacerdote e o jugo de Jesus.',
          },
          {
            title: 'Casula',
            text: 'Roupa colorida usada apenas na missa.',
          },
          {
            title: 'Véu Umeral',
            text: 'Para segurar o Santíssimo com respeito.',
          },
          {
            title: 'Batina',
            text: 'Roupa preta do dia a dia, lembrando a entrega a Deus.',
          },
        ],
      },
      {
        type: 'callout',
        emoji: '✨',
        title: 'Tudo tem um significado',
        text: 'Cada objeto e paramento tem um nome, uma oração e um significado. Conhecer isso ajuda o servo a entender que tudo na liturgia é símbolo da presença de Deus.',
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

      case 'image':
        return (
          <figure key={index} className="mv-image-block">
            <img src={block.src} alt={block.alt} className="mv-image" />
            {block.caption && <figcaption className="mv-image-caption">{block.caption}</figcaption>}
          </figure>
        );

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
