import { useState, useEffect, useMemo } from 'react';
import api from '../../api';
import './RelatoriosEntrada.css';
import { RefreshCcw, Calendar, Wallet, AlertCircle } from 'lucide-react';

// ================= TIPAGENS =================
interface Venda {
  id: number;
  dataHora: string;
  total: number;
  formaPagamento: string; 
}

interface Pagamento {
  id?: number;
  data: string;
  valor: number;
  forma: string;
}

interface Ficha {
  id: number;
  clienteNome: string;
  pagamentos: Pagamento[];
}

// ================= FUNÇÕES UTILITÁRIAS =================
const formatarMoeda = (valor: number) => {
  return (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// Pega a data atual em formato YYYY-MM-DD respeitando o fuso horário local
const getLocalISODate = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().split('T')[0];
};

const calcularDataAnterior = (dias: number) => {
  const data = new Date();
  data.setDate(data.getDate() - dias);
  return getLocalISODate(data);
};

export function RelatoriosEntrada() {
  const [periodo, setPeriodo] = useState<string>('hoje');
  const [dataInicial, setDataInicial] = useState<string>(getLocalISODate(new Date()));
  const [dataFinal, setDataFinal] = useState<string>(getLocalISODate(new Date()));

  const [vendas, setVendas] = useState<Venda[]>([]);
  const [fichas, setFichas] = useState<Ficha[]>([]);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // ================= EFEITO DE BUSCA =================
  const buscarDados = async () => {
    if (!dataInicial || !dataFinal) return;
    
    setLoading(true);
    setError(null);
    try {
      const [vendasRes, fichasRes] = await Promise.all([
        api.get('/vendas', { params: { dataInicial, dataFinal } }),
        api.get('/fichas') 
      ]);

      setVendas(vendasRes.data || []);
      setFichas(fichasRes.data || []);
    } catch (err) {
      console.error(err);
      setError('Erro ao buscar dados do relatório. Verifique a conexão com o servidor.');
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
    let vendasDinheiro = 0;
    let vendasPix = 0;
    let vendasCartao = 0;
    
    let fichasDinheiro = 0;
    let fichasPix = 0;
    let fichasCartao = 0;

    // Processar Vendas
    vendas.forEach(venda => {
      const forma = (venda.formaPagamento || '').toUpperCase();
      const valor = Number(venda.total) || 0;

      if (forma === 'PRAZO' || forma === 'FIADO') return;

      if (forma.includes('DINHEIRO')) vendasDinheiro += valor;
      else if (forma.includes('PIX')) vendasPix += valor;
      else if (forma.includes('CARTAO') || forma.includes('CARTÃO')) vendasCartao += valor;
    });

    // Processar Pagamentos de Fichas
    // CORREÇÃO DE DATAS: Instancia os limites considerando meia-noite e 23:59 no FUSO LOCAL (evita pulo de dias)
    let dataIniDate = new Date(0);
    let dataFimDate = new Date();

    if (dataInicial) {
      const [anoIni, mesIni, diaIni] = dataInicial.split('-').map(Number);
      dataIniDate = new Date(anoIni, mesIni - 1, diaIni, 0, 0, 0, 0);
    }
    
    if (dataFinal) {
      const [anoFim, mesFim, diaFim] = dataFinal.split('-').map(Number);
      dataFimDate = new Date(anoFim, mesFim - 1, diaFim, 23, 59, 59, 999);
    }

    fichas.forEach(ficha => {
      if (!ficha.pagamentos || !Array.isArray(ficha.pagamentos)) return;
      
      ficha.pagamentos.forEach(pag => {
        // 'new Date()' em uma string ISO (2026-08-18T23:33:07.249Z) converte perfeitamente para a hora local
        const dataPag = new Date(pag.data);
        const valor = Number(pag.valor) || 0;
        
        if (dataPag >= dataIniDate && dataPag <= dataFimDate) {
          const forma = (pag.forma || '').toUpperCase();

          if (forma.includes('DINHEIRO')) fichasDinheiro += valor;
          else if (forma.includes('PIX')) fichasPix += valor; // Adicionado tratamento para Pix
          else if (forma.includes('CARTAO') || forma.includes('CARTÃO')) fichasCartao += valor;
        }
      });
    });

    const totalVendas = vendasDinheiro + vendasPix + vendasCartao;
    const totalFichas = fichasDinheiro + fichasPix + fichasCartao;
    const totalGeral = totalVendas + totalFichas;

    return {
      vendasDinheiro, vendasPix, vendasCartao, totalVendas,
      fichasDinheiro, fichasPix, fichasCartao, totalFichas,
      totalGeral
    };
  }, [vendas, fichas, dataInicial, dataFinal]);

  // ================= RENDERIZAÇÃO =================
  return (
    <div className="relatorio-entradas-container">
      {/* HEADER */}
      <div className="relatorio-header">
        <div>
          <h2>Relatório de Entradas</h2>
          <p>Entradas financeiras à vista e pagamentos recebidos</p>
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
      {loading && <div className="state-message loading">Processando relatório...</div>}

      {!loading && !error && (
        <>
          {/* RESUMO GERAL */}
          <div className="summary-banner card highlight">
            <div className="banner-icon"><Wallet size={40} /></div>
            <div className="banner-content">
              <h3>TOTAL DE ENTRADAS</h3>
              <p className="total-value">{formatarMoeda(relatorio.totalGeral)}</p>
            </div>
          </div>

          {/* GRID DE CARDS (VENDAS E FICHAS) */}
          <div className="summary-grid">
            {/* ENTRADAS DE VENDAS */}
            <div className="summary-card card">
              <div className="card-header">
                <h4>ENTRADAS DE VENDAS À VISTA</h4>
              </div>
              <div className="card-body forms-grid">
                <div className="forma-item">
                  <span>Dinheiro</span>
                  <strong>{formatarMoeda(relatorio.vendasDinheiro)}</strong>
                </div>
                <div className="forma-item">
                  <span>Pix</span>
                  <strong>{formatarMoeda(relatorio.vendasPix)}</strong>
                </div>
                <div className="forma-item">
                  <span>Cartão</span>
                  <strong>{formatarMoeda(relatorio.vendasCartao)}</strong>
                </div>
              </div>
              <div className="card-footer">
                <span>Total vendas à vista:</span>
                <strong className="subtotal">{formatarMoeda(relatorio.totalVendas)}</strong>
              </div>
            </div>

            {/* PAGAMENTOS DE FICHAS */}
            <div className="summary-card card">
              <div className="card-header">
                <h4>PAGAMENTOS DE FICHAS</h4>
              </div>
              <div className="card-body forms-grid">
                <div className="forma-item">
                  <span>Dinheiro</span>
                  <strong>{formatarMoeda(relatorio.fichasDinheiro)}</strong>
                </div>
                {/* Adicionado forma-item do Pix */}
                <div className="forma-item">
                  <span>Pix</span>
                  <strong>{formatarMoeda(relatorio.fichasPix)}</strong>
                </div>
                <div className="forma-item">
                  <span>Cartão</span>
                  <strong>{formatarMoeda(relatorio.fichasCartao)}</strong>
                </div>
              </div>
              <div className="card-footer">
                <span>Total recebido de fichas:</span>
                <strong className="subtotal">{formatarMoeda(relatorio.totalFichas)}</strong>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default RelatoriosEntrada;