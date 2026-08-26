
import { useState, useEffect, useMemo } from 'react';
import api from '../../api';
import './RelatoriosMercadorias.css';
import { RefreshCcw, Calendar, Package, AlertCircle, ShoppingCart, Wallet, CreditCard } from 'lucide-react';

// ================= TIPAGENS =================
interface ParcelaMercadoria {
  numero: number;
  vencimento: string;
  valor: number;
  status: 'pendente' | 'pago';
  formaPagamento: string;
  dataPagamento?: string;
}

interface MercadoriaOperacao {
  id?: number;
  fornecedorNome?: string;
  valorNota?: number;
  descricao?: string;
  valorPagoCaixa?: number;
  valorPagoCofre?: number;
  valorPrazo?: number;
  statusGeral?: string;
  dataOperacao?: string | Date;
  parcelas?: ParcelaMercadoria[] | string;
  dataCriacao?: string | Date;
  dataAtualizacao?: string | Date;
}

// ================= FUNÇÕES UTILITÁRIAS =================
const formatarMoeda = (valor: number) => {
  return (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const getLocalISODate = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().split('T')[0];
};

const calcularDataAnterior = (dias: number) => {
  const data = new Date();
  data.setDate(data.getDate() - dias);
  return getLocalISODate(data);
};

const extrairDataString = (dateInput: string | Date | undefined | null) => {
  if (!dateInput) return '';
  const str = typeof dateInput === 'string' ? dateInput : dateInput.toISOString();
  return str.split('T')[0].split(' ')[0];
};

export default function RelatoriosMercadorias() {
  const [periodo, setPeriodo] = useState<string>('todos');
  const [dataInicial, setDataInicial] = useState<string>('');
  const [dataFinal, setDataFinal] = useState<string>('');

  const [mercadorias, setMercadorias] = useState<MercadoriaOperacao[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // ================= EFEITO DE BUSCA =================
  const buscarDados = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/mercadorias');
      setMercadorias(response.data || []);
    } catch (err) {
      console.error(err);
      setError('Erro ao buscar dados das mercadorias. Verifique a conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buscarDados();
    // Inicia carregando todo o período
    setPeriodo('todos');
  }, []);

  // ================= CONTROLE DE PERÍODO =================
  const handlePeriodoChange = (novoPeriodo: string) => {
    setPeriodo(novoPeriodo);
    
    if (novoPeriodo === 'todos') {
      setDataInicial('');
      setDataFinal('');
      return;
    }

    const hojeAtual = getLocalISODate(new Date());
    setDataFinal(hojeAtual);

    switch (novoPeriodo) {
      case 'hoje': setDataInicial(hojeAtual); break;
      case '7': setDataInicial(calcularDataAnterior(7)); break;
      case '15': setDataInicial(calcularDataAnterior(15)); break;
      case '30': setDataInicial(calcularDataAnterior(30)); break;
      case '45': setDataInicial(calcularDataAnterior(45)); break;
      case '60': setDataInicial(calcularDataAnterior(60)); break;
      case 'custom': break; 
    }
  };

  // ================= PROCESSAMENTO DE DADOS =================
  const relatorio = useMemo(() => {
    let totalCompras = 0;
    let totalPago = 0;
    let comprasContabilizadas = 0;

    // Set para blindar contra duplicidade no array caso haja JSON parsing inconsistente
    const mercadoriasProcessadas = new Set<string>();

    mercadorias.forEach(merc => {
      const uniqueId = String(merc.id);
      if (mercadoriasProcessadas.has(uniqueId)) return;
      mercadoriasProcessadas.add(uniqueId);

      // Priorizamos a data da operação da nota, caindo para a data de criação se não houver
      const dataOpStr = extrairDataString(merc.dataOperacao || merc.dataCriacao || new Date().toISOString());
      
      // Avalia o filtro baseado na DATA DA COMPRA
      if (periodo !== 'todos' && dataInicial && dataFinal) {
        if (dataOpStr < dataInicial || dataOpStr > dataFinal) {
          return; // A compra não se enquadra no filtro de data
        }
      }

      comprasContabilizadas++;
      
      const nota = Number(merc.valorNota) || 0;
      totalCompras += nota;

      // O valor pago inicial é a entrada que foi dada no Caixa e no Cofre
      let pagoNestaCompra = (Number(merc.valorPagoCaixa) || 0) + (Number(merc.valorPagoCofre) || 0);

      // Trata array de parcelas de forma segura
      let parcelasArray: ParcelaMercadoria[] = [];
      if (typeof merc.parcelas === 'string') {
        try { parcelasArray = JSON.parse(merc.parcelas); } catch (e) { console.error('Erro no JSON', e) }
      } else if (Array.isArray(merc.parcelas)) {
        parcelasArray = merc.parcelas;
      }

      // Soma também todas as parcelas que já estão com status 'pago'
      const parcelasPagas = parcelasArray.reduce((acc, p) => p.status === 'pago' ? acc + (Number(p.valor) || 0) : acc, 0);
      
      pagoNestaCompra += parcelasPagas;
      totalPago += pagoNestaCompra;
    });

    // O que falta pagar aos fornecedores nas compras do período filtrado
    const totalAberto = Math.max(totalCompras - totalPago, 0);

    return {
      totalCompras,
      totalPago,
      totalAberto,
      comprasContabilizadas
    };
  }, [mercadorias, dataInicial, dataFinal, periodo]);

  // ================= RENDERIZAÇÃO =================
  return (
    <div className="relatorio-mercadorias-container">
      {/* HEADER */}
      <div className="relatorio-header">
        <div>
          <h2>Relatório de Mercadorias</h2>
          <p>Acompanhe o volume de compras aos fornecedores, valores quitados e em aberto.</p>
        </div>
        <button className="btn-atualizar" onClick={buscarDados} disabled={loading}>
          <RefreshCcw size={18} className={loading ? 'spin' : ''} />
          Atualizar
        </button>
      </div>

      {/* FILTROS */}
      <div className="filter-section card">
        <div className="periodo-rapido">
          <span className="filter-label"><Calendar size={18}/> Filtro por Compra:</span>
          {['todos', 'hoje', '7', '15', '30', '45', '60'].map(p => (
            <button 
              key={p} 
              className={`btn-periodo ${periodo === p ? 'active' : ''}`}
              onClick={() => handlePeriodoChange(p)}
            >
              {p === 'todos' ? 'Todo Período' : p === 'hoje' ? 'Hoje' : `${p} dias`}
            </button>
          ))}
          <button 
            className={`btn-periodo ${periodo === 'custom' ? 'active' : ''}`}
            onClick={() => handlePeriodoChange('custom')}
          >
            Personalizado
          </button>
        </div>

        {periodo === 'custom' && (
          <div className="periodo-custom">
            <div>
              <label>Data Inicial</label>
              <input type="date" value={dataInicial} onChange={(e) => setDataInicial(e.target.value)} />
            </div>
            <div>
              <label>Data Final</label>
              <input type="date" value={dataFinal} onChange={(e) => setDataFinal(e.target.value)} />
            </div>
          </div>
        )}
      </div>

      {/* ESTADOS */}
      {error && <div className="state-message error"><AlertCircle /> {error}</div>}
      {loading && <div className="state-message loading">Processando dados das mercadorias...</div>}

      {!loading && !error && (
        <>
          {/* RESUMO GERAL */}
          <div className="summary-banner card highlight-mercadoria">
            <div className="banner-icon"><Package size={40} /></div>
            <div className="banner-content">
              <h3 className="banner-title">VALOR TOTAL COMPRADO (PERÍODO)</h3>
              <p className="total-value">{formatarMoeda(relatorio.totalCompras)}</p>
            </div>
          </div>

          <div className="metrics-grid">
            <div className="metric-card card">
              <div className="metric-header">
                <span className="metric-title">TOTAL PAGO</span>
                <div className="metric-icon green"><Wallet size={20} /></div>
              </div>
              <strong className="metric-value green-text">{formatarMoeda(relatorio.totalPago)}</strong>
              <span className="metric-subtitle">Entradas e parcelas quitadas</span>
            </div>

            <div className="metric-card card">
              <div className="metric-header">
                <span className="metric-title">EM ABERTO</span>
                <div className="metric-icon orange"><CreditCard size={20} /></div>
              </div>
              <strong className="metric-value orange-text">{formatarMoeda(relatorio.totalAberto)}</strong>
              <span className="metric-subtitle">Valor a pagar aos fornecedores</span>
            </div>

            <div className="metric-card card">
              <div className="metric-header">
                <span className="metric-title">OPERAÇÕES</span>
                <div className="metric-icon blue"><ShoppingCart size={20} /></div>
              </div>
              <strong className="metric-value blue-text">{relatorio.comprasContabilizadas}</strong>
              <span className="metric-subtitle">Mercadorias compradas no período</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}