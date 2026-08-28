import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle, ArrowLeft, Banknote, CalendarDays, CheckCircle, ChevronRight,
  CircleDollarSign, CreditCard, DollarSign, Loader2, Receipt, ShieldCheck,
  ShoppingBag, Smartphone, Trash2, TrendingUp, User, Wallet, Printer
} from 'lucide-react';
import api from '../api';
import './FichaDetalhes.css';
import type { Ficha } from './FichasList';

type ModoPagamento = 'INTEGRAL' | 'PARCIAL';
type FormaPagamento = 'Dinheiro' | 'Cartão' | 'Pix';
type PrintMode = 'NONE' | 'FICHA' | 'COMPRA';

const formasPagamento: FormaPagamento[] = ['Dinheiro', 'Cartão', 'Pix'];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);

const formatDate = (value: string) =>
  value
    ? new Date(value).toLocaleDateString('pt-BR', {
        timeZone: 'UTC', day: '2-digit', month: '2-digit',
        year: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    : '-';

const PaymentIcon = ({ forma, size = 15 }: { forma: string; size?: number }) => {
  if (forma === 'Pix') return <Smartphone size={size} />;
  if (forma === 'Cartão') return <CreditCard size={size} />;
  return <Banknote size={size} />;
};

const KpiCard = ({ icon, color, label, value }: {
  icon: React.ReactNode; color: string; label: string; value: React.ReactNode;
}) => (
  <div className="fd-kpi-card">
    <div className={`fd-kpi-icon ${color}`}>{icon}</div>
    <div><span>{label}</span><strong>{value}</strong></div>
  </div>
);

const EmptyState = ({ icon, title, text }: {
  icon: React.ReactNode; title: string; text: string;
}) => (
  <div className="fd-empty-list">
    <div className="fd-empty-icon">{icon}</div>
    <strong>{title}</strong><span>{text}</span>
  </div>
);

export function FichaDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modoPagamento, setModoPagamento] = useState<ModoPagamento>('INTEGRAL');
  const [valorDigitado, setValorDigitado] = useState('');
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('Dinheiro');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [printMode, setPrintMode] = useState<PrintMode>('NONE');
  const [compraToPrint, setCompraToPrint] = useState<any>(null);

  const fetchFicha = async (fichaId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/fichas/${fichaId}`);
      setFicha(data);
    } catch (err) {
      console.error('Erro ao buscar ficha:', err);
      setError('Ficha não encontrada ou erro no servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id) fetchFicha(id); }, [id]);

  useEffect(() => {
    const handleAfterPrint = () => {
      setPrintMode('NONE');
      setCompraToPrint(null);
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  const saldoDevedor = ficha
    ? Math.max(Number(ficha.valorTotal) - Number(ficha.valorPago), 0)
    : 0;
  const percentualPago = ficha
    ? Math.min((Number(ficha.valorPago) / Number(ficha.valorTotal)) * 100, 100)
    : 0;
  const totalCompras = ficha?.compras?.length || 0;
  const totalPagamentos = ficha?.pagamentos?.length || 0;
  const isPaga = !!ficha && (ficha.status === 'PAGA' || saldoDevedor <= 0);

  const handleEfetuarPagamento = async () => {
    if (!ficha || isSubmitting) return;

    const valor = modoPagamento === 'INTEGRAL'
      ? saldoDevedor
      : parseFloat(valorDigitado.replace(',', '.'));

    if (!Number.isFinite(valor) || valor <= 0) {
      return alert('Informe um valor de pagamento válido.');
    }
    
    if (valor > saldoDevedor) {
      return alert('O valor do pagamento não pode ser maior que o saldo devedor.');
    }

    // === AWAIT ADICIONADO AQUI ===
    const confirmMessage = `Você está prestes a baixar um pagamento de ${formatCurrency(valor)} via ${formaPagamento}. Confirmar?`;
    if (!await window.confirm(confirmMessage)) {
      return;
    }

    setIsSubmitting(true);
    const data = new Date();
    const dataLocal = new Date(data.getTime() - data.getTimezoneOffset() * 60000);
    const novoPagamento = { data: dataLocal.toISOString(), forma: formaPagamento, valor };
    const novoValorPago = Number(ficha.valorPago) + valor;

    try {
      await api.patch(`/fichas/${ficha.id}`, {
        pagamentos: [...(ficha.pagamentos || []), novoPagamento],
        valorPago: novoValorPago,
        status: novoValorPago >= Number(ficha.valorTotal) ? 'PAGA' : 'ABERTA',
      });
      alert('Pagamento registrado com sucesso!');
      setValorDigitado('');
      await fetchFicha(String(ficha.id));
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

  const handlePrintFicha = () => {
    setPrintMode('FICHA');
    setTimeout(() => window.print(), 100);
  };

  const handlePrintCompra = async (compra: any) => {
    let compraParaImprimir = { ...compra };
    
    if (!compraParaImprimir.itens && compra.idVenda) {
      try {
        const { data } = await api.get(`/vendas/${compra.idVenda}`);
        if (data && data.itens) {
          compraParaImprimir.itens = data.itens;
        }
      } catch (err) {
        console.warn('Não foi possível carregar os detalhes da venda.', err);
      }
    }

    setCompraToPrint(compraParaImprimir);
    setPrintMode('COMPRA');
    setTimeout(() => window.print(), 200);
  };

  if (loading) return (
    <div className="fd-centered-state">
      <div className="fd-loading-icon"><Loader2 size={32} className="spinner" /></div>
      <strong>Carregando ficha</strong><p>Buscando informações financeiras...</p>
    </div>
  );

  if (error || !ficha) return (
    <div className="fd-centered-state fd-error">
      <div className="fd-error-icon"><AlertCircle size={32} /></div>
      <h2>Ficha não encontrada</h2><p>{error}</p>
      <button className="fd-btn-primary" onClick={() => navigate('/fichas')}>
        <ArrowLeft size={16} /> Voltar para fichas
      </button>
    </div>
  );

  return (
    <>
      <div className={`fd-container ${printMode !== 'NONE' ? 'hide-on-print' : ''}`}>
        <div className="fd-topbar">
          <button className="fd-back" onClick={() => navigate('/fichas')}><ArrowLeft size={17} /> Fichas</button>
          <span className="fd-breadcrumb-separator">/</span>
          <span className="fd-breadcrumb-current">Detalhes da conta</span>
        </div>

        <header className="fd-header">
          <div className="fd-header-left">
            <div className="fd-avatar"><User size={24} /></div>
            <div className="fd-title-group">
              <div className="fd-title-meta">
                <span>CONTA DE CLIENTE</span>
                <span className="fd-code">#{String(ficha.id).padStart(5, '0')}</span>
              </div>
              <h1>{ficha.clienteNome}</h1>
              <div className="fd-status-row">
                <span className={`fd-status ${isPaga ? 'fd-status-paid' : 'fd-status-open'}`}>
                  <span className="fd-status-dot" />{isPaga ? 'Conta paga' : 'Conta aberta'}
                </span>
                <span className="fd-created"><CalendarDays size={13} /> Cadastro ativo</span>
              </div>
            </div>
          </div>
          <div className="fd-header-actions">
            <button className="btn-print-general" onClick={handlePrintFicha}>
              <Printer size={16} /> <span>Imprimir Ficha</span>
            </button>
            <button className="btn-delete" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 size={16} /> <span>Excluir ficha</span>
            </button>
          </div>
        </header>

        {showDeleteConfirm && (
          <div className="fd-alert-box">
            <div className="fd-alert-icon"><AlertCircle size={21} /></div>
            <div className="fd-alert-content">
              <strong>Excluir esta ficha?</strong>
              <p>A conta de <b>{ficha.clienteNome}</b> será apagada permanentemente. Essa ação não poderá ser desfeita.</p>
            </div>
            <div className="fd-alert-actions">
              <button className="btn-alert-cancel" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>Cancelar</button>
              <button className="btn-alert-confirm" onClick={handleExcluirFicha} disabled={isDeleting}>
                {isDeleting ? <Loader2 size={16} className="spinner" /> : <><Trash2 size={15} /> Excluir</>}
              </button>
            </div>
          </div>
        )}

        <section className="fd-kpi-grid">
          <KpiCard icon={<ShoppingBag size={19} />} color="blue" label="Total comprado" value={formatCurrency(ficha.valorTotal)} />
          <KpiCard icon={<CircleDollarSign size={19} />} color="green" label="Total pago" value={formatCurrency(ficha.valorPago)} />
          <KpiCard icon={<TrendingUp size={19} />} color="red" label="Saldo devedor" value={formatCurrency(saldoDevedor)} />
          <KpiCard icon={<Receipt size={19} />} color="purple" label="Movimentações" value={totalCompras + totalPagamentos} />
        </section>

        <section className="fd-progress-card">
          <div className="fd-progress-info">
            <div className="fd-progress-icon"><ShieldCheck size={20} /></div>
            <div>
              <span>PROGRESSO FINANCEIRO</span>
              <strong>{isPaga ? 'Conta totalmente quitada' : `${Math.round(percentualPago)}% da conta já foi pago`}</strong>
            </div>
          </div>
          <div className="fd-progress-area">
            <div className="fd-progress-values">
              <span>Pago <b>{formatCurrency(ficha.valorPago)}</b></span>
              <span>Total <b>{formatCurrency(ficha.valorTotal)}</b></span>
            </div>
            <div className="fd-progress-track"><div className="fd-progress-fill" style={{ width: `${percentualPago}%` }} /></div>
          </div>
        </section>

        <div className="fd-grid">
          <div className="fd-col-left">
            <section className="fd-card">
              <div className="fd-card-header">
                <div><span className="fd-card-eyebrow">MOVIMENTAÇÃO</span><h2>Histórico de compras</h2><p>Registro dos produtos adquiridos pelo cliente.</p></div>
                <div className="fd-card-count">{totalCompras}</div>
              </div>
              {totalCompras ? (
                <div className="fd-table-responsive"><table className="fd-table">
                  <thead><tr><th>Data</th><th>Valor</th><th className="text-right">Ação</th></tr></thead>
                  <tbody>{ficha.compras.map((compra, i) => (
                    <tr key={i}>
                      <td><div className="fd-date-cell"><CalendarDays size={14} />{formatDate(compra.data)}</div></td>
                      <td><strong className="fd-table-value">{formatCurrency(compra.valor)}</strong></td>
                      <td className="text-right">
                        <button className="fd-btn-print-compra" onClick={() => handlePrintCompra(compra)}>
                           <Printer size={15} /> Imprimir 
                        </button>
                      </td>
                    </tr>
                  ))}</tbody>
                </table></div>
              ) : <EmptyState icon={<ShoppingBag size={22} />} title="Nenhuma compra registrada" text="Ainda não existem compras vinculadas a esta ficha." />}
            </section>

            <section className="fd-card">
              <div className="fd-card-header">
                <div><span className="fd-card-eyebrow">FINANCEIRO</span><h2>Histórico de pagamentos</h2><p>Todos os pagamentos registrados nesta conta.</p></div>
                <div className="fd-card-count green">{totalPagamentos}</div>
              </div>
              {totalPagamentos ? (
                <div className="fd-table-responsive"><table className="fd-table">
                  <thead><tr><th>Data</th><th>Forma</th><th className="text-right">Valor pago</th></tr></thead>
                  <tbody>{ficha.pagamentos.map((pag, i) => (
                    <tr key={i}>
                      <td><div className="fd-date-cell"><CalendarDays size={14} />{formatDate(pag.data)}</div></td>
                      <td><span className="fd-payment-tag"><PaymentIcon forma={pag.forma} />{pag.forma}</span></td>
                      <td className="text-right"><strong className="fd-table-value text-green">+ {formatCurrency(pag.valor)}</strong></td>
                    </tr>
                  ))}</tbody>
                </table></div>
              ) : <EmptyState icon={<Wallet size={22} />} title="Nenhum pagamento realizado" text="O cliente ainda não possui pagamentos registrados." />}
            </section>
          </div>

          <aside className="fd-col-right">
            <section className="fd-card fd-payment-card">
              <div className="fd-payment-header">
                <div className="fd-payment-icon"><Wallet size={20} /></div>
                <div><span>FINANCEIRO</span><h2>Acerto financeiro</h2></div>
              </div>

              <div className="fd-balance-box">
                <span className="fd-balance-label">Saldo devedor atual</span>
                <div className={`fd-balance-value ${isPaga ? 'text-green' : 'text-red'}`}>{formatCurrency(saldoDevedor)}</div>
                <div className="fd-balance-status">
                  {isPaga ? <><CheckCircle size={14} /> Nenhum saldo pendente</> : <><AlertCircle size={14} /> Pagamento pendente</>}
                </div>
              </div>

              <div className="fd-summary-list">
                <div className="fd-summary-item"><span>Total da conta</span><strong>{formatCurrency(ficha.valorTotal)}</strong></div>
                <div className="fd-summary-item"><span>Total já pago</span><strong className="text-green">{formatCurrency(ficha.valorPago)}</strong></div>
                <div className="fd-summary-item final"><span>Restante</span><strong className={isPaga ? 'text-green' : 'text-red'}>{formatCurrency(saldoDevedor)}</strong></div>
              </div>

              {!isPaga ? (
                <div className="fd-payment-form">
                  <div className="fd-section-title"><div><span>NOVA MOVIMENTAÇÃO</span><h3>Registrar pagamento</h3></div><DollarSign size={18} /></div>

                  <div className="fd-segmented-control">
                    {(['INTEGRAL', 'PARCIAL'] as ModoPagamento[]).map(modo => (
                      <button key={modo} className={`fd-segment ${modoPagamento === modo ? 'active' : ''}`} onClick={() => setModoPagamento(modo)}>
                        {modo === 'INTEGRAL' ? 'Integral' : 'Parcial'}
                      </button>
                    ))}
                  </div>

                  <div className="fd-form-group">
                    <label>Valor do pagamento</label>
                    <div className="fd-input-prefix">
                      <span>R$</span>
                      <input
                        type="number" step="0.01" min="0"
                        value={modoPagamento === 'INTEGRAL' ? saldoDevedor.toFixed(2) : valorDigitado}
                        onChange={e => setValorDigitado(e.target.value)}
                        disabled={modoPagamento === 'INTEGRAL' || isSubmitting}
                        placeholder="0,00"
                      />
                    </div>
                    {modoPagamento === 'PARCIAL' && <small className="fd-input-help">Máximo disponível: {formatCurrency(saldoDevedor)}</small>}
                  </div>

                  <div className="fd-form-group">
                    <label>Forma de pagamento</label>
                    <div className="fd-payment-options">
                      {formasPagamento.map(forma => (
                        <button key={forma} type="button" className={`fd-payment-option ${formaPagamento === forma ? 'active' : ''}`} onClick={() => setFormaPagamento(forma)} disabled={isSubmitting}>
                          <PaymentIcon forma={forma} /><span>{forma}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button className="fd-btn-submit" onClick={handleEfetuarPagamento} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 size={19} className="spinner" /> : <CheckCircle size={19} />}
                    {isSubmitting ? 'Processando...' : 'Confirmar pagamento'}
                    {!isSubmitting && <ChevronRight size={17} />}
                  </button>
                </div>
              ) : (
                <div className="fd-paid-state">
                  <div className="fd-paid-icon"><CheckCircle size={36} /></div>
                  <span>CONTA FINALIZADA</span><h3>Tudo certo!</h3>
                  <p>Esta conta não possui saldo devedor pendente.</p>
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>

      {printMode === 'FICHA' && ficha && (
        <div className="cupom-container">
          <div className="cupom-header">
            <h2>EXTRATO DE FICHA</h2>
            <p>Cliente: {ficha.clienteNome}</p>
          </div>
          <hr className="dashed-line" />
          
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <strong>COMPRAS</strong>
          </div>
          <table className="cupom-table">
            <thead>
              <tr>
                <th style={{width: '60%'}}>Data/Hora</th>
                <th style={{textAlign: 'right'}}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {ficha.compras?.map((c, idx) => (
                <tr key={idx}>
                  <td>{formatDate(c.data)}</td>
                  <td style={{textAlign: 'right'}}>{formatCurrency(c.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <hr className="dashed-line" />
          
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <strong>PAGAMENTOS</strong>
          </div>
          <table className="cupom-table">
            <thead>
              <tr>
                <th style={{width: '40%'}}>Data</th>
                <th>Forma</th>
                <th style={{textAlign: 'right'}}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {ficha.pagamentos?.map((p, idx) => (
                <tr key={idx}>
                  <td>{new Date(p.data).toLocaleDateString('pt-BR')}</td>
                  <td>{p.forma}</td>
                  <td style={{textAlign: 'right'}}>{formatCurrency(p.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <hr className="dashed-line" />
          <div className="cupom-footer">
            <div className="info-row">
              <span>Total Comprado:</span>
              <span>{formatCurrency(ficha.valorTotal)}</span>
            </div>
            <div className="info-row">
              <span>Total Pago:</span>
              <span>{formatCurrency(ficha.valorPago)}</span>
            </div>
            <div className="total-row">
              <span>Saldo Devedor:</span>
              <span>{formatCurrency(saldoDevedor)}</span>
            </div>
          </div>
          <p style={{textAlign: 'center', marginTop: '16px'}}>Emissão: {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR')}</p>
        </div>
      )}

      {printMode === 'COMPRA' && compraToPrint && ficha && (
        <div className="cupom-container">
          <div className="cupom-header">
            <h2>COMPROVANTE DE COMPRA</h2>
            <p>Cliente: {ficha.clienteNome}</p>
            <p>Data: {formatDate(compraToPrint.data)}</p>
          </div>
          <hr className="dashed-line" />
          
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <strong>ITENS DA COMPRA</strong>
          </div>

          {compraToPrint.itens && compraToPrint.itens.length > 0 ? (
            <table className="cupom-table">
              <thead>
                <tr>
                  <th style={{textAlign: 'left'}}>Qtd</th>
                  <th style={{textAlign: 'left'}}>Descrição</th>
                  <th style={{textAlign: 'right'}}>V.Un</th>
                  <th style={{textAlign: 'right'}}>Total</th>
                </tr>
              </thead>
              <tbody>
                {compraToPrint.itens.map((item: any, idx: number) => (
                  <tr key={idx}>
                    <td style={{textAlign: 'left'}}>{item.qtd}</td>
                    <td style={{textAlign: 'left'}}>{item.nome}</td>
                    <td style={{textAlign: 'right'}}>{formatCurrency(item.preco)}</td>
                    <td style={{textAlign: 'right'}}>{formatCurrency(item.qtd * item.preco)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{marginBottom: '10px', fontSize: '12px'}}>
              <p style={{margin: '4px 0'}}><strong>Itens:</strong> {compraToPrint.resumoItens || 'Diversos'}</p>
            </div>
          )}
          
          <hr className="dashed-line" />
          <div className="total-row">
            <span>TOTAL:</span>
            <span>{formatCurrency(compraToPrint.valor)}</span>
          </div>

          <p style={{textAlign: 'center', marginTop: '16px'}}>Lançado no crediário.</p>
        </div>
      )}
    </>
  );
}