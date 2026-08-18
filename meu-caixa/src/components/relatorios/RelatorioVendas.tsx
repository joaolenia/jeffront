import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Calendar, 
  DollarSign, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  ShoppingBag, 
  TrendingUp, 
  AlertCircle,
  RefreshCw,
  FileText
} from 'lucide-react';
import api from '../../api';
import './RelatorioVendas.css';

// Tipagens baseadas na sua entidade do backend
interface ItemVenda {
  id: number;
  nome: string;
  qtd: number;
  preco: number;
}

interface Venda {
  id: number;
  itens: ItemVenda[];
  total: number;
  valorRecebido: number;
  troco: number;
  formaPagamento: string;
  dataHora: string; // ou data_hora dependendo de como o TypeORM serializa
}

type PeriodoType = 'hoje' | '7' | '15' | '30' | '45' | '60' | 'custom';

export function RelatorioVendas() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros
  const [periodo, setPeriodo] = useState<PeriodoType>('30');
  const [dataCustomizada, setDataCustomizada] = useState<string>('');

  const fetchVendas = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/vendas');
      setVendas(response.data);
    } catch (err) {
      console.error('Erro ao buscar vendas:', err);
      setError('Não foi possível carregar os dados de vendas. Verifique sua conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendas();
  }, []);

  // Lógica de Filtragem no Frontend
  const vendasFiltradas = useMemo(() => {
    if (!vendas.length) return [];

    const hoje = new Date();
    hoje.setHours(23, 59, 59, 999);

    let dataCorte = new Date();
    dataCorte.setHours(0, 0, 0, 0);

    if (periodo === 'custom' && dataCustomizada) {
      // Ajusta para buscar do início ao fim do dia selecionado
      const [ano, mes, dia] = dataCustomizada.split('-').map(Number);
      dataCorte = new Date(ano, mes - 1, dia, 0, 0, 0, 0);
      hoje.setTime(new Date(ano, mes - 1, dia, 23, 59, 59, 999).getTime());
    } else if (periodo !== 'hoje' && periodo !== 'custom') {
      const dias = parseInt(periodo, 10);
      dataCorte.setDate(dataCorte.getDate() - dias);
    }

    return vendas.filter(venda => {
      // Tenta pegar dataHora ou data_hora
      const dataString = venda.dataHora || (venda as any).data_hora;
      if (!dataString) return false;
      
      const dataVenda = new Date(dataString);
      return dataVenda >= dataCorte && dataVenda <= hoje;
    });
  }, [vendas, periodo, dataCustomizada]);

  // Cálculos dos Indicadores
  const indicadores = useMemo(() => {
    let totalGeral = 0;
    let totalAVista = 0;
    let totalAPrazo = 0;
    
    let totalPix = 0;
    let totalCartao = 0;
    let totalDinheiro = 0;
    let totalCrediario = 0;

    let qtdPix = 0;
    let qtdCartao = 0;
    let qtdDinheiro = 0;
    let qtdCrediario = 0;

    vendasFiltradas.forEach(venda => {
      const valor = Number(venda.total) || 0;
      totalGeral += valor;

      const forma = venda.formaPagamento?.toLowerCase().trim() || '';

      if (forma.includes('pix')) {
        totalPix += valor;
        qtdPix++;
        totalAVista += valor;
      } else if (forma.includes('cartão') || forma.includes('cartao')) {
        totalCartao += valor;
        qtdCartao++;
        totalAVista += valor;
      } else if (forma.includes('dinheiro')) {
        totalDinheiro += valor;
        qtdDinheiro++;
        totalAVista += valor;
      } else if (forma.includes('crediário') || forma.includes('crediario') || forma.includes('prazo')) {
        totalCrediario += valor;
        qtdCrediario++;
        totalAPrazo += valor;
      } else {
        // Fallback caso venha algo diferente (assume à vista)
        totalAVista += valor;
      }
    });

    const qtdTotal = vendasFiltradas.length;
    const ticketMedio = qtdTotal > 0 ? totalGeral / qtdTotal : 0;

    // Percentuais (evitando divisão por zero)
    const pct = (valor: number) => totalGeral > 0 ? ((valor / totalGeral) * 100).toFixed(1) : '0.0';

    return {
      qtdTotal, totalGeral, totalAVista, totalAPrazo, ticketMedio,
      totalPix, qtdPix, pctPix: pct(totalPix),
      totalCartao, qtdCartao, pctCartao: pct(totalCartao),
      totalDinheiro, qtdDinheiro, pctDinheiro: pct(totalDinheiro),
      totalCrediario, qtdCrediario, pctCrediario: pct(totalCrediario)
    };
  }, [vendasFiltradas]);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    }).format(d);
  };

  const formatTime = (dateString: string) => {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit', minute: '2-digit'
    }).format(d);
  };

  if (loading && vendas.length === 0) {
    return (
      <div className="report-status-container">
        <RefreshCw className="icon-spin text-blue" size={48} />
        <h3>Carregando vendas...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div className="report-status-container error-state">
        <AlertCircle size={48} className="text-red" />
        <h3>Ops! Ocorreu um problema.</h3>
        <p>{error}</p>
        <button className="btn-retry" onClick={fetchVendas}>Tentar Novamente</button>
      </div>
    );
  }

  return (
    <div className="relatorio-vendas">
      {/* FILTROS */}
      <div className="filter-bar neo-card">
        <div className="filter-group">
          <label><Calendar size={16}/> Período</label>
          <select value={periodo} onChange={(e) => setPeriodo(e.target.value as PeriodoType)}>
            <option value="hoje">Hoje</option>
            <option value="7">Últimos 7 dias</option>
            <option value="15">Últimos 15 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="45">Últimos 45 dias</option>
            <option value="60">Últimos 60 dias</option>
            <option value="custom">Data Específica</option>
          </select>
        </div>

        {periodo === 'custom' && (
          <div className="filter-group">
            <label>Selecione a data</label>
            <input 
              type="date" 
              value={dataCustomizada} 
              onChange={(e) => setDataCustomizada(e.target.value)} 
            />
          </div>
        )}

        <div className="filter-results-info">
          <span>{indicadores.qtdTotal} vendas encontradas</span>
        </div>
      </div>

      {vendasFiltradas.length === 0 ? (
        <div className="report-status-container empty-state">
          <FileText size={64} className="text-slate" />
          <h3>Nenhuma venda encontrada</h3>
          <p>Não existem registros de vendas para o período selecionado.</p>
        </div>
      ) : (
        <>
          {/* CARDS DE RESUMO GERAL */}
          <div className="summary-grid">
            <div className="summary-card-metric highlight">
              <div className="metric-header">
                <span className="metric-title">Faturamento Total</span>
                <DollarSign size={20} />
              </div>
              <div className="metric-value">{formatCurrency(indicadores.totalGeral)}</div>
              <div className="metric-subtitle">
                {indicadores.qtdTotal} vendas realizadas
              </div>
            </div>
            
            <div className="summary-card-metric">
              <div className="metric-header">
                <span className="metric-title">Total à Vista</span>
                <Banknote size={20} />
              </div>
              <div className="metric-value">{formatCurrency(indicadores.totalAVista)}</div>
              <div className="metric-subtitle">
                {indicadores.qtdPix + indicadores.qtdDinheiro + indicadores.qtdCartao} vendas
              </div>
            </div>

            <div className="summary-card-metric">
              <div className="metric-header">
                <span className="metric-title">Total a Prazo</span>
                <Calendar size={20} />
              </div>
              <div className="metric-value">{formatCurrency(indicadores.totalAPrazo)}</div>
              <div className="metric-subtitle">
                {indicadores.qtdCrediario} vendas (Crediário)
              </div>
            </div>

            <div className="summary-card-metric">
              <div className="metric-header">
                <span className="metric-title">Ticket Médio</span>
                <TrendingUp size={20} />
              </div>
              <div className="metric-value">{formatCurrency(indicadores.ticketMedio)}</div>
              <div className="metric-subtitle">Média por venda</div>
            </div>
          </div>

          {/* DETALHAMENTO DE FORMAS DE PAGAMENTO */}
          <h3 className="section-title">Análise por Forma de Pagamento</h3>
          <div className="payment-breakdown-grid">
            {/* PIX */}
            <div className="payment-card">
              <div className="pay-icon-box bg-teal"><Smartphone size={24} /></div>
              <div className="pay-details">
                <h4>Pix</h4>
                <div className="pay-value">{formatCurrency(indicadores.totalPix)}</div>
                <div className="pay-stats">
                  <span>{indicadores.qtdPix} vendas</span>
                  <span className="pay-pct">{indicadores.pctPix}% do fatur.</span>
                </div>
              </div>
            </div>

            {/* Cartão */}
            <div className="payment-card">
              <div className="pay-icon-box bg-blue"><CreditCard size={24} /></div>
              <div className="pay-details">
                <h4>Cartão</h4>
                <div className="pay-value">{formatCurrency(indicadores.totalCartao)}</div>
                <div className="pay-stats">
                  <span>{indicadores.qtdCartao} vendas</span>
                  <span className="pay-pct">{indicadores.pctCartao}% do fatur.</span>
                </div>
              </div>
            </div>

            {/* Dinheiro */}
            <div className="payment-card">
              <div className="pay-icon-box bg-green"><Banknote size={24} /></div>
              <div className="pay-details">
                <h4>Dinheiro</h4>
                <div className="pay-value">{formatCurrency(indicadores.totalDinheiro)}</div>
                <div className="pay-stats">
                  <span>{indicadores.qtdDinheiro} vendas</span>
                  <span className="pay-pct">{indicadores.pctDinheiro}% do fatur.</span>
                </div>
              </div>
            </div>

            {/* Crediário */}
            <div className="payment-card prazo">
              <div className="pay-icon-box bg-orange"><Calendar size={24} /></div>
              <div className="pay-details">
                <h4>Crediário</h4>
                <div className="pay-value">{formatCurrency(indicadores.totalCrediario)}</div>
                <div className="pay-stats">
                  <span>{indicadores.qtdCrediario} vendas</span>
                  <span className="pay-pct">{indicadores.pctCrediario}% do fatur.</span>
                </div>
              </div>
            </div>
          </div>

          {/* LISTA DE VENDAS */}
          <div className="sales-list-header">
            <h3 className="section-title">Histórico de Vendas</h3>
            <span className="badge-count">{vendasFiltradas.length} Registros</span>
          </div>

          <div className="sales-cards-grid">
            {vendasFiltradas.map((venda) => (
              <div key={venda.id} className="sale-card">
                <div className="sale-card-header">
                  <span className="sale-id">#{venda.id}</span>
                  <div className="sale-datetime">
                    <span>{formatDate(venda.dataHora || (venda as any).data_hora)}</span>
                    <span className="time">{formatTime(venda.dataHora || (venda as any).data_hora)}</span>
                  </div>
                </div>
                
                <div className="sale-card-body">
                  <div className="sale-total">{formatCurrency(Number(venda.total))}</div>
                  
                  <div className="sale-info-row">
                    <span className="info-label">Pagamento:</span>
                    <span className="info-val method-badge">{venda.formaPagamento}</span>
                  </div>
                  
                  <div className="sale-info-row">
                    <span className="info-label">Qtd. Itens:</span>
                    <span className="info-val"><ShoppingBag size={14}/> {venda.itens ? venda.itens.length : 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}