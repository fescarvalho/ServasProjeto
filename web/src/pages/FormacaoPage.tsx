import { useNavigate } from 'react-router-dom';
import { Building2, Cross, CalendarDays, BookOpenText, Flower, LogOut, Shield } from 'lucide-react';
import { UserData } from '../types/types';
import './FormacaoPage.css';

interface Module {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  emoji: string;
}

const MODULES: Module[] = [
  {
    id: '1',
    title: 'Identidade e Missão do Servidor',
    description: 'O que significa servir, a origem histórica do ministério e as diferenças entre Coroinha, Servo e Acólito.',
    icon: Shield,
    color: '#5b2d8e',
    emoji: '🕊️',
  },
  {
    id: '2',
    title: 'Estrutura da Igreja',
    description: 'Nave, Presbitério, Altar, Ambão, Sacrário e os demais espaços sagrados.',
    icon: Building2,
    color: '#4a2c6e',
    emoji: '⛪',
  },
  {
    id: '3',
    title: 'A Santa Missa Parte por Parte',
    description: 'Ritos Iniciais, Liturgia da Palavra, Liturgia Eucarística e Ritos Finais.',
    icon: Cross,
    color: '#7c3f20',
    emoji: '✝️',
  },
  {
    id: '4',
    title: 'Liturgia – Tempos e Cores',
    description: 'O Ano Litúrgico, as cores dos paramentos e os tempos da Igreja.',
    icon: CalendarDays,
    color: '#1a5c3a',
    emoji: '🗓️',
  },
  {
    id: '5',
    title: 'Livros, Objetos e Paramentos',
    description: 'Missal Romano, Lecionários, alfaias e os paramentos do sacerdote.',
    icon: BookOpenText,
    color: '#8a6900',
    emoji: '📖',
  },
];

interface FormacaoPageProps {
  user: UserData | null;
  onLogout: () => void;
}

export function FormacaoPage({ user, onLogout }: FormacaoPageProps) {
  const navigate = useNavigate();

  return (
    <div className="formacao-container">
      <div className="formacao-topbar">
        <div className="formacao-brand">
          <Flower size={24} color="var(--color-primary)" />
          <span>Servos do Altar</span>
        </div>
        {user && (
          <button className="btn-logout-formacao" onClick={onLogout}>
            <LogOut size={18} />
            <span>Sair</span>
          </button>
        )}
      </div>

      <div className="formacao-header">
        <h1 className="formacao-title">{user ? `Olá, ${user.name?.split(' ')[0]}` : 'Formação'}</h1>
        <p className="formacao-subtitle">Sua jornada de preparação para servir ao Altar do Senhor.</p>
      </div>

      <div className="modules-grid">
        {MODULES.map((mod) => (
          <div
            key={mod.id}
            className="module-card accessible"
            onClick={() => navigate(`/formacao/modulo/${mod.id}`)}
            style={{ borderTop: `4px solid ${mod.color}` }}
          >
            <div className="module-icon-wrapper">
              <mod.icon size={28} className="module-icon-active" style={{ color: mod.color }} />
            </div>

            <div className="module-content">
              <h3>{mod.emoji} {mod.title}</h3>
              <p>{mod.description}</p>
              <div className="module-open-hint" style={{ color: mod.color }}>Toque para estudar →</div>
            </div>
          </div>
        ))}
      </div>

      <footer className="app-footer" style={{ width: "100%", boxSizing: "border-box" }}>
        <p>
          Desenvolvido por <a href="https://fescarvpage.vercel.app/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-danger)", textDecoration: "none", fontWeight: "bold" }}>Fernando Carvalho</a>
        </p>
        <p style={{ marginTop: "5px", opacity: 0.7 }}>
          &copy; {new Date().getFullYear()} Santuário Diocesano Nossa Senhora da Natividade
        </p>
      </footer>
    </div>
  );
}
