import React, { useState } from 'react';
import { Search, User } from 'lucide-react';
import './Fichas.css';

// Dados falsos simulando seu banco de dados
const DADOS_FICHAS = [
  { id: 1, nome: 'João Silva', telefone: '(42) 99999-1111', totalDevido: 150.50, status: 'pendente' },
  { id: 2, nome: 'Maria Oliveira', telefone: '(42) 98888-2222', totalDevido: 0, status: 'paga' },
  { id: 3, nome: 'Carlos Souza', telefone: '(42) 97777-3333', totalDevido: 45.00, status: 'pendente' },
  { id: 4, nome: 'Ana Costa', telefone: '(42) 96666-4444', totalDevido: 320.00, status: 'pendente' },
];

interface FichasListProps {
  onSelectFicha: (id: number) => void;
}

export function FichasList({ onSelectFicha }: FichasListProps) {
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todas');

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  // Filtragem
  const fichasFiltradas = DADOS_FICHAS.filter(ficha => {
    const matchBusca = ficha.nome.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = filtroStatus === 'todas' || ficha.status === filtroStatus;
    return matchBusca && matchStatus;
  });

  return (
    <div className="fichas-container">
      <div className="fichas-header">
        <h2>Controle de Fichas</h2>
        <div className="fichas-controls">
          <div className="search-box">
            <Search size={18} color="#64748b" />
            <input 
              type="text" 
              placeholder="Buscar cliente..." 
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <select 
            className="filter-select"
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
          >
            <option value="todas">Todas as Fichas</option>
            <option value="pendente">Pendentes</option>
            <option value="paga">Pagas</option>
          </select>
        </div>
      </div>

      <div className="fichas-grid">
        {fichasFiltradas.map(ficha => (
          <div key={ficha.id} className="ficha-card" onClick={() => onSelectFicha(ficha.id)}>
            <div className="ficha-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={20} color="#64748b" />
                <h3>{ficha.nome}</h3>
              </div>
              <span className={`status-badge status-${ficha.status}`}>
                {ficha.status}
              </span>
            </div>
            <div className="ficha-card-body">
              <p>Telefone: {ficha.telefone}</p>
              <p className="ficha-total">
                {ficha.totalDevido > 0 ? formatCurrency(ficha.totalDevido) : 'Quitado'}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {fichasFiltradas.length === 0 && (
        <p style={{ textAlign: 'center', color: '#64748b', marginTop: '40px' }}>
          Nenhuma ficha encontrada.
        </p>
      )}
    </div>
  );
}