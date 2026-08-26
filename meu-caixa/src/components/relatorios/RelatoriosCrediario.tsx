import { useState, useEffect, useMemo } from 'react';
import api from '../../api';
import './RelatoriosCrediario.css';
import {  Calendar, BookOpen, AlertCircle, Users, Wallet, CreditCard } from 'lucide-react';

// ================= TIPAGENS =================
interface Pagamento {
  data: string;
  forma: string;
  valor: number;
}

interface Compra {
  data: string;
  valor: number;
  idVenda: number;
  resumoItens: string;
}

interface Ficha {
  id: number;
  clienteNome: string;
  compras: Compra[];
  pagamentos: Pagamento[];
  valorTotal: string | number;
  valorPago: string | number;
  status: string;
  dataCriacao: string;
  dataAtualizacao: string;
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

// Extração robusta de 'YYYY-MM-DD'
const extrairDataString = (isoString: string | undefined | null) => {
  if (!isoString) return '';
  return isoString.split('T')[0].split(' ')[0];
};

export default function RelatoriosCrediario() {
  const [periodo, setPeriodo] = useState<string>('todos');
  const [dataInicial, setDataInicial] = useState<string>('');
  const [dataFinal, setDataFinal] = useState<string>('');

  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // ================= EFEITO DE BUSCA =================
  const buscarDados = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/fichas');
      setFichas(response.data || []);
    } catch (err) {
      console.error(err);
      setError('Erro ao buscar dados do crediário. Verifique a conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buscarDados();
    // Inicializa carregando tudo
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
    let clientesContabilizados = 0;

    fichas.forEach(ficha => {
      const dataCriacaoStr = extrairDataString(ficha.dataCriacao);
      
      // Avalia o filtro baseado exclusivamente na DATA DE CRIAÇÃO da ficha
      if (periodo !== 'todos' && dataInicial && dataFinal) {
        if (dataCriacaoStr < dataInicial || dataCriacaoStr > dataFinal) {
          return; // Ignora se foi criada fora do período
        }
      }

      clientesContabilizados++;
      
      // Como o banco já traz o compilado nas chaves primárias, basta somá-las
      totalCompras += Number(ficha.valorTotal) || 0;
      totalPago += Number(ficha.valorPago) || 0;
    });

    const totalAberto = Math.max(totalCompras - totalPago, 0);

    return {
      totalCompras,
      totalPago,
      totalAberto,
      clientesContabilizados
    };
  }, [fichas, dataInicial, dataFinal, periodo]);

  // ================= RENDERIZAÇÃO =================
  return (
    <div className="relatorio-crediario-container">
      {/* HEADER */}
      <div className="relatorio-header">
        <div>
          <h2>Relatório de Crediário</h2>
          <p>Analise o volume de compras geradas e os pagamentos realizados no período.</p>
        </div>
      </div>

      {/* FILTROS */}
      <div className="filter-section card">
        <div className="periodo-rapido">
          <span className="filter-label"><Calendar size={18}/> Fichas criadas:</span>
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
      {loading && <div className="state-message loading">Carregando dados das fichas...</div>}

      {!loading && !error && (
        <>
          {/* RESUMO GERAL */}
          <div className="summary-banner card highlight-crediario">
            <div className="banner-icon"><BookOpen size={40} /></div>
            <div className="banner-content">
              <h3 className="banner-title">COMPRAS NO CREDIÁRIO</h3>
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
              <span className="metric-subtitle">Valor já quitado por clientes</span>
            </div>

            <div className="metric-card card">
              <div className="metric-header">
                <span className="metric-title">EM ABERTO</span>
                <div className="metric-icon orange"><CreditCard size={20} /></div>
              </div>
              <strong className="metric-value orange-text">{formatarMoeda(relatorio.totalAberto)}</strong>
              <span className="metric-subtitle">Valor restante a receber</span>
            </div>

            <div className="metric-card card">
              <div className="metric-header">
                <span className="metric-title">CLIENTES ATIVOS</span>
                <div className="metric-icon blue"><Users size={20} /></div>
              </div>
              <strong className="metric-value blue-text">{relatorio.clientesContabilizados}</strong>
              <span className="metric-subtitle">Fichas criadas no período</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}