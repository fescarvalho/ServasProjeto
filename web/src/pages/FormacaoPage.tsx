import { useNavigate } from 'react-router-dom';
import { Book, CalendarDays, BookOpenText, Users, Flame, Scissors, LogOut, Flower } from 'lucide-react';
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
  { id: '1', title: 'Preparação e Postura',         description: 'Como se preparar espiritualmente e fisicamente para servir.',       icon: Book,         color: '#7c3f20', emoji: '🙏' },
  { id: '2', title: 'O Ano Litúrgico e Cores',      description: 'Compreensão das estações litúrgicas e o significado das cores.',    icon: CalendarDays, color: '#5b3d8e', emoji: '🗓️' },
  { id: '3', title: 'Livros Sagrados e Marcações',  description: 'Manuseio do Missal Romano, Lecionários e Evangeliário.',           icon: BookOpenText, color: '#1a5c3a', emoji: '📖' },
  { id: '4', title: 'Gestos e Posturas Litúrgicas', description: 'Saber quando ajoelhar, sentar, inclinar e a reverência correta.',   icon: Users,        color: '#0d4f6e', emoji: '🤲' },
  { id: '5', title: 'Vestes Litúrgicas do Padre',   description: 'Os nomes e significados de cada peça que o padre veste na Missa.', icon: Scissors,     color: '#7a2d5e', emoji: '👘' },
  { id: '6', title: 'Uso do Turíbulo e da Naveta',  description: 'Técnicas e momentos corretos para a incensação.',                  icon: Flame,        color: '#6b4226', emoji: '🔥' },
  { id: '7', title: 'Objetos e Alfaias',             description: 'Identificação e cuidado com os vasos sagrados e linhos.',          icon: Book,         color: '#8a6900', emoji: '✝️' },
];

interface FormacaoPageProps {
  user: UserData;
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
        <button className="btn-logout-formacao" onClick={onLogout}>
          <LogOut size={18} />
          <span>Sair</span>
        </button>
      </div>

      <div className="formacao-header">
        <h1 className="formacao-title">Olá, {user?.name?.split(' ')[0]}</h1>
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
          &copy; {new Date().getFullYear()} Santuário Diocesano Nossa Senhora da Natividade - v5 (29/04/2026)
        </p>
      </footer>
    </div>
  );
}
