import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Clock, CheckCircle } from 'lucide-react';
import api from '../../api'; // Ajuste conforme seu projeto
import './MercadoriaDetalhes.css';

interface Parcela {
  numero: number;
  vencimento: string;
  valor: number;
  status: 'pendente' | 'pago';
  formaPagamento: string;
  dataPagamento?: string;
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

const MercadoriaDetalhes: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [mercadoria, setMercadoria] = useState<Mercadoria | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Estado para Modal de Pagamento
  const [parcelaSelecionada, setParcelaSelecionada] = useState<Parcela | null>(null);
  const [origemDinheiro, setOrigemDinheiro] = useState<'Caixa' | 'Cofre'>('Caixa');

  const carregarDetalhes = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/mercadorias/${id}`);
      setMercadoria(response.data);
    } catch (error) {
      console.error('Erro ao buscar detalhes', error);
      alert('Erro ao carregar detalhes da operação.');
      navigate('/mercadorias');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) carregarDetalhes();
  }, [id]);

  const handleExcluir = async () => {
    if (window.confirm(`Tem certeza que deseja excluir a nota de ${mercadoria?.fornecedorNome}?`)) {
      try {
        await api.delete(`/mercadorias/${id}`);
        alert('Operação excluída com sucesso.');
        navigate('/mercadorias');
      } catch (error) {
        console.error(error);
        alert('Erro ao excluir.');
      }
    }
  };

  const handlePagarParcela = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mercadoria || !parcelaSelecionada) return;

    try {
      // 1. Atualizar o array de parcelas mudando a selecionada para 'pago'
      const parcelasAtualizadas = mercadoria.parcelas.map(p => 
        p.numero === parcelaSelecionada.numero
          ? { 
              ...p, 
              status: 'pago' as const, 
              formaPagamento: origemDinheiro, 
              dataPagamento: new Date().toISOString().split('T')[0] 
            }
          : p
      );

      // 2. Verificar se todas estão pagas agora
      const todasPagas = parcelasAtualizadas.every(p => p.status === 'pago');

      // 3. Somar o valor pago no Caixa ou no Cofre
      const novoCaixa = origemDinheiro === 'Caixa' 
        ? Number(mercadoria.valorPagoCaixa) + Number(parcelaSelecionada.valor)
        : Number(mercadoria.valorPagoCaixa);
        
      const novoCofre = origemDinheiro === 'Cofre' 
        ? Number(mercadoria.valorPagoCofre) + Number(parcelaSelecionada.valor)
        : Number(mercadoria.valorPagoCofre);

      // 4. Construir o payload de atualização
      const payload = {
        parcelas: parcelasAtualizadas,
        valorPagoCaixa: novoCaixa,
        valorPagoCofre: novoCofre,
        statusGeral: todasPagas ? 'concluido' : 'pendente'
      };

      await api.patch(`/mercadorias/${id}`, payload);
      alert('Parcela baixada com sucesso!');
      setParcelaSelecionada(null);
      carregarDetalhes(); // Recarrega para obter dados atualizados

    } catch (error) {
      console.error(error);
      alert('Erro ao realizar o pagamento da parcela.');
    }
  };

  const formatCurrency = (value: number) => {
    return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  if (loading || !mercadoria) return <div className="detalhes-container">Carregando...</div>;

  return (
    <div className="detalhes-container">
      <button className="voltar-btn" onClick={() => navigate('/mercadorias')}>
        <ArrowLeft size={18} /> Voltar
      </button>

      <div className="detalhes-header">
        <div className="detalhes-title">
          <h1>{mercadoria.fornecedorNome}</h1>
          <p>Detalhes da operação • {new Date(mercadoria.dataOperacao).toLocaleDateString('pt-BR')}</p>
        </div>
        <button className="btn-excluir" onClick={handleExcluir}>
          <Trash2 size={16} /> Excluir Operação
        </button>
      </div>

      <div className="detalhes-grid">
        {/* Lado Esquerdo: Resumo */}
        <div className="card">
          <h2>Resumo da Nota</h2>
          
          <div className="resumo-list">
            <div className="resumo-item">
              <span>Status Geral</span>
              <span className={`badge ${mercadoria.statusGeral}`}>
                {mercadoria.statusGeral === 'pendente' ? <Clock size={12}/> : <CheckCircle size={12}/>}
                {mercadoria.statusGeral}
              </span>
            </div>
            
            <div className="resumo-item">
              <span>Pago via Caixa</span>
              <strong>{formatCurrency(mercadoria.valorPagoCaixa)}</strong>
            </div>

            <div className="resumo-item">
              <span>Pago via Cofre</span>
              <strong>{formatCurrency(mercadoria.valorPagoCofre)}</strong>
            </div>

            <div className="resumo-item highlight">
              <span>Em Boleto/Prazo</span>
              <span>{formatCurrency(mercadoria.valorPrazo)}</span>
            </div>
          </div>

          <div className="total-box">
            <span>Valor Total</span>
            <span className="valor">{formatCurrency(mercadoria.valorNota)}</span>
          </div>
        </div>

        {/* Lado Direito: Gestão de Parcelas */}
        <div className="card">
          <h2>Gestão de Parcelas</h2>
          
          {mercadoria.parcelas && mercadoria.parcelas.length > 0 ? (
            <table className="parcelas-table">
              <thead>
                <tr>
                  <th>Parc.</th>
                  <th>Vencimento</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {mercadoria.parcelas.map((parc) => (
                  <tr key={parc.numero}>
                    <td>{parc.numero}x</td>
                    <td>{new Date(parc.vencimento).toLocaleDateString('pt-BR')}</td>
                    <td><strong>{formatCurrency(parc.valor)}</strong></td>
                    <td>
                      <span className={`badge ${parc.status}`}>
                        {parc.status}
                      </span>
                    </td>
                    <td>
                      {parc.status === 'pendente' ? (
                        <button 
                          className="btn-baixar"
                          onClick={() => setParcelaSelecionada(parc)}
                        >
                          Baixar Parcela
                        </button>
                      ) : (
                        <span style={{ color: '#666', fontSize: '0.85rem' }}>Pago via {parc.formaPagamento}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: '#666' }}>Esta operação não possui parcelas a prazo registradas.</p>
          )}
        </div>
      </div>

      {/* Modal de Pagamento */}
      {parcelaSelecionada && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <h2>Baixar Parcela {parcelaSelecionada.numero}x</h2>
            <p style={{ marginBottom: '20px' }}>
              Confirmar o pagamento de <strong>{formatCurrency(parcelaSelecionada.valor)}</strong>?
            </p>
            
            <form onSubmit={handlePagarParcela}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Origem do Dinheiro:</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input 
                    type="radio" 
                    name="origem" 
                    value="Caixa" 
                    checked={origemDinheiro === 'Caixa'}
                    onChange={() => setOrigemDinheiro('Caixa')} 
                  />
                  <span>Caixa</span>
                </label>
                <label className="radio-label">
                  <input 
                    type="radio" 
                    name="origem" 
                    value="Cofre" 
                    checked={origemDinheiro === 'Cofre'}
                    onChange={() => setOrigemDinheiro('Cofre')} 
                  />
                  <span>Cofre</span>
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancelar" onClick={() => setParcelaSelecionada(null)}>Cancelar</button>
                <button type="submit" className="btn-salvar">Confirmar Pagamento</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MercadoriaDetalhes;