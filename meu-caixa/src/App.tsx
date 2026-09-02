import { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Monitor, ShoppingCart, Ticket, Package, Lock, BarChart3, Building, X, KeyRound, DownloadCloud } from 'lucide-react';
import { Pdv } from './components/Pdv';
import { FichasList } from './components/FichasList';
import { FichaDetalhes } from './components/FichaDetalhes';
import { Mercadorias } from './components/mercadorias/Mercadorias';
import MercadoriaDetalhes from './components/mercadorias/MercadoriaDetalhes'; 
import { Relatorios } from './components/Relatorios';
import Cofre from './components/cofre/Cofre';
import './App.css';
import './components/Header.css'; 
import { GlobalAlert } from './Alert';
import { Patrimonio } from './components/patrimonio/Patrimonio';
import { GlobalConfirm } from './Confirm';
import api from './api'; // <-- Importação da API para o Backup

// ================= CONFIGURAÇÃO DE SEGURANÇA =================
const SENHA_MESTRE = '591576'; 
// =============================================================

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  // Estados do Modal de Senha
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  // Função que intercepta os cliques do menu
  const handleNavClick = (path: string, requiresAuth: boolean = false) => {
    if (requiresAuth) {
      // Se a rota exige senha e a pessoa já não está nela, abre o modal
      setPendingRoute(path);
      setPasswordInput('');
      setPasswordError(false);
      setShowPasswordModal(true);
    } else {
      navigate(path);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Define a senha esperada com base na rota que está sendo acessada
    let isPasswordCorrect = false;
    if (pendingRoute === '/relatorios' || pendingRoute === 'backup') {
      isPasswordCorrect = passwordInput === 'y';
    } else {
      isPasswordCorrect = passwordInput === SENHA_MESTRE;
    }

    if (isPasswordCorrect) {
      setShowPasswordModal(false);
      
      // Se for a ação de backup, chama a API ao invés de navegar
      if (pendingRoute === 'backup') {
        try {
          const response = await api.post('/backup/local', { senha: passwordInput });
          alert(`Sucesso! O backup foi salvo na pasta:\n\n${response.data.caminho}`);
        } catch (error: any) {
          console.error(error);
          alert(error.response?.data?.message || 'Erro ao gerar backup. Verifique o backend.');
        }
      } 
      // Se for uma rota normal
      else if (pendingRoute) {
        navigate(pendingRoute);
      }
      setPendingRoute(null);
    } else {
      setPasswordError(true);
    }
  };

  return (
    <div className="app-container">
      <GlobalAlert />
      <GlobalConfirm />

      <header className="main-header hide-on-print">
        <div className="logo-container">
          <Monitor className="logo-icon" size={28} />
          <h1>Mercado <span>Bom Jesus</span></h1>
        </div>
        <nav className="nav-menu">
          <button 
            className={`nav-item ${isActive('/') ? 'active' : ''}`}
            onClick={() => handleNavClick('/', false)}
          >
            <ShoppingCart size={18} /> Caixa
          </button>
          
          <button 
            className={`nav-item ${isActive('/fichas') ? 'active' : ''}`}
            onClick={() => handleNavClick('/fichas', false)}
          >
            <Ticket size={18} /> Fichas
          </button>
          
          <button 
            className={`nav-item ${isActive('/mercadorias') ? 'active' : ''}`} 
            onClick={() => handleNavClick('/mercadorias', false)}
          >
            <Package size={18} /> Mercadorias
          </button>
          
          {/* Rotas Protegidas por Senha (requiresAuth = true) */}
          <button 
            className={`nav-item auth-required ${isActive('/cofre') ? 'active' : ''}`} 
            onClick={() => handleNavClick('/cofre', true)}
          >
            <Lock size={18} /> Cofre
          </button>
          
          <button 
            className={`nav-item auth-required ${isActive('/relatorios') ? 'active' : ''}`} 
            onClick={() => handleNavClick('/relatorios', true)}
          >
            <BarChart3 size={18} /> Relatórios
          </button>
          
          <button 
            className={`nav-item auth-required ${isActive('/patrimonio') ? 'active' : ''}`} 
            onClick={() => handleNavClick('/patrimonio', true)}
          >
            <Building size={18} /> Patrimonio
          </button>

          {/* Botão de Backup */}
          <button 
            className="nav-item auth-required" 
            onClick={() => handleNavClick('backup', true)}
          >
            <DownloadCloud size={18} /> Backup
          </button>
        </nav>
      </header>

      {/* Conteúdo Principal */}
      <Routes>
        <Route path="/" element={<Pdv />} />
        <Route path="/fichas" element={<FichasList />} />
        <Route path="/fichas/:id" element={<FichaDetalhes />} />
        <Route path="/mercadorias" element={<Mercadorias />} />
        <Route path="/mercadorias/:id" element={<MercadoriaDetalhes />} /> 
        <Route path="/relatorios" element={<Relatorios />} />
        <Route path="/cofre" element={<Cofre />} />
        <Route path="/patrimonio" element={<Patrimonio/>} />
      </Routes>

      {/* MODAL DE SENHA */}
      {showPasswordModal && (
        <div className="auth-modal-overlay" onMouseDown={(e) => {
          if (e.target === e.currentTarget) setShowPasswordModal(false);
        }}>
          <div className="auth-modal">
            <button className="auth-close-btn" onClick={() => setShowPasswordModal(false)}>
              <X size={20} />
            </button>
            <div className="auth-icon-container">
              <KeyRound size={32} className="auth-icon" />
            </div>
            <h2>Área Restrita</h2>
            <p>Por favor, insira a senha de administrador para acessar esta tela.</p>
            
            <form onSubmit={handlePasswordSubmit} className="auth-form">
              <input 
                type="password" 
                placeholder="Digite a senha..." 
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError(false);
                }}
                autoFocus
                className={passwordError ? 'input-error' : ''}
              />
              {passwordError && <span className="error-message">Senha incorreta. Tente novamente.</span>}
              
              <button type="submit" className="auth-submit-btn">
                Acessar
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export function App() {
  return <AppContent />;
}