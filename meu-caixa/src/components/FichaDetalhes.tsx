import  { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, DollarSign, AlertCircle, Loader2, CheckCircle, Trash2, Wallet } from 'lucide-react';
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
  
  const [modoPagamento, setModoPagamento] = useState<ModoPagamento>('INTEGRAL');
  const [valorDigitado, setValorDigitado] = useState<string>('');
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('Dinheiro');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      fetchFicha(ficha.id.toString());
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

  if (loading) return (
    <div className="fd-centered-state"><Loader2 size={40} className="spinner" /><p>Carregando dados da ficha...</p></div>
  );

  if (error || !ficha) return (
    <div className="fd-centered-state fd-error"><AlertCircle size={40} /><h2>Ops!</h2><p>{error}</p><button className="btn-primary" onClick={() => navigate('/fichas')}>Voltar</button></div>
  );

  const isPaga = ficha.status === 'PAGA' || saldoDevedor <= 0;

  return (
    <div className="fd-container">
      {/* HEADER SUPERIOR */}
      <div className="fd-header">
        <div className="fd-header-left">
          <button className="btn-back" onClick={() => navigate('/fichas')} title="Voltar">
            <ArrowLeft size={22} />
          </button>
          <div className="fd-avatar">
            <User size={24} color="#2563eb" />
          </div>
          <div className="fd-title-group">
            <h1>{ficha.clienteNome}</h1>
            <span className={`fd-badge ${isPaga ? 'fd-badge-paga' : 'fd-badge-aberta'}`}>
              {isPaga ? 'CONTA PAGA' : 'CONTA ABERTA'}
            </span>
          </div>
        </div>
        <button className="btn-delete" onClick={() => setShowDeleteConfirm(true)}>
          <Trash2 size={18} /> <span>Excluir Ficha</span>
        </button>
      </div>

      {/* CONFIRMAÇÃO DE EXCLUSÃO ESTILO ALERT INLINE */}
      {showDeleteConfirm && (
        <div className="fd-alert-box">
          <div className="fd-alert-icon"><AlertCircle size={24} /></div>
          <div className="fd-alert-content">
            <strong>Excluir conta definitivamente?</strong>
            <p>A ficha de <b>{ficha.clienteNome}</b> será apagada permanentemente. Esta ação não tem volta.</p>
          </div>
          <div className="fd-alert-actions">
            <button className="btn-alert-cancel" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>Cancelar</button>
            <button className="btn-alert-confirm" onClick={handleExcluirFicha} disabled={isDeleting}>
              {isDeleting ? <Loader2 size={16} className="spinner" /> : 'Sim, excluir'}
            </button>
          </div>
        </div>
      )}

      {/* CONTEÚDO PRINCIPAL EM GRID */}
      <div className="fd-grid">
        
        {/* COLUNA ESQUERDA: HISTÓRICO */}
        <div className="fd-col-left">
          <div className="fd-card">
            <div className="fd-card-header">
              <h2>Histórico de Compras</h2>
            </div>
            <div className="fd-card-body">
              {(!ficha.compras || ficha.compras.length === 0) ? (
                <div className="fd-empty-list">Nenhuma compra registrada.</div>
              ) : (
                <div className="fd-table-responsive">
                  <table className="fd-table">
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Resumo dos Itens</th>
                        <th className="text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ficha.compras.map((compra, index) => (
                        <tr key={index}>
                          <td>{formatDate(compra.data)}</td>
                          <td>{compra.resumoItens || 'Itens diversos'}</td>
                          <td className="text-right fw-bold">{formatCurrency(compra.valor)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="fd-card">
            <div className="fd-card-header">
              <h2>Histórico de Pagamentos</h2>
            </div>
            <div className="fd-card-body">
              {(!ficha.pagamentos || ficha.pagamentos.length === 0) ? (
                <div className="fd-empty-list">Nenhum pagamento realizado ainda.</div>
              ) : (
                <div className="fd-table-responsive">
                  <table className="fd-table">
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Forma</th>
                        <th className="text-right">Valor Pago</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ficha.pagamentos.map((pag, index) => (
                        <tr key={index}>
                          <td>{formatDate(pag.data)}</td>
                          <td><span className="fd-tag">{pag.forma}</span></td>
                          <td className="text-right fw-bold text-green">
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
        </div>

        {/* COLUNA DIREITA: ACERTO FINANCEIRO */}
        <div className="fd-col-right">
          <div className="fd-card fd-payment-card">
            <div className="fd-payment-header">
              <Wallet size={24} className="text-blue" />
              <h2>Acerto Financeiro</h2>
            </div>

            <div className="fd-balance-box">
              <span className="fd-balance-label">Saldo Devedor Atual</span>
              <div className={`fd-balance-value ${isPaga ? 'text-green' : 'text-red'}`}>
                {formatCurrency(saldoDevedor > 0 ? saldoDevedor : 0)}
              </div>
            </div>

            <div className="fd-summary-list">
              <div className="fd-summary-item">
                <span>Total Comprado</span>
                <strong>{formatCurrency(ficha.valorTotal)}</strong>
              </div>
              <div className="fd-summary-item">
                <span>Total Pago</span>
                <strong className="text-green">{formatCurrency(ficha.valorPago)}</strong>
              </div>
            </div>

            {!isPaga && (
              <div className="fd-payment-form">
                <h3>Registrar Pagamento</h3>
                
                <div className="fd-segmented-control">
                  <button 
                    className={`fd-segment ${modoPagamento === 'INTEGRAL' ? 'active' : ''}`}
                    onClick={() => setModoPagamento('INTEGRAL')}
                  >
                    Valor Integral
                  </button>
                  <button 
                    className={`fd-segment ${modoPagamento === 'PARCIAL' ? 'active' : ''}`}
                    onClick={() => setModoPagamento('PARCIAL')}
                  >
                    Valor Parcial
                  </button>
                </div>

                <div className="fd-form-group">
                  <label>Valor a Pagar (R$)</label>
                  <div className="fd-input-prefix">
                    <span>R$</span>
                    <input 
                      type="number" 
                      step="0.01" 
                      value={modoPagamento === 'INTEGRAL' ? saldoDevedor.toFixed(2) : valorDigitado}
                      onChange={(e) => setValorDigitado(e.target.value)}
                      disabled={modoPagamento === 'INTEGRAL' || isSubmitting}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="fd-form-group">
                  <label>Forma de Pagamento</label>
                  <select 
                    className="fd-select"
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
                  className="fd-btn-submit" 
                  onClick={handleEfetuarPagamento}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 size={20} className="spinner" /> : <DollarSign size={20} />}
                  Confirmar Pagamento
                </button>
              </div>
            )}

            {isPaga && (
              <div className="fd-paid-state">
                <div className="fd-paid-icon"><CheckCircle size={40} /></div>
                <h3>Tudo Certo!</h3>
                <p>Não há saldo devedor pendente para este cliente no momento.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}