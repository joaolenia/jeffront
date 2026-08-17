// src/components/mercadorias/MercadoriaDetalhes.tsx

import  { useState } from 'react';
import { 
  ArrowLeft, FileText, CheckCircle2, Clock, Wallet, 
  Building2, Banknote, Receipt, X 
} from 'lucide-react';
import  type{ Mercadoria } from './types';
import './MercadoriaDetalhes.css';

interface Props {
  mercadoria: Mercadoria;
  onVoltar: () => void;
  onPagarParcela: (idMercadoria: number, parcelaNum: number, origem: 'caixa' | 'cofre') => void;
}

export function MercadoriaDetalhes({ mercadoria, onVoltar, onPagarParcela }: Props) {
  // Controla qual parcela está com o menu de pagamento aberto
  const [parcelaEmPagamento, setParcelaEmPagamento] = useState<number | null>(null);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const confirmarPagamento = (parcelaNum: number, origem: 'caixa' | 'cofre') => {
    onPagarParcela(mercadoria.id, parcelaNum, origem);
    setParcelaEmPagamento(null); // Fecha o menu após pagar
  };

  return (
    <div className="mdet-container">
      <div className="mdet-header">
        <button className="mdet-btn-voltar" onClick={onVoltar}>
          <ArrowLeft size={18} /> Voltar
        </button>
        <div className="mdet-title-group">
          <h2 className="mdet-title">{mercadoria.fornecedor}</h2>
          <p className="mdet-subtitle">Detalhes da operação • {mercadoria.data}</p>
        </div>
      </div>

      <div className="mdet-grid">
        {/* Painel da Esquerda: Resumo */}
        <div className="mdet-panel">
          <h3><FileText size={20} color="var(--accent-blue)"/> Resumo da Nota</h3>
          
          <div className="mdet-summary-item">
            <span className="mdet-summary-label">Status Geral</span>
            <span className={`mdet-badge ${mercadoria.status}`}>
              {mercadoria.status === 'paga' ? <CheckCircle2 size={14} /> : <Clock size={14} />}
              {mercadoria.status}
            </span>
          </div>

          <div className="mdet-summary-item">
            <span className="mdet-summary-label"><Wallet size={16}/> Pago via Caixa</span>
            <span className="mdet-summary-value">{formatCurrency(mercadoria.pagamento.caixa)}</span>
          </div>

          <div className="mdet-summary-item">
            <span className="mdet-summary-label"><Building2 size={16}/> Pago via Cofre</span>
            <span className="mdet-summary-value">{formatCurrency(mercadoria.pagamento.cofre)}</span>
          </div>

          <div className="mdet-summary-item">
            <span className="mdet-summary-label" style={{color: '#fda4af'}}><Receipt size={16}/> Em Boleto/Prazo</span>
            <span className="mdet-summary-value" style={{color: '#fda4af'}}>
              {formatCurrency(mercadoria.pagamento.boleto)}
            </span>
          </div>

          <div className="mdet-summary-item mdet-total-highlight">
            <span className="mdet-summary-label">Valor Total</span>
            <span className="mdet-summary-value">{formatCurrency(mercadoria.valorTotal)}</span>
          </div>
        </div>

        {/* Painel da Direita: Parcelas */}
        <div className="mdet-panel">
          <h3><Banknote size={20} color="var(--accent-green)"/> Gestão de Parcelas</h3>
          
          {mercadoria.parcelasBoleto.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={48} opacity={0.2} style={{ marginBottom: 16 }} />
              <p>Esta nota não possui boletos ou parcelas a prazo.</p>
            </div>
          ) : (
            <table className="mdet-table">
              <thead>
                <tr>
                  <th>Parc.</th>
                  <th>Vencimento</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {mercadoria.parcelasBoleto.map(p => (
                  <tr key={p.numero}>
                    <td style={{ color: 'var(--text-muted)' }}>{p.numero}x</td>
                    <td>{p.vencimento}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(p.valor)}</td>
                    <td>
                      <span className={`mdet-badge ${p.status}`}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      
                      {/* LÓGICA DE EXIBIÇÃO DAS AÇÕES */}
                      {p.status === 'paga' ? (
                        <div className="mdet-pago-text" style={{justifyContent: 'flex-end'}}>
                          <CheckCircle2 size={16} color="var(--accent-green)"/>
                          Retirado do <strong>{p.origemPgto}</strong>
                        </div>
                      ) : parcelaEmPagamento === p.numero ? (
                        <div className="mdet-action-popover" style={{justifyContent: 'flex-end'}}>
                          <span style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: 4}}>Origem:</span>
                          <button className="mdet-btn-option" onClick={() => confirmarPagamento(p.numero, 'caixa')}>
                            <Wallet size={14}/> Caixa
                          </button>
                          <button className="mdet-btn-option" onClick={() => confirmarPagamento(p.numero, 'cofre')}>
                            <Building2 size={14}/> Cofre
                          </button>
                          <button className="mdet-btn-option cancel" onClick={() => setParcelaEmPagamento(null)}>
                            <X size={16}/>
                          </button>
                        </div>
                      ) : (
                        <button className="mdet-btn-primary" onClick={() => setParcelaEmPagamento(p.numero)}>
                          Baixar Parcela
                        </button>
                      )}

                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}