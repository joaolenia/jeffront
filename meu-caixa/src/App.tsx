import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Monitor, ShoppingCart, Ticket, Package, Lock, BarChart3 } from 'lucide-react';
import { Pdv } from './components/Pdv';
import { FichasList } from './components/FichasList';
import { FichaDetalhes } from './components/FichaDetalhes';
import { Mercadorias } from './components/mercadorias/Mercadorias';
import MercadoriaDetalhes from './components/mercadorias/MercadoriaDetalhes'; // <-- Nova importação adicionada
import { Relatorios } from './components/Relatorios';
import './App.css';
import './components/Header.css'; 

// Componente interno para podermos usar os hooks (useNavigate, useLocation)
function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  // Função para verificar se a rota atual corresponde ao botão do menu para ativá-lo
  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="app-container">
      {/* Header integrado para permitir navegação */}
      <header className="main-header hide-on-print">
        <div className="logo-container">
          <Monitor className="logo-icon" size={28} />
          <h1>Mercado <span>Bom Jesus</span></h1>
        </div>
        <nav className="nav-menu">
          <button 
            className={`nav-item ${isActive('/') ? 'active' : ''}`}
            onClick={() => navigate('/')}
          >
            <ShoppingCart size={18} /> Caixa
          </button>
          
          <button 
            className={`nav-item ${isActive('/fichas') ? 'active' : ''}`}
            onClick={() => navigate('/fichas')}
          >
            <Ticket size={18} /> Fichas
          </button>
          
          <button 
            className={`nav-item ${isActive('/mercadorias') ? 'active' : ''}`} 
            onClick={() => navigate('/mercadorias')}
          >
            <Package size={18} /> Mercadorias
          </button>
          
          <button 
            className={`nav-item ${isActive('/cofre') ? 'active' : ''}`} 
            onClick={() => navigate('/cofre')}
          >
            <Lock size={18} /> Cofre
          </button>
          
          <button 
            className={`nav-item ${isActive('/relatorios') ? 'active' : ''}`} 
            onClick={() => navigate('/relatorios')}
          >
            <BarChart3 size={18} /> Relatórios
          </button>
        </nav>
      </header>

      {/* Conteúdo Principal gerenciado pelo React Router */}
      <Routes>
        <Route path="/" element={<Pdv />} />
        
        {/* Rotas de Fichas */}
        <Route path="/fichas" element={<FichasList />} />
        <Route path="/fichas/:id" element={<FichaDetalhes />} />
        
        {/* Rotas de Mercadorias */}
        <Route path="/mercadorias" element={<Mercadorias />} />
        <Route path="/mercadorias/:id" element={<MercadoriaDetalhes />} /> {/* <-- Nova Rota Adicionada */}
        
        {/* Outras Rotas */}
        <Route path="/relatorios" element={<Relatorios />} />
        <Route path="/cofre" element={<div style={{padding: 24}}><h1>Módulo em desenvolvimento...</h1></div>} />
      </Routes>
    </div>
  );
}

// O componente raiz agora apenas exporta o AppContent, 
// pois o BrowserRouter já está lá no main.tsx
export function App() {
  return <AppContent />;
}