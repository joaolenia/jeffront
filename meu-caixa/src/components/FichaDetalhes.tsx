import  { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, DollarSign, AlertCircle, Loader2, CheckCircle, Trash2 } from 'lucide-react';
import api from '../api';
import './FichaDetalhes.css';
import type { Ficha } from './FichasList';

type ModoPagamento = 'INTEGRAL' | 'PARCIAL';
type FormaPagamento = 'Dinheiro' | 'Cartão' | 'Pix';

export function FichaDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de Pagamento
  const [modoPagamento, setModoPagamento] = useState<ModoPagamento>('INTEGRAL');
  const [valorDigitado, setValorDigitado] = useState<string>('');
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('Dinheiro');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados de Exclusão
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) fetchFicha(id);
  }, [id]);

  const fetchFicha = async (fichaId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/fichas/${fichaId}`);
      setFicha(response.data);
    } catch (err) {
      console.error('Erro ao buscar ficha:', err);
      setError('Ficha não encontrada ou erro no servidor.');
    } finally {
      setLoading(false);
    }
  };

  const saldoDevedor = ficha ? Number(ficha.valorTotal) - Number(ficha.valorPago) : 0;

  const handleEfetuarPagamento = async () => {
    if (!ficha || isSubmitting) return;

    let valorParaPagar = 0;
    
    if (modoPagamento === 'INTEGRAL') {
      valorParaPagar = saldoDevedor;
    } else {
      valorParaPagar = parseFloat(valorDigitado.replace(',', '.'));
    }

    if (isNaN(valorParaPagar) || valorParaPagar <= 0) {
      alert('Informe um valor de pagamento válido.');
      return;
    }

    if (valorParaPagar > saldoDevedor) {
      alert('O valor do pagamento não pode ser maior que o saldo devedor.');
      return;
    }

    setIsSubmitting(true);

    const novoPagamento = {
      data: new Date().toISOString(),
      forma: formaPagamento,
      valor: valorParaPagar
    };

    const novoValorPago = Number(ficha.valorPago) + valorParaPagar;
    const novoStatus = novoValorPago >= Number(ficha.valorTotal) ? 'PAGA' : 'ABERTA';

    try {
      await api.patch(`/fichas/${ficha.id}`, {
        pagamentos: [...(ficha.pagamentos || []), novoPagamento],
        valorPago: novoValorPago,
        status: novoStatus
      });

      alert('Pagamento registrado com sucesso!');
      setValorDigitado('');
      fetchFicha(ficha.id.toString()); // Recarrega os dados
    } catch (err) {
      console.error('Erro ao registrar pagamento:', err);
      alert('Erro ao registrar pagamento. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExcluirFicha = async () => {
    if (!ficha) return;
    setIsDeleting(true);
    try {
      await api.delete(`/fichas/${ficha.id}`);
      alert('Ficha excluída com sucesso.');
      navigate('/fichas');
    } catch (err) {
      console.error('Erro ao excluir ficha:', err);
      alert('Erro ao excluir ficha. Verifique se existem restrições no backend.');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="ficha-details-container center">
        <Loader2 size={40} className="spinner" />
        <p>Carregando dados da ficha...</p>
      </div>
    );
  }

  if (error || !ficha) {
    return (
      <div className="ficha-details-container center error-state">
        <AlertCircle size={40} />
        <h2>Ops!</h2>
        <p>{error}</p>
        <button className="btn-back" onClick={() => navigate('/fichas')}>Voltar para Lista</button>
      </div>
    );
  }

  const isPaga = ficha.status === 'PAGA' || saldoDevedor <= 0;

  return (
    <div className="ficha-details-container">
      {/* HEADER */}
      <div className="details-header">
        <button className="btn-icon" onClick={() => navigate('/fichas')} title="Voltar">
          <ArrowLeft size={24} />
        </button>
        <div className="client-info">
          <User size={28} color="#3b82f6" />
          <h1>{ficha.clienteNome}</h1>
          <span className={`status-badge ${isPaga ? 'badge-paga' : 'badge-aberta'}`}>
            {isPaga ? 'PAGA' : 'ABERTA'}
          </span>
        </div>
        <button 
          className="btn-delete-header" 
          onClick={() => setShowDeleteConfirm(true)}
        >
          <Trash2 size={20} /> Excluir Ficha
        </button>
      </div>

      {/* CONFIRMAÇÃO DE EXCLUSÃO */}
      {showDeleteConfirm && (
        <div className="delete-alert">
          <AlertCircle size={24} color="#ef4444" />
          <div className="delete-text">
            <strong>Excluir ficha?</strong>
            <p>Tem certeza que deseja excluir a ficha de <b>{ficha.clienteNome}</b>? Essa ação não poderá ser desfeita.</p>
          </div>
          <div className="delete-actions">
            <button className="btn-cancelar" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>Cancelar</button>
            <button className="btn-excluir" onClick={handleExcluirFicha} disabled={isDeleting}>
              {isDeleting ? 'Excluindo...' : 'Sim, Excluir'}
            </button>
          </div>
        </div>
      )}

      <div className="details-grid">
        
        {/* LADO ESQUERDO: TABELAS */}
        <div className="left-panel">
          
          <div className="card-section">
            <h2>Histórico de Compras</h2>
            {(!ficha.compras || ficha.compras.length === 0) ? (
              <p className="text-muted">Nenhuma compra registrada.</p>
            ) : (
              <div className="table-wrapper">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Resumo dos Itens</th>
                      <th style={{ textAlign: 'right' }}>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ficha.compras.map((compra, index) => (
                      <tr key={index}>
                        <td>{formatDate(compra.data)}</td>
                        <td>{compra.resumoItens || 'Itens diversos'}</td>
                        <td style={{ textAlign: 'right', fontWeight: '500' }}>{formatCurrency(compra.valor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card-section">
            <h2>Histórico de Pagamentos</h2>
            {(!ficha.pagamentos || ficha.pagamentos.length === 0) ? (
              <p className="text-muted">Nenhum pagamento realizado.</p>
            ) : (
              <div className="table-wrapper">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Forma</th>
                      <th style={{ textAlign: 'right' }}>Valor Pago</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ficha.pagamentos.map((pag, index) => (
                      <tr key={index}>
                        <td>{formatDate(pag.data)}</td>
                        <td>{pag.forma}</td>
                        <td style={{ textAlign: 'right', color: '#16a34a', fontWeight: 'bold' }}>
                          + {formatCurrency(pag.valor)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* LADO DIREITO: ACERTO */}
        <div className="right-panel">
          <div className="payment-card">
            <h2 className="payment-title">Acerto de Conta</h2>
            
            <div className="debt-display">
              <span className="debt-label">Saldo Devedor Atual</span>
              <div className={`debt-value ${isPaga ? 'success' : 'danger'}`}>
                {formatCurrency(saldoDevedor > 0 ? saldoDevedor : 0)}
              </div>
            </div>

            <div className="debt-summary">
              <div className="summary-line">
                <span>Total Comprado:</span>
                <strong>{formatCurrency(ficha.valorTotal)}</strong>
              </div>
              <div className="summary-line">
                <span>Total Pago:</span>
                <strong className="success">{formatCurrency(ficha.valorPago)}</strong>
              </div>
            </div>

            {!isPaga && (
              <div className="payment-form">
                <h3>Realizar Pagamento</h3>
                
                <div className="payment-mode-toggles">
                  <button 
                    className={`toggle-btn ${modoPagamento === 'INTEGRAL' ? 'active' : ''}`}
                    onClick={() => setModoPagamento('INTEGRAL')}
                  >
                    Valor Integral
                  </button>
                  <button 
                    className={`toggle-btn ${modoPagamento === 'PARCIAL' ? 'active' : ''}`}
                    onClick={() => setModoPagamento('PARCIAL')}
                  >
                    Valor Parcial
                  </button>
                </div>

                <div className="input-group">
                  <label>Valor a Pagar (R$)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={modoPagamento === 'INTEGRAL' ? saldoDevedor.toFixed(2) : valorDigitado}
                    onChange={(e) => setValorDigitado(e.target.value)}
                    disabled={modoPagamento === 'INTEGRAL' || isSubmitting}
                    placeholder="0.00"
                  />
                </div>

                <div className="input-group">
                  <label>Forma de Recebimento</label>
                  <select 
                    value={formaPagamento} 
                    onChange={(e) => setFormaPagamento(e.target.value as FormaPagamento)}
                    disabled={isSubmitting}
                  >
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Cartão">Cartão</option>
                    <option value="Pix">Pix</option>
                  </select>
                </div>

                <button 
                  className="btn-confirm-payment" 
                  onClick={handleEfetuarPagamento}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 size={24} className="spinner" /> : <DollarSign size={24} />}
                  Confirmar Pagamento
                </button>
              </div>
            )}

            {isPaga && (
              <div className="paid-success-message">
                <CheckCircle size={48} color="#16a34a" />
                <h3>Conta Quitada</h3>
                <p>Não há pendências financeiras para este cliente no momento.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}