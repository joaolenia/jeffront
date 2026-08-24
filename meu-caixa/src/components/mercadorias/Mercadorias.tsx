import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import api from '../../api';
import { MercadoriaCadastro } from './MercadoriaCadastro';
import './Mercadorias.css';

interface Parcela {
  numero: number;
  vencimento: string;
  valor: number;
  status: 'pendente' | 'pago';
  formaPagamento: string;
}

interface Mercadoria {
  id: number;
  fornecedorNome: string;
  valorNota: number;
  statusGeral: string;
  dataOperacao: string;
  observacao?: string;
  parcelas: Parcela[];
}

export const Mercadorias: React.FC = () => {
  const [mercadorias, setMercadorias] = useState<Mercadoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCadastroOpen, setIsCadastroOpen] = useState(false);
  
  // Estados para busca e filtros
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todas');
  
  const navigate = useNavigate();

  const fetchMercadorias = async () => {
    try {
      setLoading(true);
      const response = await api.get('/mercadorias');
      setMercadorias(response.data);
    } catch (error) {
      console.error('Erro ao buscar mercadorias', error);
      alert('Erro ao carregar a listagem.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMercadorias();
  }, []);

  const formatCurrency = (value: number) => {
    return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleSuccessCadastro = () => {
    setIsCadastroOpen(false);
    fetchMercadorias();
  };

  // Aplica os filtros na listagem exibida na tela
  const mercadoriasFiltradas = mercadorias.filter(merc => {
    const matchBusca = merc.fornecedorNome?.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = filtroStatus === 'todas' || merc.statusGeral?.toLowerCase() === filtroStatus;
    return matchBusca && matchStatus;
  });

  if (isCadastroOpen) {
    return (
      <div className="mercadorias-overlay">
        <MercadoriaCadastro 
          onSuccess={handleSuccessCadastro} 
          onCancelar={() => setIsCadastroOpen(false)} 
        />
      </div>
    );
  }

  return (
    <div className="mercadorias-container">
      <div className="mercadorias-header">
        <div>
          <h1>Mercadorias e Notas</h1>
          <p>Gerencie as entradas e pagamentos a fornecedores</p>
        </div>
        
        <div className="mercadorias-controls">
          <div className="mercadorias-search">
            <Search size={18} color="#94a3b8" />
            <input 
              type="text" 
              placeholder="Buscar fornecedor..." 
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          
          <select 
            className="mercadorias-select"
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
          >
            <option value="todas">Status: Todas</option>
            <option value="pendente">Pendentes</option>
            <option value="concluido">Concluídas</option>
          </select>
          
          <button className="btn-novo" onClick={() => setIsCadastroOpen(true)}>
            + Nova Operação
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Carregando operações...</div>
      ) : mercadorias.length === 0 ? (
        <div className="empty-state">Nenhuma operação cadastrada ainda.</div>
      ) : mercadoriasFiltradas.length === 0 ? (
        <div className="empty-state">Nenhuma operação encontrada para os filtros aplicados.</div>
      ) : (
        <div className="mercadorias-grid">
          {mercadoriasFiltradas.map(merc => (
            <div 
              key={merc.id} 
              className="mercadoria-card"
              onClick={() => navigate(`/mercadorias/${merc.id}`)}
            >
              <div className="card-header">
                <h3>{merc.fornecedorNome}</h3>
                <span className={`status-badge ${merc.statusGeral?.toLowerCase()}`}>
                  {merc.statusGeral}
                </span>
              </div>
              
              {merc.observacao && (
                <div className="card-obs">{merc.observacao}</div>
              )}

              <div className="card-body">
                <div className="info-group">
                  <label>Valor Total</label>
                  <strong>{formatCurrency(merc.valorNota)}</strong>
                </div>
                <div className="info-group">
                  <label>Data</label>
                  <span>{new Date(merc.dataOperacao + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};