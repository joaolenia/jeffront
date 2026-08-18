import React, { useState } from 'react';
import { 
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  Package, 
  FileText 
} from 'lucide-react';
import './Relatorios.css';

type ReportType = 'vendas' | 'entradas' | 'saidas' | 'crediario' | 'mercadorias';

export function Relatorios() {
  const [activeReport, setActiveReport] = useState<ReportType>('vendas');

  const menuItems = [
    { id: 'vendas', label: 'Vendas', icon: <PieChart size={20} /> },
    { id: 'entradas', label: 'Entradas', icon: <TrendingUp size={20} /> },
    { id: 'saidas', label: 'Saídas', icon: <TrendingDown size={20} /> },
    { id: 'crediario', label: 'Crediário', icon: <CreditCard size={20} /> },
    { id: 'mercadorias', label: 'Mercadorias', icon: <Package size={20} /> },
  ];

  const activeLabel = menuItems.find(item => item.id === activeReport)?.label;

  return (
    <div className="relatorios-container">
      
      <aside className="relatorios-sidebar neo-panel">
        <div className="sidebar-header">
          <FileText className="icon-glow" size={24} />
          <h2>Modelos</h2>
        </div>
        
        <nav className="sidebar-menu">
          {menuItems.map(item => (
            <button
              key={item.id}
              className={`menu-item ${activeReport === item.id ? 'active' : ''}`}
              onClick={() => setActiveReport(item.id as ReportType)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="relatorios-content neo-panel">
        <header className="content-header">
          <h2>Relatório de {activeLabel}</h2>
          <p>Utilize os filtros abaixo para analisar os dados de {activeLabel?.toLowerCase()}.</p>
        </header>
        
        <div className="report-placeholder">
          <div className="placeholder-content">
            <FileText size={48} className="placeholder-icon" />
            <p>
              O componente do relatório de <strong>{activeLabel}</strong> será renderizado neste espaço.
            </p>
          </div>
        </div>
      </main>

    </div>
  );
}