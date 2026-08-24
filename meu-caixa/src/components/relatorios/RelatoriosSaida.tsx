import { useState, useEffect, useMemo } from 'react';
import api from '../../api';
import './RelatoriosSaida.css';
import { RefreshCcw, Calendar, TrendingDown, AlertCircle } from 'lucide-react';

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
  id_mercadoria?: number; // fallback
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

// Extração robusta da string YYYY-MM-DD ignorando conversões de fuso horário
const extrairDataString = (dateInput: string | Date | undefined | null) => {
  if (!dateInput) return '';
  const str = typeof dateInput === 'string' ? dateInput : dateInput.toISOString();
  return str.split('T')[0].split(' ')[0];
};

export default function RelatoriosSaida() {
  const [periodo, setPeriodo] = useState<string>('hoje');
  const [dataInicial, setDataInicial] = useState<string>(getLocalISODate(new Date()));
  const [dataFinal, setDataFinal] = useState<string>(getLocalISODate(new Date()));

  const [mercadorias, setMercadorias] = useState<MercadoriaOperacao[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // ================= EFEITO DE BUSCA =================
  const buscarDados = async () => {
    if (!dataInicial || !dataFinal) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/mercadorias', { params: { dataInicial, dataFinal } });
      setMercadorias(response.data || []);
    } catch (err) {
      console.error(err);
      setError('Erro ao buscar dados do relatório de saídas. Verifique a conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buscarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataInicial, dataFinal]);

  // ================= CONTROLE DE PERÍODO =================
  const handlePeriodoChange = (novoPeriodo: string) => {
    setPeriodo(novoPeriodo);
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
    let totalCaixa = 0;
    let totalCofre = 0;

    // Blindagem 1: Deduplicação de mercadorias. Se a API vier com um "JOIN" imperfeito 
    // e enviar a mesma mercadoria duas vezes, bloqueamos pelo Set.
    const mercadoriasProcessadas = new Set<string>();

    mercadorias.forEach(merc => {
      // Identificador único de fallback (caso falte a prop "id" ou venha mascarada)
      const uniqueId = merc.id ? String(merc.id) : (merc.id_mercadoria ? String(merc.id_mercadoria) : JSON.stringify(merc));
      if (mercadoriasProcessadas.has(uniqueId)) return;
      mercadoriasProcessadas.add(uniqueId);

      const dataOpStr = extrairDataString(merc.dataOperacao);
      
      // 1. ANÁLISE DOS VALORES PAGOS À VISTA (Na data da operação)
      if (dataOpStr >= dataInicial && dataOpStr <= dataFinal) {
        totalCaixa += Number(merc.valorPagoCaixa) || 0;
        totalCofre += Number(merc.valorPagoCofre) || 0;
      }

      // Prepara o array de parcelas de forma robusta
      let parcelasArray: ParcelaMercadoria[] = [];
      if (typeof merc.parcelas === 'string') {
        try { parcelasArray = JSON.parse(merc.parcelas); } catch (e) { console.error(e) }
      } else if (Array.isArray(merc.parcelas)) {
        parcelasArray = merc.parcelas;
      }

      // 2. ANÁLISE DE PARCELAS PAGAS A PRAZO
      if (parcelasArray.length > 0) {
        // Blindagem 2: Evita contar duas parcelas com número idêntico se o JSON do BD estiver duplicado
        const parcelasContadas = new Set<number>();

        parcelasArray.forEach((parcela, index) => {
          // Identificador da parcela
          const pId = parcela.numero !== undefined ? parcela.numero : index;
          if (parcelasContadas.has(pId)) return;
          parcelasContadas.add(pId);

          if (parcela.status === 'pago') {
            // Se houver dataPagamento, usa ela, senão recai para o vencimento ou operação
            const dataPagStr = extrairDataString(parcela.dataPagamento || parcela.vencimento || merc.dataOperacao);
            
            // Somente contabiliza as pagas estritamente no dia/período solicitado
            if (dataPagStr >= dataInicial && dataPagStr <= dataFinal) {
              const valorParcela = Number(parcela.valor) || 0;
              const formaPagamento = (parcela.formaPagamento || '').toLowerCase();
              
              if (formaPagamento.includes('cofre')) {
                totalCofre += valorParcela;
              } else {
                totalCaixa += valorParcela; 
              }
            }
          }
        });
      }
    });

    return {
      totalCaixa, 
      totalCofre, 
      totalGeral: totalCaixa + totalCofre
    };
  }, [mercadorias, dataInicial, dataFinal]);

  // ================= RENDERIZAÇÃO =================
  return (
    <div className="relatorio-saidas-container">
      {/* HEADER */}
      <div className="relatorio-header">
        <div>
          <h2>Relatório de Saídas</h2>
          <p>Utilize os filtros abaixo para analisar os dados de saídas.</p>
        </div>
        <button className="btn-atualizar" onClick={buscarDados} disabled={loading}>
          <RefreshCcw size={18} className={loading ? 'spin' : ''} />
          Atualizar
        </button>
      </div>

      {/* FILTROS */}
      <div className="filter-section card">
        <div className="periodo-rapido">
          <span className="filter-label"><Calendar size={18}/> Período:</span>
          {['hoje', '7', '15', '30', '45', '60'].map(p => (
            <button 
              key={p} 
              className={`btn-periodo ${periodo === p ? 'active' : ''}`}
              onClick={() => handlePeriodoChange(p)}
            >
              {p === 'hoje' ? 'Hoje' : `${p} dias`}
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

      {/* ESTADOS DA TELA */}
      {error && <div className="state-message error"><AlertCircle /> {error}</div>}
      {loading && <div className="state-message loading">Processando saídas...</div>}

      {!loading && !error && (
        <>
          {/* RESUMO GERAL */}
          <div className="summary-banner card highlight-saida">
            <div className="banner-icon"><TrendingDown size={40} /></div>
            <div className="banner-content">
              <h3 className="banner-title">TOTAL DE SAÍDAS (CUSTO)</h3>
              <p className="total-value">{formatarMoeda(relatorio.totalGeral)}</p>
            </div>
          </div>

          {/* SESSÃO DE ORIGENS (Centralizada visualmente) */}
          <div className="summary-grid">
            <div className="summary-card card">
              <div className="card-header">
                <h4>SAÍDAS POR ORIGEM</h4>
              </div>
              <div className="card-body forms-grid">
                <div className="forma-item">
                  <span>RETIRADO DO CAIXA</span>
                  <strong>{formatarMoeda(relatorio.totalCaixa)}</strong>
                </div>
                <div className="forma-item">
                  <span>RETIRADO DO COFRE</span>
                  <strong>{formatarMoeda(relatorio.totalCofre)}</strong>
                </div>
              </div>
              <div className="card-footer">
                <span>Total de origens:</span>
                <strong className="subtotal">{formatarMoeda(relatorio.totalGeral)}</strong>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}