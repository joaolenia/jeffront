import { useState, useEffect } from 'react';
import { Search, FileText, CheckCircle, Clock, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './FichasList.css';

export interface Ficha {
  id: number;
  clienteNome: string;
  compras: any[];
  pagamentos: any[];
  valorTotal: number;
  valorPago: number;
  status: string;
  dataCriacao?: string;
  dataAtualizacao?: string;
}

export function FichasList() {
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'ABERTA' | 'PAGA'>('TODOS');
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchFichas();
  }, []);

  const fetchFichas = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/fichas');
      setFichas(response.data);
    } catch (err) {
      console.error('Erro ao buscar fichas:', err);
      setError('Não foi possível carregar a lista de fichas. Verifique a conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
  };

  const fichasFiltradas = fichas.filter(ficha => {
    const matchesSearch = ficha.clienteNome?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'TODOS' || ficha.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="fichas-container">
      <div className="fichas-header">
        <div className="header-title">
          <div className="icon-wrapper">
            <FileText size={24} color="#2563eb" />
          </div>
          <h1>Contas de Clientes (Crediário)</h1>
        </div>
      </div>

      <div className="fichas-filters">
        <div className="search-wrapper">
          <Search size={20} className="search-icon" />
          <input 
            type="text" 
            placeholder="Pesquisar cliente por nome..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="status-filter">
          <label>Status:</label>
          <div className="select-wrapper">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
              <option value="TODOS">Todos</option>
              <option value="ABERTA">Abertas</option>
              <option value="PAGA">Pagas</option>
            </select>
          </div>
        </div>
      </div>

      {loading && (
        <div className="loading-state">
          <Loader2 size={40} className="spinner" />
          <p>Carregando clientes...</p>
        </div>
      )}

      {error && !loading && (
        <div className="error-state">
          <AlertCircle size={40} />
          <p>{error}</p>
          <button className="btn-retry" onClick={fetchFichas}>Tentar Novamente</button>
        </div>
      )}

      {!loading && !error && fichasFiltradas.length === 0 && (
        <div className="empty-state">
          <FileText size={48} opacity={0.3} />
          <p>Nenhuma ficha encontrada.</p>
        </div>
      )}

      {!loading && !error && fichasFiltradas.length > 0 && (
        <div className="fichas-grid">
          {fichasFiltradas.map(ficha => {
            const saldoDevedor = Number(ficha.valorTotal) - Number(ficha.valorPago);
            const isPaga = ficha.status === 'PAGA' || saldoDevedor <= 0;

            return (
              <div 
                key={ficha.id} 
                className={`ficha-card ${isPaga ? 'is-paga' : 'is-aberta'}`}
                onClick={() => navigate(`/fichas/${ficha.id}`)}
              >
                <div className="card-top">
                  <h3 title={ficha.clienteNome}>{ficha.clienteNome}</h3>
                  <span className={`status-badge ${isPaga ? 'badge-paga' : 'badge-aberta'}`}>
                    {isPaga ? <CheckCircle size={14} /> : <Clock size={14} />}
                    {isPaga ? 'PAGA' : 'ABERTA'}
                  </span>
                </div>

                <div className="card-footer">
                  <div className="saldo-info">
                    <span className="saldo-label">Saldo Devedor</span>
                    <span className={`saldo-value ${isPaga ? 'success' : 'danger'}`}>
                      {formatCurrency(saldoDevedor > 0 ? saldoDevedor : 0)}
                    </span>
                  </div>
                  <div className="action-icon">
                    <ChevronRight size={20} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}