import React, { useState } from 'react';
import { Search, User } from 'lucide-react';
import './FichasList.css';

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

  const fichasFiltradas = DADOS_FICHAS.filter(ficha => {
    const matchBusca = ficha.nome.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = filtroStatus === 'todas' || ficha.status === filtroStatus;
    return matchBusca && matchStatus;
  });

  return (
    <div className="fichas-list-container">
      <div className="fichas-list-header">
        <h2 className="fichas-list-title">Fichas de Clientes</h2>
        <div className="fichas-list-controls">
          <div className="fichas-list-search">
            <Search size={20} color="#94a3b8" />
            <input 
              type="text" 
              placeholder="Pesquisar cliente..." 
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <select 
            className="fichas-list-filter"
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
          >
            <option value="todas">Status: Todos</option>
            <option value="pendente">Pendentes</option>
            <option value="paga">Pagas</option>
          </select>
        </div>
      </div>

      <div className="fichas-list-grid">
        {fichasFiltradas.map(ficha => (
          <div key={ficha.id} className="fichas-list-card" onClick={() => onSelectFicha(ficha.id)}>
            <div className="fichas-list-card-header">
              <div className="fichas-list-card-title">
                <div className="fichas-list-avatar">
                  <User size={20} color="#3b82f6" />
                </div>
                <h3>{ficha.nome}</h3>
              </div>
              <span className={`fichas-list-badge ${ficha.status === 'pendente' ? 'pendente' : 'paga'}`}>
                {ficha.status}
              </span>
            </div>
            <div className="fichas-list-card-body">
              <p>Contato: <span>{ficha.telefone}</span></p>
              <p className="fichas-list-total">
                {ficha.totalDevido > 0 ? formatCurrency(ficha.totalDevido) : 'Quitado'}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {fichasFiltradas.length === 0 && (
        <div className="fichas-list-empty">
          <p>Nenhum cliente encontrado com os filtros atuais.</p>
        </div>
      )}
    </div>
  );
}