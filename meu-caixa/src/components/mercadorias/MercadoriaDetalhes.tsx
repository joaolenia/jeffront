import React from 'react';
import { ArrowLeft } from 'lucide-react';
import type  { Mercadoria } from './types';
import './MercadoriaDetalhes.css';

interface Props {
  mercadoria: Mercadoria;
  onVoltar: () => void;
  onPagarParcela: (idMercadoria: number, parcelaNum: number, origem: 'caixa' | 'cofre') => void;
}

export function MercadoriaDetalhes({ mercadoria, onVoltar, onPagarParcela }: Props) {
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const handleBaixar = (parcelaNum: number) => {
    const origem = window.prompt("De onde o dinheiro foi retirado? (Digite 'caixa' ou 'cofre')");
    const origemNormalizada = origem?.trim().toLowerCase();
    
    if (origemNormalizada === 'caixa' || origemNormalizada === 'cofre') {
      onPagarParcela(mercadoria.id, parcelaNum, origemNormalizada);
    } else if (origem !== null) {
      alert("Origem inválida. Operação cancelada.");
    }
  };

  return (
    <div className="mdet-container">
      <div className="mdet-header">
        <button className="mdet-btn-voltar" onClick={onVoltar}>
          <ArrowLeft size={20} /> Voltar
        </button>
        <h2 style={{margin: 0, fontSize: '1.8rem', color: '#0f172a'}}>Nota: {mercadoria.fornecedor}</h2>
      </div>

      <div className="mdet-grid">
        <div className="mdet-panel">
          <h3>Resumo da Operação</h3>
          <div className="mdet-row"><span>Data:</span> <span>{mercadoria.data}</span></div>
          <div className="mdet-row"><span>Status Geral:</span> <span style={{color: mercadoria.status === 'paga' ? '#16a34a' : '#ef4444'}}>{mercadoria.status.toUpperCase()}</span></div>
          <div className="mdet-row" style={{fontSize: '1.2rem', marginTop: 16}}>
            <span>Valor Total:</span> <span>{formatCurrency(mercadoria.valorTotal)}</span>
          </div>
          
          <h3 style={{marginTop: 32}}>Composição</h3>
          <div className="mdet-row"><span>Pago via Caixa:</span> <span>{formatCurrency(mercadoria.pagamento.caixa)}</span></div>
          <div className="mdet-row"><span>Pago via Cofre:</span> <span>{formatCurrency(mercadoria.pagamento.cofre)}</span></div>
          <div className="mdet-row"><span>Ficou em Boleto:</span> <span style={{color: '#ef4444'}}>{formatCurrency(mercadoria.pagamento.boleto)}</span></div>
        </div>

        <div className="mdet-panel">
          <h3>Parcelas e Vencimentos</h3>
          {mercadoria.parcelasBoleto.length === 0 ? (
            <p style={{color: '#64748b', fontStyle: 'italic'}}>Nenhum boleto gerado para esta nota.</p>
          ) : (
            <table className="mdet-table">
              <thead>
                <tr>
                  <th>Nº</th>
                  <th>Vencimento</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {mercadoria.parcelasBoleto.map(p => (
                  <tr key={p.numero}>
                    <td style={{fontWeight: 'bold', color: '#475569'}}>{p.numero}x</td>
                    <td>{p.vencimento}</td>
                    <td style={{fontWeight: 700}}>{formatCurrency(p.valor)}</td>
                    <td><span className={`mdet-badge ${p.status}`}>{p.status}</span></td>
                    <td>
                      {p.status === 'pendente' ? (
                        <button className="mdet-btn-pagar" onClick={() => handleBaixar(p.numero)}>Baixar</button>
                      ) : (
                        <span style={{fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600}}>Pago ({p.origemPgto})</span>
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