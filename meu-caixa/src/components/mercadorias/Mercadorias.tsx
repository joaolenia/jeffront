import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api'; // Ajuste conforme seu projeto
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
  valorPagoCaixa: number;
  valorPagoCofre: number;
  valorPrazo: number;
  statusGeral: string;
  dataOperacao: string;
  parcelas: Parcela[];
}

const Mercadorias: React.FC = () => {
  const [mercadorias, setMercadorias] = useState<Mercadoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  // Estados do Formulário
  const [fornecedor, setFornecedor] = useState('');
  const [dataOperacao, setDataOperacao] = useState(new Date().toISOString().split('T')[0]);
  const [valorNota, setValorNota] = useState<number>(0);
  const [pagoCaixa, setPagoCaixa] = useState<number>(0);
  const [pagoCofre, setPagoCofre] = useState<number>(0);
  const [qtdParcelas, setQtdParcelas] = useState<number>(0);

  const valorPrazo = valorNota - (pagoCaixa + pagoCofre);

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fornecedor || valorNota <= 0) {
      alert('Preencha os campos obrigatórios.');
      return;
    }

    if (valorPrazo < 0) {
      alert('A soma dos pagamentos à vista excede o valor da nota.');
      return;
    }

    // Geração automática das parcelas caso haja prazo
    const parcelasGeradas: Parcela[] = [];
    if (valorPrazo > 0 && qtdParcelas > 0) {
      const valorParcela = valorPrazo / qtdParcelas;
      for (let i = 1; i <= qtdParcelas; i++) {
        const dataVenc = new Date(dataOperacao);
        dataVenc.setMonth(dataVenc.getMonth() + i);
        
        parcelasGeradas.push({
          numero: i,
          vencimento: dataVenc.toISOString().split('T')[0],
          valor: Number(valorParcela.toFixed(2)),
          status: 'pendente',
          formaPagamento: 'Boleto' // Padrão inicial
        });
      }
    }

    const payload = {
      fornecedorNome: fornecedor,
      valorNota,
      valorPagoCaixa: pagoCaixa,
      valorPagoCofre: pagoCofre,
      valorPrazo,
      statusGeral: valorPrazo > 0 ? 'pendente' : 'concluido',
      dataOperacao,
      parcelas: parcelasGeradas,
    };

    try {
      await api.post('/mercadorias', payload);
      alert('Operação registrada com sucesso!');
      setIsModalOpen(false);
      resetForm();
      fetchMercadorias();
    } catch (error) {
      console.error('Erro ao salvar', error);
      alert('Erro ao salvar a mercadoria/nota.');
    }
  };

  const resetForm = () => {
    setFornecedor('');
    setValorNota(0);
    setPagoCaixa(0);
    setPagoCofre(0);
    setQtdParcelas(0);
  };

  return (
    <div className="mercadorias-container">
      <div className="mercadorias-header">
        <h1>Controle de Mercadorias / Notas</h1>
        <button className="btn-novo" onClick={() => setIsModalOpen(true)}>+ Nova Operação</button>
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
                  <td><strong>{merc.fornecedorNome}</strong></td>
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

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Registrar Entrada de Nota</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Nome do Fornecedor</label>
                <input type="text" value={fornecedor} onChange={e => setFornecedor(e.target.value)} required />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Data da Operação</label>
                  <input type="date" value={dataOperacao} onChange={e => setDataOperacao(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Valor da Nota (R$)</label>
                  <input type="number" step="0.01" value={valorNota || ''} onChange={e => setValorNota(Number(e.target.value))} required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Pago à vista (Caixa)</label>
                  <input type="number" step="0.01" value={pagoCaixa || ''} onChange={e => setPagoCaixa(Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label>Pago à vista (Cofre)</label>
                  <input type="number" step="0.01" value={pagoCofre || ''} onChange={e => setPagoCofre(Number(e.target.value))} />
                </div>
              </div>

              {valorPrazo > 0 && (
                <div className="form-group">
                  <label>Gerar Parcelas para o Prazo ({formatCurrency(valorPrazo)})</label>
                  <input type="number" min="0" max="24" value={qtdParcelas || ''} onChange={e => setQtdParcelas(Number(e.target.value))} placeholder="Ex: 3" />
                  
                  {qtdParcelas > 0 && (
                    <div className="parcelas-preview">
                      Serão geradas {qtdParcelas} parcelas de {formatCurrency(valorPrazo / qtdParcelas)}
                    </div>
                  )}
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn-cancelar" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-salvar">Salvar Operação</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Mercadorias;