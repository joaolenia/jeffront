import { useState, useEffect, useMemo } from 'react';
import api from '../../api';
import './RelatoriosEntrada.css';
import {  Calendar, Wallet, AlertCircle } from 'lucide-react';

// ================= TIPAGENS =================
interface Venda {
  id: number;
  dataHora?: string;
  data_hora?: string;
  total: number;
  formaPagamento?: string; 
  forma_pagamento?: string;
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

const getLocalISODate = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().split('T')[0];
};

const calcularDataAnterior = (dias: number) => {
  const data = new Date();
  data.setDate(data.getDate() - dias);
  return getLocalISODate(data);
};

const removerAcentos = (texto: string) => {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toUpperCase();
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

    // Converte os limites selecionados para Timestamps locais absolutos (00:00:00 até 23:59:59)
    const inicioPeriodo = new Date(`${dataInicial}T00:00:00`).getTime();
    const fimPeriodo = new Date(`${dataFinal}T23:59:59.999`).getTime();

    // Função que equaliza qualquer data (vinda do banco com UTC ou Local) em um Timestamp comparável
    const getTimestamp = (dateStr: string) => {
      if (!dateStr) return 0;
      // Força formato compatível com o Date do JS substituindo espaço por 'T'
      return new Date(dateStr.replace(' ', 'T')).getTime();
    };

    // Processar Vendas
    vendas.forEach(venda => {
      const timestamp = getTimestamp(venda.dataHora || venda.data_hora || '');
      
      // Validação de Fuso Horário corrigida usando Timestamp
      if (timestamp >= inicioPeriodo && timestamp <= fimPeriodo) {
        const rawForma = venda.formaPagamento || venda.forma_pagamento || '';
        const forma = removerAcentos(rawForma);
        const valor = Number(venda.total) || 0;

        if (forma.includes('PRAZO') || forma.includes('FIADO') || forma.includes('CREDIARIO')) return;

        if (forma.includes('DINHEIRO')) {
          vendasDinheiro += valor;
        } else if (forma.includes('PIX')) {
          vendasPix += valor;
        } else if (forma.includes('CART') || forma.includes('CREDITO') || forma.includes('DEBITO')) {
          vendasCartao += valor;
        }
      }
    });

    // Processar Pagamentos de Fichas
    fichas.forEach(ficha => {
      if (!ficha.pagamentos || !Array.isArray(ficha.pagamentos)) return;
      
      ficha.pagamentos.forEach(pag => {
        const timestamp = getTimestamp(pag.data || '');
        
        if (timestamp >= inicioPeriodo && timestamp <= fimPeriodo) {
          const forma = removerAcentos(pag.forma || '');
          const valor = Number(pag.valor) || 0;

          if (forma.includes('DINHEIRO')) {
            fichasDinheiro += valor;
          } else if (forma.includes('PIX')) {
            fichasPix += valor;
          } else if (forma.includes('CART') || forma.includes('CREDITO') || forma.includes('DEBITO')) {
            fichasCartao += valor;
          }
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