import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  DollarSign,
  AlertCircle,
  Loader2,
  CheckCircle,
  Trash2,
  Wallet,
  ShoppingBag,
  Receipt,
  CalendarDays,
  CreditCard,
  Smartphone,
  Banknote,
  ChevronRight,
  TrendingUp,
  CircleDollarSign,
  ShieldCheck,
  X,
} from 'lucide-react';
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

  const [modoPagamento, setModoPagamento] =
    useState<ModoPagamento>('INTEGRAL');

  const [valorDigitado, setValorDigitado] =
    useState<string>('');

  const [formaPagamento, setFormaPagamento] =
    useState<FormaPagamento>('Dinheiro');

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] =
    useState(false);

  const [isDeleting, setIsDeleting] =
    useState(false);

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

  const saldoDevedor = ficha
    ? Math.max(
        Number(ficha.valorTotal) -
          Number(ficha.valorPago),
        0
      )
    : 0;

  const percentualPago = ficha
    ? Math.min(
        (Number(ficha.valorPago) /
          Number(ficha.valorTotal)) *
          100,
        100
      )
    : 0;

  const totalCompras = ficha?.compras?.length || 0;
  const totalPagamentos = ficha?.pagamentos?.length || 0;

  const handleEfetuarPagamento = async () => {
    if (!ficha || isSubmitting) return;

    let valorParaPagar = 0;

    if (modoPagamento === 'INTEGRAL') {
      valorParaPagar = saldoDevedor;
    } else {
      valorParaPagar = parseFloat(
        valorDigitado.replace(',', '.')
      );
    }

    if (
      isNaN(valorParaPagar) ||
      valorParaPagar <= 0
    ) {
      alert('Informe um valor de pagamento válido.');
      return;
    }

    if (valorParaPagar > saldoDevedor) {
      alert(
        'O valor do pagamento não pode ser maior que o saldo devedor.'
      );
      return;
    }

    setIsSubmitting(true);

    const novoPagamento = {
      data: new Date().toISOString(),
      forma: formaPagamento,
      valor: valorParaPagar,
    };

    const novoValorPago =
      Number(ficha.valorPago) +
      valorParaPagar;

    const novoStatus =
      novoValorPago >= Number(ficha.valorTotal)
        ? 'PAGA'
        : 'ABERTA';

    try {
      await api.patch(`/fichas/${ficha.id}`, {
        pagamentos: [
          ...(ficha.pagamentos || []),
          novoPagamento,
        ],
        valorPago: novoValorPago,
        status: novoStatus,
      });

      alert('Pagamento registrado com sucesso!');

      setValorDigitado('');

      await fetchFicha(ficha.id.toString());
    } catch (err) {
      console.error(
        'Erro ao registrar pagamento:',
        err
      );

      alert(
        'Erro ao registrar pagamento. Tente novamente.'
      );
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
      console.error(
        'Erro ao excluir ficha:',
        err
      );

      alert(
        'Erro ao excluir ficha. Verifique se existem restrições no backend.'
      );

      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Number(value) || 0);
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return '-';

    return new Date(isoString).toLocaleDateString(
      'pt-BR',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }
    );
  };

  const getPaymentIcon = (
    forma: FormaPagamento | string
  ) => {
    if (forma === 'Pix') {
      return <Smartphone size={15} />;
    }

    if (forma === 'Cartão') {
      return <CreditCard size={15} />;
    }

    return <Banknote size={15} />;
  };

  if (loading) {
    return (
      <div className="fd-centered-state">
        <div className="fd-loading-icon">
          <Loader2 size={32} />
        </div>

        <strong>Carregando ficha</strong>

        <p>
          Buscando informações financeiras...
        </p>
      </div>
    );
  }

  if (error || !ficha) {
    return (
      <div className="fd-centered-state fd-error">
        <div className="fd-error-icon">
          <AlertCircle size={32} />
        </div>

        <h2>Ficha não encontrada</h2>

        <p>{error}</p>

        <button
          className="fd-btn-primary"
          onClick={() => navigate('/fichas')}
        >
          <ArrowLeft size={16} />
          Voltar para fichas
        </button>
      </div>
    );
  }

  const isPaga =
    ficha.status === 'PAGA' ||
    saldoDevedor <= 0;

  return (
    <div className="fd-container">

      {/* =====================================================
          TOPBAR
      ====================================================== */}

      <div className="fd-topbar">

        <button
          className="fd-back"
          onClick={() => navigate('/fichas')}
        >
          <ArrowLeft size={17} />
          Fichas
        </button>

        <span className="fd-breadcrumb-separator">
          /
        </span>

        <span className="fd-breadcrumb-current">
          Detalhes da conta
        </span>

      </div>

      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="fd-header">

        <div className="fd-header-left">

          <div className="fd-avatar">
            <User size={24} />
          </div>

          <div className="fd-title-group">

            <div className="fd-title-meta">
              <span>
                CONTA DE CLIENTE
              </span>

              <span className="fd-code">
                #{String(ficha.id).padStart(5, '0')}
              </span>
            </div>

            <h1>{ficha.clienteNome}</h1>

            <div className="fd-status-row">

              <span
                className={`fd-status ${
                  isPaga
                    ? 'fd-status-paid'
                    : 'fd-status-open'
                }`}
              >
                <span className="fd-status-dot" />

                {isPaga
                  ? 'Conta paga'
                  : 'Conta aberta'}
              </span>

              <span className="fd-created">
                <CalendarDays size={13} />
                Cadastro ativo
              </span>

            </div>

          </div>

        </div>

        <button
          className="btn-delete"
          onClick={() =>
            setShowDeleteConfirm(true)
          }
        >
          <Trash2 size={16} />
          <span>Excluir ficha</span>
        </button>

      </header>

      {/* =====================================================
          DELETE ALERT
      ====================================================== */}

      {showDeleteConfirm && (
        <div className="fd-alert-box">

          <div className="fd-alert-icon">
            <AlertCircle size={21} />
          </div>

          <div className="fd-alert-content">

            <strong>
              Excluir esta ficha?
            </strong>

            <p>
              A conta de{' '}
              <b>{ficha.clienteNome}</b>{' '}
              será apagada permanentemente.
              Essa ação não poderá ser desfeita.
            </p>

          </div>

          <div className="fd-alert-actions">

            <button
              className="btn-alert-cancel"
              onClick={() =>
                setShowDeleteConfirm(false)
              }
              disabled={isDeleting}
            >
              Cancelar
            </button>

            <button
              className="btn-alert-confirm"
              onClick={handleExcluirFicha}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2
                  size={16}
                  className="spinner"
                />
              ) : (
                <>
                  <Trash2 size={15} />
                  Excluir
                </>
              )}
            </button>

          </div>

        </div>
      )}

      {/* =====================================================
          KPI CARDS
      ====================================================== */}

      <section className="fd-kpi-grid">

        <div className="fd-kpi-card">

          <div className="fd-kpi-icon blue">
            <ShoppingBag size={19} />
          </div>

          <div>
            <span>Total comprado</span>
            <strong>
              {formatCurrency(
                ficha.valorTotal
              )}
            </strong>
          </div>

        </div>

        <div className="fd-kpi-card">

          <div className="fd-kpi-icon green">
            <CircleDollarSign size={19} />
          </div>

          <div>
            <span>Total pago</span>
            <strong>
              {formatCurrency(
                ficha.valorPago
              )}
            </strong>
          </div>

        </div>

        <div className="fd-kpi-card">

          <div className="fd-kpi-icon red">
            <TrendingUp size={19} />
          </div>

          <div>
            <span>Saldo devedor</span>
            <strong>
              {formatCurrency(
                saldoDevedor
              )}
            </strong>
          </div>

        </div>

        <div className="fd-kpi-card">

          <div className="fd-kpi-icon purple">
            <Receipt size={19} />
          </div>

          <div>
            <span>Movimentações</span>
            <strong>
              {totalCompras +
                totalPagamentos}
            </strong>
          </div>

        </div>

      </section>

      {/* =====================================================
          PAYMENT PROGRESS
      ====================================================== */}

      <section className="fd-progress-card">

        <div className="fd-progress-info">

          <div className="fd-progress-icon">
            <ShieldCheck size={20} />
          </div>

          <div>
            <span>
              PROGRESSO FINANCEIRO
            </span>

            <strong>
              {isPaga
                ? 'Conta totalmente quitada'
                : `${Math.round(
                    percentualPago
                  )}% da conta já foi pago`}
            </strong>
          </div>

        </div>

        <div className="fd-progress-area">

          <div className="fd-progress-values">
            <span>
              Pago{' '}
              <b>
                {formatCurrency(
                  ficha.valorPago
                )}
              </b>
            </span>

            <span>
              Total{' '}
              <b>
                {formatCurrency(
                  ficha.valorTotal
                )}
              </b>
            </span>
          </div>

          <div className="fd-progress-track">
            <div
              className="fd-progress-fill"
              style={{
                width: `${percentualPago}%`,
              }}
            />
          </div>

        </div>

      </section>

      {/* =====================================================
          MAIN GRID
      ====================================================== */}

      <div className="fd-grid">

        {/* =================================================
            LEFT
        ================================================== */}

        <div className="fd-col-left">

          {/* COMPRAS */}

          <section className="fd-card">

            <div className="fd-card-header">

              <div>
                <span className="fd-card-eyebrow">
                  MOVIMENTAÇÃO
                </span>

                <h2>
                  Histórico de compras
                </h2>

                <p>
                  Registro dos produtos
                  adquiridos pelo cliente.
                </p>
              </div>

              <div className="fd-card-count">
                {totalCompras}
              </div>

            </div>

            <div className="fd-card-body">

              {totalCompras === 0 ? (
                <div className="fd-empty-list">
                  <div className="fd-empty-icon">
                    <ShoppingBag size={22} />
                  </div>

                  <strong>
                    Nenhuma compra registrada
                  </strong>

                  <span>
                    Ainda não existem compras
                    vinculadas a esta ficha.
                  </span>
                </div>
              ) : (

                <div className="fd-table-responsive">

                  <table className="fd-table">

                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Descrição</th>
                        <th className="text-right">
                          Valor
                        </th>
                      </tr>
                    </thead>

                    <tbody>

                      {ficha.compras.map(
                        (compra, index) => (
                          <tr key={index}>

                            <td>
                              <div className="fd-date-cell">
                                <CalendarDays
                                  size={14}
                                />

                                <span>
                                  {formatDate(
                                    compra.data
                                  )}
                                </span>
                              </div>
                            </td>

                            <td>
                              <div className="fd-item-cell">

                                <div className="fd-item-icon">
                                  <ShoppingBag
                                    size={15}
                                  />
                                </div>

                                <span>
                                  {compra.resumoItens ||
                                    'Itens diversos'}
                                </span>

                              </div>
                            </td>

                            <td className="text-right">
                              <strong className="fd-table-value">
                                {formatCurrency(
                                  compra.valor
                                )}
                              </strong>
                            </td>

                          </tr>
                        )
                      )}

                    </tbody>

                  </table>

                </div>

              )}

            </div>

          </section>

          {/* PAGAMENTOS */}

          <section className="fd-card">

            <div className="fd-card-header">

              <div>
                <span className="fd-card-eyebrow">
                  FINANCEIRO
                </span>

                <h2>
                  Histórico de pagamentos
                </h2>

                <p>
                  Todos os pagamentos
                  registrados nesta conta.
                </p>
              </div>

              <div className="fd-card-count green">
                {totalPagamentos}
              </div>

            </div>

            <div className="fd-card-body">

              {totalPagamentos === 0 ? (
                <div className="fd-empty-list">
                  <div className="fd-empty-icon">
                    <Wallet size={22} />
                  </div>

                  <strong>
                    Nenhum pagamento realizado
                  </strong>

                  <span>
                    O cliente ainda não possui
                    pagamentos registrados.
                  </span>
                </div>
              ) : (

                <div className="fd-table-responsive">

                  <table className="fd-table">

                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Forma</th>
                        <th className="text-right">
                          Valor pago
                        </th>
                      </tr>
                    </thead>

                    <tbody>

                      {ficha.pagamentos.map(
                        (pag, index) => (
                          <tr key={index}>

                            <td>
                              <div className="fd-date-cell">
                                <CalendarDays
                                  size={14}
                                />

                                <span>
                                  {formatDate(
                                    pag.data
                                  )}
                                </span>
                              </div>
                            </td>

                            <td>
                              <span className="fd-payment-tag">
                                {getPaymentIcon(
                                  pag.forma
                                )}

                                {pag.forma}
                              </span>
                            </td>

                            <td className="text-right">
                              <strong className="fd-table-value text-green">
                                +{' '}
                                {formatCurrency(
                                  pag.valor
                                )}
                              </strong>
                            </td>

                          </tr>
                        )
                      )}

                    </tbody>

                  </table>

                </div>

              )}

            </div>

          </section>

        </div>

        {/* =================================================
            RIGHT
        ================================================== */}

        <aside className="fd-col-right">

          <section className="fd-card fd-payment-card">

            <div className="fd-payment-header">

              <div className="fd-payment-icon">
                <Wallet size={20} />
              </div>

              <div>
                <span>
                  FINANCEIRO
                </span>

                <h2>
                  Acerto financeiro
                </h2>
              </div>

            </div>

            {/* SALDO */}

            <div className="fd-balance-box">

              <span className="fd-balance-label">
                Saldo devedor atual
              </span>

              <div
                className={`fd-balance-value ${
                  isPaga
                    ? 'text-green'
                    : 'text-red'
                }`}
              >
                {formatCurrency(
                  saldoDevedor
                )}
              </div>

              <div className="fd-balance-status">
                {isPaga ? (
                  <>
                    <CheckCircle size={14} />
                    Nenhum saldo pendente
                  </>
                ) : (
                  <>
                    <AlertCircle size={14} />
                    Pagamento pendente
                  </>
                )}
              </div>

            </div>

            {/* RESUMO */}

            <div className="fd-summary-list">

              <div className="fd-summary-item">
                <span>
                  Total da conta
                </span>

                <strong>
                  {formatCurrency(
                    ficha.valorTotal
                  )}
                </strong>
              </div>

              <div className="fd-summary-item">
                <span>
                  Total já pago
                </span>

                <strong className="text-green">
                  {formatCurrency(
                    ficha.valorPago
                  )}
                </strong>
              </div>

              <div className="fd-summary-item final">
                <span>
                  Restante
                </span>

                <strong
                  className={
                    isPaga
                      ? 'text-green'
                      : 'text-red'
                  }
                >
                  {formatCurrency(
                    saldoDevedor
                  )}
                </strong>
              </div>

            </div>

            {/* PAGAMENTO */}

            {!isPaga && (
              <div className="fd-payment-form">

                <div className="fd-section-title">
                  <div>
                    <span>
                      NOVA MOVIMENTAÇÃO
                    </span>

                    <h3>
                      Registrar pagamento
                    </h3>
                  </div>

                  <DollarSign size={18} />
                </div>

                {/* MODO */}

                <div className="fd-segmented-control">

                  <button
                    className={`fd-segment ${
                      modoPagamento ===
                      'INTEGRAL'
                        ? 'active'
                        : ''
                    }`}
                    onClick={() =>
                      setModoPagamento(
                        'INTEGRAL'
                      )
                    }
                  >
                    Integral
                  </button>

                  <button
                    className={`fd-segment ${
                      modoPagamento ===
                      'PARCIAL'
                        ? 'active'
                        : ''
                    }`}
                    onClick={() =>
                      setModoPagamento(
                        'PARCIAL'
                      )
                    }
                  >
                    Parcial
                  </button>

                </div>

                {/* VALOR */}

                <div className="fd-form-group">

                  <label>
                    Valor do pagamento
                  </label>

                  <div className="fd-input-prefix">

                    <span>R$</span>

                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={
                        modoPagamento ===
                        'INTEGRAL'
                          ? saldoDevedor.toFixed(
                              2
                            )
                          : valorDigitado
                      }
                      onChange={(e) =>
                        setValorDigitado(
                          e.target.value
                        )
                      }
                      disabled={
                        modoPagamento ===
                          'INTEGRAL' ||
                        isSubmitting
                      }
                      placeholder="0,00"
                    />

                  </div>

                  {modoPagamento ===
                    'PARCIAL' && (
                    <small className="fd-input-help">
                      Máximo disponível:{' '}
                      {formatCurrency(
                        saldoDevedor
                      )}
                    </small>
                  )}

                </div>

                {/* FORMA */}

                <div className="fd-form-group">

                  <label>
                    Forma de pagamento
                  </label>

                  <div className="fd-payment-options">

                    {(
                      [
                        'Dinheiro',
                        'Cartão',
                        'Pix',
                      ] as FormaPagamento[]
                    ).map((forma) => (

                      <button
                        key={forma}
                        type="button"
                        className={`fd-payment-option ${
                          formaPagamento ===
                          forma
                            ? 'active'
                            : ''
                        }`}
                        onClick={() =>
                          setFormaPagamento(
                            forma
                          )
                        }
                        disabled={isSubmitting}
                      >
                        {getPaymentIcon(
                          forma
                        )}

                        <span>
                          {forma}
                        </span>
                      </button>

                    ))}

                  </div>

                </div>

                <button
                  className="fd-btn-submit"
                  onClick={
                    handleEfetuarPagamento
                  }
                  disabled={isSubmitting}
                >

                  {isSubmitting ? (
                    <Loader2
                      size={19}
                      className="spinner"
                    />
                  ) : (
                    <CheckCircle
                      size={19}
                    />
                  )}

                  {isSubmitting
                    ? 'Processando...'
                    : 'Confirmar pagamento'}

                  {!isSubmitting && (
                    <ChevronRight
                      size={17}
                    />
                  )}

                </button>

              </div>
            )}

            {/* PAGO */}

            {isPaga && (
              <div className="fd-paid-state">

                <div className="fd-paid-icon">
                  <CheckCircle size={36} />
                </div>

                <span>
                  CONTA FINALIZADA
                </span>

                <h3>
                  Tudo certo!
                </h3>

                <p>
                  Esta conta não possui
                  saldo devedor pendente.
                </p>

              </div>
            )}

          </section>

        </aside>

      </div>

    </div>
  );
}