import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { MercadoriaCadastro } from './MercadoriaCadastro'; // Certifique-se do caminho correto
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
  const navigate = useNavigate();

  const fetchMercadorias = async () => {
    try {
      setLoading(true);
      const response = await api.get('/mercadorias');
      setMercadorias(response.data);
    } catch (error) {
      console.error('Erro ao buscar mercadorias', error);
      alert('Erro ao carregar a listagem de mercadorias.');
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
    fetchMercadorias(); // Recarrega a tabela imediatamente após salvar
  };

  // Se a tela de cadastro estiver aberta, exibimos ela com um overlay escuro
  if (isCadastroOpen) {
    return (
      <div className="mercadorias-container" style={{ position: 'relative' }}>
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <MercadoriaCadastro 
            onSuccess={handleSuccessCadastro} 
            onCancelar={() => setIsCadastroOpen(false)} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mercadorias-container">
      <div className="mercadorias-header">
        <h1>Controle de Mercadorias / Notas</h1>
        <button className="btn-novo" onClick={() => setIsCadastroOpen(true)}>
          + Nova Operação
        </button>
      </div>

      {loading ? (
        <p>Carregando operações...</p>
      ) : mercadorias.length === 0 ? (
        <div className="empty-state">Nenhuma operação cadastrada.</div>
      ) : (
        <div className="mercadorias-table-container">
          <table className="mercadorias-table">
            <thead>
              <tr>
                <th>Fornecedor</th>
                <th>Data</th>
                <th>Valor Total</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {mercadorias.map(merc => (
                <tr key={merc.id}>
                  <td>
                    <strong>{merc.fornecedorNome}</strong>
                    {merc.observacao && (
                       <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px' }}>{merc.observacao}</div>
                    )}
                  </td>
                  <td>{new Date(merc.dataOperacao).toLocaleDateString('pt-BR')}</td>
                  <td>{formatCurrency(merc.valorNota)}</td>
                  <td>
                    <span className={`status-badge ${merc.statusGeral}`}>
                      {merc.statusGeral}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn-detalhes"
                      onClick={() => navigate(`/mercadorias/${merc.id}`)}
                    >
                      Ver Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};