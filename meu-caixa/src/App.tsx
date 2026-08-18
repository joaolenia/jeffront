import { useState } from 'react';
import { Monitor, ShoppingCart, Ticket, Package, Lock, BarChart3 } from 'lucide-react';
import { Pdv } from './components/Pdv';
import { FichasList } from './components/FichasList';
import { FichaDetalhes } from './components/FichaDetalhes';
import { Mercadorias } from './components/mercadorias/Mercadorias';
import { Relatorios } from './components/Relatorios'; // Adicionada a importação dos Relatórios
import './App.css';
import './components/Header.css'; 

function App() {
  // Controla qual aba está ativa ('caixa', 'fichas', 'mercadorias', etc)
  const [abaAtiva, setAbaAtiva] = useState('caixa');
  
  // Se for null, mostra a lista. Se tiver um número, mostra os detalhes da ficha
  const [fichaSelecionadaId, setFichaSelecionadaId] = useState<number | null>(null);

  // Renderiza a tela correta com base no estado
  const renderContent = () => {
    if (abaAtiva === 'caixa') {
      return <Pdv />;
    }
    
    if (abaAtiva === 'fichas') {
      if (fichaSelecionadaId !== null) {
        return (
          <FichaDetalhes 
            fichaId={fichaSelecionadaId} 
            onVoltar={() => setFichaSelecionadaId(null)} 
          />
        );
      }
      return <FichasList onSelectFicha={(id) => setFichaSelecionadaId(id)} />;
    }

    if (abaAtiva === 'mercadorias') {
      return <Mercadorias />;
    }

    // Renderiza o módulo de Relatórios quando selecionado no Header
    if (abaAtiva === 'relatorios') {
      return <Relatorios />;
    }

    return <div style={{padding: 24}}><h1>Módulo em desenvolvimento...</h1></div>;
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
            className={`nav-item ${abaAtiva === 'caixa' ? 'active' : ''}`}
            onClick={() => setAbaAtiva('caixa')}
          >
            <ShoppingCart size={18} /> Caixa
          </button>
          
          <button 
            className={`nav-item ${abaAtiva === 'fichas' ? 'active' : ''}`}
            onClick={() => {
              setAbaAtiva('fichas');
              setFichaSelecionadaId(null); // Reseta para a lista ao clicar no menu
            }}
          >
            <Ticket size={18} /> Fichas
          </button>
          
          <button 
            className={`nav-item ${abaAtiva === 'mercadorias' ? 'active' : ''}`} 
            onClick={() => setAbaAtiva('mercadorias')}
          >
            <Package size={18} /> Mercadorias
          </button>
          
          <button 
            className={`nav-item ${abaAtiva === 'cofre' ? 'active' : ''}`} 
            onClick={() => setAbaAtiva('cofre')}
          >
            <Lock size={18} /> Cofre
          </button>
          
          <button 
            className={`nav-item ${abaAtiva === 'relatorios' ? 'active' : ''}`} 
            onClick={() => setAbaAtiva('relatorios')}
          >
            <BarChart3 size={18} /> Relatórios
          </button>
        </nav>
      </header>

      {/* Conteúdo Principal */}
      {renderContent()}
    </div>
  );
}

export default App;