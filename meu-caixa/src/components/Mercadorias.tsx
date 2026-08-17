import React, { useState } from 'react';
import { Search, Plus, ArrowLeft, Package, X } from 'lucide-react';
import './Mercadorias.css';

// --- TIPAGENS ---
type Parcela = {
  numero: number;
  valor: number;
  vencimento: string;
  status: 'pendente' | 'paga';
  origemPgto?: 'caixa' | 'cofre';
};

type Mercadoria = {
  id: number;
  fornecedor: string;
  data: string;
  valorTotal: number;
  status: 'pendente' | 'paga';
  pagamento: {
    caixa: number;
    cofre: number;
    boleto: number;
  };
  parcelasBoleto: Parcela[];
};

// --- DADOS INICIAIS (MOCK) ---
const MOCK_INICIAL: Mercadoria[] = [
  {
    id: 1,
    fornecedor: 'Distribuidora Bebidas S/A',
    data: '15/08/2026',
    valorTotal: 5000,
    status: 'pendente',
    pagamento: { caixa: 1000, cofre: 0, boleto: 4000 },
    parcelasBoleto: [
      { numero: 1, valor: 2000, vencimento: '15/09/2026', status: 'pendente' },
      { numero: 2, valor: 2000, vencimento: '15/10/2026', status: 'pendente' },
    ]
  },
  {
    id: 2,
    fornecedor: 'Frigorífico Boi Gordo',
    data: '16/08/2026',
    valorTotal: 1500,
    status: 'paga',
    pagamento: { caixa: 500, cofre: 1000, boleto: 0 },
    parcelasBoleto: []
  }
];

export function Mercadorias() {
  const [mercadorias, setMercadorias] = useState<Mercadoria[]>(MOCK_INICIAL);
  const [view, setView] = useState<'lista' | 'detalhes'>('lista');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filtros da lista
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todas');

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // --- RENDERIZAÇÃO DA LISTA (CARDS) ---
  const renderLista = () => {
    const filtradas = mercadorias.filter(m => {
      const matchBusca = m.fornecedor.toLowerCase().includes(busca.toLowerCase());
      const matchStatus = filtroStatus === 'todas' || m.status === filtroStatus;
      return matchBusca && matchStatus;
    });

    return (
      <>
        <div className="merc-header">
          <h2 className="merc-title">Controle de Mercadorias</h2>
          <div className="merc-controls">
            <div className="merc-search">
              <Search size={18} color="#94a3b8" />
              <input 
                type="text" 
                placeholder="Buscar fornecedor..." 
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            <select 
              className="merc-select"
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
            >
              <option value="todas">Status: Todos</option>
              <option value="pendente">Pendentes</option>
              <option value="paga">Pagas</option>
            </select>
            <button className="merc-btn-novo" onClick={() => setIsModalOpen(true)}>
              <Plus size={18} /> Nova Entrada
            </button>
          </div>
        </div>

        <div className="merc-grid">
          {filtradas.map(m => (
            <div key={m.id} className="merc-card" onClick={() => { setSelectedId(m.id); setView('detalhes'); }}>
              <div className="merc-card-header">
                <div className="merc-card-title">
                  <Package size={20} color="#64748b" />
                  <h3>{m.fornecedor}</h3>
                </div>
                <span className={`merc-badge ${m.status}`}>{m.status}</span>
              </div>
              <div className="merc-card-info">
                <p>Data: <span>{m.data}</span></p>
                <p>Boleto: <span>{m.pagamento.boleto > 0 ? formatCurrency(m.pagamento.boleto) : 'Não possui'}</span></p>
                <p className="merc-card-total">{formatCurrency(m.valorTotal)}</p>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  };

  // --- RENDERIZAÇÃO DOS DETALHES ---
  const renderDetalhes = () => {
    const item = mercadorias.find(m => m.id === selectedId);
    if (!item) return null;

    const handlePagarParcela = (parcelaNum: number) => {
      const origem = window.prompt("De onde saiu o dinheiro? Digite 'caixa' ou 'cofre'.");
      if (origem === 'caixa' || origem === 'cofre') {
        const atualizadas = mercadorias.map(m => {
          if (m.id === item.id) {
            const novasParcelas = m.parcelasBoleto.map(p => 
              p.numero === parcelaNum ? { ...p, status: 'paga' as const, origemPgto: origem } : p
            );
            // Verifica se todas foram pagas para atualizar o status geral da mercadoria
            const tudoPago = novasParcelas.every(p => p.status === 'paga');
            return { ...m, parcelasBoleto: novasParcelas, status: tudoPago ? 'paga' : m.status };
          }
          return m;
        });
        setMercadorias(atualizadas);
      } else {
        alert("Operação cancelada. Origem inválida.");
      }
    };

    return (
      <>
        <div className="merc-detalhes-header">
          <button className="merc-btn-voltar" onClick={() => setView('lista')}>
            <ArrowLeft size={18} /> Voltar
          </button>
          <h2 className="merc-title">Nota: {item.fornecedor}</h2>
        </div>

        <div className="merc-detalhes-grid">
          <div className="merc-panel">
            <h3>Resumo da Entrada</h3>
            <div className="merc-info-row"><span>Data:</span> <span>{item.data}</span></div>
            <div className="merc-info-row"><span>Status:</span> <span style={{color: item.status === 'paga' ? '#16a34a' : '#dc2626'}}>{item.status.toUpperCase()}</span></div>
            <div className="merc-info-row"><span>Valor Total:</span> <span>{formatCurrency(item.valorTotal)}</span></div>
            
            <h3 style={{marginTop: '24px'}}>Composição do Pagamento</h3>
            <div className="merc-info-row"><span>Retirado do Caixa:</span> <span>{formatCurrency(item.pagamento.caixa)}</span></div>
            <div className="merc-info-row"><span>Retirado do Cofre:</span> <span>{formatCurrency(item.pagamento.cofre)}</span></div>
            <div className="merc-info-row"><span>Gerado em Boleto:</span> <span style={{color: '#dc2626'}}>{formatCurrency(item.pagamento.boleto)}</span></div>
          </div>

          <div className="merc-panel">
            <h3>Parcelas do Boleto</h3>
            {item.parcelasBoleto.length === 0 ? (
              <p style={{color: '#64748b'}}>Esta nota não possui boletos/parcelas.</p>
            ) : (
              <table className="merc-table">
                <thead>
                  <tr>
                    <th>Parc.</th>
                    <th>Vencimento</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {item.parcelasBoleto.map(p => (
                    <tr key={p.numero}>
                      <td>{p.numero}x</td>
                      <td>{p.vencimento}</td>
                      <td style={{fontWeight: 600}}>{formatCurrency(p.valor)}</td>
                      <td>
                        <span className={`merc-badge ${p.status}`}>{p.status}</span>
                      </td>
                      <td>
                        {p.status === 'pendente' ? (
                          <button className="btn-pagar-parcela" onClick={() => handlePagarParcela(p.numero)}>Baixar</button>
                        ) : (
                          <span style={{fontSize: '0.8rem', color: '#64748b'}}>Via {p.origemPgto}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </>
    );
  };

  // --- RENDERIZAÇÃO DO MODAL DE CADASTRO ---
  const renderModal = () => {
    if (!isModalOpen) return null;

    // Estados do Formulário
    const [formFornecedor, setFormFornecedor] = useState('');
    const [formTotal, setFormTotal] = useState('');
    
    // Divisão de Valores
    const [usaCaixa, setUsaCaixa] = useState(false);
    const [valCaixa, setValCaixa] = useState('');
    const [usaCofre, setUsaCofre] = useState(false);
    const [valCofre, setValCofre] = useState('');
    const [usaBoleto, setUsaBoleto] = useState(false);
    const [valBoleto, setValBoleto] = useState('');
    
    // Dados Boleto
    const [qtdParcelas, setQtdParcelas] = useState('1');
    const [dataVencimento, setDataVencimento] = useState('');

    // Cálculos
    const numTotal = parseFloat(formTotal) || 0;
    const numCaixa = usaCaixa ? (parseFloat(valCaixa) || 0) : 0;
    const numCofre = usaCofre ? (parseFloat(valCofre) || 0) : 0;
    const numBoleto = usaBoleto ? (parseFloat(valBoleto) || 0) : 0;
    
    const restante = numTotal - (numCaixa + numCofre + numBoleto);
    const canSave = numTotal > 0 && restante === 0 && formFornecedor.trim() !== '';

    const handleSave = () => {
      // Gerar parcelas se houver boleto
      const parcelasArray: Parcela[] = [];
      if (usaBoleto && numBoleto > 0) {
        const parcelasInt = parseInt(qtdParcelas);
        const valorPorParcela = numBoleto / parcelasInt;
        
        // Lógica simplificada de datas (apenas repassa a primeira data como exemplo)
        for (let i = 1; i <= parcelasInt; i++) {
          parcelasArray.push({
            numero: i,
            valor: valorPorParcela,
            vencimento: i === 1 ? dataVencimento : 'A definir', // Num app real, somaria +30 dias
            status: 'pendente'
          });
        }
      }

      const novaMercadoria: Mercadoria = {
        id: Date.now(),
        fornecedor: formFornecedor,
        data: new Date().toLocaleDateString('pt-BR'),
        valorTotal: numTotal,
        status: (usaBoleto && numBoleto > 0) ? 'pendente' : 'paga', // Se teve boleto, fica pendente
        pagamento: {
          caixa: numCaixa,
          cofre: numCofre,
          boleto: numBoleto
        },
        parcelasBoleto: parcelasArray
      };

      setMercadorias([novaMercadoria, ...mercadorias]);
      setIsModalOpen(false);
    };

    return (
      <div className="merc-modal-overlay">
        <div className="merc-modal-content">
          <div className="merc-modal-header">
            <h2>Nova Entrada de Mercadoria</h2>
            <button className="merc-btn-close" onClick={() => setIsModalOpen(false)}><X size={24}/></button>
          </div>
          
          <div className="merc-modal-body">
            <div className="merc-form-row">
              <div className="merc-input-group">
                <label>Fornecedor</label>
                <input type="text" className="merc-input" value={formFornecedor} onChange={e => setFormFornecedor(e.target.value)} placeholder="Nome da empresa" />
              </div>
              <div className="merc-input-group">
                <label>Valor Total da Nota (R$)</label>
                <input type="number" className="merc-input" value={formTotal} onChange={e => setFormTotal(e.target.value)} placeholder="0.00" />
              </div>
            </div>

            <div className="merc-split-area">
              <h3 style={{marginTop: 0, fontSize: '1rem', color: '#1e293b'}}>Como essa nota foi/será paga? (Divisão)</h3>
              
              <div className="merc-split-row">
                <label className="merc-split-checkbox">
                  <input type="checkbox" checked={usaCaixa} onChange={e => setUsaCaixa(e.target.checked)}/>
                  Tirado do Caixa
                </label>
                {usaCaixa && <input type="number" className="merc-split-input" placeholder="Valor" value={valCaixa} onChange={e => setValCaixa(e.target.value)} />}
              </div>

              <div className="merc-split-row">
                <label className="merc-split-checkbox">
                  <input type="checkbox" checked={usaCofre} onChange={e => setUsaCofre(e.target.checked)}/>
                  Tirado do Cofre
                </label>
                {usaCofre && <input type="number" className="merc-split-input" placeholder="Valor" value={valCofre} onChange={e => setValCofre(e.target.value)} />}
              </div>

              <div className="merc-split-row" style={{border: 'none'}}>
                <label className="merc-split-checkbox">
                  <input type="checkbox" checked={usaBoleto} onChange={e => setUsaBoleto(e.target.checked)}/>
                  Ficou no Boleto / Prazo
                </label>
                {usaBoleto && <input type="number" className="merc-split-input" placeholder="Valor Boleto" value={valBoleto} onChange={e => setValBoleto(e.target.value)} />}
              </div>

              {usaBoleto && (
                <div className="merc-boleto-details">
                  <div className="merc-input-group">
                    <label>Qtd. Parcelas</label>
                    <input type="number" className="merc-input" value={qtdParcelas} onChange={e => setQtdParcelas(e.target.value)} min="1" />
                  </div>
                  <div className="merc-input-group">
                    <label>Data 1º Vencimento</label>
                    <input type="date" className="merc-input" value={dataVencimento} onChange={e => setDataVencimento(e.target.value)} />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="merc-modal-footer">
            <span className={`merc-restante ${restante === 0 ? 'success' : 'error'}`}>
              {numTotal === 0 ? 'Informe o valor total' : restante === 0 ? 'Valores batem (R$ 0,00)' : `Falta alocar: ${formatCurrency(restante)}`}
            </span>
            <button className="merc-btn-salvar" disabled={!canSave} onClick={handleSave}>
              Salvar Entrada
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mercadorias-wrapper">
      {view === 'lista' ? renderLista() : renderDetalhes()}
      {renderModal()}
    </div>
  );
}