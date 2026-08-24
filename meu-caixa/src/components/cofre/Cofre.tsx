import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Shield, TrendingUp, TrendingDown, 
  Search, PlusCircle, MinusCircle, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api'; // Conexão com o backend
import './Cofre.css';

interface MovimentacaoCofre {
  id: number;
  dataHora: string;
  tipo: 'entrada' | 'saida';
  valor: number;
  descricao: string;
  origem: 'caixa' | 'externo' | 'cofre';
}

export default function Cofre() {
  const navigate = useNavigate();
  
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoCofre[]>([]);
  const [saldoCofre, setSaldoCofre] = useState(0);
  const [loading, setLoading] = useState(true);

  // Estados do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'entrada' | 'saida'>('entrada');
  const [valorInput, setValorInput] = useState<string>('');
  const [descricaoInput, setDescricaoInput] = useState<string>('');
  const [origemInput, setOrigemInput] = useState<'caixa' | 'externo'>('externo');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Busca os dados reais da API
  const fetchDadosCofre = async () => {
    setLoading(true);
    try {
      const response = await api.get('/cofre');
      
      if (response.data) {
        // Garante que o saldo seja tratado como número
        setSaldoCofre(Number(response.data.saldo) || 0);
        setMovimentacoes(response.data.movimentacoes || []);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do cofre:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDadosCofre();
  }, []);

  const handleOpenModal = (tipo: 'entrada' | 'saida') => {
    setModalType(tipo);
    setValorInput('');
    setDescricaoInput('');
    setOrigemInput('externo');
    setIsModalOpen(true);
  };

  const handleSalvarMovimentacao = async (e: React.FormEvent) => {
    e.preventDefault();
    const valorNumerico = parseFloat(valorInput.replace(',', '.'));
    
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      alert('Digite um valor válido.');
      return;
    }
    if (!descricaoInput.trim()) {
      alert('A descrição é obrigatória.');
      return;
    }
    if (modalType === 'saida' && valorNumerico > saldoCofre) {
      alert('Saldo insuficiente no cofre para esta saída.');
      return;
    }

    setIsSubmitting(true);
    
    // O backend irá gerar a data e o ID
    const payload = {
      tipo: modalType,
      valor: valorNumerico,
      descricao: descricaoInput,
      origem: modalType === 'entrada' ? origemInput : 'cofre',
    };

    try {
      const response = await api.post('/cofre/movimentacao', payload);
      
      // Atualiza o estado da tela com os dados validados e retornados pelo backend
      if (response.data) {
        setSaldoCofre(Number(response.data.saldo) || 0);
        setMovimentacoes(response.data.movimentacoes || []);
      }
      
      setIsModalOpen(false);
      alert(`${modalType === 'entrada' ? 'Entrada' : 'Saída'} registrada com sucesso!`);
    } catch (error: any) {
      console.error('Erro ao salvar movimentação:', error);
      // Exibe a mensagem de erro que vem do backend (ex: Saldo Insuficiente)
      alert(error.response?.data?.message || 'Erro ao registrar movimentação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Formatação de Moeda
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Tratativa Segura de Data para evitar bugs de Fuso Horário
  const formatDate = (isoStr: string) => {
    if (!isoStr) return '';
    // A API envia em UTC (Z). O objeto Date converte automaticamente para o fuso local do navegador.
    const d = new Date(isoStr);
    return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  // Separação das movimentações para visualização
  const entradas = movimentacoes.filter(m => m.tipo === 'entrada');
  const saidas = movimentacoes.filter(m => m.tipo === 'saida');

  return (
    <div className="cofre-container">
      {/* CABEÇALHO */}
      <header className="cofre-header">
        <div className="cofre-header-left">
          <button className="cofre-btn-back" onClick={() => navigate(-1)} title="Voltar">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1>Cofre da Loja</h1>
            <span className="cofre-subtitle">Gerenciamento seguro de valores em espécie</span>
          </div>
        </div>
      </header>

      {/* DASHBOARD PRINCIPAL */}
      <div className="cofre-dashboard">
        {/* CARD DO SALDO */}
        <div className="cofre-saldo-card">
          <div className="saldo-icon"><Shield size={40}/></div>
          <div className="saldo-info">
            <span>Saldo Atual no Cofre</span>
            {loading ? (
              <h2>Carregando...</h2>
            ) : (
              <h2>{formatCurrency(saldoCofre)}</h2>
            )}
          </div>
        </div>

        {/* AÇÕES (ENTRADA / SAÍDA) */}
        <div className="cofre-actions-card">
          <h3>Movimentar Cofre</h3>
          <p>Selecione o tipo de operação que deseja realizar.</p>
          <div className="action-buttons">
            <button 
              className="btn-entrada" 
              onClick={() => handleOpenModal('entrada')}
              disabled={loading}
            >
              <PlusCircle size={20}/> Guardar Dinheiro
            </button>
            <button 
              className="btn-saida" 
              onClick={() => handleOpenModal('saida')}
              disabled={loading}
            >
              <MinusCircle size={20}/> Retirar Dinheiro
            </button>
          </div>
        </div>
      </div>

      {/* HISTÓRICOS SEPARADOS (GRID 2 COLUNAS) */}
      <div className="cofre-history-grid">
        
        {/* COLUNA DE ENTRADAS */}
        <div className="cofre-history-card">
          <div className="history-header entrada">
            <TrendingUp size={24} />
            <h3>Histórico de Entradas</h3>
          </div>
          
          <div className="cofre-table-wrapper">
            <table className="cofre-table">
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
                      <td className="data-col">{formatDate(mov.dataHora)}</td>
                      <td className="text-capitalize">{mov.origem}</td>
                      <td>{mov.descricao}</td>
                      <td className="align-right font-bold text-green">
                        + {formatCurrency(mov.valor)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="cofre-empty-state">
                      <Search size={24} />
                      <p>Nenhuma entrada registrada.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* COLUNA DE SAÍDAS */}
        <div className="cofre-history-card">
          <div className="history-header saida">
            <TrendingDown size={24} />
            <h3>Histórico de Saídas</h3>
          </div>
          
          <div className="cofre-table-wrapper">
            <table className="cofre-table">
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
                      <td className="data-col">{formatDate(mov.dataHora)}</td>
                      <td>{mov.descricao}</td>
                      <td className="align-right font-bold text-red">
                        - {formatCurrency(mov.valor)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="cofre-empty-state">
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

      {/* MODAL DE MOVIMENTAÇÃO */}
      {isModalOpen && (
        <div className="cofre-modal-overlay">
          <div className="cofre-modal">
            <div className="modal-header">
              <h2>{modalType === 'entrada' ? 'Nova Entrada no Cofre' : 'Nova Retirada do Cofre'}</h2>
            </div>
            
            <form onSubmit={handleSalvarMovimentacao}>
              <div className="form-group">
                <label>Valor (R$)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0.01"
                  required 
                  placeholder="0,00"
                  value={valorInput}
                  onChange={e => setValorInput(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Descrição</label>
                <input 
                  type="text" 
                  required 
                  placeholder={modalType === 'entrada' ? "Ex: Sangria do Caixa" : "Ex: Pagamento fornecedor"}
                  value={descricaoInput}
                  onChange={e => setDescricaoInput(e.target.value)}
                />
              </div>

              {modalType === 'entrada' && (
                <div className="form-group">
                  <label>Origem do Dinheiro</label>
                  <select 
                    value={origemInput} 
                    onChange={(e) => setOrigemInput(e.target.value as 'caixa' | 'externo')}
                  >
                    <option value="externo">Externo (Dinheiro de fora da loja)</option>
                    <option value="caixa">Caixa (Sangria / Fechamento)</option>
                  </select>
                </div>
              )}

              {modalType === 'saida' && (
                <div className="modal-alert warning">
                  <AlertCircle size={16}/>
                  Atenção: Você está retirando dinheiro do cofre. O saldo será reduzido.
                </div>
              )}

              <div className="modal-footer">
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
                  className={`btn-confirmar ${modalType}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Salvando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}