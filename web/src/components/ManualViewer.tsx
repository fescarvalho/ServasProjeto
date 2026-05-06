import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Download, AlertCircle, BookOpen } from 'lucide-react';
import './ManualViewer.css';

export function ManualViewer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const page = searchParams.get('page') || '1';
  const title = searchParams.get('title') || 'Manual da Serva';
  const manualUrl = '/materiais/manual-servos.pdf';

  // Monta a URL do PDF com a página de abertura (suporte no Chrome/Edge/Firefox)
  const pdfSrc = `${manualUrl}#page=${page}&toolbar=0&view=FitH`;

  return (
    <div className="viewer-container">
      <div className="viewer-header">
        <button className="back-btn" onClick={() => navigate('/formacao')}>
          <ChevronLeft size={24} />
          <span>Voltar</span>
        </button>

        <div className="viewer-title-block">
          <div className="viewer-module-label">
            <BookOpen size={14} />
            <span>Módulo</span>
          </div>
          <h2 className="viewer-title">{title}</h2>
        </div>

        <a href={manualUrl} download className="download-btn" title="Baixar PDF completo">
          <Download size={18} />
          <span className="mobile-hide">Baixar</span>
        </a>
      </div>

      {isMobile && (
        <div className="mobile-alert">
          <AlertCircle size={20} className="alert-icon" />
          <div>
            <strong>Dificuldade para visualizar?</strong>
            <p>Se não carregar, use o botão "Baixar" para ler no seu leitor de PDF.</p>
          </div>
        </div>
      )}

      <div className="iframe-wrapper">
        <iframe
          key={pdfSrc}
          src={pdfSrc}
          className="pdf-iframe"
          title={`Manual das Servas do Altar — ${title}`}
        />
      </div>
    </div>
  );
}
