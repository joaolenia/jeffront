import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import './RelatoriosCrediario.css';
import { 
  BookOpen, 
  AlertCircle, 
  Users, 
  Wallet, 
  CreditCard,
  Clock,
  ChevronRight,
  UserCircle
} from 'lucide-react';

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

// Conversão blindada de datas do banco (com e sem microsegundos/fuso)
const parseDataSegura = (valor?: string | Date | null): Date => {
  if (!valor) return new Date(0);
  if (valor instanceof Date) return valor;
  
  let texto = String(valor).trim();
  if (texto.includes('.')) texto = texto.split('.')[0];
  
  if (texto.includes('T') || texto.includes(' ')) {
    let isoString = texto.replace(' ', 'T');
    if (!isoString.endsWith('Z') && !isoString.includes('+') && !isoString.includes('-', 10)) {
      isoString += 'Z'; 
    }
    return new Date(isoString);
  }
  
  return new Date(texto + 'T12:00:00Z');
};

const formatarDataExibicao = (valor?: string | Date | null) => {
  const d = parseDataSegura(valor);
  if (isNaN(d.getTime()) || d.getTime() === 0) return 'Data indisponível';
  
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(d);
};

export default function RelatoriosCrediario() {
  const navigate = useNavigate();
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
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
  }, []);

  // ================= PROCESSAMENTO DE DADOS =================
  const relatorio = useMemo(() => {
    let totalCompras = 0;
    let totalPago = 0;

    // Ordenar fichas da mais nova (atualizada recentemente) para a mais antiga
    const fichasOrdenadas = [...fichas].sort((a, b) => {
      const dataA = parseDataSegura(a.dataAtualizacao || a.dataCriacao).getTime();
      const dataB = parseDataSegura(b.dataAtualizacao || b.dataCriacao).getTime();
      return dataB - dataA;
    });

    fichasOrdenadas.forEach(ficha => {
      totalCompras += Number(ficha.valorTotal) || 0;
      totalPago += Number(ficha.valorPago) || 0;
    });

    const totalAberto = Math.max(totalCompras - totalPago, 0);

    return {
      totalCompras,
      totalPago,
      totalAberto,
      clientesContabilizados: fichasOrdenadas.length,
      fichasOrdenadas
    };
  }, [fichas]);

  // ================= RENDERIZAÇÃO =================
  return (
    <div className="relatorio-crediario-container">
      {/* HEADER */}
      <div className="relatorio-header">
        <div>
          <h2>Relatório de Crediário</h2>
          <p>Visão geral de todas as fichas, compras e pagamentos do sistema.</p>
        </div>
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
              <h3 className="banner-title">COMPRAS TOTAIS NO CREDIÁRIO</h3>
              <p className="total-value">{formatarMoeda(relatorio.totalCompras)}</p>
            </div>
          </div>

          {/* MÉTRICAS */}
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
              <span className="metric-subtitle">Total de fichas no sistema</span>
            </div>
          </div>

          {/* GRID DE FICHAS */}
          <div className="fichas-list-header">
            <h3>Fichas Recentes</h3>
            <span className="badge-count">{relatorio.clientesContabilizados} Fichas</span>
          </div>

          <div className="fichas-cards-grid">
            {relatorio.fichasOrdenadas.map(ficha => {
              const valorAbertoFicha = Math.max((Number(ficha.valorTotal) || 0) - (Number(ficha.valorPago) || 0), 0);
              const quitada = valorAbertoFicha <= 0 && Number(ficha.valorTotal) > 0;

              return (
                <div 
                  key={ficha.id} 
                  className={`rc-ficha-card ${quitada ? 'quitada' : ''}`}
                  onClick={() => navigate(`/fichas/${ficha.id}`)}
                >
                  <div className="rc-ficha-header">
                    <span className="rc-ficha-id">#{ficha.id}</span>
                    <div className="rc-ficha-date">
                      <Clock size={12} />
                      <span>{formatarDataExibicao(ficha.dataAtualizacao || ficha.dataCriacao)}</span>
                    </div>
                  </div>

                  <div className="rc-ficha-body">
                    <div className="rc-cliente-nome">
                      <UserCircle size={18} className="text-slate" />
                      <strong>{ficha.clienteNome}</strong>
                    </div>
                    
                    <div className="rc-ficha-valores">
                      <div className="rc-valor-item">
                        <span className="label">Total Comprado</span>
                        <span className="val total">{formatarMoeda(Number(ficha.valorTotal))}</span>
                      </div>
                      <div className="rc-valor-item">
                        <span className="label">Total Pago</span>
                        <span className="val pago">{formatarMoeda(Number(ficha.valorPago))}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rc-ficha-footer">
                    <div className={`rc-status-badge ${quitada ? 'success' : 'warning'}`}>
                      {quitada ? 'Ficha Quitada' : `Aberto: ${formatarMoeda(valorAbertoFicha)}`}
                    </div>
                    <button className="rc-btn-acessar">
                      Ver detalhes <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  );
}