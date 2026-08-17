import { ArrowLeft } from 'lucide-react';
import type { Mercadoria } from './types';
import './MercadoriaDetalhes.css';

interface MercadoriaDetalhesProps {
  mercadoria: Mercadoria;
  onVoltar: () => void;
  onPagarParcela: (idMercadoria: number, parcelaNum: number, origem: 'caixa' | 'cofre') => void;
}

export function MercadoriaDetalhes({ mercadoria, onVoltar, onPagarParcela }: MercadoriaDetalhesProps) {
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const handleBaixar = (parcelaNum: number) => {
    const origem = window.prompt("Digite a origem do pagamento: 'caixa' ou 'cofre'");
    if (origem === 'caixa' || origem === 'cofre') {
      onPagarParcela(mercadoria.id, parcelaNum, origem);
    } else if (origem !== null) {
      alert("Origem inválida. Digite 'caixa' ou 'cofre'.");
    }
  };

  return (
    <div className="mdet-container">
      <div className="mdet-header">
        <button className="mdet-btn-voltar" onClick={onVoltar}>
          <ArrowLeft size={18} /> Voltar
        </button>
        <h2 style={{margin: 0, color: '#1e293b'}}>Detalhes: {mercadoria.fornecedor}</h2>
      </div>

      <div className="mdet-grid">
        <div className="mdet-panel">
          <h3>Resumo da Entrada</h3>
          <div className="mdet-row"><span>Data:</span> <span>{mercadoria.data}</span></div>
          <div className="mdet-row"><span>Status Geral:</span> <span style={{color: mercadoria.status === 'paga' ? '#16a34a' : '#dc2626'}}>{mercadoria.status.toUpperCase()}</span></div>
          <div className="mdet-row"><span>Valor Total:</span> <span>{formatCurrency(mercadoria.valorTotal)}</span></div>
          
          <h3 style={{marginTop: 24}}>Composição do Pagamento</h3>
          <div className="mdet-row"><span>Caixa:</span> <span>{formatCurrency(mercadoria.pagamento.caixa)}</span></div>
          <div className="mdet-row"><span>Cofre:</span> <span>{formatCurrency(mercadoria.pagamento.cofre)}</span></div>
          <div className="mdet-row"><span>Boleto/Prazo:</span> <span style={{color: '#dc2626'}}>{formatCurrency(mercadoria.pagamento.boleto)}</span></div>
        </div>

        <div className="mdet-panel">
          <h3>Gestão de Parcelas (Boleto)</h3>
          {mercadoria.parcelasBoleto.length === 0 ? (
            <p style={{color: '#64748b'}}>Não há parcelas registradas para esta nota.</p>
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
                    <td>{p.numero}x</td>
                    <td>{p.vencimento}</td>
                    <td style={{fontWeight: 600}}>{formatCurrency(p.valor)}</td>
                    <td><span className={`mdet-badge ${p.status}`}>{p.status}</span></td>
                    <td>
                      {p.status === 'pendente' ? (
                        <button className="mdet-btn-pagar" onClick={() => handleBaixar(p.numero)}>Pagar</button>
                      ) : (
                        <span style={{fontSize: '0.85rem', color: '#64748b'}}>Via {p.origemPgto}</span>
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