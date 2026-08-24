import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  CreditCard,
  Landmark,
  Receipt,
  ShieldCheck,
  Trash2,
  Wallet,
  X,
} from 'lucide-react';
import api from '../../api';
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

  const [parcelaSelecionada, setParcelaSelecionada] =
    useState<Parcela | null>(null);

  const [origemDinheiro, setOrigemDinheiro] =
    useState<'Caixa' | 'Cofre'>('Caixa');

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
    if (id) {
      carregarDetalhes();
    }
  }, [id]);

  const handleExcluir = async () => {
    if (
      !window.confirm(
        `Tem certeza que deseja excluir a nota de ${mercadoria?.fornecedorNome}?`
      )
    ) {
      return;
    }

    try {
      await api.delete(`/mercadorias/${id}`);

      alert('Operação excluída com sucesso.');

      navigate('/mercadorias');
    } catch (error) {
      console.error(error);
      alert('Erro ao excluir.');
    }
  };

  const handlePagarParcela = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!mercadoria || !parcelaSelecionada) {
      return;
    }

    try {
      // 1. Integrar com o Cofre se a origem do pagamento for "Cofre"
      if (origemDinheiro === 'Cofre') {
        try {
          await api.post('/cofre/movimentacao', {
            tipo: 'saida',
            valor: Number(parcelaSelecionada.valor),
            descricao: `Pagamento de parcela - ${mercadoria.fornecedorNome}`,
            origem: 'mercadoria'
          });
        } catch (error: any) {
          console.error('Erro na movimentação do cofre:', error);
          alert(error.response?.data?.message || 'Erro ao registrar saída no cofre. A parcela não foi baixada.');
          return; // Interrompe o processo se não for possível retirar do cofre
        }
      }

      // 2. Atualizar os dados da mercadoria e parcelas
      const parcelasAtualizadas = mercadoria.parcelas.map((parcela) =>
        parcela.numero === parcelaSelecionada.numero
          ? {
              ...parcela,
              status: 'pago' as const,
              formaPagamento: origemDinheiro,
              dataPagamento: new Date()
                .toISOString()
                .split('T')[0],
            }
          : parcela
      );

      const todasPagas = parcelasAtualizadas.every(
        (parcela) => parcela.status === 'pago'
      );

      const novoCaixa =
        origemDinheiro === 'Caixa'
          ? Number(mercadoria.valorPagoCaixa) +
            Number(parcelaSelecionada.valor)
          : Number(mercadoria.valorPagoCaixa);

      const novoCofre =
        origemDinheiro === 'Cofre'
          ? Number(mercadoria.valorPagoCofre) +
            Number(parcelaSelecionada.valor)
          : Number(mercadoria.valorPagoCofre);

      const payload = {
        parcelas: parcelasAtualizadas,
        valorPagoCaixa: novoCaixa,
        valorPagoCofre: novoCofre,
        statusGeral: todasPagas ? 'concluido' : 'pendente',
      };

      await api.patch(`/mercadorias/${id}`, payload);

      alert('Parcela baixada com sucesso!');

      setParcelaSelecionada(null);

      await carregarDetalhes();
    } catch (error) {
      console.error(error);
      alert('Erro ao realizar o pagamento da parcela.');
    }
  };

  const formatCurrency = (value: number) => {
    return Number(value).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const formatDate = (value: string) => {
    return new Date(value).toLocaleDateString('pt-BR');
  };

  const estatisticas = useMemo(() => {
    if (!mercadoria) {
      return {
        total: 0,
        pago: 0,
        restante: 0,
        percentual: 0,
        parcelasPagas: 0,
        parcelasPendentes: 0,
      };
    }

    const total = Number(mercadoria.valorNota) || 0;

    const pago =
      Number(mercadoria.valorPagoCaixa || 0) +
      Number(mercadoria.valorPagoCofre || 0);

    const restante = Math.max(total - pago, 0);

    const parcelasPagas =
      mercadoria.parcelas?.filter(
        (parcela) => parcela.status === 'pago'
      ).length || 0;

    const parcelasPendentes =
      mercadoria.parcelas?.filter(
        (parcela) => parcela.status === 'pendente'
      ).length || 0;

    const percentual =
      total > 0 ? Math.min((pago / total) * 100, 100) : 0;

    return {
      total,
      pago,
      restante,
      percentual,
      parcelasPagas,
      parcelasPendentes,
    };
  }, [mercadoria]);

  if (loading) {
    return (
      <div className="detalhes-loading">
        <div className="loading-spinner" />
        <span>Carregando operação...</span>
      </div>
    );
  }

  if (!mercadoria) {
    return null;
  }

  return (
    <div className="detalhes-container">

      {/* TOPO */}
      <div className="top-navigation">
        <button
          className="voltar-btn"
          onClick={() => navigate('/mercadorias')}
        >
          <ArrowLeft size={17} />
          Voltar para operações
        </button>

        <div className="top-navigation-id">
          Operação #{String(mercadoria.id).padStart(5, '0')}
        </div>
      </div>

      {/* HEADER */}
      <header className="detalhes-header">
        <div className="detalhes-title-area">
          <div className="fornecedor-icon">
            <Receipt size={25} />
          </div>

          <div className="detalhes-title">
            <span className="eyebrow">DETALHES DA OPERAÇÃO</span>

            <h1>{mercadoria.fornecedorNome}</h1>

            <p>
              Registrada em {formatDate(mercadoria.dataOperacao)}
            </p>
          </div>
        </div>

        <button
          className="btn-excluir"
          onClick={handleExcluir}
        >
          <Trash2 size={17} />
          Excluir operação
        </button>
      </header>

      {/* STATUS */}
      <section className="status-banner">
        <div className="status-banner-info">
          <div
            className={`status-icon ${
              mercadoria.statusGeral === 'concluido'
                ? 'status-success'
                : 'status-warning'
            }`}
          >
            {mercadoria.statusGeral === 'concluido' ? (
              <CheckCircle2 size={21} />
            ) : (
              <Clock3 size={21} />
            )}
          </div>

          <div>
            <span className="status-label">
              STATUS DA OPERAÇÃO
            </span>

            <strong>
              {mercadoria.statusGeral === 'concluido'
                ? 'Operação concluída'
                : 'Pagamento pendente'}
            </strong>
          </div>
        </div>

        <div className="status-progress">
          <div className="progress-header">
            <span>Progresso do pagamento</span>
            <strong>
              {Math.round(estatisticas.percentual)}%
            </strong>
          </div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                width: `${estatisticas.percentual}%`,
              }}
            />
          </div>
        </div>
      </section>

      {/* INDICADORES */}
      <section className="metric-grid">

        <div className="metric-card">
          <div className="metric-icon blue">
            <Receipt size={20} />
          </div>

          <div className="metric-content">
            <span>Valor da nota</span>
            <strong>{formatCurrency(estatisticas.total)}</strong>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon green">
            <CheckCircle2 size={20} />
          </div>

          <div className="metric-content">
            <span>Total pago</span>
            <strong>{formatCurrency(estatisticas.pago)}</strong>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon orange">
            <Clock3 size={20} />
          </div>

          <div className="metric-content">
            <span>Valor restante</span>
            <strong>{formatCurrency(estatisticas.restante)}</strong>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon purple">
            <CreditCard size={20} />
          </div>

          <div className="metric-content">
            <span>Parcelas</span>
            <strong>
              {estatisticas.parcelasPagas}/
              {mercadoria.parcelas?.length || 0}
            </strong>
          </div>
        </div>

      </section>

      {/* CONTEÚDO */}
      <div className="detalhes-grid">

        {/* RESUMO */}
        <div className="card resumo-card">

          <div className="card-header">
            <div>
              <span className="card-eyebrow">FINANCEIRO</span>
              <h2>Resumo da nota</h2>
            </div>

            <div className="card-header-icon">
              <Wallet size={19} />
            </div>
          </div>

          <div className="resumo-list">

            <div className="resumo-item">
              <div className="resumo-label">
                <span className="dot blue-dot" />
                Pago via Caixa
              </div>

              <strong>
                {formatCurrency(mercadoria.valorPagoCaixa)}
              </strong>
            </div>

            <div className="resumo-item">
              <div className="resumo-label">
                <span className="dot purple-dot" />
                Pago via Cofre
              </div>

              <strong>
                {formatCurrency(mercadoria.valorPagoCofre)}
              </strong>
            </div>

            <div className="resumo-item">
              <div className="resumo-label">
                <span className="dot orange-dot" />
                Em boleto / prazo
              </div>

              <strong className="valor-prazo">
                {formatCurrency(mercadoria.valorPrazo)}
              </strong>
            </div>

          </div>

          <div className="finance-divider" />

          <div className="total-box">
            <div>
              <span>Valor total da operação</span>
              <small>Valor informado na nota</small>
            </div>

            <strong>
              {formatCurrency(mercadoria.valorNota)}
            </strong>
          </div>

          <div className="security-note">
            <ShieldCheck size={16} />
            <span>
              Informações financeiras protegidas e vinculadas à
              operação.
            </span>
          </div>
        </div>

        {/* PARCELAS */}
        <div className="card parcelas-card">

          <div className="card-header">
            <div>
              <span className="card-eyebrow">CONTROLE</span>
              <h2>Gestão de parcelas</h2>
            </div>

            <div className="parcelas-counter">
              <strong>{estatisticas.parcelasPagas}</strong>
              <span>de {mercadoria.parcelas?.length || 0} pagas</span>
            </div>
          </div>

          {mercadoria.parcelas &&
          mercadoria.parcelas.length > 0 ? (
            <div className="table-wrapper">
              <table className="parcelas-table">
                <thead>
                  <tr>
                    <th>Parcela</th>
                    <th>Vencimento</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th>Ação</th>
                  </tr>
                </thead>

                <tbody>
                  {mercadoria.parcelas.map((parcela) => (
                    <tr key={parcela.numero}>

                      <td>
                        <div className="parcela-number">
                          <span>
                            {String(parcela.numero).padStart(2, '0')}
                          </span>
                          <small>Parcela</small>
                        </div>
                      </td>

                      <td>
                        <span className="date-value">
                          {formatDate(parcela.vencimento)}
                        </span>
                      </td>

                      <td>
                        <strong className="table-value">
                          {formatCurrency(parcela.valor)}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`badge ${
                            parcela.status
                          }`}
                        >
                          {parcela.status === 'pago' ? (
                            <CheckCircle2 size={13} />
                          ) : (
                            <Clock3 size={13} />
                          )}

                          {parcela.status === 'pago'
                            ? 'Pago'
                            : 'Pendente'}
                        </span>
                      </td>

                      <td>
                        {parcela.status === 'pendente' ? (
                          <button
                            className="btn-baixar"
                            onClick={() =>
                              setParcelaSelecionada(parcela)
                            }
                          >
                            Baixar parcela
                          </button>
                        ) : (
                          <div className="payment-info">
                            <CheckCircle2 size={14} />
                            <span>
                              {parcela.formaPagamento}
                            </span>
                          </div>
                        )}
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">
                <Receipt size={24} />
              </div>

              <strong>Nenhuma parcela registrada</strong>

              <span>
                Esta operação não possui pagamentos a prazo.
              </span>
            </div>
          )}

        </div>

      </div>

      {/* MODAL */}
      {parcelaSelecionada && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setParcelaSelecionada(null);
            }
          }}
        >
          <div className="modal-content">

            <button
              className="modal-close"
              type="button"
              onClick={() => setParcelaSelecionada(null)}
              aria-label="Fechar"
            >
              <X size={18} />
            </button>

            <div className="modal-icon">
              <CreditCard size={24} />
            </div>

            <div className="modal-header">
              <span>BAIXA DE PAGAMENTO</span>
              <h2>Confirmar parcela</h2>

              <p>
                Você está registrando o pagamento da parcela{' '}
                <strong>
                  #{parcelaSelecionada.numero}
                </strong>
                .
              </p>
            </div>

            <div className="payment-summary">
              <span>Valor da parcela</span>

              <strong>
                {formatCurrency(parcelaSelecionada.valor)}
              </strong>
            </div>

            <form onSubmit={handlePagarParcela}>

              <div className="form-label">
                Origem do dinheiro
              </div>

              <div className="radio-group">

                <label
                  className={`radio-label ${
                    origemDinheiro === 'Caixa'
                      ? 'selected'
                      : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="origem"
                    value="Caixa"
                    checked={origemDinheiro === 'Caixa'}
                    onChange={() =>
                      setOrigemDinheiro('Caixa')
                    }
                  />

                  <div className="radio-icon">
                    <Wallet size={19} />
                  </div>

                  <div className="radio-text">
                    <strong>Caixa</strong>
                    <span>Pagamento em dinheiro</span>
                  </div>

                  <div className="radio-check">
                    <CheckCircle2 size={18} />
                  </div>
                </label>

                <label
                  className={`radio-label ${
                    origemDinheiro === 'Cofre'
                      ? 'selected'
                      : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="origem"
                    value="Cofre"
                    checked={origemDinheiro === 'Cofre'}
                    onChange={() =>
                      setOrigemDinheiro('Cofre')
                    }
                  />

                  <div className="radio-icon">
                    <Landmark size={19} />
                  </div>

                  <div className="radio-text">
                    <strong>Cofre</strong>
                    <span>Pagamento reservado</span>
                  </div>

                  <div className="radio-check">
                    <CheckCircle2 size={18} />
                  </div>
                </label>

              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancelar"
                  onClick={() =>
                    setParcelaSelecionada(null)
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="btn-salvar"
                >
                  <CheckCircle2 size={17} />
                  Confirmar pagamento
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default MercadoriaDetalhes;