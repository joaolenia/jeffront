import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Building2, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  PlusCircle, 
  MinusCircle, 
  ArrowDownCircle, 
  AlertCircle, 
  RefreshCcw,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import './Patrimonio.css';

interface Movimentacao {
  id: string;
  tipo: 'entrada' | 'saida' | 'sangria';
  valor: number;
  descricao: string;
  data: string;
}

export function Patrimonio() {
  const navigate = useNavigate();

  const [saldo, setSaldo] = useState<number>(0);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Estados do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [acaoModal, setAcaoModal] = useState<'inserir' | 'tirar' | 'sangrar'>('inserir');
  const [valorInput, setValorInput] = useState<string>('');
  const [descricaoInput, setDescricaoInput] = useState<string>('');

  const formatarMoeda = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  const formatDate = (isoStr: string) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return (
      d.toLocaleDateString('pt-BR') + 
      ' às ' + 
      d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    );
  };

  const buscarPatrimonio = async () => {
    setLoading(true);
    try {
      const response = await api.get('/patrimonio');
      if (response.data) {
        setSaldo(Number(response.data.saldo) || 0);
        setMovimentacoes(response.data.movimentacoes || []);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do patrimônio:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buscarPatrimonio();
  }, []);

  const handleOpenModal = (acao: 'inserir' | 'tirar' | 'sangrar') => {
    setAcaoModal(acao);
    setValorInput('');
    setDescricaoInput(acao === 'sangrar' ? 'Sangria do Cofre' : '');
    setIsModalOpen(true);
  };

  const handleSalvarMovimentacao = async (e: React.FormEvent) => {
    e.preventDefault();
    const valorNum = parseFloat(valorInput.replace(',', '.'));

    if (isNaN(valorNum) || valorNum <= 0) {
      alert('Por favor, digite um valor válido.');
      return;
    }

    if (acaoModal === 'tirar' && valorNum > saldo) {
      alert('Saldo insuficiente no patrimônio para esta retirada.');
      return;
    }

    setIsSubmitting(true);
    const descricaoFinal = descricaoInput.trim() || (acaoModal === 'sangrar' ? 'Sangria do Cofre' : 'Movimentação');

    try {
      if (acaoModal === 'sangrar') {
        // 1. Debita do Cofre primeiro
        try {
          await api.post('/cofre/movimentacao', {
            tipo: 'saida',
            valor: valorNum,
            descricao: `Sangria para Patrimônio: ${descricaoFinal}`,
            origem: 'cofre'
          });
        } catch (cofreError: any) {
          console.error('Erro ao debitar do cofre:', cofreError);
          alert(cofreError.response?.data?.message || 'Erro ao retirar dinheiro do Cofre. Operação cancelada.');
          setIsSubmitting(false);
          return;
        }

        // 2. Registra como entrada por sangria no patrimônio
        await api.post('/patrimonio/entrada', {
          valor: valorNum,
          descricao: descricaoFinal,
          tipo: 'sangria'
        });

        alert('Sangria realizada com sucesso! O valor foi transferido do Cofre para o Patrimônio.');
      } else if (acaoModal === 'tirar') {
        await api.post('/patrimonio/saida', {
          valor: valorNum,
          descricao: descricaoFinal
        });
        alert('Saída de patrimônio registrada com sucesso!');
      } else {
        await api.post('/patrimonio/entrada', {
          valor: valorNum,
          descricao: descricaoFinal,
          tipo: 'entrada'
        });
        alert('Entrada no patrimônio registrada com sucesso!');
      }

      await buscarPatrimonio();
      setIsModalOpen(false);
    } catch (error: any) {
      console.error('Erro na movimentação:', error);
      alert(error.response?.data?.message || 'Erro ao processar operação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Separação em listas de Entradas e Saídas
  const entradas = movimentacoes.filter(m => m.tipo === 'entrada' || m.tipo === 'sangria');
  const saidas = movimentacoes.filter(m => m.tipo === 'saida');

  return (
    <div className="patrimonio-container">
      {/* CABEÇALHO */}
      <header className="patrimonio-header">
        <div className="patrimonio-header-left">
          <button className="patrimonio-btn-back" onClick={() => navigate(-1)} title="Voltar">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1>Patrimônio da Loja</h1>
            <span className="patrimonio-subtitle">Gestão do capital acumulado e reservas líquidas</span>
          </div>
        </div>

        <button 
          className="btn-recarregar" 
          onClick={buscarPatrimonio} 
          disabled={loading || isSubmitting}
          title="Recarregar dados"
        >
          <RefreshCcw size={18} className={loading ? 'spin' : ''} />
          Atualizar
        </button>
      </header>

      {/* DASHBOARD TOP: SALDO & AÇÕES */}
      <div className="patrimonio-dashboard">
        {/* CARD SALDO */}
        <div className="patrimonio-saldo-card">
          <div className="saldo-icon">
            <Building2 size={40} />
          </div>
          <div className="saldo-info">
            <span>Patrimônio Total Acumulado</span>
            {loading ? (
              <h2>Carregando...</h2>
            ) : (
              <h2>{formatarMoeda(saldo)}</h2>
            )}
          </div>
        </div>

        {/* CARD AÇÕES */}
        <div className="patrimonio-actions-card">
          <h3>Movimentações do Patrimônio</h3>
          <p>Selecione a ação que deseja realizar:</p>
          <div className="action-buttons-grid">
            <button 
              className="btn-pat-action btn-guardar" 
              onClick={() => handleOpenModal('inserir')}
              disabled={loading}
            >
              <PlusCircle size={18} /> Inserir Dinheiro
            </button>
            <button 
              className="btn-pat-action btn-retirar" 
              onClick={() => handleOpenModal('tirar')}
              disabled={loading}
            >
              <MinusCircle size={18} /> Retirar Dinheiro
            </button>
            <button 
              className="btn-pat-action btn-sangrar" 
              onClick={() => handleOpenModal('sangrar')}
              disabled={loading}
            >
              <ArrowDownCircle size={18} /> Sangrar Cofre
            </button>
          </div>
        </div>
      </div>

      {/* HISTÓRICOS EM GRID DUPLO */}
      <div className="patrimonio-history-grid">
        {/* TABELA DE ENTRADAS / SANGRIA */}
        <div className="patrimonio-history-card">
          <div className="history-header entrada">
            <TrendingUp size={22} />
            <h3>Histórico de Entradas & Sangrias</h3>
          </div>
          <div className="patrimonio-table-wrapper">
            <table className="patrimonio-table">
              <thead>
                <tr>
                  <th>Data e Hora</th>
                  <th>Origem</th>
                  <th>Descrição</th>
                  <th className="align-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="text-center py-4">Carregando...</td></tr>
                ) : entradas.length > 0 ? (
                  entradas.map(mov => (
                    <tr key={mov.id}>
                      <td className="data-col">{formatDate(mov.data)}</td>
                      <td>
                        <span className={`badge-origem ${mov.tipo}`}>
                          {mov.tipo === 'sangria' ? 'Sangria Cofre' : 'Externo'}
                        </span>
                      </td>
                      <td>{mov.descricao}</td>
                      <td className="align-right font-bold text-green">
                        + {formatarMoeda(mov.valor)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="patrimonio-empty-state">
                      <Search size={24} />
                      <p>Nenhuma entrada registrada.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* TABELA DE SAÍDAS */}
        <div className="patrimonio-history-card">
          <div className="history-header saida">
            <TrendingDown size={22} />
            <h3>Histórico de Retiradas</h3>
          </div>
          <div className="patrimonio-table-wrapper">
            <table className="patrimonio-table">
              <thead>
                <tr>
                  <th>Data e Hora</th>
                  <th>Descrição</th>
                  <th className="align-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={3} className="text-center py-4">Carregando...</td></tr>
                ) : saidas.length > 0 ? (
                  saidas.map(mov => (
                    <tr key={mov.id}>
                      <td className="data-col">{formatDate(mov.data)}</td>
                      <td>{mov.descricao}</td>
                      <td className="align-right font-bold text-red">
                        - {formatarMoeda(mov.valor)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="patrimonio-empty-state">
                      <Search size={24} />
                      <p>Nenhuma saída registrada.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* POPUP / MODAL MODERNO */}
      {isModalOpen && (
        <div 
          className="pat-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) setIsModalOpen(false);
          }}
        >
          <div className="pat-modal">
            <div className="pat-modal-header">
              <div>
                <span className="pat-modal-badge">
                  {acaoModal === 'inserir' && 'Entrada de Capital'}
                  {acaoModal === 'tirar' && 'Retirada de Capital'}
                  {acaoModal === 'sangrar' && 'Transferência Interna'}
                </span>
                <h2>
                  {acaoModal === 'inserir' && 'Inserir Dinheiro no Patrimônio'}
                  {acaoModal === 'tirar' && 'Retirar Dinheiro do Patrimônio'}
                  {acaoModal === 'sangrar' && 'Sangria do Cofre para Patrimônio'}
                </h2>
              </div>
              <button 
                type="button" 
                className="pat-btn-close" 
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSalvarMovimentacao}>
              {acaoModal === 'sangrar' && (
                <div className="modal-alert warning">
                  <AlertCircle size={18} />
                  <span>
                    <strong>Atenção:</strong> Esta ação retirará o valor diretamente do <strong>Cofre da Loja</strong> e creditará no <strong>Patrimônio</strong>.
                  </span>
                </div>
              )}

              {acaoModal === 'tirar' && (
                <div className="modal-alert danger">
                  <AlertCircle size={18} />
                  <span>
                    O valor será debitado do patrimônio total da empresa.
                  </span>
                </div>
              )}

              <div className="form-group">
                <label>Valor da Operação (R$)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0.01"
                  required 
                  autoFocus
                  placeholder="0,00"
                  value={valorInput}
                  onChange={e => setValorInput(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label>Descrição da Origem / Finalidade</label>
                <input 
                  type="text" 
                  required={acaoModal !== 'sangrar'} 
                  placeholder={
                    acaoModal === 'sangrar'
                      ? "Ex: Fechamento semanal do cofre" 
                      : acaoModal === 'inserir' 
                      ? "Ex: Aporte dos sócios, rendimentos..." 
                      : "Ex: Distribuição de lucros, investimento..."
                  }
                  value={descricaoInput}
                  onChange={e => setDescricaoInput(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="pat-modal-footer">
                <button 
                  type="button" 
                  className="btn-cancelar" 
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className={`btn-confirmar ${acaoModal}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Processando...' : 'Confirmar Operação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}