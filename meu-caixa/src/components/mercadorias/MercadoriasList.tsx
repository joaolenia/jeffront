import  { useState } from 'react';
import { Search, Plus, Package } from 'lucide-react';
import type { Mercadoria } from './types';
import './MercadoriasList.css';

interface MercadoriasListProps {
  mercadorias: Mercadoria[];
  onSelect: (id: number) => void;
  onNovoCadastro: () => void;
}

export function MercadoriasList({ mercadorias, onSelect, onNovoCadastro }: MercadoriasListProps) {
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todas');

  const filtradas = mercadorias.filter(m => {
    const matchBusca = m.fornecedor.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = filtroStatus === 'todas' || m.status === filtroStatus;
    return matchBusca && matchStatus;
  });

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="mlist-container">
      <div className="mlist-header">
        <h2 className="mlist-title">Mercadorias Registradas</h2>
        <div className="mlist-controls">
          <div className="mlist-search">
            <Search size={18} color="#94a3b8" />
            <input 
              type="text" 
              placeholder="Buscar fornecedor..." 
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <select 
            className="mlist-select"
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
          >
            <option value="todas">Status: Todas</option>
            <option value="pendente">Pendentes</option>
            <option value="paga">Pagas</option>
          </select>
          <button className="mlist-btn-novo" onClick={onNovoCadastro}>
            <Plus size={18} /> Nova
          </button>
        </div>
      </div>

      <div className="mlist-grid">
        {filtradas.map(m => (
          <div key={m.id} className="mlist-card" onClick={() => onSelect(m.id)}>
            <div className="mlist-card-header">
              <div className="mlist-card-title">
                <Package size={20} color="#64748b" />
                {m.fornecedor}
              </div>
              <span className={`mlist-badge ${m.status}`}>{m.status}</span>
            </div>
            <div className="mlist-info">
              <p>Data: <strong>{m.data}</strong></p>
              <p>Boleto: <strong>{m.pagamento.boleto > 0 ? formatCurrency(m.pagamento.boleto) : 'Não possui'}</strong></p>
              <p className="mlist-total">{formatCurrency(m.valorTotal)}</p>
            </div>
          </div>
        ))}
        {filtradas.length === 0 && <p style={{color: '#64748b'}}>Nenhuma mercadoria encontrada.</p>}
      </div>
    </div>
  );
}